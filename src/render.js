// Château Cashflow — render.js
// Alles wat getekend wordt. Alles in hele pixels op de 640×360-grid, geen anti-aliasing.
(function (root) {
  const CC = root.CC = root.CC || {};
  const P = CC.PAL;
  const R = {};
  R.W = 640; R.H = 360;

  // ---------- Primitieven ----------
  R.rect = function (ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  // Scanline-vulling van een convexe polygoon, pixelscherp.
  R.poly = function (ctx, pts, color) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    ctx.fillStyle = color;
    const n = pts.length;
    for (let yy = Math.round(minY); yy < Math.round(maxY); yy++) {
      const y = yy + 0.5;
      let xl = Infinity, xr = -Infinity;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          const x = a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]);
          if (x < xl) xl = x; if (x > xr) xr = x;
        }
      }
      if (xl < xr) ctx.fillRect(Math.round(xl), yy, Math.round(xr) - Math.round(xl), 1);
    }
  };
  // 2:1-lijn (isometrische rand), 1 px dik
  R.isoLine = function (ctx, x0, y0, len, dir, color) {
    ctx.fillStyle = color;
    for (let k = 0; k < len / 2; k++) ctx.fillRect(Math.round(x0 + 2 * k), Math.round(y0 + k * dir), 2, 1);
  };

  // ---------- Isometrie (schaal uit config: TW = halve tegelbreedte, TH = TW/2) ----------
  const RM = CC.ROOM;
  const TW = RM.tw, TH = RM.th;
  R.TW = TW; R.TH = TH;
  R.iso = function (x, y, z) { return [Math.round(RM.originX + (x - y) * TW), Math.round(RM.originY + (x + y) * TH - (z || 0))]; };

  // Box met drie zichtbare vlakken + 1px omlijning. col = {top,left,right}
  R.box = function (ctx, x, y, w, d, h, col, z, noOutline) {
    z = z || 0;
    const A = R.iso(x, y, z), B = R.iso(x + w, y, z), C = R.iso(x + w, y + d, z), D = R.iso(x, y + d, z);
    const up = p => [p[0], p[1] - h];
    const sil = [up(A), up(B), B, C, D, up(D)];
    if (!noOutline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) R.poly(ctx, sil.map(p => [p[0] + dx, p[1] + dy]), P.ink);
    R.poly(ctx, [up(D), up(C), C, D], col.left);
    R.poly(ctx, [up(C), up(B), B, C], col.right);
    R.poly(ctx, [up(A), up(B), up(C), up(D)], col.top);
    return { A, B, C, D, h };
  };
  R.quad = function (ctx, x0, y0, x1, y1, color, z) {
    R.poly(ctx, [R.iso(x0, y0, z), R.iso(x1, y0, z), R.iso(x1, y1, z), R.iso(x0, y1, z)], color);
  };

  function hash(a, b) { let h = (a * 374761393 + b * 668265263) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return (h & 0xffff) / 0xffff; }

  // ---------- Plat tekenen, dan schuin plaatsen ----------
  R.flat = function (w, h, fn) {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    const x = c.getContext('2d'); fn(x, c.width, c.height); return c;
  };
  R.shearBlit = function (ctx, img, x, y, dir) {
    x = Math.round(x); y = Math.round(y);
    for (let i = 0; i < img.width; i++) ctx.drawImage(img, i, 0, 1, img.height, x + i, y + dir * Math.floor(i / 2), 1, img.height);
  };
  // Afgeronde rechthoek in hele pixels (geen anti-aliasing). r = straal in pixels.
  R.inset = function (i, r) { return i >= r ? 0 : r - Math.floor(Math.sqrt(r * r - (r - i - 0.5) * (r - i - 0.5))); };
  R.round = function (ctx, x, y, w, h, r, col) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    r = Math.min(r, Math.floor(w / 2), Math.floor(h / 2));
    ctx.fillStyle = col;
    for (let i = 0; i < r; i++) {
      const k = R.inset(i, r);
      ctx.fillRect(x + k, y + i, w - 2 * k, 1);
      ctx.fillRect(x + k, y + h - 1 - i, w - 2 * k, 1);
    }
    ctx.fillRect(x, y + r, w, h - 2 * r);
  };
  // Hoeken van een rechthoek afronden door ze te overschilderen met de achtergrondkleur
  R.roundCorners = function (ctx, x, y, w, h, r, col) {
    ctx.fillStyle = col;
    for (let i = 0; i < r; i++) {
      const k = R.inset(i, r);
      if (!k) continue;
      ctx.fillRect(x, y + i, k, 1); ctx.fillRect(x + w - k, y + i, k, 1);
      ctx.fillRect(x, y + h - 1 - i, k, 1); ctx.fillRect(x + w - k, y + h - 1 - i, k, 1);
    }
  };
  // Pil met rand: afgeronde rechthoek met een 1px lijn
  R.pill = function (ctx, x, y, w, h, fill, line) {
    R.round(ctx, x, y, w, h, Math.floor(h / 2), line);
    R.round(ctx, x + 1, y + 1, w - 2, h - 2, Math.floor(h / 2) - 1, fill);
  };

  R.glow = function (ctx, cx, cy, r, color, strong) {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y) / r;
      if (d > 1) continue;
      const lvl = d < 0.45 ? 2 : (d < 0.75 ? 1 : 0);
      const px = cx + x, py = cy + y;
      if (lvl === 2 && (strong || (px + py) % 2 === 0)) ctx.fillRect(px, py, 1, 1);
      else if (lvl === 1 && (px + py) % 2 === 0 && py % 2 === 0) ctx.fillRect(px, py, 1, 1);
      else if (lvl === 0 && px % 2 === 0 && py % 4 === 0 && (px / 2 + py / 4) % 2 === 0) ctx.fillRect(px, py, 1, 1);
    }
  };

  // ---------- Muren ----------
  const WAINS = 38;
  function flatWall(w, H, variant) {
    const left = variant === 'left', focal = variant === 'focal';
    return R.flat(w, H, (x) => {
      x.fillStyle = focal ? '#6e1a26' : '#f6e8c3'; x.fillRect(0, 0, w, H);
      for (let i = 0; i < w; i += 12) {
        x.fillStyle = focal ? '#62161f' : '#ecd9ab'; x.fillRect(i, 0, 4, H);
        x.fillStyle = focal ? '#7d2230' : '#f9efd2'; x.fillRect(i + 4, 0, 1, H);
      }
      x.fillStyle = focal ? '#8a2a36' : '#e6d09c';
      for (let yy = 14; yy < H - WAINS - 6; yy += 12) for (let i = 8; i < w; i += 12) {
        const px = i + ((yy / 12) % 2 ? 0 : 6) - 6; if (px < 4) continue;
        x.fillRect(px, yy, 1, 1); x.fillRect(px - 1, yy + 1, 3, 1); x.fillRect(px, yy + 2, 1, 1);
      }
      // kroonlijst
      x.fillStyle = P.wood1; x.fillRect(0, 0, w, 1);
      x.fillStyle = P.wood3; x.fillRect(0, 1, w, 3);
      x.fillStyle = P.wood4; x.fillRect(0, 4, w, 1);
      x.fillStyle = focal ? '#4a1018' : '#d8c28e'; x.fillRect(0, 5, w, 1);
      for (let i = 2; i < w; i += 4) { x.fillStyle = P.wood2; x.fillRect(i, 2, 2, 1); }
      // lambrisering
      const top = H - WAINS;
      x.fillStyle = P.green2; x.fillRect(0, top, w, WAINS);
      x.fillStyle = P.wood1; x.fillRect(0, top - 4, w, 1);
      x.fillStyle = P.wood3; x.fillRect(0, top - 3, w, 2);
      x.fillStyle = P.wood4; x.fillRect(0, top - 1, w, 1);
      for (let i = 5; i + 24 <= w; i += 30) {
        x.fillStyle = P.green1; x.fillRect(i, top + 6, 24, 22);
        x.fillStyle = P.green3; x.fillRect(i + 1, top + 6, 23, 1); x.fillRect(i, top + 6, 1, 21);
        x.fillStyle = '#35604a'; x.fillRect(i + 3, top + 9, 18, 16);
        x.fillStyle = '#3e6d55'; x.fillRect(i + 3, top + 9, 18, 1);
        x.fillStyle = '#284a39'; x.fillRect(i + 3, top + 24, 18, 1);
      }
      x.fillStyle = P.wood2; x.fillRect(0, H - 7, w, 1);
      x.fillStyle = P.wood1; x.fillRect(0, H - 6, w, 6);
      if (left) { x.fillStyle = 'rgba(31,10,14,0.10)'; x.fillRect(0, 0, w, H); }
    });
  }

  function flatWindow(withCat) {
    const W = 46, H = 76, fx = 8, fw = 30, top = 5, bot = 66;
    return R.flat(W, H, (x) => {
      const cx = fx + fw / 2;
      for (let yy = top; yy < bot; yy++) {
        const r = yy - top; let hw = fw / 2;
        if (r < 15) hw = Math.round(Math.sqrt(Math.max(0, 15 * 15 - (15 - r) * (15 - r))));
        x.fillStyle = P.ink; x.fillRect(cx - hw - 1, yy, hw * 2 + 2, 1);
        if (hw > 1) { x.fillStyle = P.wood2; x.fillRect(cx - hw, yy, hw * 2, 1); }
        const ghw = hw - 3;
        if (ghw > 0 && yy > top + 2 && yy < bot - 3) {
          x.fillStyle = yy < top + 24 ? '#c9e4e6' : (yy < top + 38 ? '#a9ccd4' : '#8fb3bd'); x.fillRect(cx - ghw, yy, ghw * 2, 1);
          if (yy > top + 40) { x.fillStyle = '#b8a48a'; x.fillRect(cx - ghw, yy, ghw * 2, 1); if ((yy - top) % 7 < 3) { x.fillStyle = '#6e5a48'; for (let k = cx - ghw + 2; k < cx + ghw - 2; k += 6) x.fillRect(k, yy, 2, 1); } }
        }
      }
      x.fillStyle = P.wood1; x.fillRect(cx - 1, top + 3, 2, bot - top - 6);
      for (const yy of [top + 20, top + 36, top + 50]) x.fillRect(fx + 3, yy, fw - 6, 1);
      x.fillStyle = 'rgba(255,255,255,0.45)';
      for (let k = 0; k < 9; k++) x.fillRect(fx + 5 + k, top + 30 - k, 1, 1);
      for (let k = 0; k < 6; k++) x.fillRect(cx + 3 + k, top + 48 - k, 1, 1);
      x.fillStyle = P.ink; x.fillRect(fx - 4, bot - 2, fw + 8, 5);
      x.fillStyle = P.wood4; x.fillRect(fx - 3, bot - 2, fw + 6, 1);
      x.fillStyle = P.wood3; x.fillRect(fx - 3, bot - 1, fw + 6, 3);
      x.fillStyle = P.ink; x.fillRect(1, 1, W - 2, 3);
      x.fillStyle = P.gold; x.fillRect(2, 2, W - 4, 1); x.fillRect(0, 1, 2, 3); x.fillRect(W - 2, 1, 2, 3);
      for (const side of [0, 1]) {
        for (let yy = 4; yy < 62; yy++) {
          const w = yy < 40 ? 8 : (yy < 44 ? 5 : 6 + Math.floor((yy - 44) / 5));
          const x0 = side ? W - 1 - w : 1;
          x.fillStyle = P.ink; x.fillRect(x0 - (side ? 1 : 0), yy, w + 1, 1);
          x.fillStyle = P.bord2; x.fillRect(x0, yy, w - (side ? 0 : 1), 1);
          x.fillStyle = P.bord3; x.fillRect(side ? x0 + 2 : x0 + 1, yy, 1, 1);
          x.fillStyle = P.bord1; x.fillRect(x0 + 4, yy, 1, 1);
          x.fillStyle = '#b8323f'; if (yy < 40) x.fillRect(side ? x0 + 6 : x0 + 6, yy, 1, 1);
        }
        x.fillStyle = P.gold; x.fillRect(side ? W - 8 : 1, 41, 7, 2);
      }

    });
  }

  R.sleepingCat = function (x, cx, by) {
    x.fillStyle = P.ink; x.fillRect(cx - 7, by - 8, 16, 9); x.fillRect(cx + 5, by - 11, 7, 5);
    x.fillStyle = '#d98a3a'; x.fillRect(cx - 6, by - 7, 14, 7);
    x.fillStyle = '#e9a85a'; x.fillRect(cx - 5, by - 7, 10, 1);
    x.fillStyle = '#b86a2a'; x.fillRect(cx - 4, by - 5, 2, 1); x.fillRect(cx, by - 6, 2, 1); x.fillRect(cx - 2, by - 3, 3, 1); x.fillRect(cx + 3, by - 4, 2, 1);
    x.fillStyle = '#d98a3a'; x.fillRect(cx + 6, by - 10, 5, 4);
    x.fillStyle = P.ink; x.fillRect(cx + 6, by - 11, 1, 1); x.fillRect(cx + 10, by - 11, 1, 1); x.fillRect(cx + 7, by - 8, 3, 1);
    x.fillStyle = '#f3e3c8'; x.fillRect(cx - 7, by - 2, 5, 2);
  };

  function flatSign(logo) {
    const W = 84, H = 46;
    return R.flat(W, H, (x) => {
      x.fillStyle = P.ink; x.fillRect(0, 0, W, H);
      x.fillStyle = '#b88a2a'; x.fillRect(1, 1, W - 2, H - 2);
      x.fillStyle = P.gold; x.fillRect(1, 1, W - 2, 1); x.fillRect(1, 1, 1, H - 2);
      x.fillStyle = P.ink; x.fillRect(3, 3, W - 6, H - 6);
      x.fillStyle = P.green1; x.fillRect(4, 4, W - 8, H - 8);
      x.fillStyle = '#26473a'; for (let i = 6; i < W - 6; i += 4) x.fillRect(i, 5, 1, H - 10);
      x.fillStyle = P.gold; x.fillRect(6, 6, W - 12, 1); x.fillRect(6, H - 7, W - 12, 1);
      for (const [bx, by] of [[5, 5], [W - 7, 5], [5, H - 7], [W - 7, H - 7]]) { x.fillStyle = P.gold2; x.fillRect(bx, by, 2, 2); }
      if (logo && logo.naturalWidth) x.drawImage(logo, Math.round((W - logo.naturalWidth) / 2), Math.round((H - logo.naturalHeight) / 2));
      else { CC.FONT.draw(x, 'CHÂTEAU', W / 2, 13, P.gold2, { align: 'center' }); CC.FONT.draw(x, 'CASHFLOW', W / 2, 25, P.gold2, { align: 'center' }); }
    });
  }

  // ---------- Statische kamer (gecachet) ----------
  R.roomCache = null;
  R.buildRoom = function (level, images) {
    images = images || {};
    const c = document.createElement('canvas'); c.width = R.W; c.height = R.H;
    const ctx = c.getContext('2d');
    const bands = ['#1f0a0e', '#240d12', '#2a1016', '#30131a'];
    for (let i = 0; i < 4; i++) R.rect(ctx, 0, i * 90, R.W, 90, bands[i]);
    for (let i = 0; i < 40; i++) R.rect(ctx, Math.floor(hash(i, 7) * R.W), Math.floor(hash(i, 13) * 200) + 20, 1, 1, hash(i, 3) > 0.5 ? '#45101a' : '#6e1a26');
    const W = RM.w, D = RM.d, H = RM.wallH, K = RM.chamfer || 0;
    const Bk = R.iso(W, 0), Lf = R.iso(0, D), Fr = R.iso(W, D);
    const Bs = R.iso(K, 0), Ls = R.iso(0, K);

    // vloerplaat
    const slab = 8;
    R.poly(ctx, [[Lf[0], Lf[1]], [Fr[0], Fr[1]], [Fr[0], Fr[1] + slab], [Lf[0], Lf[1] + slab]], P.wood1);
    R.poly(ctx, [[Fr[0], Fr[1]], [Bk[0], Bk[1]], [Bk[0], Bk[1] + slab], [Fr[0], Fr[1] + slab]], '#3a2012');
    R.isoLine(ctx, Lf[0], Lf[1] + 2, Fr[0] - Lf[0], 1, P.wood2);
    R.isoLine(ctx, Lf[0], Lf[1] + slab, Fr[0] - Lf[0], 1, P.ink);
    R.isoLine(ctx, Fr[0], Fr[1] + slab, Bk[0] - Fr[0], -1, P.ink);

    // vloer: smalle planken in de x-richting (3 per meter)
    const tones = ['#b0733a', '#a5693a', '#bb7c41', '#9f6436'];
    const PL = 1 / 3;
    for (let j = 0; j < D * 3; j++) {
      const y0 = j * PL, y1 = y0 + PL;
      const xa = Math.max(0, K - y0), xb = Math.max(0, K - y1);
      const col = tones[Math.floor(hash(j, 77) * tones.length)];
      R.poly(ctx, [R.iso(xa, y0), R.iso(W, y0), R.iso(W, y1), R.iso(xb, y1)], col);
      R.isoLine(ctx, R.iso(xa, y0)[0], R.iso(xa, y0)[1], (W - xa) * TW, 1, '#7a4a24');
      // stootnaden
      let xs = xa + 0.6 + hash(j, 5) * 1.6;
      while (xs < W - 0.3) {
        const p = R.iso(xs, y1); R.isoLine(ctx, p[0], p[1] - 0, Math.round(PL * TW), -1, '#8a562b');
        xs += 1.6 + hash(Math.round(xs * 10), j) * 1.8;
      }
    }
    for (let i = 0; i < 320; i++) {
      const tx = hash(i, 201) * W, ty = hash(i, 202) * D; if (tx + ty < K + 0.3) continue;
      const p = R.iso(tx, ty); R.rect(ctx, p[0], p[1], 2, 1, hash(i, 203) > 0.5 ? '#c68a4c' : '#98602f');
    }
    // lichtval van de ramen
    for (const w of CC.WALL.windowsBack || []) {
      R.poly(ctx, [R.iso(w.x0 + 0.1, 0.05), R.iso(w.x1 - 0.1, 0.05), R.iso(w.x1 + 0.5, 2.3), R.iso(w.x0 + 0.5, 2.3)], 'rgba(255,236,170,0.17)');
      const m = (w.x0 + w.x1) / 2; R.poly(ctx, [R.iso(m - 0.05, 0.05), R.iso(m + 0.05, 0.05), R.iso(m + 0.55, 2.3), R.iso(m + 0.45, 2.3)], 'rgba(122,74,36,0.25)');
    }
    for (const w of CC.WALL.windowsLeft || []) {
      R.poly(ctx, [R.iso(0.05, w.y0 + 0.1), R.iso(0.05, w.y1 - 0.1), R.iso(2.3, w.y1 + 0.5), R.iso(2.3, w.y0 + 0.5)], 'rgba(255,236,170,0.17)');
      const m = (w.y0 + w.y1) / 2; R.poly(ctx, [R.iso(0.05, m - 0.05), R.iso(0.05, m + 0.05), R.iso(2.3, m + 0.55), R.iso(2.3, m + 0.45)], 'rgba(122,74,36,0.25)');
    }
    if (CC.WALL.rug) { const r = CC.WALL.rug; R.rug(ctx, r.x, r.y, r.w, r.d); }
    // deurmat
    const dm = RM.door;
    R.quad(ctx, dm.x - 0.9, dm.y - 0.55, dm.x, dm.y + 0.55, P.bord2);
    R.quad(ctx, dm.x - 0.75, dm.y - 0.4, dm.x - 0.1, dm.y + 0.4, P.bord1);

    // muren
    const back = flatWall((W - K) * TW, H, 'back');
    const leftW = flatWall((D - K) * TW, H, 'left');
    const focal = K ? flatWall(K * 2 * TW, H, 'focal') : null;
    const bx = back.getContext('2d'), lx = leftW.getContext('2d');
    (CC.WALL.windowsBack || []).forEach((w, i) => { const win = flatWindow(false); bx.drawImage(win, Math.round(((w.x0 + w.x1) / 2 - K) * TW - win.width / 2), H - 108); });
    (CC.WALL.windowsLeft || []).forEach((w, i) => { const win = flatWindow(true); lx.drawImage(win, Math.round((D - (w.y0 + w.y1) / 2) * TW - win.width / 2), H - 108); });
    if (focal) {
      const fc = focal.getContext('2d');
      const sign = flatSign(images.logoSign);
      const sx = Math.round((focal.width - sign.width) / 2), sy = H - CC.WALL.sign.z0 - sign.height;
      fc.fillStyle = 'rgba(31,10,14,0.3)'; fc.fillRect(sx + 2, sy + 3, sign.width, sign.height);
      fc.drawImage(sign, sx, sy);
    }
    R.shearBlit(ctx, back, Bs[0], Bs[1] - H, 1);
    R.shearBlit(ctx, leftW, Lf[0], Lf[1] - H, -1);
    if (focal) ctx.drawImage(focal, Ls[0], Ls[1] - H);

    // wandbovenkant en hoekpalen
    R.poly(ctx, [[Bs[0], Bs[1] - H - 4], [Bk[0] + 4, Bk[1] - H - 2], [Bk[0], Bk[1] - H], [Bs[0], Bs[1] - H]], P.wood2);
    R.poly(ctx, [[Lf[0] - 4, Lf[1] - H - 2], [Ls[0], Ls[1] - H - 4], [Ls[0], Ls[1] - H], [Lf[0], Lf[1] - H]], P.wood1);
    R.isoLine(ctx, Bs[0], Bs[1] - H - 5, Bk[0] - Bs[0] + 4, 1, P.ink);
    R.isoLine(ctx, Lf[0] - 4, Lf[1] - H - 3, Ls[0] - Lf[0] + 4, -1, P.ink);
    if (K) {
      R.rect(ctx, Ls[0], Ls[1] - H - 5, Bs[0] - Ls[0], 1, P.ink);
      R.rect(ctx, Ls[0], Ls[1] - H - 4, Bs[0] - Ls[0], 4, '#8a5a2c');
      R.rect(ctx, Ls[0] - 1, Ls[1] - H - 4, 2, H + 4, '#3a2012');
      R.rect(ctx, Bs[0] - 1, Bs[1] - H - 4, 2, H + 4, '#e2cf9f');
    }
    R.rect(ctx, Bk[0], Bk[1] - H - 2, 4, H + 2, '#3a2012');
    R.rect(ctx, Lf[0] - 4, Lf[1] - H - 2, 4, H + 2, P.wood1);
    R.rect(ctx, Bk[0] + 4, Bk[1] - H - 2, 1, H + 2 + slab, P.ink);
    R.rect(ctx, Lf[0] - 5, Lf[1] - H - 2, 1, H + 2 + slab, P.ink);
    return c;
  };

  R.rug = function (ctx, x, y, w, d) {
    const q = (a, b, c2, d2, col) => R.quad(ctx, a, b, c2, d2, col);
    q(x - 0.05, y - 0.05, x + w + 0.05, y + d + 0.05, P.ink);
    q(x, y, x + w, y + d, P.bord1);
    q(x + 0.2, y + 0.2, x + w - 0.2, y + d - 0.2, P.gold);
    q(x + 0.26, y + 0.26, x + w - 0.26, y + d - 0.26, P.bord2);
    q(x + 0.55, y + 0.55, x + w - 0.55, y + d - 0.55, '#7d1f2c');
    for (let i = x + 0.8; i < x + w - 0.6; i += 0.6) for (let j = y + 0.8; j < y + d - 0.6; j += 0.6) {
      const p = R.iso(i, j); R.rect(ctx, p[0] - 1, p[1], 3, 1, P.bord3); R.rect(ctx, p[0], p[1] - 1, 1, 3, P.bord3);
    }
    for (let j = y; j <= y + d + 0.01; j += 0.2) for (const xx of [x - 0.05, x + w + 0.05]) { const p = R.iso(xx, j); R.rect(ctx, p[0] + (xx > x ? 1 : -2), p[1], 1, 1, P.cream2); }
  };

  // ---------- Wijnkast ----------
  // Front plat getekend, schuin geplaatst. Flessen worden er daarna rechtop op getekend.
  const FH = 92, CORNICE = 14;
  const VAK = [{ top: 18, planks: [32, 47] }, { top: 50, planks: [64, 79] }];
  function flatCabinetFront(s, f, Wpx, hoverVak) {
    return R.flat(Wpx, FH, (x, w) => {
      const cx = Math.floor(w / 2);
      for (let r = 0; r < 13; r++) {
        const hw = Math.min(Math.floor(w / 2), [5, 9, 12, 14, 16, 17, 18, 19, 20, 21, 22, 22, 22][r]);
        x.fillStyle = P.ink; x.fillRect(cx - hw, r, hw * 2, 1);
        if (hw > 1) { x.fillStyle = r < 12 ? P.green2 : P.gold; x.fillRect(cx - hw + 1, r, hw * 2 - 2, 1); }
        if (r > 0 && r < 12 && hw > 2) { x.fillStyle = P.gold; x.fillRect(cx - hw + 1, r, 1, 1); x.fillRect(cx + hw - 2, r, 1, 1); }
      }
      x.fillStyle = P.gold; x.fillRect(cx - 5, 1, 10, 1);
      // druiventros
      x.fillStyle = P.green4; x.fillRect(cx + 1, 3, 3, 1); x.fillRect(cx, 4, 1, 1);
      x.fillStyle = P.bord3; x.fillRect(cx - 3, 5, 6, 2); x.fillRect(cx - 2, 7, 4, 2); x.fillRect(cx - 1, 9, 2, 1);
      x.fillStyle = P.bord4; x.fillRect(cx - 3, 5, 1, 1); x.fillRect(cx, 6, 1, 1); x.fillRect(cx - 1, 8, 1, 1);
      // lijst
      x.fillStyle = P.ink; x.fillRect(0, 13, w, 1);
      x.fillStyle = P.wood4; x.fillRect(1, 13, w - 2, 1);
      x.fillStyle = P.wood3; x.fillRect(0, 14, w, 2);
      x.fillStyle = P.gold; x.fillRect(0, 16, w, 1);
      // binnenkant
      x.fillStyle = '#2b170d'; x.fillRect(4, 17, w - 8, 64);
      x.fillStyle = '#34200f'; for (let i = 7; i < w - 4; i += 7) x.fillRect(i, 17, 1, 64);
      x.fillStyle = '#1c0e07'; x.fillRect(4, 17, w - 8, 1);
      f.vakken.forEach((vakId, vi) => {
        const V = VAK[vi], vk = s.vakken[vakId];
        for (const pr of V.planks) { x.fillStyle = P.wood4; x.fillRect(4, pr, w - 8, 1); x.fillStyle = P.wood2; x.fillRect(4, pr + 1, w - 8, 1); }
        if (vk.wine && vk.n === 0) { x.fillStyle = P.red; for (const pr of V.planks) x.fillRect(5, pr - 1, w - 10, 1); }
        if (hoverVak === vakId) { x.fillStyle = P.gold2; const y0 = V.top, y1 = V.planks[1] + 1; x.fillRect(4, y0, w - 8, 1); x.fillRect(4, y1, w - 8, 1); x.fillRect(4, y0, 1, y1 - y0); x.fillRect(w - 5, y0, 1, y1 - y0); }
      });
      // tussenschot met naamplaatje
      x.fillStyle = P.wood3; x.fillRect(4, 48, w - 8, 2); x.fillStyle = P.gold; x.fillRect(cx - 4, 48, 8, 2);
      // la met knopjes
      x.fillStyle = P.wood2; x.fillRect(4, 81, w - 8, 1);
      // stijlen
      x.fillStyle = P.ink; x.fillRect(0, 13, 1, FH - 13); x.fillRect(w - 1, 13, 1, FH - 13);
      x.fillStyle = P.wood3; x.fillRect(1, 17, 1, 66); x.fillRect(w - 4, 17, 1, 66);
      x.fillStyle = P.wood2; x.fillRect(2, 17, 2, 66); x.fillRect(w - 3, 17, 2, 66);
      x.fillStyle = P.wood4; x.fillRect(1, 17, 1, 3); x.fillRect(w - 4, 17, 1, 3);
      // plint met la
      x.fillStyle = P.wood2; x.fillRect(1, 82, w - 2, 6);
      x.fillStyle = P.wood3; x.fillRect(3, 83, w - 6, 4);
      x.fillStyle = P.gold; x.fillRect(cx - 6, 85, 2, 1); x.fillRect(cx + 4, 85, 2, 1);
      x.fillStyle = P.wood1; x.fillRect(1, 88, w - 2, 3);
      x.fillStyle = P.ink; x.fillRect(0, FH - 1, w, 1);
    });
  }
  const sideCache = {};
  function flatCabinetSide(Wpx) {
    if (sideCache[Wpx]) return sideCache[Wpx];
    return (sideCache[Wpx] = R.flat(Wpx, FH, (x, w) => {
      x.fillStyle = P.ink; x.fillRect(0, 13, w, 1);
      x.fillStyle = P.wood3; x.fillRect(0, 14, w, 2);
      x.fillStyle = '#9a6a2a'; x.fillRect(0, 16, w, 1);
      x.fillStyle = P.wood2; x.fillRect(0, 17, w, 71);
      x.fillStyle = P.wood1; x.fillRect(3, 22, w - 6, 56);
      x.fillStyle = '#6a3e1e'; x.fillRect(4, 23, w - 8, 54);
      x.fillStyle = '#5e361a'; x.fillRect(4, 23, w - 8, 1); x.fillRect(4, 23, 1, 54);
      x.fillStyle = '#3a2012'; x.fillRect(0, 82, w, 9);
      x.fillStyle = P.wood2; x.fillRect(0, 82, w, 1);
      x.fillStyle = 'rgba(31,10,14,0.18)'; x.fillRect(0, 0, w, FH);
      x.fillStyle = P.ink; x.fillRect(w - 1, 13, 1, FH - 13); x.fillRect(0, FH - 1, w, 1);
    }));
  }

  // Fles 3×10 (rechtop), onderkant op (x,y)
  R.bottleM = function (ctx, x, y, w) {
    ctx.fillStyle = w.cap; ctx.fillRect(x + 1, y - 10, 1, 2);
    ctx.fillStyle = w.glass; ctx.fillRect(x + 1, y - 8, 1, 2); ctx.fillRect(x, y - 6, 3, 6);
    ctx.fillStyle = w.label; ctx.fillRect(x, y - 4, 3, 2);
    if (w.label2 && w.label2 !== w.label) { ctx.fillStyle = w.label2; ctx.fillRect(x + 1, y - 4, 1, 1); }
    if (w.wine) { ctx.fillStyle = w.wine; ctx.fillRect(x + 2, y - 2, 1, 2); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y - 6, 1, 2);
  };

  R.drawShelf = function (ctx, f, s, hover) {
    const left = f.o === 'left';
    const A = R.iso(f.x, f.y), B = R.iso(f.x + f.w, f.y), C = R.iso(f.x + f.w, f.y + f.d), D = R.iso(f.x, f.y + f.d);
    const BT = FH - CORNICE;
    const up = (p) => [p[0], p[1] - BT];
    R.poly(ctx, [up(A), up(B), up(C), up(D)].map(p => [p[0], p[1] - 1]), P.ink);
    R.poly(ctx, [up(A), up(B), up(C), up(D)], '#5a3420');
    // zijkant + front
    let fx0, fy0, dir, Wpx;
    if (!left) { R.shearBlit(ctx, flatCabinetSide(C[0] - D[0] > 0 ? B[0] - C[0] : 1), C[0], C[1] - FH, -1); Wpx = C[0] - D[0]; fx0 = D[0]; fy0 = D[1] - FH; dir = 1; }
    else { R.shearBlit(ctx, flatCabinetSide(C[0] - D[0]), D[0], D[1] - FH, 1); Wpx = B[0] - C[0]; fx0 = C[0]; fy0 = C[1] - FH; dir = -1; }
    const hv = hover && f.vakken.includes(hover) ? hover : null;
    R.shearBlit(ctx, flatCabinetFront(s, f, Wpx, hv), fx0, fy0, dir);
    // flessen rechtop
    const per = 6, inner = Wpx - 10, step = Math.floor(inner / per);
    f.vakken.forEach((vakId, vi) => {
      const vk = s.vakken[vakId]; if (!vk.wine) return;
      const wine = CC.wineById(vk.wine);
      VAK[vi].planks.forEach((pr, row) => {
        for (let i = 0; i < per; i++) {
          if (row * per + i >= vk.n) break;
          const fx = 5 + i * step + Math.floor((step - 3) / 2);
          R.bottleM(ctx, fx0 + fx, fy0 + pr + dir * Math.floor((fx + 1) / 2), wine);
        }
      });
    });
    return f.vakken.map((vakId, vi) => {
      const V = VAK[vi];
      const yTop = fy0 + V.top + Math.min(0, dir * Math.floor(Wpx / 2));
      const yBot = fy0 + V.planks[1] + Math.max(0, dir * Math.floor(Wpx / 2));
      return { vak: vakId, x: fx0, y: yTop, w: Wpx, h: yBot - yTop };
    });
  };

  // Mini-fles (2×7) voor kleine plekken
  // Wijnfles als afbeelding (assets/wines.js, tools/build_wines.py). size: schap | icoon | groot.
  // Geeft false terug als de afbeelding er (nog) niet is; dan tekent de code de oude fles.
  R.wineSprite = function (ctx, w, size, cx, bottom) {
    const S = CC.WINE_SPRITES && CC.WINE_SPRITES[w.id] && CC.WINE_SPRITES[w.id][size];
    const im = S && CC.IMAGES && CC.IMAGES['wine_' + w.id.slice(5) + '_' + size];
    if (!im || !im.complete || !im.naturalWidth) return false;
    ctx.drawImage(im, Math.round(cx - im.naturalWidth / 2), Math.round(bottom - im.naturalHeight));
    return true;
  };

  // Fles gecentreerd in een rij (cx, cy = midden van het vak). size: icoon (standaard) of schap.
  R.bottleMid = function (ctx, cx, cy, w, size) {
    size = size || 'icoon';
    const S = CC.WINE_SPRITES && CC.WINE_SPRITES[w.id] && CC.WINE_SPRITES[w.id][size];
    if (S && R.wineSprite(ctx, w, size, cx, Math.round(cy + S.h / 2))) return;
    if (size === 'schap') R.bottle(ctx, cx - 1, cy + 4, w); else R.bottleIcon(ctx, cx - 3, cy - 9, w);
  };

  R.bottle = function (ctx, x, y, w) {
    if (R.wineSprite(ctx, w, 'schap', x + 1, y + 1)) return;
    ctx.fillStyle = w.cap; ctx.fillRect(x, y - 7, 2, 1);
    ctx.fillStyle = w.glass; ctx.fillRect(x, y - 6, 2, 2);
    ctx.fillStyle = w.label; ctx.fillRect(x, y - 4, 2, 2);
    ctx.fillStyle = w.glass; ctx.fillRect(x, y - 2, 2, 2);
    if (w.wine) { ctx.fillStyle = w.wine; ctx.fillRect(x + 1, y - 2, 1, 2); }
  };

  R.bottleIcon = function (ctx, x, y, w) {
    x = Math.round(x); y = Math.round(y);
    if (R.wineSprite(ctx, w, 'icoon', x + 3, y + 20)) return;
    const shape = w.shape, ink = P.ink;
    const neckH = shape === 'bdx' ? 5 : 6, bodyTop = y + neckH + 1;
    R.rect(ctx, x + 1, y - 1, 4, neckH + 2, ink);
    R.rect(ctx, x - 1, bodyTop - 1, 8, 18 - neckH + 1, ink);
    if (shape === 'bourg' || shape === 'flute' || shape === 'sparkle') R.rect(ctx, x, bodyTop - 2, 6, 2, ink);
    R.rect(ctx, x + 2, y, 2, neckH, w.glass);
    R.rect(ctx, x + 2, y, 2, shape === 'sparkle' ? 4 : 3, w.cap);
    if (shape === 'sparkle') R.rect(ctx, x + 1, y + 1, 4, 3, w.cap);
    R.rect(ctx, x, bodyTop, 6, 17 - neckH, w.glass);
    if (shape === 'bourg' || shape === 'flute') R.rect(ctx, x + 1, bodyTop - 1, 4, 1, w.glass);
    if (w.wine) R.rect(ctx, x + 1, bodyTop + 1, 4, 15 - neckH, w.wine);
    R.rect(ctx, x, bodyTop + 4, 6, 6, w.label);
    R.rect(ctx, x + 1, bodyTop + 6, 4, 1, w.label2);
    R.rect(ctx, x + 2, bodyTop + 8, 2, 1, w.label2);
    R.rect(ctx, x + 1, bodyTop + 1, 1, 2, 'rgba(255,255,255,0.35)');
  };

  // ---------- Toonbank (kijkt recht naar de speler) met kassa en telefoon ----------
  R.drawCounterFront = function (ctx, f, hover) {
    const O = R.iso(0, 0);
    const wpx = f.px, h = f.h;
    const x0 = Math.round(O[0] - wpx / 2);
    const yFront = Math.round(O[1] + TH * f.front), yBack = Math.round(O[1] + TH * f.back);
    const top = yFront - h, topBack = yBack - h;
    // blad
    R.rect(ctx, x0 - 2, topBack - 1, wpx + 4, top - topBack + 3, P.ink);
    R.rect(ctx, x0 - 1, topBack, wpx + 2, top - topBack, '#ece4d2');
    for (let i = 0; i < 12; i++) R.rect(ctx, x0 + 4 + i * 7, topBack + 2 + (i % 3) * 2, 4, 1, '#d2c7af');
    R.rect(ctx, x0 - 1, top, wpx + 2, 2, '#c9bda3');
    // front
    R.rect(ctx, x0 - 1, top + 2, wpx + 2, h - 1, P.ink);
    R.rect(ctx, x0, top + 2, wpx, 2, '#5a3420');
    R.rect(ctx, x0, top + 4, wpx, h - 10, P.green2);
    const n = 3, pw = Math.floor((wpx - 10) / n) - 3;
    for (let i = 0; i < n; i++) {
      const px = x0 + 5 + i * (pw + 3) + 1;
      R.rect(ctx, px, top + 7, pw, h - 16, P.gold);
      R.rect(ctx, px + 1, top + 8, pw - 2, h - 18, P.green1);
      R.rect(ctx, px + 2, top + 9, pw - 4, h - 20, P.green3);
      R.rect(ctx, px + 3, top + 10, pw - 6, h - 22, P.green2);
    }
    R.rect(ctx, x0, top + h - 6, wpx, 1, P.gold);
    R.rect(ctx, x0 + 3, top + h - 7, wpx - 6, 1, '#e8b53a');
    R.rect(ctx, x0, top + h - 5, wpx, 5, P.wood1);
    R.rect(ctx, x0, top + h - 5, wpx, 1, P.wood2);
    // kassa (rechts op de toonbank)
    const kx = x0 + wpx - 30, ky = topBack - 14;
    const hk = hover === 'register';
    R.rect(ctx, kx - 1, ky - 1, 22, 22, P.ink);
    R.rect(ctx, kx, ky + 7, 20, 13, hk ? P.gold2 : '#c9962e');
    R.rect(ctx, kx, ky + 7, 20, 1, P.gold2);
    R.rect(ctx, kx + 1, ky + 10, 18, 5, '#8a6420');
    for (let i = 0; i < 5; i++) R.rect(ctx, kx + 2 + i * 3 + (i > 2 ? 1 : 0), ky + 11, 2, 2, P.cream3);
    R.rect(ctx, kx + 1, ky + 17, 18, 1, '#8a6420');
    R.rect(ctx, kx + 3, ky, 14, 7, '#c9962e');
    R.rect(ctx, kx + 4, ky + 1, 12, 4, '#1f3a2e');
    R.rect(ctx, kx + 6, ky + 2, 7, 1, P.green4);
    R.rect(ctx, kx + 19, ky + 9, 3, 1, P.ink); R.rect(ctx, kx + 21, ky + 6, 1, 4, P.ink); R.rect(ctx, kx + 20, ky + 5, 3, 2, P.gold);
    // telefoon (links op de toonbank): zwarte draaischijftelefoon met hoorn
    const tx = x0 + 9, ty = topBack - 10;
    const hp = hover === 'phone';
    const body = hp ? '#4a3a40' : '#2a2226', hi = hp ? '#6a5a60' : '#3e3438';
    R.rect(ctx, tx, ty + 5, 16, 9, P.ink);                        // voet
    R.rect(ctx, tx + 1, ty + 6, 14, 7, body);
    R.rect(ctx, tx + 2, ty + 6, 12, 1, hi);
    R.rect(ctx, tx + 5, ty + 7, 6, 5, P.cream2);                  // draaischijf
    R.rect(ctx, tx + 6, ty + 7, 4, 1, P.cream3);
    R.rect(ctx, tx + 7, ty + 9, 2, 1, P.ink);
    for (const [dx, dy] of [[5, 8], [10, 8], [5, 10], [10, 10], [7, 7], [8, 11]]) R.rect(ctx, tx + dx, ty + dy, 1, 1, '#8a7a6a');
    R.rect(ctx, tx - 1, ty + 1, 18, 5, P.ink);                    // hoorn
    R.rect(ctx, tx, ty + 2, 16, 2, body); R.rect(ctx, tx + 1, ty + 2, 14, 1, hi);
    R.rect(ctx, tx - 1, ty + 2, 4, 5, P.ink); R.rect(ctx, tx, ty + 3, 2, 3, body);
    R.rect(ctx, tx + 13, ty + 2, 4, 5, P.ink); R.rect(ctx, tx + 14, ty + 3, 2, 3, body);
    R.rect(ctx, tx + 16, ty + 10, 2, 1, P.ink); R.rect(ctx, tx + 18, ty + 11, 1, 3, P.ink);   // snoer
    // glazen en papieren zak
    for (const dx of [36, 41]) { const gx = x0 + dx, gy = topBack + 3; R.rect(ctx, gx, gy - 8, 4, 4, P.glass2); R.rect(ctx, gx, gy - 6, 4, 1, P.bord3); R.rect(ctx, gx + 1, gy - 4, 2, 3, P.glass2); R.rect(ctx, gx, gy - 1, 4, 1, P.glass2); }
    if (hover) R.rect(ctx, x0 - 2, top + h + 1, wpx + 4, 1, P.gold2);
    return {
      register: { x: kx - 3, y: ky - 3, w: 26, h: 26 },
      phone: { x: tx - 3, y: ty - 3, w: 24, h: 20 },
      all: { x: x0 - 2, y: topBack - 16, w: wpx + 4, h: yFront - topBack + h + 16 },
    };
  };

  // ---------- Presentatietafel (wordt de vitrine) ----------
  R.drawTable = function (ctx, f, s, hover) {
    const oak = { top: '#c98f4e', left: P.wood3, right: P.wood2 };
    const lg = 0.14, h = f.h;
    for (const [lx, ly] of [[0, 0], [f.w - lg, 0], [0, f.d - lg], [f.w - lg, f.d - lg]]) R.box(ctx, f.x + lx + 0.05, f.y + ly + 0.05, lg, lg, h - 5, { top: P.wood2, left: P.wood2, right: P.wood1 });
    R.box(ctx, f.x + 0.05, f.y + 0.05, f.w - 0.1, f.d - 0.1, 5, { top: P.wood2, left: P.wood2, right: P.wood1 }, h - 9);
    const g = R.box(ctx, f.x - 0.05, f.y - 0.05, f.w + 0.1, f.d + 0.1, 4, oak, h - 4);
    // loper
    R.quad(ctx, f.x + 0.15, f.y + 0.3, f.x + f.w - 0.15, f.y + f.d - 0.3, P.bord2, h);
    R.quad(ctx, f.x + 0.15, f.y + 0.34, f.x + f.w - 0.15, f.y + 0.38, P.gold, h);
    R.quad(ctx, f.x + 0.15, f.y + f.d - 0.38, f.x + f.w - 0.15, f.y + f.d - 0.34, P.gold, h);
    const wine = (s && s.vitrine && CC.wineById(s.vitrine)) || CC.wineById('wine_bordeaux');
    // houten kistje met flessen (schuin tentoongesteld)
    R.box(ctx, f.x + 0.25, f.y + 0.25, 0.7, 0.5, 9, { top: '#5a3420', left: P.wood4, right: P.wood3 }, h);
    const kb = R.iso(f.x + 0.25, f.y + 0.75, h + 9);
    for (let i = 0; i < 4; i++) { const bx = kb[0] + 3 + i * 4, by = kb[1] + Math.floor((3 + i * 4) / 2) - 1; R.rect(ctx, bx - 1, by - 9, 5, 10, P.ink); R.bottleM(ctx, bx, by, wine); }
    const ks = R.iso(f.x + 0.25, f.y + 0.75, h + 4); R.rect(ctx, ks[0] + 6, ks[1] + 2, 8, 2, P.bord3);
    // twee staande flessen + glazen + krijtbordje
    for (const [ox, oy] of [[1.2, 0.35], [1.35, 0.5]]) { const p = R.iso(f.x + ox, f.y + oy, h); R.rect(ctx, p[0] - 1, p[1] - 17, 6, 18, P.ink); R.rect(ctx, p[0], p[1] - 16, 4, 16, wine.glass); R.rect(ctx, p[0] + 1, p[1] - 16, 2, 3, wine.cap); R.rect(ctx, p[0], p[1] - 8, 4, 4, wine.label); R.rect(ctx, p[0], p[1] - 12, 1, 4, 'rgba(255,255,255,0.35)'); }
    for (const [ox, oy] of [[1.15, 0.8], [1.4, 0.85]]) { const p = R.iso(f.x + ox, f.y + oy, h); R.rect(ctx, p[0], p[1] - 9, 4, 4, P.glass2); R.rect(ctx, p[0], p[1] - 7, 4, 1, P.bord3); R.rect(ctx, p[0] + 1, p[1] - 5, 2, 4, P.glass2); R.rect(ctx, p[0], p[1] - 1, 4, 1, P.glass2); }
    const cb = R.iso(f.x + 0.9, f.y + 0.85, h);
    R.rect(ctx, cb[0] - 6, cb[1] - 12, 12, 12, P.ink); R.rect(ctx, cb[0] - 5, cb[1] - 11, 10, 9, '#2a2f2b'); R.rect(ctx, cb[0] - 5, cb[1] - 11, 10, 1, P.wood3);
    R.rect(ctx, cb[0] - 3, cb[1] - 8, 6, 1, P.cream2); R.rect(ctx, cb[0] - 3, cb[1] - 5, 4, 1, P.bord4);
    if (hover) R.isoLine(ctx, g.D[0], g.D[1] + 1, g.C[0] - g.D[0], 1, P.gold2);
    return { x: g.D[0] - 2, y: g.A[1] - h - 24, w: g.B[0] - g.D[0] + 4, h: g.C[1] - g.A[1] + h + 26 };
  };

  R.drawBarrel = function (ctx, f) {
    const c = R.iso(f.x + f.w / 2, f.y + f.d / 2);
    const bx = c[0], by = c[1], H = 34;
    ctx.fillStyle = 'rgba(31,10,14,0.35)'; ctx.fillRect(bx - 12, by - 2, 24, 4);
    for (let r = 0; r < H; r++) {
      const w = 20 + Math.round(4 * Math.sin(Math.PI * r / (H - 1)));
      const y = by - H + r;
      R.rect(ctx, bx - w / 2 - 1, y, w + 2, 1, P.ink);
      R.rect(ctx, bx - w / 2, y, w, 1, P.wood3);
      for (let s2 = -w / 2 + 3; s2 < w / 2; s2 += 4) R.rect(ctx, bx + s2, y, 1, 1, P.wood2);
      R.rect(ctx, bx - w / 2, y, 3, 1, P.wood4);
      R.rect(ctx, bx + w / 2 - 4, y, 4, 1, P.wood2);
      if ([5, 6, 27, 28].includes(r)) R.rect(ctx, bx - w / 2, y, w, 1, r % 2 ? '#3a3036' : P.stone1);
    }
    R.rect(ctx, bx - 11, by - H - 6, 22, 7, P.ink);
    R.rect(ctx, bx - 10, by - H - 5, 20, 5, P.wood4);
    R.rect(ctx, bx - 7, by - H - 4, 14, 3, P.wood3);
    R.rect(ctx, bx - 2, by - H + 14, 4, 4, P.ink); R.rect(ctx, bx - 1, by - H + 15, 2, 2, P.wood1); // spon
  };

  // Stapel houten wijnkisten met stro en flessenhalzen
  R.drawCrates = function (ctx, f) {
    const cw = { top: '#9a6432', left: '#8a5a2c', right: '#6a3e1e' };
    const bw = CC.wineById('wine_rioja');
    R.box(ctx, f.x, f.y, f.w, f.d, 12, cw);
    R.box(ctx, f.x + 0.05, f.y + 0.02, f.w - 0.1, f.d - 0.05, 12, cw, 12);
    // latten
    for (const z of [4, 8, 16, 20]) { const a = R.iso(f.x, f.y + f.d, z); R.isoLine(ctx, a[0], a[1], Math.round(f.w * TW), 1, '#5e361a'); const b2 = R.iso(f.x + f.w, f.y + f.d, z); R.isoLine(ctx, b2[0], b2[1], Math.round(f.d * TW), -1, '#4a2a17'); }
    const st = R.iso(f.x + 0.1, f.y + f.d, 6); R.rect(ctx, st[0] + 3, st[1] + 1, 7, 3, P.bord2); R.rect(ctx, st[0] + 4, st[1] + 2, 5, 1, P.bord3);
    const s2 = R.iso(f.x + 0.15, f.y + f.d - 0.03, 18); R.rect(ctx, s2[0] + 3, s2[1] + 1, 7, 3, P.bord2);
    // open bovenste kist: stro + flessenhalzen
    const t = R.iso(f.x + 0.15, f.y + 0.1, 24);
    for (let i = 0; i < 9; i++) R.rect(ctx, t[0] - 2 + i * 2, t[1] + 4 + (i % 3), 1, 2, P.honey);
    for (let i = 0; i < 3; i++) { const bx = t[0] + 2 + i * 5, by = t[1] + 5 + Math.floor(i * 2.5); R.rect(ctx, bx - 1, by - 7, 4, 8, P.ink); R.rect(ctx, bx, by - 6, 2, 6, bw.glass); R.rect(ctx, bx, by - 6, 2, 2, bw.cap); }
  };

  R.drawPlant = function (ctx, f, t) {
    const c = R.iso(f.x + f.w / 2, f.y + f.d / 2);
    const px = c[0], py = c[1];
    ctx.fillStyle = 'rgba(31,10,14,0.3)'; ctx.fillRect(px - 10, py - 2, 20, 4);
    // stam (kort, licht kronkelend)
    R.rect(ctx, px - 2, py - 30, 5, 18, P.ink);
    R.rect(ctx, px - 1, py - 29, 3, 17, P.wood2); R.rect(ctx, px - 1, py - 29, 1, 17, P.wood3);
    R.rect(ctx, px - 5, py - 31, 4, 3, P.ink); R.rect(ctx, px - 4, py - 30, 2, 1, P.wood2);
    // terracotta pot
    R.rect(ctx, px - 10, py - 16, 20, 16, P.ink);
    R.rect(ctx, px - 9, py - 15, 18, 14, '#b85a34');
    R.rect(ctx, px + 3, py - 15, 6, 14, '#8c4226');
    R.rect(ctx, px - 8, py - 15, 2, 14, '#d77a4c');
    R.rect(ctx, px - 11, py - 19, 22, 5, P.ink); R.rect(ctx, px - 10, py - 18, 20, 3, '#c96a3c'); R.rect(ctx, px - 10, py - 18, 20, 1, '#e08a5a');
    R.rect(ctx, px - 8, py - 15, 16, 1, '#4a2a17');
    // brede, ronde kruin die de stam raakt
    const sway = Math.round(Math.sin(t * 1.1 + f.x) * 0.6);
    const blobs = [[-17, -44, 14, 10], [-4, -50, 16, 12], [-11, -56, 15, 9], [5, -42, 14, 10], [-19, -36, 11, 8], [-6, -40, 14, 10], [9, -52, 10, 8], [-2, -60, 10, 6], [4, -34, 9, 6]];
    for (const [dx, dy, w, h] of blobs) R.rect(ctx, px + dx - 1 + sway, py + dy - 1, w + 2, h + 2, P.ink);
    blobs.forEach(([dx, dy, w, h], i) => R.rect(ctx, px + dx + sway, py + dy, w, h, ['#56764a', '#6f8f5e', '#4a6640'][i % 3]));
    blobs.forEach(([dx, dy, w, h], i) => { R.rect(ctx, px + dx + 2 + sway, py + dy + 1, Math.min(5, w - 3), 1, '#a9c08c'); R.rect(ctx, px + dx + w - 3 + sway, py + dy + h - 2, 2, 1, '#34492c'); if (i % 2) R.rect(ctx, px + dx + 4 + sway, py + dy + 4, 2, 1, '#8fae74'); });
  };

  // ---------- Geschilderde achtergrond: alleen wat verandert wordt getekend ----------
  // Fles 3×11 voor de geschilderde kasten, onderkant op (x,y)
  R.bottleP = function (ctx, x, y, w) {
    if (CC.WINE_SPRITES && CC.WINE_SPRITES[w.id]) {
      ctx.fillStyle = 'rgba(20,8,6,0.45)'; ctx.fillRect(x + 3, y - 6, 1, 6);   // schaduw
      if (R.wineSprite(ctx, w, 'schap', x + 1.5, y + 1)) return;
    }
    ctx.fillStyle = 'rgba(20,8,6,0.55)'; ctx.fillRect(x + 3, y - 7, 1, 7);            // schaduw
    ctx.fillStyle = w.cap; ctx.fillRect(x + 1, y - 11, 1, 2);
    ctx.fillStyle = w.glass; ctx.fillRect(x + 1, y - 9, 1, 2); ctx.fillRect(x, y - 7, 3, 7);
    ctx.fillStyle = w.label; ctx.fillRect(x, y - 5, 3, 3);
    if (w.label2 && w.label2 !== w.label) { ctx.fillStyle = w.label2; ctx.fillRect(x + 1, y - 4, 1, 1); }
    if (w.wine) { ctx.fillStyle = w.wine; ctx.fillRect(x + 2, y - 2, 1, 2); }
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x, y - 7, 1, 2);
  };

  R.paintedShelf = function (ctx, f, s, hover, images) {
    const BG = CC.BG, L = CC.BG_LAYERS || {};
    R.drawLayer(ctx, images, 'layer_' + f.id, L[f.id]);
    const pk = BG.planks[f.id]; if (!pk) return [];
    const Y = (c, x) => Math.round(c + pk.slope * x);
    const per = 6, span = pk.x1 - pk.x0 - 3;
    const rects = [];
    f.vakken.forEach((vakId, vi) => {
      const vk = s.vakken[vakId];
      const rows = pk.rows.slice(vi * 2, vi * 2 + 2);
      if (vk.wine) {
        const wine = CC.wineById(vk.wine);
        rows.forEach((c, r) => {
          for (let i = 0; i < per; i++) {
            if (r * per + i >= vk.n) break;
            const x = Math.round(pk.x0 + 1 + i * span / per);
            R.bottleP(ctx, x, Y(c, x + 1), wine);
          }
          if (vk.n === 0) R.isoLine(ctx, pk.x0, Y(c, pk.x0) - 1, pk.x1 - pk.x0, Math.sign(pk.slope), P.red);
        });
      }
      const top = Math.min(Y(rows[0], pk.x0), Y(rows[0], pk.x1)) - 14;
      const bot = Math.max(Y(rows[1], pk.x0), Y(rows[1], pk.x1)) + 2;
      if (hover === vakId) {
        const dir = Math.sign(pk.slope), len = pk.x1 - pk.x0 + 4;
        R.isoLine(ctx, pk.x0 - 2, Y(rows[0], pk.x0 - 2) - 13, len, dir, P.gold2);
        R.isoLine(ctx, pk.x0 - 2, Y(rows[1], pk.x0 - 2) + 1, len, dir, P.gold2);
        R.rect(ctx, pk.x0 - 2, Y(rows[0], pk.x0 - 2) - 13, 1, Y(rows[1], pk.x0 - 2) - Y(rows[0], pk.x0 - 2) + 14, P.gold2);
        R.rect(ctx, pk.x1 + 1, Y(rows[0], pk.x1 + 1) - 13, 1, Y(rows[1], pk.x1 + 1) - Y(rows[0], pk.x1 + 1) + 14, P.gold2);
      }
      rects.push({ vak: vakId, x: pk.x0 - 3, y: top, w: pk.x1 - pk.x0 + 6, h: bot - top });
    });
    return rects;
  };

  // Tafel als voorgrondlaag (met het houten trapje en de kaars, besluit 62) + de vitrinewijn op het trapje
  R.paintedTable = function (ctx, f, s, images) {
    const L = CC.BG_LAYERS || {}, V = CC.BG.vitrine, t = performance.now() / 1000;
    R.drawLayer(ctx, images, 'layer_table', L.table);
    // kaarsvlam: klein, warm en onrustig (altijd; het is de sfeer van de winkel)
    if (V && V.flame) {
      const k = 0.75 + 0.15 * Math.sin(t * 7.3) + 0.1 * Math.sin(t * 12.9 + 1.3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(V.flame.x, V.flame.y, 1, V.flame.x, V.flame.y, 12);
      g.addColorStop(0, `rgba(255,190,90,${(0.42 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = g; ctx.fillRect(V.flame.x - 12, V.flame.y - 12, 24, 24); ctx.restore();
    }
    const listed = s ? CC.SIM.listed(s).filter(l => l.n > 0) : [];
    // alleen als je de vitrine hebt gekocht en er bewust een wijn in zet
    const wine = s && s.vitrine && CC.SIM.owns(s, 'vitrine') && listed.some(l => l.wine.id === s.vitrine) ? CC.wineById(s.vitrine) : null;
    if (!wine || !V) return;
    // uitgelicht: warme lichtvlek rond het trapje, zacht ademend (net als het uithangbord)
    const cx = 324, cy = 188, br = 0.3 + 0.05 * Math.sin(t * 1.6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.translate(cx, cy); ctx.scale(1, 0.6);
    const g = ctx.createRadialGradient(0, 0, 3, 0, 0, 32); g.addColorStop(0, `rgba(255,200,120,${br.toFixed(3)})`); g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.fillRect(-34, -34, 68, 68); ctx.restore();
    // flessen: eerst de bovenste trede (verder weg), dan de onderste
    for (const [x, y] of [...V.top, ...V.low]) {
      ctx.fillStyle = 'rgba(31,10,14,0.35)'; ctx.fillRect(x - 2, y - 1, 5, 2);
      if (!R.wineSprite(ctx, wine, 'schap', x, y)) R.bottle(ctx, x - 1, y, wine);
    }
    // glinstering die langs de flessen trekt
    const i = Math.floor(t * 0.7) % 6, ph = (t * 0.7) % 1;
    if (ph < 0.25) { const [x, y] = [...V.top, ...V.low][i]; R.rect(ctx, x - 1, y - 9, 1, 3, 'rgba(255,255,255,0.8)'); }
  };

  // Winkelfases (besluit 63): decorlaag; het lichtsnoer twinkelt zacht per lampje
  R.paintedDecor = function (ctx, f, images, t) {
    const L = (CC.BG_LAYERS || {})[f.layer];
    if (!L) return;
    R.drawLayer(ctx, images, 'layer_' + f.layer, L);
    if (!f.twinkle || !L.bulbs) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    L.bulbs.forEach(([x, y], i) => {
      const k = 0.5 + 0.5 * Math.sin(t * (0.9 + (i % 5) * 0.17) + i * 2.3);
      const g = ctx.createRadialGradient(x, y, 0.5, x, y, 6);
      g.addColorStop(0, `rgba(255,205,120,${(0.12 + 0.2 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(255,205,120,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 6, y - 6, 12, 12);
    });
    ctx.restore();
  };

  // Achtergrond of laag tekenen (alleen het schemerbeeld; de dagversie is geschrapt, besluit 56/85)
  R.drawLayer = function (ctx, images, key, pos) {
    const im = images[key];
    if (pos && im && im.complete && im.naturalWidth) ctx.drawImage(im, pos.x, pos.y);
  };

  // Uithangbord; met t (investering 'uithangbord') brandt het: een schilderijlamp erboven,
  // een warme lichtbundel over het bord en gloeiende letters, zacht ademend.
  R.paintedSign = function (ctx, images, t) {
    const logo = images.logoSign, S = CC.BG.sign;
    if (!logo || !logo.complete || !logo.naturalWidth) return;
    const w = logo.naturalWidth, h = logo.naturalHeight, cx = Math.round(S.x + w / 2);
    if (t == null) { ctx.drawImage(logo, S.x, S.y); return; }
    const k = 0.9 + 0.07 * Math.sin(t * 1.3) + 0.03 * Math.sin(t * 7.1);
    const top = S.y - 6, bot = S.y + h + 12;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // lichtbundel van de lamp naar beneden
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, `rgba(255,214,140,${0.5 * k})`); g.addColorStop(0.55, `rgba(255,180,90,${0.22 * k})`); g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(cx - 14, top); ctx.lineTo(cx + 14, top); ctx.lineTo(cx + w / 2 + 16, bot); ctx.lineTo(cx - w / 2 - 16, bot); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.drawImage(logo, S.x, S.y);
    // gloeiende letters (bloom)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.7 * k; ctx.filter = 'blur(3px)'; ctx.drawImage(logo, S.x, S.y);
    ctx.filter = 'none'; ctx.globalAlpha = 0.25 * k; ctx.drawImage(logo, S.x, S.y);
    ctx.restore();
    // de lamp zelf: messing arm en kap
    const ly = S.y - 10;
    R.rect(ctx, cx - 1, ly - 3, 2, 4, P.ink); R.rect(ctx, cx, ly - 3, 1, 3, P.wood4);
    R.round(ctx, cx - 15, ly, 30, 5, 2, P.ink);
    R.rect(ctx, cx - 14, ly + 1, 28, 3, '#b88a2a'); R.rect(ctx, cx - 14, ly + 1, 28, 1, P.gold); R.rect(ctx, cx - 12, ly + 3, 24, 1, P.gold2);
  };

  R.hoverBox = function (ctx, r) {
    const c = P.gold2;
    R.rect(ctx, r.x, r.y, r.w, 1, c); R.rect(ctx, r.x, r.y + r.h - 1, r.w, 1, c);
    R.rect(ctx, r.x, r.y, 1, r.h, c); R.rect(ctx, r.x + r.w - 1, r.y, 1, r.h, c);
  };

  // ---------- Klanten (placeholder, ± 66 px hoog; wordt vervangen door gegenereerde sprites) ----------
  // Gegenereerde sprite (als geladen), anders de placeholder hieronder.
  R.crowdOffset = function (c) {
    if (c.staff || typeof c.id !== 'number') return [0, 0];
    const h = (c.id * 2654435761) >>> 0;
    return [(h % 11) - 5, ((h >>> 8) % 5) - 2];   // −5..5 px opzij, −2..2 px diepte
  };
  // Loopanimatie (besluit 96): walk2 · staand · walk3 · staand, aan de afgelegde weg gekoppeld (walkPhase groeit
  // met 2 per tegel). 1,4 beeld per eenheid = ± 0,7 m per pas: bij 1,5 tegel/s ± 2 passen per seconde, dus de
  // voet glijdt niet en op 2× en 4× loopt het tempo vanzelf mee.
  R.WALK_RATE = 1.4;
  const ready = im => im && im.complete && im.naturalWidth;
  R.drawCustomerSprite = function (ctx, c, images) {
    const view = c.toward ? 'front' : 'back';
    const look = c.sprite || c.type;
    const key = 'chr_' + look + '_' + view, stand = images[key];
    if (!ready(stand)) return null;
    const [sx0, sy00] = R.iso(c.x, c.y);
    // vaste kleine verschuiving per klant (alleen beeld, niet in de sim): wie op dezelfde plek staat wordt geen kluit (besluit 90)
    const [ox, oy] = R.crowdOffset(c), sx = sx0 + ox, sy0 = sy00 + oy;
    let img = stand, step = c.moving ? (Math.floor(c.walkPhase * 3) % 2) : 0;   // zonder loopbeelden: 1 px wip, zoals voorheen
    const w2 = images[key + '_walk2'], w3 = images[key + '_walk3'];
    if (c.moving && ready(w2) && ready(w3) && w2.naturalWidth === stand.naturalWidth && w2.naturalHeight === stand.naturalHeight &&
        w3.naturalWidth === stand.naturalWidth && w3.naturalHeight === stand.naturalHeight) {
      const f = Math.floor((c.walkPhase || 0) * R.WALK_RATE) % 4;
      img = f === 0 ? w2 : f === 2 ? w3 : stand;
      step = 0;   // de benen doen het werk; geen wip, zodat niemand opspringt bij de wissel
    }
    const w = img.naturalWidth, h = img.naturalHeight;
    const native = (CC.SPRITE_FACING[look] || CC.SPRITE_FACING[c.type] || {})[view] || -1;
    const flip = (c.face || -1) !== native;
    ctx.globalAlpha = c.alpha == null ? 1 : c.alpha;
    ctx.fillStyle = 'rgba(31,10,14,0.35)'; ctx.fillRect(sx - 10, sy0 - 2, 21, 4); ctx.fillRect(sx - 7, sy0 - 3, 15, 1);
    const x = Math.round(sx - w / 2), y = Math.round(sy0 - h + 1 - step);
    if (flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
    else ctx.drawImage(img, x, y);
    // gekozen fles(sen) in de hand, met een getal als het er meer zijn (klanten kopen 1–3 flessen)
    if (c.carry && !c.staff) {
      const qty = (c.want && c.want.qty) || 1;
      const bimg = images['wine_' + c.carry.id.slice(5) + '_schap'];
      const side = c.toward ? 1 : -1;                                   // flessen aan de zijkant, niet over het lijf
      const bx = side > 0 ? x + w - 4 : x, by = Math.round(y + h * 0.45);
      const n = Math.min(qty, 3);
      R.rect(ctx, (side > 0 ? bx : bx - (n - 1) * 3) - 1, by - 1, 4 + (n - 1) * 3 + 2, 14, 'rgba(31,10,14,0.55)');
      for (let i = 0; i < n; i++) {
        const xx = bx + side * i * 3;
        if (bimg && bimg.complete && bimg.naturalWidth) ctx.drawImage(bimg, xx, by);
        else R.bottleP(ctx, xx, by + 12, c.carry);
      }
      if (qty > 1) {   // gouden label met het aantal, net boven de flessen
        const t = qty + '×', tw = CC.FONT.width(t) + 5, tx = side > 0 ? bx + (n - 1) * 3 + 5 : bx - (n - 1) * 3 - tw - 2, ty = by - 6;
        R.round(ctx, tx, ty, tw, 10, 3, P.ink); R.round(ctx, tx + 1, ty + 1, tw - 2, 8, 2, P.gold2);
        CC.FONT.draw(ctx, t, tx + 3, ty + 2, P.ink);
      }
    }
    ctx.globalAlpha = 1;
    return [sx, y];
  };

  R.drawCustomer = function (ctx, c, t) {
    const look = (CC.CUSTOMER_TYPES[c.type] || CC.STAFF[c.type]).look;
    const [sx, sy0] = R.iso(c.x, c.y);
    const step = c.moving ? (Math.floor(c.walkPhase * 3) % 2) : 0;
    const sy = sy0 - step;
    const fl = c.face < 0 ? -1 : 1;
    const skin = P[look.skin] || look.skin;
    ctx.globalAlpha = c.alpha == null ? 1 : c.alpha;
    ctx.fillStyle = 'rgba(31,10,14,0.35)'; ctx.fillRect(sx - 10, sy0 - 2, 21, 4); ctx.fillRect(sx - 7, sy0 - 3, 15, 1);
    const l1 = step ? 2 : 0, l2 = step ? 0 : 2;
    const parts = [
      [-6, -21 + l1, 5, 20 - l1, look.legs], [1, -21 + l2, 5, 20 - l2, look.legs],   // benen
      [-7, -3, 6, 3, '#2a2226'], [1, -3, 6, 3, '#2a2226'],                           // schoenen
      [-8, -44, 17, 24, look.body], [4, -44, 5, 24, look.body2],                      // romp
      [-11, -42, 4, 18, look.body2], [8, -42, 4, 18, look.body2],                     // armen
      [-11, -25, 4, 4, skin], [8, -25, 4, 4, skin],                                   // handen
      [-2, -48, 6, 4, skin],                                                          // hals
      [-6, -61, 13, 13, skin],                                                        // hoofd
      [-6, -64, 13, 5, look.hair], [-7, -61, 3, 7, look.hair],                        // haar
    ];
    ctx.fillStyle = P.ink;
    for (const [dx, dy, w, h] of parts) { const x0 = fl > 0 ? sx + dx : sx - dx - w; ctx.fillRect(x0 - 1, sy + dy - 1, w + 2, h + 2); }
    for (const [dx, dy, w, h, col] of parts) { const x0 = fl > 0 ? sx + dx : sx - dx - w; ctx.fillStyle = col; ctx.fillRect(x0, sy + dy, w, h); }
    const X = (dx, w) => (fl > 0 ? sx + dx : sx - dx - (w || 1));
    R.rect(ctx, X(2), sy - 56, 1, 2, P.ink); R.rect(ctx, X(5), sy - 56, 1, 2, P.ink);
    R.rect(ctx, X(6), sy - 53, 1, 1, P.skin2);
    R.rect(ctx, X(2, 3), sy - 51, 3, 1, '#b86a5a');
    R.rect(ctx, X(-4, 8), sy - 44, 8, 2, look.body2);
    R.rect(ctx, X(-1, 1), sy - 41, 1, 16, look.body2);
    if (look.prop === 'bag') { R.rect(ctx, X(-16, 8), sy - 32, 8, 11, P.ink); R.rect(ctx, X(-15, 6), sy - 31, 6, 9, P.cream2); R.rect(ctx, X(-13, 1), sy - 40, 1, 9, P.ink); }
    if (look.prop === 'cap') { R.rect(ctx, X(-7, 15), sy - 66, 15, 5, P.ink); R.rect(ctx, X(-6, 13), sy - 65, 13, 4, P.stone1); R.rect(ctx, X(6, 6), sy - 62, 6, 2, P.ink); }
    if (look.prop === 'scarf') { R.rect(ctx, X(-8, 17), sy - 45, 17, 4, P.gold); R.rect(ctx, X(-5, 3), sy - 41, 3, 9, P.gold); }
    if (look.prop === 'shades') { R.rect(ctx, X(-5, 12), sy - 64, 12, 2, P.ink); }
    if (c.carry) { const bx = fl > 0 ? sx + 11 : sx - 14; R.rect(ctx, bx - 1, sy - 37, 5, 13, P.ink); R.bottleP(ctx, bx, sy - 24, c.carry); }
    ctx.globalAlpha = 1;
    return [sx, sy - 66];
  };

  // ---------- Papier en patronen (besluit 91) ----------
  // Eén keer gebouwd (64 × 64, vaste ruis), daarna als patroon hergebruikt; vastgezet aan het venster, zodat de
  // textuur meeschuift. Alleen paletkleuren, hele pixels.
  const PATS = {};
  R.pattern = function (ctx, kind, ox, oy) {
    let pat = PATS[kind];
    if (!pat) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      if (kind === 'paper') {          // crème met fijne vezels: een paar donkere streepjes en lichte puntjes
        g.fillStyle = P.cream2; g.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
          const v = hash(x + 17, y + 5);
          if (v < 0.011) { g.fillStyle = P.cream1; g.fillRect(x, y, v < 0.004 ? 2 : 1, 1); }
          else if (v > 0.990) { g.fillStyle = P.cream3; g.fillRect(x, y, v > 0.996 ? 2 : 1, 1); }
        }
      } else if (kind === 'lattice') { // ruitjes als op een wijnetiket, heel licht
        g.fillStyle = P.cream1; g.fillRect(0, 0, 64, 64);
        g.fillStyle = P.cream2;
        for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { g.fillRect(x, y, 1, 1); g.fillRect(x + 4, y + 4, 1, 1); }
      }
      pat = PATS[kind] = { img: c, byCtx: new WeakMap() };
    }
    let cp = pat.byCtx.get(ctx);
    if (!cp) { cp = ctx.createPattern(pat.img, 'repeat'); pat.byCtx.set(ctx, cp); }
    if (cp.setTransform && typeof DOMMatrix !== 'undefined') cp.setTransform(new DOMMatrix([1, 0, 0, 1, Math.round(ox || 0), Math.round(oy || 0)]));
    return cp;
  };

  // ---------- UI-bouwstenen ----------
  // Houten kader met perkament (9-slice in code)
  R.panel = function (ctx, x, y, w, h, style) {
    // Venster in de kaartstijl (besluit 59): ronde hoeken, houten lijst, goudlijn, papieren vlak
    x = Math.round(x); y = Math.round(y);
    const dark = style === 'dark';
    R.round(ctx, x + 3, y + 4, w, h, 10, 'rgba(31,10,14,0.35)');   // schaduw
    R.round(ctx, x, y, w, h, 10, P.ink);
    R.round(ctx, x + 1, y + 1, w - 2, h - 2, 9, P.wood3);
    R.round(ctx, x + 2, y + 2, w - 4, h - 4, 8, P.wood2);
    R.round(ctx, x + 4, y + 4, w - 8, h - 8, 7, P.gold);
    if (dark) { R.round(ctx, x + 5, y + 5, w - 10, h - 10, 6, P.bord1); R.round(ctx, x + 7, y + 7, w - 14, h - 14, 5, P.bord2); R.round(ctx, x + 8, y + 8, w - 16, h - 16, 4, P.bord1); return; }
    // papier met een fijne binnenlijn, zoals een kaart (besluit 91)
    R.round(ctx, x + 5, y + 5, w - 10, h - 10, 6, R.pattern(ctx, 'paper', x, y));
    R.rect(ctx, x + 11, y + 5, w - 22, 1, P.cream3);
    const ix = x + 7, iy = y + 7, iw = w - 14, ih = h - 14;
    R.rect(ctx, ix + 4, iy, iw - 8, 1, P.cream1); R.rect(ctx, ix + 4, iy + ih - 1, iw - 8, 1, P.cream1);
    R.rect(ctx, ix, iy + 4, 1, ih - 8, P.cream1); R.rect(ctx, ix + iw - 1, iy + 4, 1, ih - 8, P.cream1);
    for (const [cx, cy, dx, dy] of [[ix, iy, 1, 1], [ix + iw - 1, iy, -1, 1], [ix, iy + ih - 1, 1, -1], [ix + iw - 1, iy + ih - 1, -1, -1]]) {
      R.rect(ctx, cx + dx * 1, cy + dy * 2, 1, 1, P.cream1); R.rect(ctx, cx + dx * 2, cy + dy * 1, 1, 1, P.cream1);   // afgeronde hoek
      R.rect(ctx, cx + dx * 1, cy + dy * 3, 1, 1, P.cream1); R.rect(ctx, cx + dx * 3, cy + dy * 1, 1, 1, P.cream1);
    }
  };

  R.button = function (ctx, x, y, w, h, label, state) {
    // state: {hover, disabled, active, tone:'green'|'wood'|'bord'|'gold'} — ronde knop met diepte
    state = state || {};
    const tone = state.tone || 'green';
    const base = { green: [P.green2, P.green3, P.green1], wood: [P.wood2, P.wood3, P.wood1], bord: [P.bord2, P.bord3, P.bord1], gold: ['#b88a2a', P.gold, '#7a5a1a'] }[tone];
    let [fill, hi, lo] = base;
    if (state.active) { fill = P.gold; hi = P.gold2; lo = '#a8801f'; }
    if (state.disabled) { fill = P.stone1; hi = P.stone2; lo = '#4a443e'; }
    const hov = state.hover && !state.disabled, press = hov ? 1 : 0;
    const r = Math.min(5, Math.floor(h / 2));
    R.round(ctx, x, y, w, h, r, P.ink);
    R.round(ctx, x + 1, y + 1, w - 2, h - 2, r - 1, lo);                       // onderrand (diepte)
    R.round(ctx, x + 1, y + 1 + press, w - 2, h - 3, r - 1, hov ? hi : fill);   // knopvlak
    R.rect(ctx, x + r, y + 2 + press, w - 2 * r, 1, hov ? P.gold2 : hi);        // glans
    const txtCol = state.active ? P.ink : (state.disabled ? P.stone3 : P.cream3);
    CC.FONT.draw(ctx, label, x + w / 2, y + Math.floor((h - 7) / 2) + press, txtCol, { align: 'center', shadow: state.active || state.disabled ? null : lo });
  };

  // Plek voor een ballon zoeken dicht bij het hoofd (besluit 90): recht erboven, iets opzij of een stapje hoger.
  // Lukt dat niet zonder overlap met `placed` (andere ballonnen, het uithangbord, de bedragen), dan null: de ballon wacht.
  R.bubbleFit = function (x, y, text, placed) {
    const lines = CC.FONT.wrap(text, 110);
    const w = Math.max(...lines.map(l => CC.FONT.width(l))) + 8;
    const h = lines.length * 10 + 5;
    const free = (bx, by) => by >= 18 && !(placed || []).some(r => bx < r.x + r.w + 2 && bx + w + 2 > r.x && by < r.y + r.h + 4 && by + h + 4 > r.y);
    const base = Math.round(x - w / 2), top = Math.round(y - h - 5);
    for (const dy of [0, -12, -24]) for (const dx of [0, -Math.round(w / 2) + 8, Math.round(w / 2) - 8]) {
      const bx = Math.max(2, Math.min(R.W - w - 2, base + dx)), by = top + dy;
      if (free(bx, by)) return { bx, by, w, h, lines };
    }
    return null;
  };
  R.bubble = function (ctx, x, y, text, tone, alpha, placed, fit) {
    fit = fit || R.bubbleFit(x, y, text, placed);
    let bx, by, w, h, lines;
    if (fit) ({ bx, by, w, h, lines } = fit);
    else {   // geen vrije plek (alleen buiten de winkel gebruikt): gewoon boven het hoofd
      lines = CC.FONT.wrap(text, 110); w = Math.max(...lines.map(l => CC.FONT.width(l))) + 8; h = lines.length * 10 + 5;
      bx = Math.max(2, Math.min(R.W - w - 2, Math.round(x - w / 2))); by = Math.max(18, Math.round(y - h - 5));
    }
    if (placed) placed.push({ x: bx, y: by, w, h });
    const border = { red: P.red, grey: P.stone1, bord: P.bord3, gold: P.gold, green: P.ok }[tone] || P.ink;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    R.round(ctx, bx, by, w, h, 4, border);
    R.round(ctx, bx + 1, by + 1, w - 2, h - 2, 3, P.cream3);
    // staartje
    const tx = Math.max(bx + 3, Math.min(bx + w - 6, Math.round(x) - 2));
    R.rect(ctx, tx, by + h, 4, 1, border); R.rect(ctx, tx + 1, by + h, 2, 1, P.cream3);
    R.rect(ctx, tx + 1, by + h + 1, 2, 1, border); R.rect(ctx, tx + 1, by + h + 2, 1, 1, border);
    lines.forEach((l, i) => CC.FONT.draw(ctx, l, bx + 4, by + 3 + i * 10, P.ink));
    ctx.globalAlpha = 1;
  };

  // Adviesvraag: goudkleurig bordje met ! boven de klant, met een balkje voor het geduld (frac 1 → 0)
  R.askMark = function (ctx, x, y, t, frac) {
    const b = Math.round(Math.sin(t * 5) * 2);
    const bx = Math.round(x) - 6, by = Math.round(y) - 22 + b;
    const col = frac < 0.35 ? P.bord4 : P.gold;
    R.rect(ctx, bx, by, 13, 15, P.ink);
    R.rect(ctx, bx + 1, by + 1, 11, 13, col);
    R.rect(ctx, bx + 1, by + 1, 11, 1, P.gold2);
    R.rect(ctx, bx + 5, by + 3, 3, 6, P.ink); R.rect(ctx, bx + 5, by + 10, 3, 2, P.ink);
    R.rect(ctx, bx + 5, by + 15, 3, 1, P.ink); R.rect(ctx, bx + 6, by + 16, 1, 1, P.ink);   // puntje
    R.rect(ctx, bx - 1, by - 5, 15, 3, P.ink);
    R.rect(ctx, bx, by - 4, Math.max(0, Math.round(13 * frac)), 1, frac < 0.35 ? P.bord4 : P.green4);
    return { x: bx - 2, y: by - 6, w: 17, h: 24 };
  };

  R.arrow = function (ctx, x, y, t) {
    const b = Math.round(Math.sin(t * 6) * 2);
    const yy = y - 12 + b;
    R.rect(ctx, x - 4, yy - 1, 9, 7, P.ink);
    R.rect(ctx, x - 3, yy, 7, 2, P.gold);
    R.rect(ctx, x - 2, yy + 2, 5, 1, P.gold); R.rect(ctx, x - 1, yy + 3, 3, 1, P.gold); R.rect(ctx, x, yy + 4, 1, 1, P.gold);
    R.rect(ctx, x - 2, yy - 7, 5, 7, P.ink); R.rect(ctx, x - 1, yy - 6, 3, 7, P.gold);
  };

  R.euro = function (n, decimals) {
    const neg = n < 0; n = Math.abs(n);
    let s;
    if (decimals || (n % 1 !== 0 && n < 1000)) {
      const [a, b] = n.toFixed(2).split('.');
      s = a.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + b;
      if (!decimals && b === '00') s = a.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else {
      s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return (neg ? '-' : '') + '€' + s;
  };

  CC.R = R;
})(typeof window !== 'undefined' ? window : globalThis);
