# Château Cashflow — titelscherm: bron naar 640×360, palet, harde pixels.
# Bron: art_bronnen/titel_bron.png   Uitvoer: assets/title_bg.png
# Draaien: python tools/build_title.py
import os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 640, 360
im = Image.open(os.path.join(ROOT, 'art_bronnen', 'titel_bron.png')).convert('RGB')
# naar 16:9 bijsnijden (midden), dan verkleinen
r = W / H
if im.width / im.height > r:
    nw = round(im.height * r); x0 = (im.width - nw) // 2; im = im.crop((x0, 0, x0 + nw, im.height))
else:
    nh = round(im.width / r); y0 = (im.height - nh) // 2; im = im.crop((0, y0, im.width, y0 + nh))
im = im.resize((W, H), Image.LANCZOS)
im = im.quantize(64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
im.save(os.path.join(ROOT, 'assets', 'title_bg.png'))
print('assets/title_bg.png', im.size)
