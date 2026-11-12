# Château Cashflow — figuren uit bladen van 2 × 3 (boven: voor staand, stap, stap; onder: achter staand, stap, stap)
# op effen magenta. Maakt per figuur 6 spelbeelden met één schaal, één voetlijn en één kader per aanzicht:
#   assets/chr_<naam>_<front|back>.png, _walk2.png, _walk3.png  + assets/sprites.js
# Gebruik: python3 tools/import_bladen.py <map met bladen>   (bestandsnaam = <naam>.png)
import os, sys, re, json
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets')
HEIGHT = {'buurt': 64, 'koopjes': 62, 'liefhebber': 64, 'snob': 68, 'sem': 64, 'fatima': 62, 'dubois': 64}
COLORS = 28

def runs(v, mingap):
    idx = np.where(v)[0]; out = []; a = idx[0]; p = idx[0]
    for i in idx[1:]:
        if i - p > mingap: out.append((a, p + 1)); a = i
        p = i
    out.append((a, p + 1)); return out

def cells(mask):
    H, W = mask.shape
    rows = runs(mask.sum(1) > 2, 40)
    rows = sorted(rows, key=lambda r: r[0] - r[1])[:2]; rows.sort()
    res = []
    for (y0, y1) in rows:
        sub = mask[y0:y1]
        cols = runs(sub.sum(0) > 1, 28)
        cols = sorted(cols, key=lambda r: r[0] - r[1])[:3]; cols.sort()
        if len(cols) != 3: cols = [(i * W // 3, (i + 1) * W // 3) for i in range(3)]
        row = []
        for (x0, x1) in cols:
            m = sub[:, x0:x1]; ys = np.where(m.any(1))[0]; xs = np.where(m.any(0))[0]
            row.append((x0 + xs[0], y0 + ys[0], x0 + xs[-1] + 1, y0 + ys[-1] + 1))
        res.append(row)
    return res

def small(rgb, mask, box, scale, w, h, footx):
    """bron-uitsnede → spelkader w × h; voet op de onderste rij, footx = bron-x die op het midden komt"""
    x0, y0, x1, y1 = box
    sw, sh = w / scale, h / scale
    left = footx - sw / 2; top = y1 - sh
    L, T = int(np.floor(left)), int(np.floor(top)); R, B = int(np.ceil(left + sw)), int(np.ceil(top + sh))
    pad = Image.new('RGB', (R - L, B - T), (0, 0, 0)); pad.paste(Image.fromarray(rgb * mask[..., None]).crop((max(L, 0), max(T, 0), R, B)), (max(-L, 0), max(-T, 0)))
    pm = Image.new('L', (R - L, B - T), 0); pm.paste(Image.fromarray((mask * 255).astype(np.uint8)).crop((max(L, 0), max(T, 0), R, B)), (max(-L, 0), max(-T, 0)))
    # kleur alleen uit figuurpixels middelen (geen magenta in de rand): som(kleur × masker) / som(masker)
    c = np.array(pad.resize((w * 4, h * 4), Image.BOX).resize((w, h), Image.BOX)).astype(float); a = np.array(pm.resize((w, h), Image.BOX)).astype(float)
    c = np.clip(c * 255 / np.maximum(a, 1)[..., None], 0, 255).astype(np.uint8)
    return Image.fromarray(c), Image.fromarray(a.astype(np.uint8))

def best_shift(ref, refa, im, ima, h):
    """stapbeeld zo schuiven dat het bovenlijf op het staande beeld valt"""
    top = int(h * 0.5); best = (1e18, 0)
    R = np.array(ref).astype(int)[:top]; RA = np.array(refa)[:top] > 127
    for dx in range(-3, 4):
        I = np.roll(np.array(im).astype(int), dx, 1)[:top]; IA = np.roll(np.array(ima), dx, 1)[:top] > 127
        d = np.abs(R - I).sum(2); d[RA != IA] = 400; d[~RA & ~IA] = 0
        s = d.sum()
        if s < best[0]: best = (s, dx)
    return best[1]

def do(path, name):
    typ = re.sub(r'\d+$', '', name); h = HEIGHT[typ]
    rgb = np.array(Image.open(path).convert('RGB')); r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    mask = ~((r > 200) & (b > 200) & (g < 90))
    full = mask.copy()
    for _ in range(2):   # mengrand van de bron eraf (2 bronpixels)
        m = mask.copy(); m[1:] &= mask[:-1]; m[:-1] &= mask[1:]; m[:, 1:] &= mask[:, :-1]; m[:, :-1] &= mask[:, 1:]; mask = m
    grid = cells(mask)
    scale = h / (grid[0][0][3] - grid[0][0][1])            # staand vooraanzicht bepaalt de schaal
    out = {}
    for vi, v in enumerate(('front', 'back')):
        row = grid[vi]
        w = int(np.ceil(max(bx[2] - bx[0] for bx in row) * scale)) + 4
        # midden: zwaartepunt van de bovenste helft (bovenlijf), zodat de stapbeelden op het staande beeld vallen
        frames = []
        for bx in row:
            x0, y0, x1, y1 = bx; m = mask[y0:y0 + (y1 - y0) // 2, x0:x1]
            cx = x0 + (m.sum(0) * np.arange(x1 - x0)).sum() / m.sum()
            # kader zo leggen dat het hele figuur erin valt
            cx = min(max(cx, x1 - w / scale / 2 + 1 / scale), x0 + w / scale / 2 - 1 / scale) if (x1 - x0) * scale <= w - 2 else (x0 + x1) / 2
            frames.append(small(rgb, mask, bx, scale, w, h, cx))
        ref, refa = frames[0]
        for k in (1, 2):
            dx = best_shift(ref, refa, frames[k][0], frames[k][1], h)
            if dx: frames[k] = (Image.fromarray(np.roll(np.array(frames[k][0]), dx, 1)), Image.fromarray(np.roll(np.array(frames[k][1]), dx, 1)))
        for suf, (im, al) in zip(('', '_walk2', '_walk3'), frames): out[v + suf] = (im, al)
    # één palet voor alle zes
    keys = list(out); strip = Image.new('RGB', (sum(out[k][0].width for k in keys), h), (40, 20, 20)); x = 0
    for k in keys:
        im, al = out[k]; a = np.array(al) > 127; c = np.array(im); c[~a] = (40, 20, 20); strip.paste(Image.fromarray(c), (x, 0)); x += im.width
    q = np.array(strip.quantize(COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')); x = 0
    meta = {}
    for k in keys:
        im, al = out[k]; w = im.width; c = q[:, x:x + w]; x += w
        a = np.array(al) > 127; orig = np.array(im).astype(int)
        pink = (orig[..., 0] > 170) & (orig[..., 2] > 170) & (orig[..., 1] < 120) & (np.abs(orig[..., 0] - orig[..., 2]) < 40)
        a &= ~pink
        fn = f'chr_{name}_{k}.png'
        Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA').save(os.path.join(OUT, fn))
        meta[k] = {'src': 'assets/' + fn, 'w': int(w), 'h': int(h)}
    return meta

if __name__ == '__main__':
    src = sys.argv[1]
    s = open(os.path.join(OUT, 'sprites.js')).read()
    meta = json.loads(re.search(r'SPRITES = (\{.*?\});', s, re.S).group(1))
    for fn in sorted(os.listdir(src)):
        m = re.fullmatch(r'([a-z]+\d*)\.png', fn)
        if not m or re.sub(r'\d+$', '', m.group(1)) not in HEIGHT: continue
        meta[m.group(1)] = do(os.path.join(src, fn), m.group(1)); print(m.group(1), {k: f"{d['w']}x{d['h']}" for k, d in meta[m.group(1)].items() if '_' not in k})
    variants = {}
    for name in sorted(meta): variants.setdefault(re.sub(r'\d+$', '', name), []).append(name)
    open(os.path.join(OUT, 'sprites.js'), 'w').write('// gegenereerd door tools/build_sprites.py\n(window.CC = window.CC || {}).SPRITES = ' + json.dumps(meta) + ';\nCC.SPRITE_VARIANTS = ' + json.dumps(variants) + ';\n')
