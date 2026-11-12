# Château Cashflow — de fietser uit één blad van 2 × 2 op magenta (besluit 105), in de opzet van import_bladen.py.
# Bron:    art_bronnen/personages/fietser.png
#          boven: vooraanzicht (rijdt naar linksvoor), trapstand 1 en 2
#          onder: achteraanzicht (rijdt naar rechtsachter), trapstand 1 en 2
# Uitvoer: assets/fietser_<voor|achter>_<1|2>.png  + assets/fietser.js (waar de wielen de grond raken)
#          Eén schaal voor alle vier: haar hoofd komt even hoog boven de grond als dat van een staande klant (HOOFD px).
#          Per aanzicht één kader en één grondlijn; de tweede trapstand wordt zo gelegd dat fiets en lijf niet verspringen.
#          Harde randen; de kleur aan de rand komt alleen uit de figuur (geen magenta), één palet voor alle vier.
# Draaien: python tools/import_fietser.py            (of: --blad <pad> --uit <map>, om eerst ergens anders te kijken)
#          Zonder blad gebeurt er niets.
import os, sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_bladen import cells, small   # zelfde rastervinder en verkleiner als de figuren

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOOFD = 64      # hoogte van een staande buurtbewoner (import_bladen.HEIGHT['buurt'])
COLORS = 28
RAND = 0.30     # de wielen zijn de onderste punten in de buitenste 30% van de breedte

def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

def wheels(a):
    """grondpunten van de twee wielen in een alfamasker (h × w): laagste pixel links en rechts aan de buitenkant"""
    h, w = a.shape
    low = np.array([np.nonzero(a[:, x])[0].max() if a[:, x].any() else -1 for x in range(w)])
    out = []
    for xs in (range(0, int(w * RAND) + 1), range(int(w * (1 - RAND)), w)):
        xs = [x for x in xs if low[x] >= 0]
        m = max(low[x] for x in xs); cols = [x for x in xs if low[x] == m]
        out.append([int(round(float(np.median(cols)))), int(m)])
    return out

def shift(ref, refa, im, ima):
    """tweede trapstand zo schuiven (−4..4 px) dat fiets en lijf zo goed mogelijk op de eerste vallen"""
    best = (1e18, 0)
    R = np.array(ref).astype(int); RA = np.array(refa) > 127
    for dx in range(-4, 5):
        I = np.roll(np.array(im).astype(int), dx, 1); IA = np.roll(np.array(ima), dx, 1) > 127
        d = np.abs(R - I).sum(2); d[RA != IA] = 400; d[~RA & ~IA] = 0
        if d.sum() < best[0]: best = (d.sum(), dx)
    return best[1]

def main():
    src = arg('--blad', os.path.join(ROOT, 'art_bronnen', 'personages', 'fietser.png'))
    out_dir = arg('--uit', os.path.join(ROOT, 'assets'))
    if not os.path.exists(src):
        print('geen blad:', os.path.relpath(src, ROOT), '- er verandert niets'); return
    rgb = np.array(Image.open(src).convert('RGB')); r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    # magenta en de roze mengrand eromheen zijn achtergrond; daarna nog 1 bronpixel eraf (niet 2 zoals bij de
    # figuren: spaken en stuur zijn dun en zouden anders verdwijnen)
    mask = ~(((r > 200) & (b > 200) & (g < 90)) | ((r > 170) & (b > 170) & (g < 130) & (np.abs(r - b) < 60)))
    for _ in range(1):
        m = mask.copy(); m[1:] &= mask[:-1]; m[:-1] &= mask[1:]; m[:, 1:] &= mask[:, :-1]; m[:, :-1] &= mask[:, 1:]; mask = m
    grid = cells(mask, 2)
    # schaal: van de bovenkant van haar hoofd tot het midden tussen de twee wielen (vooraanzicht, trapstand 1) = HOOFD
    x0, y0, x1, y1 = grid[0][0]
    (ax, ay), (bx, by) = wheels(mask[y0:y1, x0:x1])
    scale = HOOFD / ((ay + by) / 2)
    out, meta = {}, {'wheels': {}}
    for vi, view in enumerate(('voor', 'achter')):
        row = grid[vi]
        w = int(np.ceil(max(bx_[2] - bx_[0] for bx_ in row) * scale)) + 4
        h = int(np.ceil(max(bx_[3] - bx_[1] for bx_ in row) * scale))
        frames = [small(rgb, mask, bx_, scale, w, h, (bx_[0] + bx_[2]) / 2) for bx_ in row]
        dx = shift(frames[0][0], frames[0][1], frames[1][0], frames[1][1])
        if dx: frames[1] = tuple(Image.fromarray(np.roll(np.array(f), dx, 1)) for f in frames[1])
        for k, f in enumerate(frames): out[f'{view}_{k + 1}'] = f
    # één palet voor alle vier
    keys = list(out); H = max(out[k][0].height for k in keys)
    strip = Image.new('RGB', (sum(out[k][0].width for k in keys), H), (40, 20, 20)); x = 0
    for k in keys:
        im, al = out[k]; a = np.array(al) > 127; c = np.array(im); c[~a] = (40, 20, 20); strip.paste(Image.fromarray(c), (x, 0)); x += im.width
    q = np.array(strip.quantize(COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')); x = 0
    os.makedirs(out_dir, exist_ok=True)
    for k in keys:
        im, al = out[k]; w, h = im.size; c = q[:h, x:x + w]; x += w
        a = np.array(al) > 127; o = np.array(im).astype(int)
        a &= ~((o[..., 0] > 170) & (o[..., 2] > 170) & (o[..., 1] < 120) & (np.abs(o[..., 0] - o[..., 2]) < 40))
        Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA').save(os.path.join(out_dir, f'fietser_{k}.png'))
        if k.endswith('_1'): meta['wheels'][k[:-2]] = wheels(a)
        print(f'fietser_{k}.png', f'{w} × {h}')
    with open(os.path.join(out_dir, 'fietser.js'), 'w') as f:
        f.write('// gegenereerd door tools/import_fietser.py: waar de wielen de grond raken (x, y in het ongespiegelde beeld).\n'
                '// Met de hand bij te stellen als de schaduw niet goed onder de wielen staat.\n'
                '(window.CC = window.CC || {}).FIETSER = ' + json.dumps(meta) + ';\n')
    print('wielen:', meta['wheels'], f'· schaal {scale:.4f}')

if __name__ == '__main__':
    main()
