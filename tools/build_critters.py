# Château Cashflow — kat en muis (winkel dicht): één bronbeeld op magenta → kleine sprites.
# Bron:    art_bronnen/dieren/katmuis_bron.png  (rij 1: kat ren1, ren2, loop · rij 2: kat zit · rij 3: muis ren1, ren2; alles kijkt naar rechts)
# Uitvoer: assets/critter_<naam>.png + assets/critters.js
# Draaien: python tools/build_critters.py
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_bronnen', 'dieren', 'katmuis_bron.png')
OUT = os.path.join(ROOT, 'assets')
NAMES = ['cat_run1', 'cat_run2', 'cat_walk', 'cat_sit', 'mouse_run1', 'mouse_run2']
CAT_H = 22          # hoogte van de lopende kat in spelpixels; de rest schaalt mee
INK = (31, 10, 14)

im = np.array(Image.open(SRC).convert('RGB')).astype(int)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
fg = ~((r > 110) & (b > 110) & (g < np.minimum(r, b) - 45))
lab, n = ndimage.label(ndimage.binary_closing(fg, iterations=6))
objs = [s for s in ndimage.find_objects(lab) if (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 3000]
assert len(objs) == 6, f'verwacht 6 figuren, gevonden {len(objs)}'
# sorteer op rij (y-midden in banden) en dan x
objs.sort(key=lambda s: (round((s[0].start + s[0].stop) / 2 / 150), s[1].start))
walk = objs[2]; scale = CAT_H / (walk[0].stop - walk[0].start)

def sprite(sl):
    y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
    rgb = im[y0:y1, x0:x1].astype(np.uint8); a = (fg[y0:y1, x0:x1] * 255).astype(np.uint8)
    w, h = max(2, round((x1 - x0) * scale)), max(2, round((y1 - y0) * scale))
    pm = Image.fromarray(np.dstack([rgb * (a[..., None] / 255.0), a]).astype(np.uint8), 'RGBA')
    small = np.array(pm.resize((w, h), Image.BOX)).astype(float)
    al = small[..., 3]
    col = np.where(al[..., None] > 0, small[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    mask = al > 100
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = np.clip(col, 0, 255); out[..., 3] = mask * 255
    q = Image.fromarray(out[..., :3]).quantize(10, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    arr = np.dstack([np.array(q), out[..., 3]])
    m = arr[..., 3] > 0; pad = np.pad(m, 1); ring = np.zeros_like(pad)
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): ring |= np.roll(np.roll(pad, dy, 0), dx, 1)
    ring &= ~pad
    big = np.zeros((h + 2, w + 2, 4), np.uint8); big[1:-1, 1:-1] = arr; big[ring] = (*INK, 255)
    return Image.fromarray(big, 'RGBA')

meta = {}
for name, sl in zip(NAMES, objs):
    spr = sprite(sl); fn = f'critter_{name}.png'; spr.save(os.path.join(OUT, fn))
    meta[name] = {'src': 'assets/' + fn, 'w': spr.width, 'h': spr.height}
open(os.path.join(OUT, 'critters.js'), 'w').write('// gegenereerd door tools/build_critters.py\n(window.CC = window.CC || {}).CRITTERS = ' + json.dumps(meta) + ';\n')
print({k: f"{v['w']}x{v['h']}" for k, v in meta.items()})
