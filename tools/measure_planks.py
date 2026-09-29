# Zoekt plankniveaus in de geschilderde wijnkasten (lichte houtstroken onder 2:1-helling).
import numpy as np, json, sys
from PIL import Image
im = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
R, G, B = im[..., 0], im[..., 1], im[..., 2]
board = (R > 170) & (G > 95) & (G < 190) & (B < 110) & (R - B > 90)
cabs = json.loads(sys.argv[2])
out = {}
for name, (x0, y0, x1, y1, slope) in cabs.items():
    ys, xs = np.nonzero(board[y0:y1, x0:x1]); xs = xs + x0; ys = ys + y0
    c = ys - slope * xs                       # intercept per pixel
    lo, hi = int(c.min()), int(c.max()) + 1
    hist = np.bincount((c - lo).astype(int), minlength=hi - lo + 1)
    sm = np.convolve(hist, [1, 2, 1], 'same')
    peaks = [i for i in range(1, len(sm) - 1) if sm[i] >= sm[i - 1] and sm[i] > sm[i + 1] and sm[i] > 0.35 * sm.max()]
    # samenvoegen van dichtbij liggende pieken
    merged = []
    for p in peaks:
        if merged and p - merged[-1][0] < 6:
            if sm[p] > sm[merged[-1][0]]: merged[-1] = (p, sm[p])
        else: merged.append((p, sm[p]))
    lines = []
    for p, _ in merged:
        sel = np.abs(c - (p + lo)) <= 1.5
        lines.append({'c': p + lo, 'x0': int(np.percentile(xs[sel], 3)), 'x1': int(np.percentile(xs[sel], 97)), 'n': int(sel.sum())})
    out[name] = {'slope': slope, 'lines': lines}
print(json.dumps(out, indent=1))
