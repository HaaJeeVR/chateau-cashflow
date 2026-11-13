# Château Cashflow — kaartillustraties uit bronbladen met panelen op magenta.
# Blad 1:  art_bronnen/kaarten/kaarten_bron.png   (4 × 3)
#          rij 1: rose, tapas, bubbels, zoet
#          rij 2: koningsdag, braderie, recensie (TikTok-hit), doos
#          rij 3: proeverij, koeling, riool, aanslag
# Blad 2:  art_bronnen/kaarten/kaarten_bron2.png  (4 × 4, laatste rij alleen links één paneel)
#          rij 1: hittegolf, stamppot, oesters, introweek
#          rij 2: kunstroute, beursgang, koopavond, partij (Ronnie heeft een partij over)
#          rij 3: bruiloft, buurtapp, kassa, parkeren
#          rij 4: stroom
# Ontbreekt een blad, dan houden die kaarten hun getekende placeholder.
# Los:     art_bronnen/kaarten/doos_open.png → card_doos_open.png (D4: de doos zonder etiket, open)
# Uitvoer: assets/card_<id>.png (160 × 80, het vak op de kaart) + assets/cards.js
# Draaien: python tools/build_cards.py
# De panelen worden gevonden op de magenta (of donkere) tussenruimte; anders een gelijk raster.
# Elk paneel wordt bijgesneden tot de verhouding van het vak (2 : 1); FOCUS schuift de uitsnede omhoog/omlaag.
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets')
SHEETS = [
    ('kaarten_bron.png', 4, 3, 0.5, ['rose', 'tapas', 'bubbels', 'zoet', 'koningsdag', 'braderie', 'recensie', 'doos', 'proeverij', 'koeling', 'riool', 'aanslag']),
    ('kaarten_bron2.png', 4, 4, 0.2, ['hittegolf', 'stamppot', 'oesters', 'introweek', 'kunstroute', 'beursgang', 'koopavond', 'partij', 'bruiloft', 'buurtapp', 'kassa', 'parkeren', 'stroom']),
]
W, H = 160, 80
BORDER = 6          # donkere rand rond elk paneel weglaten (bronpixels)
FOCUS = {'rose': 0.35, 'koningsdag': 0.55, 'proeverij': 0.55, 'aanslag': 0.55}   # 0 = boven, 0.5 = midden, 1 = onder

import numpy as np
def runs(v, n):
    out, st = [], None
    for i, x in enumerate(list(v) + [False]):
        if x and st is None: st = i
        if not x and st is not None:
            if i - st > 40: out.append((st, i))
            st = None
    return out if len(out) == n else None

meta = {}
for fname, COLS, ROWS, THR, ORDER in SHEETS:
    SRC = os.path.join(ROOT, 'art_bronnen', 'kaarten', fname)
    if not os.path.exists(SRC):
        print('ontbreekt (overgeslagen):', fname); continue
    im = Image.open(SRC).convert('RGB')
    a = np.array(im).astype(int)
    mag = (a[..., 0] > 170) & (a[..., 2] > 170) & (a[..., 1] < 110)
    # THR: blad 2 heeft lege vakken in de laatste rij, dus daar telt een rij/kolom al bij 20% beeld
    cols = runs((~mag).mean(0) > THR, COLS) or [(round(i * im.width / COLS), round((i + 1) * im.width / COLS)) for i in range(COLS)]
    rows = runs((~mag).mean(1) > THR, ROWS) or [(round(i * im.height / ROWS), round((i + 1) * im.height / ROWS)) for i in range(ROWS)]
    for i, cid in enumerate(ORDER):
        (x0, x1), (y0, y1) = cols[i % COLS], rows[i // COLS]
        x0, x1, y0, y1 = x0 + BORDER, x1 - BORDER, y0 + BORDER, y1 - BORDER
        pw, ph = x1 - x0, y1 - y0
        f = FOCUS.get(cid, 0.5)
        if pw / ph > W / H: nw = ph * W / H; x0 += (pw - nw) / 2; x1 = x0 + nw
        else: nh = pw * H / W; y0 += (ph - nh) * f; y1 = y0 + nh
        p = im.crop((round(x0), round(y0), round(x1), round(y1))).resize((W, H), Image.LANCZOS)
        p = p.quantize(48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
        name = f'card_{cid}.png'
        p.save(os.path.join(OUT, name))
        meta[cid] = {'src': 'assets/' + name, 'w': W, 'h': H}
# Losse beelden (2 : 1), zelfde behandeling: D4 de geopende doos zonder etiket
SINGLE = [('doos_open.png', 'doos_open')]
for fname, cid in SINGLE:
    SRC = os.path.join(ROOT, 'art_bronnen', 'kaarten', fname)
    if not os.path.exists(SRC):
        print('ontbreekt (overgeslagen):', fname); continue
    im = Image.open(SRC).convert('RGB'); pw, ph = im.size
    if pw / ph > W / H: nw = ph * W / H; box = ((pw - nw) / 2, 0, (pw + nw) / 2, ph)
    else: nh = pw * H / W; box = (0, (ph - nh) / 2, pw, (ph + nh) / 2)
    p = im.crop(tuple(round(v) for v in box)).resize((W, H), Image.LANCZOS)
    p = p.quantize(48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    p.save(os.path.join(OUT, f'card_{cid}.png')); meta[cid] = {'src': f'assets/card_{cid}.png', 'w': W, 'h': H}
open(os.path.join(OUT, 'cards.js'), 'w').write(
    '// gegenereerd door tools/build_cards.py\n(window.CC = window.CC || {}).CARD_ART = ' + json.dumps(meta) + ';\n')
print(f'{len(meta)} kaartillustraties gemaakt.')
