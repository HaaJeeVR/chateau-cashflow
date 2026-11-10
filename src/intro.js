// Château Cashflow — intro.js
// Openingsfilmpje bij de eerste start, vóór het titelscherm (besluit 86). Geen video: alles op het canvas.
// Deterministisch: INTRO.renderAt(ctx, t) tekent elk frame alleen vanuit de tijd t (seconden). Scrubben: index.html?intro=12.5
// Beelden: assets/intro_*.png uit tools/build_intro.py (de browser leest bij file:// geen pixels terug, dus geen
// kleurcorrectie hier). Ontbreken ze, dan valt de intro terug op title_bg/bg_start.
(function (root) {
  const CC = root.CC = root.CC || {};
  const P = CC.PAL;
  const R = () => CC.R, F = () => CC.FONT, TX = () => CC.TEXT.intro;
  const IN = {};

  // ---------- hulpjes ----------
  const H = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const u01 = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const easeOut = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
  const easeIn = u => Math.pow(clamp(u, 0, 1), 2);
  const rnd = Math.round;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').imageSmoothingEnabled = false; return c; }
  const ok = im => !!(im && im.complete && im.naturalWidth);

  // ---------- tijdlijn (seconden) ----------
  // 1 straat · 2 deurmat · 3 brief · 4 sleutel en licht · 5 montage · 6 logo
  const T = IN.T = {
    s1: 0, s2: 4.2, env: 4.7, letterIn: 5.6, stamp: 6.3, letterOut: 9.0,
    s4: 9.4, keyIn: 9.9, keyPush: 10.25, keyTurn: 10.75, keyOut: 11.35, lightOn: 11.6,
    s5: 13.0, s6: 18.8, logo: 19.6, glint: 20.25, tag: 20.6, prompt: 21.4,
  };
  IN.DUR = T.prompt;           // daarna wacht het eindbeeld op een klik
  IN.REDUCED_DUR = 0.8;        // prefers-reduced-motion: korte fade naar het eindbeeld

  // ---------- beelden ----------
  const VAK_WINES = { shelf_1: ['wine_merlot', 'wine_sauvignon'], shelf_2: ['wine_rioja', 'wine_provence'], shelf_3: ['wine_bordeaux', 'wine_chablis'], shelf_4: ['wine_cremant', 'wine_barolo'] };
  const VITRINE_WINE = 'wine_champagne';
  function required() {
    const k = ['title', 'bg', 'logo', 'logoSign', 'layer_shelf_3', 'layer_shelf_4', 'chr_sem_back'];
    for (const id in (CC.INTRO_ART || {})) k.push('intro_' + id);
    if (CC.WINE_SPRITES) for (const id of [...Object.values(VAK_WINES).flat(), VITRINE_WINE]) if (CC.WINE_SPRITES[id]) k.push('wine_' + id.slice(5) + '_schap');
    return k;
  }
  // 'loading' | 'ok' | 'fail' (een beeld kon niet laden: dan slaat main.js de intro over)
  IN.status = function (images) {
    let loading = false;
    for (const k of required()) {
      const im = images[k];
      if (!im) return 'fail';
      if (!im.complete) loading = true;
      else if (!im.naturalWidth) return 'fail';
    }
    return loading ? 'loading' : 'ok';
  };
  let IMG = null, A = null;
  function prepare(images) {
    if (A && IMG === images) return;
    IMG = images;
    A = {
      gevel: ok(images.intro_gevel) ? images.intro_gevel : images.title,
      dark: ok(images.intro_winkel_donker) ? images.intro_winkel_donker : images.bg,
      half: ok(images.intro_winkel_half) ? images.intro_winkel_half : images.bg,
      key: ok(images.intro_sleutel) ? images.intro_sleutel : null,
      keyTurned: ok(images.intro_sleutel_gedraaid) ? images.intro_sleutel_gedraaid : null,
      env: envelope(),
      door: doorArt(),
    };
  }

  // ---------- overgangen: geordende dither (alleen bestaande kleuren, geen waas) ----------
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let PATS = null;
  const BUFS = []; let depth = 0;
  // tekent scène B over wat er al staat, met dekking p (0..1) in 16 stappen
  function dither(ctx, p, drawB) {
    const n = clamp(Math.round(p * 16), 0, 16);
    if (n === 0) return;
    if (n === 16) { drawB(ctx); return; }
    if (!PATS) {
      PATS = [];
      for (let k = 0; k <= 16; k++) {
        const c = canvas(4, 4), g = c.getContext('2d'); g.fillStyle = '#000';
        for (let i = 0; i < 16; i++) if (BAYER[i] < k) g.fillRect(i % 4, i >> 2, 1, 1);
        PATS.push(ctx.createPattern(c, 'repeat'));
      }
    }
    const buf = BUFS[depth] || (BUFS[depth] = canvas(640, 360)), b = buf.getContext('2d');
    depth++;
    b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.clearRect(0, 0, 640, 360);
    drawB(b);
    b.globalCompositeOperation = 'destination-in'; b.fillStyle = PATS[n]; b.fillRect(0, 0, 640, 360);
    b.globalCompositeOperation = 'source-over';
    depth--;
    ctx.drawImage(buf, 0, 0);
  }
  const black = g => R().rect(g, 0, 0, 640, 360, P.ink);

  // ---------- sfeer (deterministisch) ----------
  function rain(ctx, t, n, alpha) {
    ctx.fillStyle = `rgba(196,224,227,${alpha})`;
    for (let i = 0; i < n; i++) {
      const sp = 230 + H(i + 3) * 90, len = 3 + Math.floor(H(i + 7) * 3);
      const y = ((H(i) * 420 + t * sp) % 420) - 40, x = ((H(i + 1) * 720 + y * 0.25) % 700) - 30;
      for (let k = 0; k < len; k++) ctx.fillRect(rnd(x - k * 0.25), rnd(y - k), 1, 1);
      if (y > 300 && y < 330 && H(i + 11) < 0.3) ctx.fillRect(rnd(x) - 1, rnd(y) + 1, 3, 1);   // spatje op de kade
    }
  }
  function waterGlints(ctx, t, x0, x1, y0, y1, n, col, amp) {
    for (let i = 0; i < n; i++) {
      const per = 1.4 + H(i + 40) * 1.6, ph = (t / per + H(i + 41)) % 1, cyc = Math.floor(t / per + H(i + 41));
      const x = x0 + Math.floor(H(i * 7 + cyc * 13) * (x1 - x0)), y = y0 + Math.floor(H(i * 5 + cyc * 17) * (y1 - y0));
      ctx.globalAlpha = Math.sin(ph * Math.PI) * amp;
      R().rect(ctx, x, y, 2 + Math.floor(H(i + cyc) * 3), 1, col);
    }
    ctx.globalAlpha = 1;
  }
  function stars(ctx, t) {   // zelfde plekken als het titelscherm
    for (let i = 0; i < 16; i++) {
      const x = 70 + Math.floor(H(i) * 150), y = 4 + Math.floor(H(i + 50) * 80);
      const k = (Math.sin(t * (0.8 + H(i + 7) * 1.6) + H(i + 99) * 6.28) + 1) / 2;
      if (k < 0.35) continue;
      ctx.globalAlpha = (k - 0.35) / 0.65; R().rect(ctx, x, y, 1, 1, P.cream3);
    }
    ctx.globalAlpha = 1;
  }
  const SHOP_LAMPS = [{ x: 36, y: 86, r: 16 }, { x: 592, y: 87, r: 12 }, { x: 112, y: 42, r: 5 }, { x: 72, y: 50, r: 4 }];   // = fx.js
  const STREET_LAMPS = [{ x: 66, y: 128, r: 18 }, { x: 581, y: 172, r: 10 }, { x: 150, y: 192, r: 6 }];                       // gevel
  function lampGlow(ctx, t, k, list) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    list.forEach((L, i) => {
      const f = (0.8 + 0.12 * Math.sin(t * 1.3 + i * 2.1)) * k;
      for (let j = 3; j >= 1; j--) {
        const r = rnd(L.r * j / 3 + 2);
        ctx.globalAlpha = 0.045 * f * (4 - j); R().round(ctx, L.x - r, L.y - r, 2 * r, 2 * r, r, '#ffb25a');
      }
    });
    ctx.restore(); ctx.globalAlpha = 1;
  }

  // ---------- onderschrift (typt in) en overslaan-hint ----------
  function caption(ctx, text, t, t0) {
    if (t < t0) return;
    const n = Math.min(text.length, Math.floor((t - t0) * 30) + 1);
    const w = F().width(text) + 14, x = 12, y = 330;
    R().round(ctx, x, y, w, 17, 5, P.ink);
    R().round(ctx, x + 1, y + 1, w - 2, 15, 4, 'rgba(69,16,26,0.92)');
    R().rect(ctx, x + 5, y + 2, w - 10, 1, P.bord2);
    F().draw(ctx, text.slice(0, n), x + 7, y + 5, P.cream2);
  }
  function skipHint(ctx, t) {
    if (t < 0.8 || t >= T.s6) return;
    ctx.globalAlpha = Math.min(1, (t - 0.8) / 0.4) * 0.85;
    F().draw(ctx, TX().skip, 630, 348, P.stone2, { align: 'right', shadow: P.ink });
    ctx.globalAlpha = 1;
  }

  // ---------- shot 1: de grachtenstraat, ochtendschemer, motregen ----------
  function saleBoard(g) {   // makelaarsbord achter het gekalkte glas (kleuren al in het ochtendlicht)
    const x = 266, y = 188, w = 136, h = 44;
    const red = '#8f2b37', red2 = '#b04450', white = '#ebe6da', ink = '#1d1420';
    R().rect(g, x + 2, y + 3, w, h, 'rgba(14,12,24,0.5)');
    R().rect(g, x, y, w, h, ink);
    R().rect(g, x + 1, y + 1, w - 2, h - 2, red); R().rect(g, x + 2, y + 2, w - 4, 1, red2);
    F().head.draw(g, TX().board, x + w / 2, y + 8, white, { align: 'center', shadow: '#5e1a24' });
    R().rect(g, x + 4, y + 25, w - 8, 15, white);
    F().draw(g, TX().boardSub, x + w / 2, y + 29, '#6e1a26', { align: 'center' });
    for (const [tx, ty] of [[x - 3, y - 2], [x + w - 6, y - 2], [x - 3, y + h - 3], [x + w - 6, y + h - 3]]) R().rect(g, tx, ty, 9, 5, '#c9c3b2');   // plakband
  }
  function shotStreet(ctx, t) {
    ctx.drawImage(A.gevel, 0, 0);
    saleBoard(ctx);
    lampGlow(ctx, t, 0.7, STREET_LAMPS);
    waterGlints(ctx, t, 10, 630, 334, 358, 10, '#c4d6e0', 0.5);
    rain(ctx, t, 160, 0.4);
    caption(ctx, TX().place, t, 0.8);
  }

  // ---------- shot 2: envelop op de deurmat ----------
  function envelope() {   // plat op de vloer in 2:1, 17 × 10
    const c = canvas(17, 10), g = c.getContext('2d');
    const inside = (x, y) => (x * -6 - (y - 6) * 11) <= 0 && ((x - 11) * 3 - y * 5) <= 0 && ((x - 16) * 6 + (y - 3) * 11) <= 0 && ((x - 5) * -3 + (y - 9) * 5) <= 0;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 17; x++) {
      if (!inside(x + 0.5, y + 0.5)) {
        if (inside(x + 1.5, y + 0.5) || inside(x - 0.5, y + 0.5) || inside(x + 0.5, y + 1.5) || inside(x + 0.5, y - 0.5)) R().rect(g, x, y, 1, 1, P.ink);
        continue;
      }
      R().rect(g, x, y, 1, 1, y > 6 || x < 3 ? P.cream1 : P.cream3);
    }
    R().rect(g, 7, 4, 3, 1, P.stone2); R().rect(g, 9, 3, 2, 1, P.stone2);   // klep
    R().rect(g, 8, 4, 2, 2, P.bord3); R().rect(g, 8, 4, 1, 1, P.bord4);     // zegel
    return c;
  }
  const MAT = { x0: 404, y0: 312, x1: 377, y1: 296 };   // van de drempel naar het midden van de deurmat (bg_start.png)
  function envPos(t) {
    const u = easeOut(u01(t, T.env, 0.45));
    return [rnd(MAT.x0 + (MAT.x1 - MAT.x0) * u), rnd(MAT.y0 + (MAT.y1 - MAT.y0) * u)];
  }
  function drawEnvelope(ctx, t) {
    if (t < T.env) return;
    const [x, y] = envPos(t);
    ctx.fillStyle = 'rgba(10,8,20,0.45)'; ctx.fillRect(x + 4, y + 8, 10, 2);
    ctx.drawImage(A.env, x - 8, y - 5);
    const sk = u01(t, T.env + 0.42, 0.4);   // één glinster als hij stil ligt
    if (sk > 0 && sk < 1) {
      const arm = sk < 0.3 ? 1 : sk < 0.7 ? 2 : 1;
      for (let i = 1; i <= arm; i++) { const c = i === 1 ? '#ffffff' : P.gold2; R().rect(ctx, x + 6 - i, y - 6, 1, 1, c); R().rect(ctx, x + 6 + i, y - 6, 1, 1, c); R().rect(ctx, x + 6, y - 6 - i, 1, 1, c); R().rect(ctx, x + 6, y - 6 + i, 1, 1, c); }
      R().rect(ctx, x + 6, y - 6, 1, 1, '#ffffff');
    }
    const k = u01(t, T.env + 0.45, 0.35);   // stofje
    if (k > 0 && k < 1) {
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 5; i++) { const a = H(i + 70) * 6.28, d = 3 + k * 8; R().rect(ctx, rnd(x + Math.cos(a) * d), rnd(y + 2 + Math.sin(a) * d * 0.5), 1, 1, P.stone3); }
      ctx.globalAlpha = 1;
    }
  }
  function shopDark(ctx, t) {
    ctx.drawImage(A.dark, 0, 0);
    lampGlow(ctx, t, 0.9, [SHOP_LAMPS[0]]);
  }

  // ---------- shot 3: de brief van de bank ----------
  let STAMP = null;
  function stampImg() {   // GEHONOREERD met inktgaatjes (vast patroon)
    if (STAMP) return STAMP;
    const L = TX().letter, sw = F().head.width(L.stamp) + 18, sh = 26, c = canvas(sw, sh), g = c.getContext('2d');
    R().rect(g, 0, 0, sw, sh, P.bord3); g.clearRect(2, 2, sw - 4, sh - 4);
    R().rect(g, 3, 3, sw - 6, 1, P.bord3); R().rect(g, 3, sh - 4, sw - 6, 1, P.bord3);
    F().head.draw(g, L.stamp, sw / 2, 8, P.bord3, { align: 'center' });
    const d = g.getImageData(0, 0, sw, sh);   // alleen eigen tekenwerk: mag ook bij file://
    for (let i = 0; i < d.data.length; i += 4) { if (H((i >> 2) * 3.1 + 0.7) < 0.16) d.data[i + 3] = 0; else if (d.data[i + 3]) d.data[i + 3] = 215; }
    g.putImageData(d, 0, 0);
    return (STAMP = c);
  }
  function letter(ctx, t) {
    const inU = easeOut(u01(t, T.letterIn, 0.32)), outU = easeIn(u01(t, T.letterOut, 0.28));
    if (inU <= 0 || outU >= 1) return;
    const L = TX().letter, rep = CC.CONFIG.repay, E = v => R().euro(v);
    const w = 300, x = 170, inner = w - 28;
    const small = [].concat(...L.small.map(s => F().wrap(s, inner)));
    const h = 228 + small.length * 10 - (L.wish ? 0 : 14);   // 6 px marge onder de laatste regel
    const y0 = Math.max(8, rnd((360 - h) / 2));
    const thump = t >= T.stamp && t < T.stamp + 0.07 ? 1 : 0;
    const y = rnd(360 + (y0 - 360) * inU + (360 - y0) * outU) + thump;
    R().rect(ctx, 0, 0, 640, 360, `rgba(10,8,20,${(0.45 * inU * (1 - outU)).toFixed(3)})`);
    // papier: schaduw, rand, twee vouwen
    R().rect(ctx, x + 4, y + 5, w, h, 'rgba(10,8,20,0.5)');
    R().rect(ctx, x - 1, y - 1, w + 2, h + 2, P.ink);
    R().rect(ctx, x, y, w, h, P.cream3);
    for (const fy of [Math.round(h / 3), Math.round(h * 2 / 3)]) { R().rect(ctx, x, y + fy, w, 1, '#ece0c4'); R().rect(ctx, x, y + fy + 1, w, 1, '#fffaf0'); }
    // briefhoofd: opkomende zon (Morgenstond)
    const sx = x + 22, sy = y + 24;
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI; R().rect(ctx, rnd(sx + Math.cos(a) * 11), rnd(sy + Math.sin(a) * 11), 1, 2, P.gold); }
    for (let yy = -7; yy <= 0; yy++) { const hw = Math.floor(Math.sqrt(49 - yy * yy)); R().rect(ctx, sx - hw - 1, sy + yy, 2 * hw + 3, 1, P.ink); }
    for (let yy = -6; yy <= 0; yy++) { const hw = Math.floor(Math.sqrt(36 - yy * yy)); R().rect(ctx, sx - hw, sy + yy, 2 * hw + 1, 1, yy < -3 ? P.gold2 : P.gold); }
    R().rect(ctx, sx - 12, sy + 1, 25, 1, P.bord2);
    F().draw(ctx, L.bank, x + 40, y + 13, P.bord2);
    F().draw(ctx, L.since, x + 40, y + 23, P.stone1);
    F().draw(ctx, L.place, x + w - 14, y + 13, P.stone1, { align: 'right' });
    R().rect(ctx, x + 14, y + 36, inner, 1, P.bord3);
    let ly = y + 46;
    F().draw(ctx, L.re, x + 14, ly, P.bord2); ly += 16;
    F().draw(ctx, L.salute, x + 14, ly, P.ink); ly += 14;
    F().draw(ctx, L.verdict, x + 14, ly, P.ink); ly += 16;
    const row = (l, r) => {
      F().draw(ctx, l, x + 24, ly, P.ink);
      const rw = F().width(r), lw = F().width(l);
      for (let dx = x + 28 + lw; dx < x + w - 40 - rw; dx += 3) R().rect(ctx, dx, ly + 6, 1, 1, P.stone3);
      F().draw(ctx, r, x + w - 36, ly, P.ink, { align: 'right' }); ly += 10;
    };
    row(L.term, L.termVal.split('{n}').join(rep.length)); row(L.when, L.whenVal);
    row(L.first, E(rep[0])); row(L.last, E(rep[rep.length - 1]));
    ly += 8;
    if (L.wish) { F().draw(ctx, L.wish, x + 14, ly, P.ink); ly += 18; } else ly += 4;
    F().draw(ctx, L.greet, x + 14, ly, P.ink); ly += 12;
    // handtekening: lussen en een haal eronder
    const sigY = ly;
    ctx.fillStyle = '#26324f';
    let px0 = null, py0 = null;
    for (let i = 0; i <= 160; i++) {
      const s = i / 160 * Math.PI * 7, qx = rnd(x + 20 + s * 3.2 - 5 * Math.sin(s)), qy = rnd(ly + 8 - 6 * Math.cos(s) * (1 - i / 260));
      if (qx !== px0 || qy !== py0) ctx.fillRect(qx, qy, 1, 1);
      px0 = qx; py0 = qy;
    }
    for (let i = 0; i < 46; i++) ctx.fillRect(x + 30 + i, rnd(ly + 15 - i * 0.12), 1, 1);
    ly += 18;
    F().draw(ctx, L.name, x + 14, ly, P.ink); ly += 10;
    F().draw(ctx, L.role, x + 14, ly, P.stone1); ly += 18;
    R().rect(ctx, x + 14, ly, inner, 1, P.stone3); ly += 6;
    for (const l of small) { F().draw(ctx, l, x + 14, ly, P.stone2); ly += 10; }
    // stempel, rechts naast de ondertekening
    if (t >= T.stamp) { const st = stampImg(); ctx.drawImage(st, x + w - st.width - 18, sigY + 2); }
  }

  // ---------- shot 4: sleutel en licht ----------
  // Placeholder-illustratie (160 × 80, kaartformaat) zolang art_bronnen/intro_sleutel_bron.png er niet is.
  const KEY = { kx: 101, ky: 41 };   // sleutelgat in de illustratie
  function vnoise(x, y, sc, seed) {
    const gx = x / sc, gy = y / sc, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
    const v = (i, j) => H((ix + i) * 57.3 + (iy + j) * 131.7 + seed);
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy;
  }
  function doorArt() {
    const c = canvas(160, 80), g = c.getContext('2d'), d = g.createImageData(160, 80), a = d.data;
    const hex = s => { const n = parseInt(s.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const G = ['#1f3a2e', '#26473a', '#2f5541', '#3d6a50', '#5e8a5f'].map(hex);
    const put = (x, y, col) => { const i = (y * 160 + x) * 4; a[i] = col[0]; a[i + 1] = col[1]; a[i + 2] = col[2]; a[i + 3] = 255; };
    for (let y = 0; y < 80; y++) for (let x = 0; x < 160; x++) {
      let col;
      if (x < 124) {   // deur: verticale nerf, licht van linksboven, verhoogd paneel links
        const grain = vnoise(x * 3, y * 0.35, 6, 21);
        let k = 2 - (grain < 0.32 ? 1 : 0) + (grain > 0.8 ? 1 : 0) - (x + y > 150 ? 1 : 0);
        if (x >= 10 && x < 74 && y >= 6 && y < 74) {
          const l = x - 10, r = 73 - x, tp = y - 6, bt = 73 - y;
          if (Math.min(l, tp) < 3 && l <= r && tp <= bt) k = 4;
          else if (Math.min(r, bt) < 3) k = 0;
          else if (Math.min(l, r, tp, bt) === 3) k = 1;
        }
        col = G[clamp(k, 0, 4)];
        if (x >= 120) col = x === 123 ? hex('#141016') : G[0];
      } else if (x < 134) {   // stenen kozijn
        col = x === 124 ? hex('#141016') : x < 127 ? hex('#a39a8c') : x < 131 ? hex('#d4cbbb') : hex('#bdb3a1');
        if ((y + 3) % 19 === 0) col = hex('#8a8173');
      } else {   // baksteen
        const row = Math.floor(y / 6), off = row % 2 ? 4 : 0, mortar = y % 6 === 5 || (x + off) % 12 === 0;
        const v = H(Math.floor((x + off) / 12) * 7 + row * 13);
        col = mortar ? hex('#6b6259') : v < 0.33 ? hex('#4a2a17') : v < 0.66 ? hex('#5a3020') : hex('#6e3a24');
      }
      put(x, y, col);
    }
    g.putImageData(d, 0, 0);
    // messing slotplaat
    const px = KEY.kx - 9, py = 16;
    R().round(g, px - 1, py - 1, 20, 50, 5, P.ink);
    R().round(g, px, py, 18, 48, 4, '#9a7224'); R().round(g, px, py, 16, 46, 4, '#c79a2e');
    R().rect(g, px + 2, py + 3, 2, 40, P.gold); R().rect(g, px + 3, py + 1, 10, 1, P.gold2);
    R().rect(g, px + 7, py + 4, 3, 3, P.ink); R().rect(g, px + 8, py + 5, 1, 1, P.gold2);
    R().rect(g, px + 7, py + 41, 3, 3, P.ink); R().rect(g, px + 8, py + 42, 1, 1, P.gold2);
    const { kx, ky } = KEY;
    R().round(g, kx - 3, ky - 4, 6, 6, 3, P.ink); R().rect(g, kx - 1, ky, 3, 7, P.ink); R().rect(g, kx - 2, ky + 1, 5, 2, P.ink);
    g.fillStyle = 'rgba(20,12,16,0.35)'; g.fillRect(px + 18, py + 3, 2, 46); g.fillRect(px + 2, py + 48, 17, 1);
    // ochtendlicht: alles iets koeler (vermenigvuldigen, zonder pixels terug te lezen)
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#d6dce8'; g.fillRect(0, 0, 160, 80); g.globalCompositeOperation = 'source-over';
    return c;
  }
  function keyArt(g, t) {
    const turned = t >= T.keyTurn;
    if (A.key) {   // gegenereerde illustratie: recht → gedraaid
      g.drawImage(turned && A.keyTurned ? A.keyTurned : A.key, 0, 0);
      if (turned) F().draw(g, TX().click, 150, 6, P.cream3, { align: 'right', shadow: P.ink });
      return;
    }
    g.drawImage(A.door, 0, 0);
    const { kx, ky } = KEY;
    const push = easeOut(u01(t, T.keyPush, 0.32)), off = rnd((1 - push) * 26);
    const bx = kx - 22 - off, gold = P.gold, dark = '#9a7224', light = P.gold2;
    const sx0 = bx + 8, sx1 = kx - 2 + (push < 1 ? -off : 0);
    if (sx1 > sx0) { R().rect(g, sx0, ky - 2, sx1 - sx0, 5, P.ink); R().rect(g, sx0, ky - 1, sx1 - sx0, 3, dark); R().rect(g, sx0, ky - 1, sx1 - sx0, 1, gold); }
    if (push < 1) { R().rect(g, sx1 - 1, ky - 2, 5, 9, P.ink); R().rect(g, sx1, ky + 1, 3, 5, dark); R().rect(g, sx1, ky - 1, 3, 2, gold); }   // baard
    if (!turned) {   // kop plat in beeld
      R().round(g, bx - 10, ky - 10, 20, 20, 10, P.ink); R().round(g, bx - 9, ky - 9, 18, 18, 9, dark); R().round(g, bx - 9, ky - 9, 17, 17, 9, gold);
      R().rect(g, bx - 5, ky - 8, 6, 1, light); R().rect(g, bx - 7, ky - 6, 1, 4, light);
      R().round(g, bx - 4, ky - 4, 8, 8, 4, P.ink); R().round(g, bx - 3, ky - 3, 6, 6, 3, '#26473a');
    } else {         // kwartslag: de kop staat op zijn kant
      R().round(g, bx - 3, ky - 11, 7, 22, 3, P.ink); R().round(g, bx - 2, ky - 10, 5, 20, 2, dark);
      R().rect(g, bx - 2, ky - 9, 2, 18, gold); R().rect(g, bx - 1, ky - 8, 1, 6, light);
      const k = u01(t, T.keyTurn, 0.3);
      if (k < 1) {
        g.globalAlpha = 1 - k;
        for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) R().rect(g, kx + dx * (7 + rnd(k * 8)), ky + dy * (6 + rnd(k * 6)), 2, 1, light);
        g.globalAlpha = 1;
      }
      F().draw(g, TX().click, kx + 12, ky - 22, P.cream3, { shadow: P.ink });
    }
    g.fillStyle = 'rgba(20,12,16,0.3)'; g.fillRect(bx - 8, ky + 11, 16, 1);
  }
  let KEYC = null;
  function keyCard(ctx, t) {
    const inU = easeOut(u01(t, T.keyIn, 0.28)), outU = easeIn(u01(t, T.keyOut, 0.25));
    if (inU <= 0 || outU >= 1) return;
    const w = 176, h = 96, x = 232, y = rnd(360 + (128 - 360) * inU + (360 - 128) * outU);
    R().round(ctx, x + 3, y + 4, w, h, 10, 'rgba(10,8,20,0.5)');
    R().round(ctx, x, y, w, h, 10, P.ink); R().round(ctx, x + 1, y + 1, w - 2, h - 2, 9, P.wood3);
    R().round(ctx, x + 2, y + 2, w - 4, h - 4, 8, P.wood2); R().round(ctx, x + 4, y + 4, w - 8, h - 8, 7, P.gold);
    const ax = x + 8, ay = y + 8;
    if (!KEYC) KEYC = canvas(160, 80);
    const g = KEYC.getContext('2d'); g.clearRect(0, 0, 160, 80); keyArt(g, t);
    R().rect(ctx, ax - 1, ay - 1, 162, 82, P.ink);
    ctx.drawImage(KEYC, ax, ay);
    R().roundCorners(ctx, ax, ay, 160, 80, 5, P.gold);
  }
  function lightLevel(t) {   // 0 = donker, 0.5 = half, 1 = aan; in trapjes, met één knipper
    const d = t - T.lightOn;
    if (d < 0) return 0;
    if (d < 0.06) return 1; if (d < 0.16) return 0; if (d < 0.22) return 1; if (d < 0.5) return 0.5;
    return 1;
  }
  function shopLit(ctx, t, k) {
    ctx.drawImage(k >= 1 ? IMG.bg : k > 0 ? A.half : A.dark, 0, 0);
    lampGlow(ctx, t, k >= 1 ? 1 : 0.9, k >= 1 ? SHOP_LAMPS : [SHOP_LAMPS[0]]);
  }

  // ---------- shot 5: montage ----------
  function drop(t, t0, height) {   // vallen, landen, twee keer na-veren; null = nog niet in beeld
    const d = t - t0;
    if (d < 0) return null;
    const fall = 0.26;
    if (d < fall) return -rnd(height * (1 - (d / fall) * (d / fall)));
    const b = d - fall;
    if (b < 0.14) return -rnd(5 * Math.sin(Math.PI * b / 0.14));
    if (b < 0.22) return -rnd(2 * Math.sin(Math.PI * (b - 0.14) / 0.08));
    return 0;
  }
  function dust(ctx, t, t0, x, y, w) {
    const k = u01(t, t0, 0.35); if (k <= 0 || k >= 1) return;
    ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 10; i++) { const s = i < 5 ? -1 : 1, dx = s * (2 + H(i + t0) * 4 + k * 14), dy = -k * 6 * H(i + 2); R().rect(ctx, rnd(x + (s < 0 ? 0 : w) + dx), rnd(y + dy), 1, 1, P.cream1); }
    ctx.globalAlpha = 1;
  }
  const SHELF_T = { shelf_3: T.s5 + 0.1, shelf_4: T.s5 + 0.45 };
  const VAK_ORDER = [['shelf_1', 0], ['shelf_2', 0], ['shelf_1', 1], ['shelf_2', 1], ['shelf_3', 0], ['shelf_4', 0], ['shelf_3', 1], ['shelf_4', 1]];
  function bottles(ctx, t, id, vi, t0) {   // zelfde plankposities als R.paintedShelf
    const pk = CC.BG.planks[id], rows = pk.rows.slice(vi * 2, vi * 2 + 2), per = 6, span = pk.x1 - pk.x0 - 3;
    const w = CC.wineById(VAK_WINES[id][vi]);
    rows.forEach((c, r) => {
      for (let i = 0; i < per; i++) {
        const d = t - (t0 + (r * per + i) * 0.022);
        if (d < 0) continue;
        const x = rnd(pk.x0 + 1 + i * span / per), y = rnd(c + pk.slope * (x + 1));
        R().bottleP(ctx, x, y + (d < 0.12 ? -rnd(10 * (1 - d / 0.12)) : d < 0.18 ? -1 : 0), w);
      }
    });
  }
  function montage(ctx, t) {
    const L = CC.BG_LAYERS;
    shopLit(ctx, t, 1);
    for (const id of ['shelf_4', 'shelf_3']) {   // kast 3 en 4 vallen op hun plek
      const dy = drop(t, SHELF_T[id], 150), im = IMG['layer_' + id];
      if (dy == null) continue;
      ctx.drawImage(im, L[id].x, L[id].y + dy);
      dust(ctx, t, SHELF_T[id] + 0.26, L[id].x + 4, L[id].y + im.naturalHeight - 4, im.naturalWidth - 8);
    }
    VAK_ORDER.forEach(([id, vi], i) => bottles(ctx, t, id, vi, T.s5 + 0.75 + i * 0.28));   // vak voor vak vol
    // Sem met een krat, van de deur naar achteren
    const ts = T.s5 + 1.4, te = ts + 1.9;
    if (t > ts && t < te + 0.4) {
      const u = u01(t, ts, te - ts), sem = IMG.chr_sem_back;
      const [sx, sy] = R().iso(8.7 + (5.6 - 8.7) * u, 5.3 + (1.9 - 5.3) * u), step = u < 1 ? Math.floor(t * 6) % 2 : 0;
      ctx.globalAlpha = t > te ? 1 - (t - te) / 0.4 : 1;
      ctx.fillStyle = 'rgba(31,10,14,0.35)'; ctx.fillRect(sx - 9, sy - 2, 19, 3);
      ctx.save(); ctx.translate(rnd(sx + sem.naturalWidth / 2), rnd(sy - sem.naturalHeight + 1 - step)); ctx.scale(-1, 1); ctx.drawImage(sem, 0, 0); ctx.restore();   // gespiegeld: loopt naar rechtsachter
      ctx.globalAlpha = 1;
    }
    // vitrine op het trapje
    const V = CC.BG.vitrine, vt = T.s5 + 3.2, vw = CC.wineById(VITRINE_WINE);
    [...V.top, ...V.low].forEach(([x, y], i) => {
      const d = t - (vt + i * 0.07); if (d < 0) return;
      ctx.fillStyle = 'rgba(31,10,14,0.35)'; ctx.fillRect(x - 2, y - 1, 5, 2);
      if (!R().wineSprite(ctx, vw, 'schap', x, y + (d < 0.12 ? -rnd(8 * (1 - d / 0.12)) : 0))) R().bottle(ctx, x - 1, y, vw);
    });
    // uithangbord valt op het bord en gaat branden (zelfde gloed als de investering)
    const st = T.s5 + 3.9, sdy = drop(t, st, 60);
    if (sdy != null) { if (t > st + 0.6) R().paintedSign(ctx, IMG, t); else ctx.drawImage(IMG.logoSign, CC.BG.sign.x, CC.BG.sign.y + sdy); }
    caption(ctx, TX().lastLine, t, T.s5 + 4.4);
  }

  // ---------- shot 6: het logo op de gevel (= het titelscherm) ----------
  let GLINT = null;
  function logoShot(ctx, t, still) {
    const logo = IMG.logo;
    ctx.drawImage(IMG.title, 0, 0);
    if (!still) { stars(ctx, t); waterGlints(ctx, t, 10, 630, 332, 358, 14, P.gold2, 0.8); }
    const lx = rnd(CC.TITLE.logoX - logo.naturalWidth / 2), ly = CC.TITLE.logoY;
    const dy = still ? 0 : drop(t, T.logo, 150);
    if (dy != null) {
      ctx.drawImage(logo, lx, ly + dy);
      if (!still) dust(ctx, t, T.logo + 0.26, lx + 30, ly + 112, 190);
      const gu = still ? 0 : u01(t, T.glint, 0.55);   // één glansstreep over het logo
      if (gu > 0 && gu < 1) {
        if (!GLINT) GLINT = canvas(logo.naturalWidth, logo.naturalHeight);
        const g = GLINT.getContext('2d');
        g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, GLINT.width, GLINT.height); g.drawImage(logo, 0, 0);
        g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,241,168,0.55)';
        const bx = rnd(-60 + gu * 380);
        g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx + 14, 0); g.lineTo(bx - 46, 120); g.lineTo(bx - 60, 120); g.closePath(); g.fill();
        g.globalCompositeOperation = 'source-over';
        ctx.drawImage(GLINT, lx, ly + dy);
      }
    }
    // onderbalk + tagline: precies zoals UI.title, zodat het menu er naadloos overheen komt
    const tk = still ? 1 : u01(t, T.tag, 0.3);
    if (tk > 0) dither(ctx, tk, g => {
      R().rect(g, 0, 286, 640, 74, 'rgba(31,10,14,0.72)'); R().rect(g, 0, 286, 640, 1, P.wood2);
      F().draw(g, CC.TEXT.tagline, 320, 294, P.cream2, { align: 'center', shadow: P.ink });
    });
  }
  function startPrompt(ctx, t, blink) {
    if (blink && ((t - T.prompt) % 1.1) >= 0.72) return;
    F().draw(ctx, TX().start, 320, 318, P.gold2, { align: 'center', shadow: P.ink });
  }

  // ---------- het hele filmpje ----------
  IN.ready = function (images) { if (IN.status(images) !== 'ok') return false; prepare(images); return true; };
  IN.renderAt = function (ctx, t, opts) {
    opts = opts || {};
    ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (opts.reduced) {   // prefers-reduced-motion: korte fade naar het stilstaande eindbeeld
      black(ctx);
      dither(ctx, t / IN.REDUCED_DUR, g => logoShot(g, t, true));
      if (t >= IN.REDUCED_DUR) startPrompt(ctx, t, false);
      return;
    }
    if (t < T.s2) {
      shotStreet(ctx, t);
      if (t < 0.6) dither(ctx, 1 - t / 0.6, black);
    } else if (t < T.s4) {
      shopDark(ctx, t); drawEnvelope(ctx, t);
      if (t < T.s2 + 0.45) dither(ctx, 1 - (t - T.s2) / 0.45, g => shotStreet(g, t));
      letter(ctx, t);
    } else if (t < T.s5) {
      shopLit(ctx, t, lightLevel(t));
      drawEnvelope(ctx, t);
      if (t < T.lightOn) caption(ctx, TX().bankFirst, t, T.s4 + 0.05);
      keyCard(ctx, t);
    } else if (t < T.s6) {
      montage(ctx, t);
    } else {
      if (t < T.s6 + 0.6) { montage(ctx, T.s6 - 0.001); dither(ctx, (t - T.s6) / 0.6, g => logoShot(g, t)); }
      else logoShot(ctx, t);
      if (t >= T.prompt) startPrompt(ctx, t, true);
    }
    skipHint(ctx, t);
  };

  CC.INTRO = IN;
})(typeof window !== 'undefined' ? window : globalThis);
