# Château Cashflow — feestbeeld schuldenvrij als lagen (haak C5).
# Het oude assets/schuldenvrij.png was een lichte herschildering van de hele winkel (zachter logo, bleke flessen).
# Nu: alleen de feestvoorwerpen uit de bron (slingers, ballonnen, fles en glazen, confetti), als één doorzichtige
# laag van 640 × 360 die main.js over de gewone winkel legt. Logo, kasten en flessen blijven dus scherp.
#
# Bron:    art_bronnen/schuldenvrij_bron.png (1672 × 941), geschilderd op de OUDE eindfase-achtergrond;
#          art_bronnen/_oud_2026-11-13/bg_eindfase_bron.png als vergelijking (wat er anders is = feest).
# Uitvoer: assets/schuldenvrij.png (RGBA, alleen de feestvoorwerpen ondoorzichtig)
# Draaien: python tools/build_feest.py   (na build_bg.py)
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_bronnen', 'schuldenvrij_bron.png')
REF = os.path.join(ROOT, 'art_bronnen', '_oud_2026-11-13', 'bg_eindfase_bron.png')
LAMPJES = os.path.join(ROOT, 'assets', 'layer_decor_lampjes.png')
OUT = os.path.join(ROOT, 'assets', 'schuldenvrij.png')
W, H = 640, 360
SW, SH = 1672, 941
K = SW / W
FLOOR = [(96, 94), (262, 14), (372, 14), (539, 94), (539, 233), (317, 349), (95, 237)]   # ROOM uit build_bg.py
FLOOR_TOP = 150   # confetti alleen op de vloer (onder de toonbank), in 640-pixels

# vakken in bronpixels (x0, y0, x1, y1) waarbinnen het verschil met de oude achtergrond een feestvoorwerp is
BOXES = {
    'slinger_links':  (430, 120, 720, 262),
    'slinger_rechts': (980, 110, 1262, 252),
    'ballonnen':      (900, 200, 990, 385),
    'fles':           (774, 460, 807, 553),
}
# links hangen de lampjes in de bron hoger dan in de lampjeslaag: daar een bovengrens langs de slinger zelf
SLINGER_LINKS_TOP = [(430, 195), (495, 204), (555, 186), (595, 174), (630, 159), (665, 132), (720, 132)]
# de glazen staan vóór het trapje: alleen de kelken, de voetjes en het dienblad (bronpixels)
GLAZEN = [('rect', (815, 504, 831, 556)), ('rect', (835, 504, 850, 556)), ('rect', (853, 504, 869, 556)),
          ('ellipse', (801, 539, 883, 566))]

src = Image.open(SRC).convert('RGB'); ref = Image.open(REF).convert('RGB')
assert src.size == ref.size == (SW, SH)
A = np.array(src.filter(ImageFilter.GaussianBlur(1.2))).astype(int)
B = np.array(ref.filter(ImageFilter.GaussianBlur(1.2))).astype(int)
diff = np.abs(A - B).sum(2)
S = np.array(src).astype(int)

# de lampjes zitten al in de lampjeslaag: niet nog eens meenemen
lampjes = np.zeros((SH, SW), bool)
if os.path.exists(LAMPJES):
    import json
    lay = json.load(open(os.path.join(ROOT, 'assets', 'layers.json')))['decor_lampjes']
    la = np.array(Image.open(LAMPJES).convert('RGBA'))[..., 3] > 0
    full = np.zeros((H, W), bool); full[lay['y']:lay['y'] + la.shape[0], lay['x']:lay['x'] + la.shape[1]] = la
    lampjes = np.array(Image.fromarray(full.astype(np.uint8) * 255).resize((SW, SH), Image.NEAREST)) > 0
    lampjes = ndimage.binary_dilation(lampjes, iterations=4)

def clean(m, keep=0.04, fill=True):
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(m)
    if n == 0: return m
    sz = ndimage.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i, a in enumerate(sz) if a >= keep * max(sz)])
    m = ndimage.binary_closing(m, iterations=2) | m
    return ndimage.binary_fill_holes(m) if fill else m

mask = np.zeros((SH, SW), bool)
for name, (x0, y0, x1, y1) in BOXES.items():
    m = np.zeros((SH, SW), bool); m[y0:y1, x0:x1] = diff[y0:y1, x0:x1] > 70
    if name == 'slinger_rechts': m &= ~lampjes
    if name == 'slinger_links':
        t = Image.new('L', (SW, SH), 0); ImageDraw.Draw(t).polygon(SLINGER_LINKS_TOP + [(x1, y1), (x0, y1)], fill=255)
        m &= np.array(t) > 0
    mask |= clean(m, keep=0.02 if name.startswith('slinger') else 0.1)
g = Image.new('L', (SW, SH), 0); d = ImageDraw.Draw(g)
for kind, box in GLAZEN: (d.rectangle if kind == 'rect' else d.ellipse)(box, fill=255)
mask |= clean((np.array(g) > 0) & (diff > 50), keep=0.02)

# naar 640 × 360: voorvermenigvuldigd verkleinen, dan harde rand (alfa ≥ 0,5)
rgba = np.zeros((SH, SW, 4), np.uint8); rgba[..., :3] = S; rgba[..., 3] = mask * 255
pre = rgba.astype(float); pre[..., :3] *= pre[..., 3:4] / 255
small = np.array(Image.fromarray(pre[..., :3].astype(np.uint8)).resize((W, H), Image.BOX)).astype(float)
alpha = np.array(Image.fromarray(rgba[..., 3]).resize((W, H), Image.BOX)).astype(float)
keep = alpha >= 128
col = np.zeros((H, W, 3)); col[keep] = small[keep] * 255 / alpha[keep, None]

# confetti: kleine goudgele snippers op de vloer die in de oude achtergrond niet lagen → 2 × 2 pixels
fl = Image.new('L', (W, H), 0); ImageDraw.Draw(fl).polygon(FLOOR, fill=255)
floor = np.array(fl.resize((SW, SH), Image.NEAREST)) > 0
floor[:int(FLOOR_TOP * K)] = False
gold = (S[..., 0] > 190) & (S[..., 1] > 140) & (S[..., 2] < 120) & (diff > 60) & floor & ~mask
lab, n = ndimage.label(gold)
sz = ndimage.sum(gold, lab, range(1, n + 1))
conf = []
for i, c in enumerate(ndimage.center_of_mass(gold, lab, range(1, n + 1))):
    if 3 <= sz[i] <= 70:
        x, y = int(c[1] / K), int(c[0] / K)
        if 0 <= x < W - 1 and 0 <= y < H - 1 and not keep[y:y + 2, x:x + 2].any():
            pix = S[lab == i + 1].mean(0); conf.append((x, y, pix))
for x, y, pix in conf:
    keep[y:y + 2, x:x + 2] = True; col[y:y + 2, x:x + 2] = pix
    col[y + 1, x:x + 2] *= 0.8   # onderkant iets donkerder: een snipper, geen stip

# eigen palet (de feestkleuren zitten niet in het achtergrondpalet), harde pixels, geen dithering
q = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).quantize(32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
out = np.zeros((H, W, 4), np.uint8); out[..., :3] = np.array(q); out[..., 3] = keep * 255
out[~keep, :3] = 0
Image.fromarray(out).save(OUT, optimize=True)
print('feest:', int(keep.sum()), 'px, confetti', len(conf), '→', os.path.relpath(OUT, ROOT))
