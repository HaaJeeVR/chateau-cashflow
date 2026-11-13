# Château Cashflow — tasje en doos voor wie afrekent (haak C2, pakket D3).
# Bron:    art_bronnen/voorwerpen/draagbaar.png: drie voorwerpen naast elkaar op effen magenta
#          (tasje met één fles, tasje met twee of drie flessen, dichte doos).
# Uitvoer: assets/obj_tas1.png, obj_tas2.png, obj_doos6.png en assets/voorwerpen.js met
#          CC.OBJ   (beelden en maten) en
#          CC.HAND  (per figuur en aanzicht: waar de linker- en rechterhand zit, in pixels van het staande beeld,
#                    gemeten op de figuur zelf; met de hand bijstellen kan in HAND_FIX hieronder).
# Draaien: python3 tools/build_draagbaar.py   (opnieuw na import_bladen.py)
import os, re, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_bronnen', 'voorwerpen', 'draagbaar.png')
OUT = os.path.join(ROOT, 'assets')
NAMES = ['tas1', 'tas2', 'doos6']
HEIGHT = {'tas1': 16, 'tas2': 16, 'doos6': 12}   # spelpixels; een figuur is ± 64 hoog
COLORS = 16
HAND_FIX = {}   # bv. {'snob2': {'front': {'r': [dx, dy]}}}: extra verschuiving bovenop de meting

def cut():
    rgb = np.array(Image.open(SRC).convert('RGB')); r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    mask = ~((r > 190) & (b > 190) & (g < 100))
    mask = ndimage.binary_opening(mask, iterations=2)
    lab, n = ndimage.label(mask); sz = ndimage.sum(mask, lab, range(1, n + 1))
    big = sorted([i + 1 for i in range(n) if sz[i] > 0.1 * sz.max()], key=lambda i: np.nonzero(lab == i)[1].min())
    assert len(big) == 3, f'verwacht 3 voorwerpen, gevonden {len(big)}'
    meta = {}
    for name, i in zip(NAMES, big):
        m = lab == i   # geen gaten vullen: tussen de hengsels is het magenta
        m &= ~((r > 150) & (b > 120) & (g < 90) & (np.abs(r - b) < 90))   # mengkleuren met magenta
        m = ndimage.binary_erosion(m, iterations=1)
        ys, xs = np.nonzero(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        h = HEIGHT[name]; w = max(1, round((x1 - x0) * h / (y1 - y0)))
        crop = rgb[y0:y1, x0:x1] * m[y0:y1, x0:x1, None]
        c = np.array(Image.fromarray(crop.astype(np.uint8)).resize((w, h), Image.BOX)).astype(float)
        a = np.array(Image.fromarray((m[y0:y1, x0:x1] * 255).astype(np.uint8)).resize((w, h), Image.BOX)).astype(float)
        c = np.clip(c * 255 / np.maximum(a, 1)[..., None], 0, 255).astype(np.uint8)
        q = np.array(Image.fromarray(c).quantize(COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB'))
        fn = f'obj_{name}.png'
        a[(q[..., 0] > 150) & (q[..., 2] > 110) & (q[..., 1] < 90)] = 0
        Image.fromarray(np.dstack([q, (a >= 128) * 255]).astype(np.uint8), 'RGBA').save(os.path.join(OUT, fn))
        meta[name] = {'src': 'assets/' + fn, 'w': w, 'h': h}
    return meta

def hands():
    s = open(os.path.join(OUT, 'sprites.js')).read()
    spr = json.loads(re.search(r'SPRITES = (\{.*?\});', s, re.S).group(1))
    out = {}
    for look in sorted(spr):
        out[look] = {}
        for view in ('front', 'back'):
            a = np.array(Image.open(os.path.join(ROOT, spr[look][view]['src'])).convert('RGBA'))[..., 3] > 0
            h, w = a.shape
            res = {}
            for side in ('l', 'r'):
                best = None
                for y in range(int(h * 0.48), int(h * 0.64)):
                    xs = np.nonzero(a[y])[0]
                    if not len(xs): continue
                    x = xs[0] if side == 'l' else xs[-1]
                    if best is None or (x < best[0] if side == 'l' else x > best[0]) or x == best[0]: best = (int(x), y)
                dx, dy = HAND_FIX.get(look, {}).get(view, {}).get(side, (0, 0))
                res[side] = [best[0] + dx, best[1] + dy]
            out[look][view] = res
    return out

if __name__ == '__main__':
    meta = cut(); hand = hands()
    open(os.path.join(OUT, 'voorwerpen.js'), 'w').write(
        '// gegenereerd door tools/build_draagbaar.py\n(window.CC = window.CC || {}).OBJ = ' + json.dumps(meta) +
        ';\n// hand per figuur en aanzicht (pixels in het staande beeld, niet gespiegeld): l = linkerrand, r = rechterrand\nCC.HAND = ' + json.dumps(hand) + ';\n')
    print({k: f"{v['w']}x{v['h']}" for k, v in meta.items()}, len(hand), 'figuren')
