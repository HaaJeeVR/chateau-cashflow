# Château Cashflow — wijnflessen: één bronbeeld met 12 flessen op magenta → sprites in drie maten.
# Bron:    art_bronnen/wijnen/wijnen_bron.png  (12 flessen van links naar rechts in de volgorde van CC.WINES, magenta achtergrond)
# Uitvoer: assets/wine_<id>_<schap|icoon|groot>.png + assets/wines.js
# Draaien: python tools/build_wines.py
# Maten = hoogte van de hoogste fles; de rest schaalt mee, zodat een Elzasser fluit ook in het spel hoger is dan een port.
import os, json
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_bronnen', 'wijnen', 'wijnen_bron.png')
OUT = os.path.join(ROOT, 'assets')
ORDER = ['merlot', 'sauvignon', 'provence', 'rioja', 'cremant', 'chablis', 'gewurz', 'bordeaux', 'port', 'barolo', 'champagne', 'gevrey']
SIZES = {'schap': 14, 'icoon': 24, 'groot': 44}   # hoogte van de hoogste fles, in spelpixels
INK = (31, 10, 14)

im = np.array(Image.open(SRC).convert('RGB')).astype(int)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
fg = ~((r > 110) & (b > 110) & (g < np.minimum(r, b) - 45))   # alles wat geen magenta(achtig) is, ook de randpixels
cols = fg.sum(0) > 5
segs, start = [], None
for x, c in enumerate(list(cols) + [False]):
    if c and start is None: start = x
    if not c and start is not None:
        if x - start > 30: segs.append((start, x))
        start = None
assert len(segs) == 12, f'verwacht 12 flessen, gevonden {len(segs)}'
boxes = []
for s0, s1 in segs:
    rows = np.nonzero(fg[:, s0:s1].sum(1) > 2)[0]
    boxes.append((s0, rows.min(), s1, rows.max() + 1))
tallest = max(b[3] - b[1] for b in boxes)

def sprite(box, scale, outline):
    x0, y0, x1, y1 = box
    rgb = im[y0:y1, x0:x1].astype(np.uint8)
    a = (fg[y0:y1, x0:x1] * 255).astype(np.uint8)
    w, h = max(2, round((x1 - x0) * scale)), max(4, round((y1 - y0) * scale))
    # voorvermenigvuldigd verkleinen, dan harde alfa
    pm = Image.fromarray(np.dstack([rgb * (a[..., None] / 255.0), a]).astype(np.uint8), 'RGBA')
    small = np.array(pm.resize((w, h), Image.BOX)).astype(float)
    al = small[..., 3]
    col = np.where(al[..., None] > 0, small[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    mask = al > 110
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = np.clip(col, 0, 255); out[..., 3] = mask * 255
    img = Image.fromarray(out, 'RGBA')
    # weinig kleuren, geen dithering: harde pixels
    q = img.convert('RGB').quantize(10 if scale * tallest < 20 else 16, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    arr = np.dstack([np.array(q), out[..., 3]])
    if outline:
        # 1 px donkere rand rondom, zodat de fles tegen elke achtergrond leesbaar is
        m = arr[..., 3] > 0
        pad = np.pad(m, 1)
        ring = np.zeros_like(pad)
        for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): ring |= np.roll(np.roll(pad, dy, 0), dx, 1)
        ring &= ~pad
        big = np.zeros((h + 2, w + 2, 4), np.uint8)
        big[1:-1, 1:-1] = arr
        big[ring] = (*INK, 255)
        arr = big
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')

meta = {}
for key, box in zip(ORDER, boxes):
    wid = 'wine_' + key
    meta[wid] = {}
    for size, hmax in SIZES.items():
        spr = sprite(box, hmax / tallest, outline=(size != 'schap'))
        name = f'{wid}_{size}.png'
        spr.save(os.path.join(OUT, name))
        meta[wid][size] = {'src': 'assets/' + name, 'w': spr.width, 'h': spr.height}
open(os.path.join(OUT, 'wines.js'), 'w').write(
    '// gegenereerd door tools/build_wines.py\n(window.CC = window.CC || {}).WINE_SPRITES = ' + json.dumps(meta) + ';\n')
print(json.dumps({k: {s: f"{v[s]['w']}x{v[s]['h']}" for s in v} for k, v in meta.items()}))
