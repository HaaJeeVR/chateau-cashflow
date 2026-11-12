# Château Cashflow — voorgrond van de straat (besluit 98): lantaarnpaal en twee paaltjes links op de stoep,
# uitgeknipt uit de geschilderde achtergrond. main.js tekent dit over de figuren heen, zodat voorbijgangers en de
# fietser er áchter langs gaan in plaats van eroverheen.
# Bron:    assets/bg_start.png
# Uitvoer: assets/fg_straat.png (640 × 360, alleen de paal en paaltjes ondoorzichtig)
# Draaien: python tools/build_voorgrond.py   (opnieuw als de achtergrond verandert)
import os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'bg_start.png')
OUT = os.path.join(ROOT, 'assets', 'fg_straat.png')
# vakken rond de voorwerpen (x0, y0, x1, y1); de paal pas vanaf y 150 (daarboven komt geen figuur) en smal,
# want er staat een fiets achter
BOXES = {'lantaarn': (31, 150, 44, 206), 'lantaarnvoet': (20, 206, 54, 268), 'paaltje1': (60, 234, 84, 290), 'paaltje2': (120, 276, 147, 336)}
DARK = 50   # gietijzer is donkerder dan de kinderkopjes (voegen ± 52 en lichter)

src = Image.open(SRC).convert('RGBA'); im = np.array(src)
lum = im[..., 0] * 0.3 + im[..., 1] * 0.59 + im[..., 2] * 0.11
mask = np.zeros(lum.shape, bool)
for name, (x0, y0, x1, y1) in BOXES.items():
    m = lum[y0:y1, x0:x1] < DARK
    lab, n = ndimage.label(m)
    sz = ndimage.sum(m, lab, range(1, n + 1)); m = lab == (np.argmax(sz) + 1)   # alleen het voorwerp zelf
    m = ndimage.binary_closing(m, iterations=1) | m
    if not name.startswith('lantaarn'): m = ndimage.binary_fill_holes(m)
    mask[y0:y1, x0:x1] |= m
out = im.copy(); out[~mask] = 0          # helemaal leeg buiten de voorwerpen (klein bestand)
Image.fromarray(out).save(OUT, optimize=True)
print('voorgrond:', int(mask.sum()), 'px →', os.path.relpath(OUT, ROOT))
