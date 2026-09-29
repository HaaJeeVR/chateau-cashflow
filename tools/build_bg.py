# Château Cashflow — bouwt de spelachtergrond uit de gegenereerde bronbeelden.
# Bron:    art_bronnen/bg_start_bron.png  (2 kasten)  en  art_bronnen/bg_eindfase_bron.png  (4 kasten)
# Uitvoer: assets/bg_start.png, layer_shelf_3.png, layer_shelf_4.png, layer_table.png, layers.json
#          + vitrine (als art_bronnen/bg_vitrine_bron.png bestaat): het houten trapje en de kaars uit die bewerking
#            worden op de tafel van bg_start_bron.png geplakt (de tafel zelf in die bewerking was scheef; besluit 62)
#          + deurmat (als art_bronnen/bg_matje_bron.png bestaat): het chique matje over het oude heen
#          + winkelfases (als art_bronnen/fases/bg_fase3_bron.png bestaat): decor dat uit die bewerking wordt geknipt
#            (verschil met fases/fase_basis.png) → layer_decor_<naam>.png; welke fase wat toont staat in config.js (besluit 63)
# Draaien: python3 tools/build_bg.py
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from scipy.spatial import ConvexHull

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_FULL = os.path.join(ROOT, 'art_bronnen', 'bg_eindfase_bron.png')
SRC_START = os.path.join(ROOT, 'art_bronnen', 'bg_start_bron.png')
OUT = os.path.join(ROOT, 'assets')
W, H = 640, 360

# Isometrie van het geschilderde beeld (gelijk aan config.js ROOM)
TW, TH, OX, OY = 27.2, 13.6, 317, 120
def iso(x, y, z=0): return (OX + (x - y) * TW, OY + (x + y) * TH - z)

# Kamer-omtrek: alles daarbuiten is straat en wordt gedempt.
ROOM = [(96, 94), (262, 14), (372, 14), (539, 94), (539, 233), (317, 349), (95, 237)]
# Tafel (blad + poten) als voorgrondlaag, gemeten in 640×360
TABLE = [(275, 198), (311, 180), (373, 209), (373, 246), (342, 261), (334, 261), (278, 233), (275, 231)]
# Buitenste kasten (plattegrond in tegels): x, y, w, d
CABS = {'shelf_4': (0, 4.5, 0.75, 1.4), 'shelf_3': (4.5, 0, 1.4, 0.75)}
CAB_H = 118  # hoogte incl. kuif in pixels

def load(p):
    return Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS)

# Vitrine (besluit 62): trapje + kaars uit bg_vitrine_bron.png, in bronpixels (1672 × 941).
# Omtrek = punten uit een 5× vergrote uitsnede vanaf (765, 460); verschuiving = waar ze op de oude tafel staan.
SRC_VITRINE = os.path.join(ROOT, 'art_bronnen', 'bg_vitrine_bron.png')
_T = lambda pts: [(765 + x / 5, 460 + y / 5) for x, y in pts]
VITRINE_PARTS = [
    (_T([(145, 122), (272, 64), (606, 212), (590, 300), (620, 360), (620, 460), (412, 548), (385, 545), (380, 500), (75, 405), (55, 390), (52, 288), (150, 245)]), (18, -12)),   # trapje
    (_T([(765, 70), (780, 70), (790, 150), (815, 190), (815, 320), (845, 335), (835, 360), (810, 380), (815, 500), (855, 530), (855, 560), (800, 595), (720, 590),
         (680, 555), (685, 520), (735, 495), (735, 375), (705, 345), (710, 325), (735, 315), (735, 195), (755, 150)]), (4, -12)),   # kaars
]

# Deurmat (2026-09-28): het chique matje (bordeaux, gouden rand, lelie) uit bg_matje_bron.png, een
# bewerking van HJ met een andere uitsnede. De bovenkant van de mat (hoeken links, boven, rechts) wordt
# affien op het oude matje in bg_start_bron.png gelegd; +MAT_DIK bronpixels onder de mat voor de dikte.
SRC_MAT = os.path.join(ROOT, 'art_bronnen', 'bg_matje_bron.png')
MAT_SRC = [(833.75, 715.75), (918, 672.5), (973.75, 701.25), (887.5, 742.5)]   # L, T, R, B in bg_matje_bron.png
MAT_DST = [(903.75, 780.5), (999.5, 731.25), (1057.5, 768.75), (965, 812.5)]   # L, T, R, B in bg_start_bron.png
MAT_DIK = 3
MAT_FLOOR_SHIFT = (-130, 63)   # vloer om het oude matje mee te bedekken: zoveel bronpixels langs de planken verschoven

def paste_mat(base):
    if not os.path.exists(SRC_MAT): return base
    mat = Image.open(SRC_MAT).convert('RGB')
    A = np.array([[x, y, 1] for x, y in MAT_DST[:3]], float)
    cx = np.linalg.solve(A, [p[0] for p in MAT_SRC[:3]]); cy = np.linalg.solve(A, [p[1] for p in MAT_SRC[:3]])
    warped = mat.transform(base.size, Image.AFFINE, (*cx, *cy), resample=Image.BICUBIC)
    L, T, R, B = MAT_DST; d = MAT_DIK * 1.2
    # eerst het oude matje wegwerken: vloer van verderop langs de planken (zelfde afstand tot de vloerrand)
    old = Image.new('L', base.size, 0)
    Ro = (R[0] + 5, R[1])   # het oude matje steekt rechts iets verder uit dan het nieuwe
    ImageDraw.Draw(old).polygon([L, T, Ro, (Ro[0], Ro[1] + d), (B[0], B[1] + d), (L[0], L[1] + d)], fill=255)
    old = old.filter(ImageFilter.MaxFilter(9))
    floor = Image.new('RGB', base.size); floor.paste(base, MAT_FLOOR_SHIFT)
    base = Image.composite(floor, base, old)
    m = Image.new('L', base.size, 0)
    ImageDraw.Draw(m).polygon([L, T, R, (R[0], R[1] + d), (B[0], B[1] + d), (L[0], L[1] + d)], fill=255)
    return Image.composite(warped, base, m.filter(ImageFilter.MaxFilter(3)))

def load_start():
    """Startbeeld; met vitrinebron: trapje en kaars erop geplakt. Geeft ook het masker (640×360) van wat er is geplakt."""
    base = paste_mat(Image.open(SRC_START).convert('RGB'))
    extra = np.zeros((H, W), bool)
    if os.path.exists(SRC_VITRINE):
        vit = Image.open(SRC_VITRINE).convert('RGB')
        assert vit.size == base.size, 'vitrinebron moet even groot zijn als bg_start_bron.png'
        for poly, (dx, dy) in VITRINE_PARTS:
            m = Image.new('L', base.size, 0); ImageDraw.Draw(m).polygon([(x + dx, y + dy) for x, y in poly], fill=255)
            shifted = Image.new('RGB', base.size); shifted.paste(vit, (dx, dy))
            base = Image.composite(shifted, base, m)
            extra |= np.array(m.resize((W, H), Image.BOX)) > 0
    return base.resize((W, H), Image.LANCZOS), extra

def dampen(im, sat=0.7, bright=0.72):
    mask = Image.new('L', (W, H), 0); ImageDraw.Draw(mask).polygon(ROOM, fill=255)
    out = ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(sat)).enhance(bright)
    return Image.composite(im, out, mask)

def save_layer(src, mask, name, layers):
    ys, xx = np.nonzero(mask)
    x0, x1, y0, y1 = xx.min(), xx.max() + 1, ys.min(), ys.max() + 1
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    rgba[..., :3] = src[y0:y1, x0:x1]; rgba[..., 3] = mask[y0:y1, x0:x1] * 255
    Image.fromarray(rgba).save(os.path.join(OUT, f'layer_{name}.png'))
    layers[name] = {'x': int(x0), 'y': int(y0)}

def poly_mask(pts, grow=0):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    if grow: m = m.filter(ImageFilter.MaxFilter(grow))
    return np.array(m) > 0

full_raw = load(SRC_FULL)
start_raw, VIT_MASK = load_start()
full, start = dampen(full_raw), dampen(start_raw)
# Eén gedeeld palet (64 kleuren, geen dithering): harde pixels en identieke kleuren in alle lagen
pal = full.quantize(64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
fq = full.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
sq = start.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
sq.save(os.path.join(OUT, 'bg_start.png'))
fq.save(os.path.join(OUT, 'bg_full_ref.png'))
a, b = np.array(fq), np.array(sq)

layers = {}
for name, (x, y, w, d) in CABS.items():
    pts = [iso(px, py, z) for z in (0, CAB_H) for px, py in ((x, y), (x + w, y), (x + w, y + d), (x, y + d))]
    P = np.array(pts); hull = P[ConvexHull(P).vertices]
    save_layer(a, poly_mask(hull, grow=5), name, layers)
save_layer(b, poly_mask(TABLE) | VIT_MASK, 'table', layers)   # tafel + trapje + kaars
json.dump(layers, open(os.path.join(OUT, 'layers.json'), 'w'), indent=1)
print(json.dumps(layers))
# Ook als JS (index.html werkt via file://, dus geen fetch van JSON)
open(os.path.join(OUT, 'layers.js'), 'w').write('// gegenereerd door tools/build_bg.py\n(window.CC = window.CC || {}).BG_LAYERS = ' + json.dumps(layers) + ';\n')

# ---------- Winkelfases (besluit 63) ----------
# Per voorwerp: kader in bronpixels (1672 × 941) + eventuele verschuiving (dx, dy) in bronpixels.
SRC_FASE3 = os.path.join(ROOT, 'art_bronnen', 'fases', 'bg_fase3_bron.png')
SRC_FASEBASIS = os.path.join(ROOT, 'art_bronnen', 'fases', 'fase_basis.png')
DECOR = {
    'lampjes':   {'box': (400, 60, 1262, 268)},
    'olijf':     {'box': (272, 428, 372, 612)},
    'monstera':  {'box': (1278, 436, 1432, 622)},
    'stoepbord': {'box': (1082, 662, 1238, 832), 'shift': (94, -33)},   # opzij: stond in de looproute naar de deur
    'terras':    {'box': (442, 676, 722, 918)},
}
if os.path.exists(SRC_FASE3) and os.path.exists(SRC_FASEBASIS):
    from scipy import ndimage
    f3 = Image.open(SRC_FASE3).convert('RGB'); fb = Image.open(SRC_FASEBASIS).convert('RGB')
    assert f3.size == fb.size, 'bg_fase3_bron.png moet even groot zijn als fase_basis.png'
    A = np.array(f3.filter(ImageFilter.GaussianBlur(1.5))).astype(int)
    B = np.array(fb.filter(ImageFilter.GaussianBlur(1.5))).astype(int)
    diff = np.abs(A - B).sum(2)
    SW, SH = f3.size
    for name, spec in DECOR.items():
        x0, y0, x1, y1 = spec['box']; dx, dy = spec.get('shift', (0, 0))
        m = np.zeros((SH, SW), bool); m[y0:y1, x0:x1] = diff[y0:y1, x0:x1] > 45
        m = ndimage.binary_opening(m, iterations=2)
        lab, n = ndimage.label(m); sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, [i + 1 for i, a in enumerate(sizes) if a > 60])
        m = ndimage.binary_fill_holes(ndimage.binary_dilation(m, iterations=3))
        src = f3
        if dx or dy:
            sh = fb.copy(); sh.paste(f3.crop((x0, y0, x1, y1)), (x0 + dx, y0 + dy), Image.fromarray((m[y0:y1, x0:x1] * 255).astype(np.uint8)))
            src = sh; m = np.roll(np.roll(m, dy, 0), dx, 1)
        mk = np.array(Image.fromarray((m * 255).astype(np.uint8)).resize((W, H), Image.BOX)) > 110
        img = dampen(src.resize((W, H), Image.LANCZOS)).quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
        save_layer(np.array(img), mk, 'decor_' + name, layers)
        if name == 'lampjes':   # lampjes: heldere stippen → posities voor de twinkeling
            lay = np.array(img).astype(int); br = (lay.sum(2) >= 590) & (lay[..., 2] < 0.8 * lay[..., 0]) & mk
            lab, n = ndimage.label(ndimage.binary_dilation(br, iterations=1))
            layers['decor_lampjes']['bulbs'] = [[round(float(c[1]), 1), round(float(c[0]), 1)] for c in ndimage.center_of_mass(br, lab, range(1, n + 1))]
    # Tegels voor het niveauscherm ("Nieuwe aankleding"), scherp uit de bron: fase 2 = olijf + monstera, fase 3 = terras
    def decor_cut(name, thr=45, fill=True):
        # strenger dan de spellaag: geen schaduw op de keien, geen losse spikkels (alleen stukken ≥ 5% van het grootste)
        x0, y0, x1, y1 = DECOR[name]['box']
        m = np.zeros((SH, SW), bool); m[y0:y1, x0:x1] = diff[y0:y1, x0:x1] > thr
        m = ndimage.binary_opening(m, iterations=2)
        m = ndimage.binary_dilation(m, iterations=2)
        if fill: m = ndimage.binary_fill_holes(m)
        lab, n = ndimage.label(m); sz = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, [i + 1 for i, a in enumerate(sz) if a >= 0.05 * max(sz)])
        ys, xs = np.nonzero(m); ya, yb, xa, xb = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.dstack([np.array(f3)[ya:yb, xa:xb], (m[ya:yb, xa:xb] * 255).astype(np.uint8)])
        return Image.fromarray(rgba, 'RGBA')
    def tile(parts, fn, bw=88, bh=40, gap=6):
        hmax = max(p.height for p in parts)
        wsum = sum(p.width for p in parts) + gap * (len(parts) - 1)
        sheet = Image.new('RGBA', (wsum, hmax), (0, 0, 0, 0)); x = 0
        for p in parts: sheet.alpha_composite(p, (x, hmax - p.height)); x += p.width + gap
        sc = min((bw - 2) / sheet.width, (bh - 2) / sheet.height)
        w, h = max(2, round(sheet.width * sc)), max(2, round(sheet.height * sc))
        a = np.array(sheet).astype(float); a[..., :3] *= a[..., 3:] / 255
        sm = np.array(Image.fromarray(a.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(float)
        al = sm[..., 3]; col = np.where(al[..., None] > 0, sm[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
        rgb = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).quantize(28, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
        mm = al > 110; pad = np.pad(mm, 1); ring = np.zeros_like(pad)
        for ddy, ddx in ((0, 1), (1, 0), (0, -1), (-1, 0)): ring |= np.roll(np.roll(pad, ddy, 0), ddx, 1)
        ring &= ~pad
        out = np.zeros((h + 2, w + 2, 4), np.uint8); out[1:-1, 1:-1, :3] = np.array(rgb); out[1:-1, 1:-1, 3] = mm * 255; out[ring] = (31, 10, 14, 255)
        Image.fromarray(out, 'RGBA').save(os.path.join(OUT, fn))
    tile([decor_cut('olijf'), decor_cut('monstera')], 'tile_aankleding2.png')
    # terras: los uitknippen oogt rommelig (keien en schaduw), dus een 'kiekje' van het terras met afgeronde hoeken
    def snapshot(box, fn, bh=40):
        crop = f3.crop(box); w = round(crop.width * bh / crop.height)
        im = crop.resize((w, bh), Image.BOX).quantize(32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGBA')
        a = np.array(im); a[0, :] = a[-1, :] = a[:, 0] = a[:, -1] = (31, 10, 14, 255)
        for (yy, xx) in ((0, 0), (0, -1), (-1, 0), (-1, -1)): a[yy, xx] = (0, 0, 0, 0)
        for (yy, xx) in ((1, 1), (1, -2), (-2, 1), (-2, -2)): a[yy, xx] = (31, 10, 14, 255)
        Image.fromarray(a, 'RGBA').save(os.path.join(OUT, fn))
    snapshot((440, 668, 724, 920), 'tile_aankleding3.png')
    json.dump(layers, open(os.path.join(OUT, 'layers.json'), 'w'), indent=1)
    open(os.path.join(OUT, 'layers.js'), 'w').write('// gegenereerd door tools/build_bg.py\n(window.CC = window.CC || {}).BG_LAYERS = ' + json.dumps(layers) + ';\n')
    print('fases:', {k: layers['decor_' + k] for k in DECOR if k != 'lampjes'}, 'lampjes:', len(layers['decor_lampjes'].get('bulbs', [])))
