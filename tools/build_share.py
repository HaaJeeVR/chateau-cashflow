# Château Cashflow — favicon en deelbeeld (A9, handoff na review 2). Alleen uit bestaande beelden.
# Uitvoer: assets/favicon.png (64 x 64), favicon.ico (16/32/48, in de hoofdmap) en assets/og_image.jpg (1200 x 630, klein genoeg voor WhatsApp).
# Draaien: python tools/build_share.py
import os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, 'assets', *p)
logo = Image.open(A('logo_main.png')).convert('RGBA')
# favicon: de druiventros met de C uit het logo (linksboven, 64 x 64 op ware grootte)
fav = logo.crop((0, 0, 64, 64))
fav.save(A('favicon.png'))
fav.save(os.path.join(ROOT, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
# deelbeeld: het titelscherm (achtergrond + logo op dezelfde plek als in het spel), 2x in hele pixels,
# dan bijgesneden tot 1,91 : 1 en zacht naar 1200 x 630 (de verhouding die link-voorbeelden gebruiken)
bg = Image.open(A('title_bg.png')).convert('RGBA')
bg.alpha_composite(logo, (360 - logo.width // 2, 12))
big = bg.resize((1280, 720), Image.NEAREST)
h = round(1280 / (1200 / 630))          # 672
big = big.crop((0, 0, 1280, h))          # bovenkant houden: daar staat het logo
big.convert('RGB').resize((1200, 630), Image.LANCZOS).save(A('og_image.jpg'), quality=86, optimize=True)
print('favicon.png, favicon.ico, og_image.jpg')
