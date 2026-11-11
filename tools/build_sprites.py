# Château Cashflow — personages: magenta weg, bijsnijden, naar spelgrootte, palet, harde alpha.
# Bron: art_bronnen/personages/<naam>_<voor|achter>.png  óf  <naam>.png met twee figuren naast elkaar (links voor, rechts achter).
#       <naam> = type met eventueel een nummer voor een variant (buurt2, snob2). Een blad <naam>.png gaat vóór losse _voor/_achter.
# Uitvoer: assets/chr_<naam>_<front|back>.png + sprites.js (CC.SPRITES en CC.SPRITE_VARIANTS: type → namen)
#
# Loopbeelden (besluit 96): assets/chr_<naam>_<front|back>_walk2.png en _walk3.png worden met de hand gemaakt
# uit het staande beeld (zelfde maat, zelfde voetlijn). Dit script maakt of wijzigt ze nooit, zet ze wel in het
# manifest (views front_walk2 enz.), en laat het staande beeld staan als er loopbeelden bij horen: een nieuw
# staand beeld zou niet meer passen op de loopbeelden. Opnieuw maken van zo'n staand beeld: --forceer (en
# daarna de loopbeelden opnieuw maken).
#   python3 tools/build_sprites.py                 alles uit art_bronnen/personages
#   python3 tools/build_sprites.py --manifest      alleen sprites.js opnieuw schrijven uit wat er in assets/ staat
import os, json, sys, re
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

FORCE = '--forceer' in sys.argv
ONLY_MANIFEST = '--manifest' in sys.argv
WALKS = ('walk2', 'walk3')

def walk_files(name, v):
    return [os.path.join(OUT, f"chr_{name}_{v}_{w}.png") for w in WALKS]

def has_walks(name, v):
    return all(os.path.exists(f) for f in walk_files(name, v))

def add_walks(meta):
    """Loopbeelden die naast een staand beeld in assets/ staan in het manifest opnemen (alleen als ze er allebei zijn)."""
    for name in list(meta):
        for v in ('front', 'back'):
            if v in meta[name] and has_walks(name, v):
                for w, f in zip(WALKS, walk_files(name, v)):
                    im = Image.open(f)
                    if im.size != (meta[name][v]['w'], meta[name][v]['h']):
                        print(f"LET OP: {os.path.basename(f)} is {im.size}, staand beeld {meta[name][v]['w']}x{meta[name][v]['h']}: niet opgenomen"); break
                    meta[name][f"{v}_{w}"] = {'src': 'assets/' + os.path.basename(f), 'w': im.width, 'h': im.height}

def write_manifest(meta, variants):
    add_walks(meta)
    open(os.path.join(OUT, 'sprites.js'), 'w').write('// gegenereerd door tools/build_sprites.py\n(window.CC = window.CC || {}).SPRITES = ' + json.dumps(meta)
        + ';\nCC.SPRITE_VARIANTS = ' + json.dumps(variants) + ';\n')

if ONLY_MANIFEST:   # manifest uit assets/: staande beelden chr_<naam>_<front|back>.png (+ loopbeelden)
    meta, variants = {}, {}
    for fn in sorted(os.listdir(OUT)):
        m = re.fullmatch(r'chr_([a-z]+\d*)_(front|back)\.png', fn)
        if not m: continue
        name, v = m.groups(); im = Image.open(os.path.join(OUT, fn))
        meta.setdefault(name, {})[v] = {'src': 'assets/' + fn, 'w': im.width, 'h': im.height}
    for name in sorted(meta):
        variants.setdefault(re.sub(r'\d+$', '', name), []).append(name)
    write_manifest(meta, variants)
    print('manifest:', {k: sorted(v) for k, v in meta.items()})
    sys.exit(0)

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
        v = 'front' if view == 'voor' else 'back'
        fn = f"chr_{name}_{v}.png"
        if has_walks(name, v) and not FORCE and os.path.exists(os.path.join(OUT, fn)):
            out = Image.open(os.path.join(OUT, fn))   # loopbeelden horen bij dit staande beeld: niet opnieuw maken
            print(f"{fn}: blijft staan (heeft loopbeelden; --forceer om toch opnieuw te maken)")
        else:
            out = to_game(im, typ); out.save(os.path.join(OUT, fn))
        meta.setdefault(name, {})[v] = {'src': 'assets/' + fn, 'w': out.width, 'h': out.height}
    variants.setdefault(typ, []).append(name)
write_manifest(meta, variants)
print(json.dumps(variants), {k: {v: f"{d['w']}x{d['h']}" for v, d in m.items()} for k, m in meta.items() if k[-1].isdigit() or k == 'liefhebber'})
