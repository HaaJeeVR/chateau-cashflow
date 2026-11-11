# Château Cashflow — beelden voor de intro (besluit 86).
# De browser mag bij index.html-dubbelklikken (file://) geen pixels teruglezen, dus alle kleurcorrectie gebeurt hier.
#
# Uitvoer (assets/):
#   intro_gevel.png           shot 1: de gevel in de ochtendschemer, leeg pand met gekalkte ruiten.
#                             Met art_bronnen/intro_gevel_bron.png (prompt J1 in 02_ART.md) wordt die bron gebruikt;
#                             anders maakt deze tool hem uit assets/title_bg.png (kalk op de ruiten + kleurcorrectie).
#   intro_winkel_donker.png   shot 2–4: de winkel vóór zonsopgang (uit assets/bg_start.png), lantaarn buiten brandt nog.
#   intro_winkel_half.png     shot 4: tussenstap als het licht aanknippert.
#   intro_sleutel.png         shot 4: kaartillustratie 160 × 80, sleutel recht in het slot   (prompt J2)
#   intro_sleutel_gedraaid.png          zelfde, kwartslag gedraaid                        (prompt J2, bewerking)
#                             bronnen: art_bronnen/intro_sleutel_bron.png en intro_sleutel_gedraaid_bron.png;
#                             zonder bronnen tekent de code een placeholder.
#   intro.js                  welke beelden er zijn (CC.INTRO_ART)
# Draaien: python tools/build_intro.py   (na build_title.py en build_bg.py)
import json, math, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
SRC = os.path.join(ROOT, 'art_bronnen')
W, H = 640, 360


def hsh(n):
    x = math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)


def vnoise(x, y, sc, seed):
    gx, gy = x / sc, y / sc
    ix, iy = math.floor(gx), math.floor(gy)
    fx, fy = gx - ix, gy - iy
    v = lambda i, j: hsh((ix + i) * 57.3 + (iy + j) * 131.7 + seed)
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy


def hexc(c):
    return [int(c[i:i + 2], 16) for i in (1, 3, 5)]


def to16x9(im):
    r = W / H
    if im.width / im.height > r:
        nw = round(im.height * r); x0 = (im.width - nw) // 2; im = im.crop((x0, 0, x0 + nw, im.height))
    else:
        nh = round(im.width / r); y0 = (im.height - nh) // 2; im = im.crop((0, y0, im.width, y0 + nh))
    return im.resize((W, H), Image.LANCZOS)


def quant(arr, n=64):
    im = Image.fromarray(np.clip(np.rint(arr), 0, 255).astype(np.uint8), 'RGB')
    return im.quantize(n, method=Image.Quantize.MEDIANCUT, kmeans=3, dither=Image.Dither.NONE).convert("RGB")   # kmeans houdt de lampen warm


# ---------- shot 1: kalk op de ruiten (gemeten in title_bg.png) ----------
GLASS = [
    (253, 140, 33, 21), (288, 140, 36, 21), (327, 140, 40, 21), (369, 140, 47, 21),   # bovenlichten etalage
    (253, 162, 163, 91),                                                             # etalage
    (430, 140, 37, 21), (430, 162, 37, 89),                                           # zijraam
]
FANLIGHT = (500, 139, 35, 24)   # bovenlicht van de deur


def whitewash(a):
    C = {k: hexc(v) for k, v in dict(light='#fdf6e3', mid='#e3d3ad', shade='#c2b597', edge='#8f8470', gap='#3a2a20').items()}
    CELL = 19
    for rx, ry, rw, rh in GLASS:
        for y in range(ry, ry + rh):
            for x in range(rx, rx + rw):
                cx, cy = x // CELL, y // CELL
                best, bx, by, bs = 1e9, 0, 0, 0
                for j in (-1, 0, 1):
                    for i in (-1, 0, 1):
                        cid = (cx + i) * 73 + (cy + j) * 151
                        px = (cx + i) * CELL + CELL / 2 + (hsh(cid) - 0.5) * 12
                        py = (cy + j) * CELL + CELL / 2 + (hsh(cid + 9) - 0.5) * 12
                        dd = math.hypot(x - px, (y - py) * 1.2)
                        if dd < best: best, bx, by, bs = dd, px, py, hsh(cid + 5)
                ang = math.atan2(y - by, x - bx)
                ring = best / 3.1 + ang * (0.45 if bs > 0.5 else -0.45) + bs * 7
                fr = ring - math.floor(ring)
                edge = min(x - rx, rx + rw - 1 - x, y - ry, ry + rh - 1 - y)
                cover = vnoise(x, y, 9, 3) * 0.7 + vnoise(x, y, 4, 8) * 0.3 + (-0.3 if edge < 2 else -0.12 if edge < 5 else 0.1)
                if cover < 0.24: c = C['gap']
                elif cover < 0.29: c = C['edge']
                else: c = C['light'] if fr < 0.16 else C['shade'] if 0.52 < fr < 0.64 else C['mid']
                a[y, x] = c


BAYER = np.array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]).reshape(4, 4) / 16.0


def dawn(a):
    """Ochtendschemer: koel en grijzig, lucht in geditherde banden lichter; straatlantaarns blijven branden,
    het licht van de etalage (ook op de stoep en in het water) is uit."""
    f = a.astype(float); r, g, b = f[..., 0], f[..., 1], f[..., 2]
    L = 0.3 * r + 0.59 * g + 0.11 * b
    yy, xx = np.mgrid[0:H, 0:W]
    in_shop = (xx >= 236) & (xx <= 482) & (yy >= 76) & (yy <= 266)
    shop_light = (xx >= 236) & (xx <= 545) & (yy >= 96)
    lamp = ~shop_light & (r > 150) & (r - b > 70) & (L > 125)
    nr, ng, nb = 0.52 * L + 0.26 * r + 8, 0.54 * L + 0.22 * g + 16, 0.6 * L + 0.2 * b + 34
    sky = ~in_shop & (yy < 150) & (b > r + 10) & (L < 95)
    lift = np.floor((6 + yy * 0.27) / 8 + BAYER[yy & 3, xx & 3]) * 8 * sky
    nr, ng, nb = nr + lift * 0.85, ng + lift * 0.9, nb + lift
    out = np.stack([np.where(lamp, r * 0.96 + 4, nr), np.where(lamp, g * 0.9 + 6, ng), np.where(lamp, b * 0.85 + 14, nb)], -1)
    return out


def fanlight(a):
    x0, y0, w, h = FANLIGHT
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            r, g, b = (int(v) for v in a[y, x])
            if 0.3 * r + 0.59 * g + 0.11 * b < 62: continue
            hl = (x - x0 - (y - y0) * 0.8 + 40) % 22 < 2
            a[y, x] = (92, 100, 118) if hl else (44, 47, 60)


def night(a):
    """Vóór zonsopgang binnen: donkerblauw; de lantaarn linksboven buiten brandt nog."""
    f = a.astype(float); r, g, b = f[..., 0], f[..., 1], f[..., 2]
    L = 0.3 * r + 0.59 * g + 0.11 * b
    yy, xx = np.mgrid[0:H, 0:W]
    lamp = (xx < 64) & (yy > 62) & (yy < 112) & (r > 165) & (r - b > 60)
    out = np.stack([r * 0.2 + L * 0.07 + 6, g * 0.22 + L * 0.1 + 10, b * 0.28 + L * 0.2 + 26], -1)
    out[lamp] = np.stack([r * 0.85, g * 0.75, b * 0.6], -1)[lamp]
    return out


def build_card(names):
    """Kaartillustraties 160 × 80 (2 : 1, midden), samen gekwantiseerd zodat beide beelden hetzelfde palet hebben."""
    srcs = [os.path.join(SRC, n + '_bron.png') for n in names]
    if not all(os.path.exists(s) for s in srcs): return []
    tiles = []
    for s in srcs:
        im = Image.open(s).convert('RGB')
        if im.width / im.height > 2: nw = im.height * 2; x0 = (im.width - nw) / 2; im = im.crop((round(x0), 0, round(x0 + nw), im.height))
        else: nh = im.width / 2; y0 = (im.height - nh) / 2; im = im.crop((0, round(y0), im.width, round(y0 + nh)))
        tiles.append(im.resize((160, 80), Image.LANCZOS))
    sheet = Image.new('RGB', (160 * len(tiles), 80))
    for i, t in enumerate(tiles): sheet.paste(t, (160 * i, 0))
    sheet = sheet.quantize(48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = []
    for i, n in enumerate(names):
        sheet.crop((160 * i, 0, 160 * (i + 1), 80)).save(os.path.join(ASSETS, n + '.png')); out.append(n)
    return out


meta = {}
def add(key, name, w, h): meta[key] = {'src': 'assets/' + name, 'w': w, 'h': h}

# shot 1
gsrc = os.path.join(SRC, 'intro_gevel_bron.png')
if os.path.exists(gsrc):
    gevel = quant(np.array(to16x9(Image.open(gsrc).convert('RGB'))).astype(float))
    print('gevel: uit art_bronnen/intro_gevel_bron.png')
else:
    a = np.array(Image.open(os.path.join(ASSETS, 'title_bg.png')).convert('RGB'))
    whitewash(a)
    d = np.clip(np.rint(dawn(a)), 0, 255).astype(np.uint8)
    fanlight(d)
    gevel = quant(d)
    print('gevel: afgeleid van title_bg.png (kalk + ochtend)')
gevel.save(os.path.join(ASSETS, 'intro_gevel.png')); add('gevel', 'intro_gevel.png', W, H)

# shot 2–4
shop = np.array(Image.open(os.path.join(ASSETS, 'bg_start.png')).convert('RGB')).astype(float)
dark = night(shop)
quant(dark).save(os.path.join(ASSETS, 'intro_winkel_donker.png')); add('winkel_donker', 'intro_winkel_donker.png', W, H)
quant(dark + (shop - dark) * 0.55).save(os.path.join(ASSETS, 'intro_winkel_half.png')); add('winkel_half', 'intro_winkel_half.png', W, H)

# shot 4: sleutel (optioneel)
for n in build_card(['intro_sleutel', 'intro_sleutel_gedraaid']):
    add(n.replace('intro_', ''), n + '.png', 160, 80)
if 'sleutel' not in meta: print('sleutel: geen bron, de code tekent een placeholder')

open(os.path.join(ASSETS, 'intro.js'), 'w', encoding='utf-8').write(
    '// gegenereerd door tools/build_intro.py\n(window.CC = window.CC || {}).INTRO_ART = ' + json.dumps(meta) + ';\n')
print('assets/intro.js:', ', '.join(meta))
