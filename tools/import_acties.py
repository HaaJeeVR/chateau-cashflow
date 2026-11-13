# Château Cashflow — actiebeelden van het personeel (haak C1, pakket D2).
# Blad van 2 × 2 op effen magenta: boven vooraanzicht pose 1 en 2, onder achteraanzicht pose 1 en 2.
# Maakt per figuur 4 spelbeelden met dezelfde schaal, voetlijn en kleuren als de loopbeelden van import_bladen.py:
#   assets/chr_<naam>_<front|back>_act1.png, _act2.png  + de sleutels in assets/sprites.js
#   sem:    act1 fles vasthouden, act2 fles in het schap zetten (achteraanzicht bij het bijvullen)
#   fatima: act1 klant aanspreken (gebaar), act2 fles tonen
#   dubois: act1 glas poetsen, act2 glas met wijn bekijken (pose A met wijn: goedgekeurd door HJ)
# Gebruik: python3 tools/import_acties.py art_bronnen/personages/acties   (bestandsnaam = <naam>.png)
import os, sys, re, json
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_bladen import cells, small, HEIGHT, OUT

def palette_of(name):
    """kleuren van de bestaande loopbeelden, zodat de actiebeelden er niet uit springen"""
    cols = []
    for k in ('front', 'back', 'front_walk2', 'back_walk2'):
        a = np.array(Image.open(os.path.join(OUT, f'chr_{name}_{k}.png')).convert('RGBA'))
        cols.append(a[a[..., 3] > 0][:, :3])
    cols = np.unique(np.concatenate(cols), axis=0)[:256]
    p = Image.new('P', (1, 1)); flat = list(cols.flatten()) + [0] * (768 - cols.size); p.putpalette(flat[:768])
    return p, len(cols)

def do(path, name, ref_h):
    h0 = HEIGHT[name]
    rgb = np.array(Image.open(path).convert('RGB')); r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    mask = ~((r > 200) & (b > 200) & (g < 90))
    for _ in range(2):
        m = mask.copy(); m[1:] &= mask[:-1]; m[:-1] &= mask[1:]; m[:, 1:] &= mask[:, :-1]; m[:, :-1] &= mask[:, 1:]; mask = m
    grid = cells(mask, ncol=2)
    scale = h0 / (grid[0][0][3] - grid[0][0][1])          # pose 1 vooraan staat rechtop: die bepaalt de schaal
    pal, ncol = palette_of(name)
    meta = {}
    for vi, v in enumerate(('front', 'back')):
        row = grid[vi]
        w = max(ref_h[v], int(np.ceil(max(bx[2] - bx[0] for bx in row) * scale)) + 4)
        h = max(h0, int(np.ceil(max(bx[3] - bx[1] for bx in row) * scale)) + 1)
        for k, bx in enumerate(row):
            x0, y0, x1, y1 = bx
            # midden = zwaartepunt van de benen (onderste kwart): de voeten staan waar de loopbeelden ze hebben
            lo = mask[y1 - (y1 - y0) // 4:y1, x0:x1]
            cx = x0 + (lo.sum(0) * np.arange(x1 - x0)).sum() / lo.sum()
            cx = min(max(cx, x1 - w / scale / 2 + 1 / scale), x0 + w / scale / 2 - 1 / scale)
            im, al = small(rgb, mask, bx, scale, w, h, cx)
            a = np.array(al) > 127
            c = np.array(im.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB'))
            orig = np.array(im).astype(int)
            pink = (orig[..., 0] > 170) & (orig[..., 2] > 170) & (orig[..., 1] < 120) & (np.abs(orig[..., 0] - orig[..., 2]) < 40)
            a &= ~pink
            fn = f'chr_{name}_{v}_act{k + 1}.png'
            Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA').save(os.path.join(OUT, fn))
            meta[f'{v}_act{k + 1}'] = {'src': 'assets/' + fn, 'w': int(w), 'h': int(h)}
    return meta, ncol

if __name__ == '__main__':
    src = sys.argv[1]
    s = open(os.path.join(OUT, 'sprites.js')).read()
    meta = json.loads(re.search(r'SPRITES = (\{.*?\});', s, re.S).group(1))
    variants = json.loads(re.search(r'SPRITE_VARIANTS = (\{.*?\});', s, re.S).group(1))
    for fn in sorted(os.listdir(src)):
        m = re.fullmatch(r'(sem|fatima|dubois)\.png', fn)
        if not m: continue
        name = m.group(1)
        ref = {v: meta[name][v]['w'] for v in ('front', 'back')}
        acts, ncol = do(os.path.join(src, fn), name, ref)
        meta[name] = {k: d for k, d in meta[name].items() if '_act' not in k}; meta[name].update(acts)
        print(name, f'{ncol} kleuren', {k: f"{d['w']}x{d['h']}" for k, d in acts.items()})
    open(os.path.join(OUT, 'sprites.js'), 'w').write('// gegenereerd door tools/build_sprites.py\n(window.CC = window.CC || {}).SPRITES = ' + json.dumps(meta) + ';\nCC.SPRITE_VARIANTS = ' + json.dumps(variants) + ';\n')
