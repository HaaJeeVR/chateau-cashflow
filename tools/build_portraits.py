# Château Cashflow — portretten: vierkant bijsnijden, naar spelgrootte, palet, harde pixels.
# Bron:    art_bronnen/portretten/<wie>_<stemming>.png   stemming = neutraal | blij | boos
#          (bijv. bankier_neutraal.png, bankier_blij.png, bankier_boos.png)
# Uitvoer: assets/por_<wie>_<neutral|happy|grim>.png + assets/portraits.js
# Draaien: python tools/build_portraits.py
# Tip: laat de achtergrond gewoon staan (effen, rustig). Het portret komt in een kader van 80 x 80 spelpixels.
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_bronnen', 'portretten')
OUT = os.path.join(ROOT, 'assets')
SIZE = 80
# Afwijkende maat per persoon: (spelpixels, uitsnede als deel van de bron). Een portret moet op zijn
# echte schermmaat gebouwd worden; verkleinen in het spel gooit pixels weg en maakt het onscherp.
SPEC = {'leverancier': (48, 0.7)}   # klein in het telefoonvenster: strakker op het gezicht
# Per persoon + stemming (wint van SPEC): (spelpixels, uitsnede, midden x, midden y als deel van de bron).
# Personeel: neutraal klein in het personeelsvenster (gezicht), blij groot in de level-up-pop-up.
SPEC_MOOD = {
    'sem_neutral': (40, 0.5, 0.5, 0.36), 'sem_happy': (72, 0.8, 0.5, 0.42),
    'fatima_neutral': (40, 0.5, 0.52, 0.34), 'fatima_happy': (72, 0.85, 0.45, 0.45),
    'dubois_neutral': (40, 0.5, 0.47, 0.34), 'dubois_happy': (72, 0.85, 0.55, 0.42),
}
COLORS = 48
MOOD = {'neutraal': 'neutral', 'blij': 'happy', 'boos': 'grim'}

meta = {}
if os.path.isdir(SRC):
    for fn in sorted(os.listdir(SRC)):
        if not fn.lower().endswith('.png'): continue
        base = fn[:-4]
        if '_' not in base: continue
        who, mood = base.rsplit('_', 1)
        mood = MOOD.get(mood, mood)
        im = Image.open(os.path.join(SRC, fn)).convert('RGB')
        # vierkant uitsnijden, iets naar boven (hoofd en schouders)
        size, crop = SPEC.get(who, (SIZE, 1.0))
        s = int(min(im.width, im.height) * crop)
        x0 = (im.width - s) // 2
        y0 = max(0, min(im.height - s, int((im.height - s) * 0.3)))
        if who + '_' + mood in SPEC_MOOD:
            size, crop, cx, cy = SPEC_MOOD[who + '_' + mood]
            s = int(min(im.width, im.height) * crop)
            x0 = max(0, min(im.width - s, int(im.width * cx - s / 2)))
            y0 = max(0, min(im.height - s, int(im.height * cy - s / 2)))
        im = im.crop((x0, y0, x0 + s, y0 + s)).resize((size, size), Image.LANCZOS)
        im = im.quantize(COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
        name = f'por_{who}_{mood}.png'
        im.save(os.path.join(OUT, name))
        meta.setdefault(who, {})[mood] = {'src': 'assets/' + name, 'w': size, 'h': size}
open(os.path.join(OUT, 'portraits.js'), 'w').write(
    '// gegenereerd door tools/build_portraits.py\n(window.CC = window.CC || {}).PORTRAITS = ' + json.dumps(meta) + ';\n')
print(json.dumps(meta, indent=1) if meta else 'Geen portretten gevonden in art_bronnen/portretten/')
