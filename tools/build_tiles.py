# Château Cashflow — plaatjes voor de tegels op het niveauscherm en de iconen in "Investeren".
# Bron:    art_bronnen/tegels/tegels_bron.png  (4 × 3 figuren los op magenta, geen kaders):
#          rij 1: kast, koeling (ijsemmer), vitrine (proeftafel), uithangbord
#          rij 2: crowd (groepje klanten), buurt, koopjes, liefhebber
#          rij 3: snob, sem, fatima, dubois
# Uitvoer: assets/tile_<naam>.png  (past in het tegelvak, ± 80 × 72)
#          assets/icon_<naam>.png  (alleen de vier upgrades; past in het icoonvak, ± 34 × 34)
#          assets/tiles.js
# Draaien: python tools/build_tiles.py
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_bronnen', 'tegels', 'tegels_bron.png')
OUT = os.path.join(ROOT, 'assets')
ROWS = [['kast', 'koeling', 'vitrine', 'uithangbord'],
        ['crowd', 'buurt', 'koopjes', 'liefhebber'],
        ['snob', 'sem', 'fatima', 'dubois']]
ICONS = ['kast', 'koeling', 'vitrine', 'uithangbord']
TILE_W, TILE_H = 80, 72          # besluit 91: op ware grootte voor het tegelvak (was 88 × 40)
ICON_W, ICON_H = 34, 34
INK = (31, 10, 14)

im = np.array(Image.open(SRC).convert('RGB')).astype(int)
H, W = im.shape[:2]
r_, g_, b_ = im[..., 0], im[..., 1], im[..., 2]
fg = ~((r_ > 110) & (b_ > 110) & (g_ < np.minimum(r_, b_) - 45))
fg = ndimage.binary_opening(fg, iterations=1)          # losse magenta-ruis weg

# Figuren vinden: grote vlekken, kleine vlekjes (glinsteringen) horen bij de dichtstbijzijnde grote.
lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=2))
objs = ndimage.find_objects(lab)
areas = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
big = [i for i in range(n) if areas[i] > 0.1 * areas.max()]
assert len(big) == 12, f'verwacht 12 figuren, gevonden {len(big)}'
box = {i: [objs[i][1].start, objs[i][0].start, objs[i][1].stop, objs[i][0].stop] for i in big}
for i in range(n):
    if i in big: continue
    cy, cx = [(s.start + s.stop) / 2 for s in objs[i]]
    j = min(big, key=lambda k: ((box[k][0] + box[k][2]) / 2 - cx) ** 2 + ((box[k][1] + box[k][3]) / 2 - cy) ** 2)
    b = box[j]; s = objs[i]
    box[j] = [min(b[0], s[1].start), min(b[1], s[0].start), max(b[2], s[1].stop), max(b[3], s[0].stop)]
# in leesvolgorde: eerst op rij (midden y), dan op x
order = sorted(big, key=lambda k: (box[k][1] + box[k][3]) / 2)
rows = [sorted(order[r * 4:r * 4 + 4], key=lambda k: box[k][0]) for r in range(3)]

def fit(b, bw, bh):
    x0, y0, x1, y1 = b
    m = fg[y0:y1, x0:x1]
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = y0 + ys.min(), y0 + ys.max() + 1, x0 + xs.min(), x0 + xs.max() + 1
    scale = min((bw - 2) / (x1 - x0), (bh - 2) / (y1 - y0))
    rgb = im[y0:y1, x0:x1].astype(np.uint8); a = (fg[y0:y1, x0:x1] * 255).astype(np.uint8)
    w, h = max(2, round((x1 - x0) * scale)), max(2, round((y1 - y0) * scale))
    pm = Image.fromarray(np.dstack([rgb * (a[..., None] / 255.0), a]).astype(np.uint8), 'RGBA')
    small = np.array(pm.resize((w, h), Image.BOX)).astype(float)
    al = small[..., 3]
    col = np.where(al[..., None] > 0, small[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    mask = al > 110
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = np.clip(col, 0, 255); out[..., 3] = mask * 255
    q = Image.fromarray(out[..., :3]).quantize(28, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    arr = np.dstack([np.array(q), out[..., 3]])
    mm = arr[..., 3] > 0; pad = np.pad(mm, 1); ring = np.zeros_like(pad)
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): ring |= np.roll(np.roll(pad, dy, 0), dx, 1)
    ring &= ~pad
    big_ = np.zeros((h + 2, w + 2, 4), np.uint8); big_[1:-1, 1:-1] = arr; big_[ring] = (*INK, 255)
    return Image.fromarray(big_, 'RGBA')

meta = {'tiles': {}, 'icons': {}}
for names, ks in zip(ROWS, rows):
    for name, k in zip(names, ks):
        t = fit(box[k], TILE_W, TILE_H); fn = f'tile_{name}.png'; t.save(os.path.join(OUT, fn))
        meta['tiles'][name] = {'src': 'assets/' + fn, 'w': t.width, 'h': t.height}
        if name in ICONS:
            t = fit(box[k], ICON_W, ICON_H); fn = f'icon_{name}.png'; t.save(os.path.join(OUT, fn))
            meta['icons'][name] = {'src': 'assets/' + fn, 'w': t.width, 'h': t.height}
open(os.path.join(OUT, 'tiles.js'), 'w').write('// gegenereerd door tools/build_tiles.py\n(window.CC = window.CC || {}).TILES = '
    + json.dumps(meta['tiles']) + ';\nCC.ICONS = ' + json.dumps(meta['icons']) + ';\n')
print({k: f"{v['w']}x{v['h']}" for k, v in {**meta['tiles'], **{'icon_' + a: b for a, b in meta['icons'].items()}}.items()})
