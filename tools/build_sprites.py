# Château Cashflow — personages: magenta weg, bijsnijden, naar spelgrootte, palet, harde alpha.
# Bron: art_bronnen/personages/<naam>_<voor|achter>.png  óf  <naam>.png met twee figuren naast elkaar (links voor, rechts achter).
#       <naam> = type met eventueel een nummer voor een variant (buurt2, snob2). Een blad <naam>.png gaat vóór losse _voor/_achter.
# Uitvoer: assets/chr_<naam>_<front|back>.png + sprites.js (CC.SPRITES en CC.SPRITE_VARIANTS: type → namen)
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_bronnen', 'personages')
OUT = os.path.join(ROOT, 'assets')
HEIGHT = {'buurt': 64, 'koopjes': 62, 'liefhebber': 64, 'snob': 68, 'sem': 64, 'fatima': 62, 'dubois': 64}   # figuurhoogte in spelpixels

def key_out(im):
    a = np.array(im.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # magenta en roze randjes: veel rood+blauw, weinig groen
    mag = ((r > 150) & (b > 150) & (g < 110)) | ((r - g > 60) & (b - g > 60))
    alpha = ~mag
    alpha = ndimage.binary_opening(alpha, iterations=2)
    alpha = ndimage.binary_erosion(alpha, iterations=3)   # roze rand eraf
    lab, n = ndimage.label(alpha)
    if n > 1:
        sizes = np.bincount(lab.ravel()); sizes[0] = 0
        keep = sizes > sizes.max() * 0.02
        alpha = keep[lab]
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

import re
def to_game(im, typ):
    im = im.crop(im.getbbox())
    h = HEIGHT[typ]; w = max(1, round(im.width * h / im.height))
    rgb = im.convert('RGB').resize((w, h), Image.LANCZOS)
    al = im.split()[3].resize((w, h), Image.LANCZOS)
    q = rgb.quantize(40, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    qa = np.array(q).astype(int)
    pink = (qa[..., 0] - qa[..., 1] > 50) & (qa[..., 2] - qa[..., 1] > 40)
    alpha = ((np.array(al) > 150) & ~pink).astype(np.uint8) * 255
    return Image.fromarray(np.dstack([np.array(q), alpha]), 'RGBA')

def split_sheet(im):
    """Blad met twee figuren: knip op de leegste kolom rond het midden."""
    a = np.array(im)[..., 3] > 0
    W_ = a.shape[1]; cols = a.sum(0)
    lo, hi = int(W_ * 0.35), int(W_ * 0.65)
    cut = lo + int(np.argmin(cols[lo:hi]))
    return im.crop((0, 0, cut, im.height)), im.crop((cut, 0, W_, im.height))

sources = {}   # naam -> {'voor': Image, 'achter': Image}
files = sorted(f for f in os.listdir(SRC) if f.endswith('.png'))
sheets = {f[:-4] for f in files if '_' not in f}
for fn in files:
    base = fn[:-4]
    if '_' in base:
        name, view = base.split('_')
        if name in sheets: continue          # blad gaat voor
        sources.setdefault(name, {})[view] = key_out(Image.open(os.path.join(SRC, fn)))
    else:
        left, right = split_sheet(key_out(Image.open(os.path.join(SRC, fn))))
        sources[base] = {'voor': left, 'achter': right}

meta, variants = {}, {}
for name, views in sorted(sources.items()):
    typ = re.sub(r'\d+$', '', name)
    for view, im in views.items():
        out = to_game(im, typ)
        v = 'front' if view == 'voor' else 'back'
        fn = f"chr_{name}_{v}.png"; out.save(os.path.join(OUT, fn))
        meta.setdefault(name, {})[v] = {'src': 'assets/' + fn, 'w': out.width, 'h': out.height}
    variants.setdefault(typ, []).append(name)
open(os.path.join(OUT, 'sprites.js'), 'w').write('// gegenereerd door tools/build_sprites.py\n(window.CC = window.CC || {}).SPRITES = ' + json.dumps(meta)
    + ';\nCC.SPRITE_VARIANTS = ' + json.dumps(variants) + ';\n')
print(json.dumps(variants), {k: {v: f"{d['w']}x{d['h']}" for v, d in m.items()} for k, m in meta.items() if k[-1].isdigit() or k == 'liefhebber'})
