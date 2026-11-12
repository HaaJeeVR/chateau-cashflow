# Château Cashflow — tegels met figuren voor het niveauscherm en het personeelsvenster, uit de spelsprites (besluit 97).
# Bron:    assets/chr_<naam>_front.png  (de staande vooraanzichten, zoals in de winkel; niet geschaald)
# Uitvoer: assets/tile_<buurt|koopjes|liefhebber|snob|sem|fatima|dubois|crowd>.png  + de figuurregels in assets/tiles.js
#          klanttype = twee varianten van dat type naast elkaar; personeel = één figuur; crowd = drie verschillende klanten.
#          Eén donkere rand van 1 px om het geheel, zoals de andere tegels.
# Draaien: python tools/build_figuurtegels.py   (na tools/build_tiles.py, dat de figuren laat staan)
import os, re, json
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
INK = (31, 10, 14)
TILE_W, TILE_H = 80, 72
# per tegel: figuren van achter naar voor, met hun x-verschuiving t.o.v. het midden (voeten op één lijn)
TILES = {
    'buurt':      [('buurt3', -12), ('buurt', 11)],
    'koopjes':    [('koopjes2', -12), ('koopjes', 11)],
    'liefhebber': [('liefhebber2', -12), ('liefhebber', 11)],
    'snob':       [('snob2', -12), ('snob', 11)],
    'sem':        [('sem', 0)],
    'fatima':     [('fatima', 0)],
    'dubois':     [('dubois', 0)],
    'crowd':      [('liefhebber3', -22), ('snob3', 22), ('buurt7', 0)],
}

def feet_x(a):
    """midden van de voeten (onderste 6 rijen) — daar staat de figuur op"""
    xs = np.nonzero(a[-6:].any(0))[0]
    return (xs[0] + xs[-1] + 1) / 2

def build(parts):
    ims = [np.array(Image.open(os.path.join(A, f'chr_{n}_front.png')).convert('RGBA')) for n, _ in parts]
    H = max(im.shape[0] for im in ims); W = 120
    can = np.zeros((H, W, 4), np.uint8)
    for im, (_, dx) in zip(ims, parts):
        h, w = im.shape[:2]; a = im[..., 3] > 0
        x0 = int(round(W / 2 + dx - feet_x(a))); y0 = H - h
        sub = can[y0:y0 + h, x0:x0 + w]; sub[a] = im[a]
    ys, xs = np.nonzero(can[..., 3]); can = can[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = can.shape[:2]
    m = np.pad(can[..., 3] > 0, 1); ring = np.zeros_like(m)
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)): ring |= np.roll(np.roll(m, dy, 0), dx, 1)
    ring &= ~m
    out = np.zeros((h + 2, w + 2, 4), np.uint8); out[1:-1, 1:-1] = can; out[ring] = (*INK, 255)
    assert out.shape[1] <= TILE_W and out.shape[0] <= TILE_H, (parts, out.shape)
    return Image.fromarray(out, 'RGBA')

if __name__ == '__main__':
    path = os.path.join(A, 'tiles.js'); s = open(path).read()
    tiles = json.loads(re.search(r'TILES = (\{.*?\});', s, re.S).group(1))
    icons = re.search(r'CC\.ICONS = (\{.*?\});', s, re.S).group(1)
    for name, parts in TILES.items():
        t = build(parts); fn = f'tile_{name}.png'; t.save(os.path.join(A, fn))
        tiles[name] = {'src': 'assets/' + fn, 'w': t.width, 'h': t.height}
        print(name, t.size)
    open(path, 'w').write('// gegenereerd door tools/build_tiles.py en tools/build_figuurtegels.py\n(window.CC = window.CC || {}).TILES = '
        + json.dumps(tiles) + ';\nCC.ICONS = ' + icons + ';\n')
