// Château Cashflow — fx.js
// Sfeer en effecten (besluit 59): lampen, gracht, blaadjes, deurbel, muntjes, kat en muis, vuurwerk.
// Alles in hele pixels en rustig: het moet leven, geen kermis worden.
(function (root) {
  const CC = root.CC = root.CC || {};
  const P = CC.PAL;
  const R = () => CC.R;
  const FX = { parts: [], leaves: [], sparks: [], nextLeaf: 2, critter: null, nextCritter: 12 };

  // Plekken in de geschilderde achtergrond (640 × 360), gemeten in assets/bg_start.png
  const LAMPS = [{ x: 36, y: 86, r: 16 }, { x: 592, y: 87, r: 12 }, { x: 112, y: 42, r: 5 }, { x: 72, y: 50, r: 4 }];
  const WATER = { x0: 2, x1: 104, y0: 96, y1: 160 };
  const TREE = { x0: 0, x1: 80, y0: 0, y1: 48 };

  function disc(ctx, cx, cy, r, col) { R().round(ctx, cx - r, cy - r, r * 2, r * 2, r, col); }

  // ---------- Achtergrond-sfeer (onder de figuren) ----------
  FX.ambience = function (ctx, t, dt) {
    // lamplicht dat zacht ademt en af en toe flakkert
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    LAMPS.forEach((L, i) => {
      const f = 0.8 + 0.12 * Math.sin(t * 1.3 + i * 2.1) + (Math.sin(t * 17 + i * 5) > 0.93 ? -0.25 : 0);
      for (let k = 3; k >= 1; k--) { ctx.globalAlpha = 0.045 * f * (4 - k); disc(ctx, L.x, L.y, Math.round(L.r * k / 3 + 2), '#ffb25a'); }
    });
    ctx.restore(); ctx.globalAlpha = 1;
    // glinsteringen op de gracht
    while (FX.sparks.length < 9) FX.sparks.push({ x: WATER.x0 + Math.floor(Math.random() * (WATER.x1 - WATER.x0)), y: WATER.y0 + Math.floor(Math.random() * (WATER.y1 - WATER.y0)), w: 2 + Math.floor(Math.random() * 3), life: 0, max: 0.8 + Math.random() * 1.4 });
    for (const s of FX.sparks) {
      s.life += dt;
      ctx.globalAlpha = Math.sin(Math.min(1, s.life / s.max) * Math.PI) * 0.7;
      R().rect(ctx, s.x, s.y, s.w, 1, P.gold2);
    }
    ctx.globalAlpha = 1;
    FX.sparks = FX.sparks.filter(s => s.life < s.max);
    // blaadjes uit de boom linksboven
    FX.nextLeaf -= dt;
    if (FX.nextLeaf <= 0) { FX.nextLeaf = 2.5 + Math.random() * 4; FX.leaves.push({ x: TREE.x0 + Math.random() * (TREE.x1 - TREE.x0), y: TREE.y0 + Math.random() * (TREE.y1 - TREE.y0), vy: 8 + Math.random() * 5, ph: Math.random() * 6, col: Math.random() < 0.5 ? P.gold : P.wood3 }); }
    for (const l of FX.leaves) {
      l.y += l.vy * dt; l.ph += dt * 2.2;
      const x = Math.round(l.x + Math.sin(l.ph) * 5 + l.y * 0.3), y = Math.round(l.y);
      R().rect(ctx, x, y, 2, 1, l.col); if (Math.sin(l.ph) > 0) R().rect(ctx, x + 1, y + 1, 1, 1, l.col);
    }
    FX.leaves = FX.leaves.filter(l => l.y < 230);
  };

  // ---------- Deeltjes (boven de figuren): deurbel, muntjes, vuurwerk ----------
  FX.sparkle = function (sx, sy, col, n) {
    for (let i = 0; i < (n || 5); i++) { const a = Math.random() * Math.PI * 2, v = 12 + Math.random() * 18; FX.parts.push({ x: sx, y: sy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 8, g: 30, life: 0, max: 0.5 + Math.random() * 0.3, col: col || P.gold2, star: i === 0 }); }
  };
  FX.coins = function (sx, sy) {
    for (let i = 0; i < 4; i++) FX.parts.push({ x: sx + (Math.random() - 0.5) * 6, y: sy, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 25, g: 140, life: 0, max: 0.6 + Math.random() * 0.2, col: P.gold, coin: true });
  };
  // ---------- A10: het moment van verkopen, in beeld ----------
  // Bij elke verkoop vliegt een munt (het HUD-icoon) in een boog van de kassa naar het kasbedrag; pas als hij landt
  // telt de kas op (FX.cashPending wordt van de getoonde kas afgetrokken). Grote verkoop (> €25 of 6+ flessen):
  // grotere munt met twee kleine erachter en langer oplichten. Druk: hooguit MAXC munten tegelijk; de rest gaat in de
  // jongste munt die nog vliegt (die groeit mee). Alleen beeld; de sim weet hier niets van.
  const CASH = { x: 119, y: 7 }, MAXC = 5;
  FX.flying = []; FX.land = null;
  FX.cashPending = function () { let a = 0; for (const c of FX.flying) a += c.amt; return a; };
  FX.clearCoins = function () { FX.flying = []; };
  FX.saleCoin = function (amt, qty, sx, sy) {
    const big = amt > 25 || qty >= 6;
    if (FX.flying.length >= MAXC) {   // bundelen: bij de jongste munt optellen, die wordt groter
      const c = FX.flying[FX.flying.length - 1]; c.amt += amt; c.n++; c.big = c.big || big || c.n >= 3; return;
    }
    FX.flying.push({ x0: sx, y0: sy, t: 0, dur: 0.62 + Math.random() * 0.08, h: 34 + Math.random() * 10, amt, n: 1, big });
  };
  function coinAt(ctx, x, y, r) {   // munt zoals het kasicoon in de HUD (7 × 7), kleiner of groter
    if (r >= 4) { R().round(ctx, x - 4, y - 4, 9, 9, 3, P.ink); R().round(ctx, x - 3, y - 3, 7, 7, 3, P.gold); R().rect(ctx, x - 1, y - 1, 3, 3, '#b88a2a'); R().rect(ctx, x - 2, y - 2, 1, 1, P.gold2); R().rect(ctx, x - 1, y - 3, 2, 1, P.gold2); }
    else if (r >= 3) { R().rect(ctx, x - 3, y - 3, 7, 7, P.ink); R().rect(ctx, x - 2, y - 3, 5, 7, P.gold); R().rect(ctx, x - 3, y - 2, 7, 5, P.gold); R().rect(ctx, x - 1, y - 1, 3, 3, '#b88a2a'); R().rect(ctx, x - 2, y - 2, 1, 1, P.gold2); }
    else if (r === 2) { R().rect(ctx, x - 2, y - 2, 5, 5, P.ink); R().rect(ctx, x - 1, y - 2, 3, 5, P.gold); R().rect(ctx, x - 2, y - 1, 5, 3, P.gold); R().rect(ctx, x, y, 1, 1, '#b88a2a'); R().rect(ctx, x - 1, y - 1, 1, 1, P.gold2); }
    else { R().rect(ctx, x - 1, y - 1, 3, 3, P.ink); R().rect(ctx, x, y - 1, 1, 3, P.gold); R().rect(ctx, x - 1, y, 3, 1, P.gold); R().rect(ctx, x, y, 1, 1, P.gold2); }
  }
  FX.drawCoins = function (ctx, dt) {
    const next = [];
    for (const c of FX.flying) {
      c.t += dt;
      const k = Math.min(1, c.t / c.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   // in-uit
      // 12_WEEKKLUSSEN §5: om het uithangbord heen (links eronder langs), zodat het logo vrij blijft (besluit 90)
      const S = (CC.BG && CC.BG.sign) || { x: 285, y: 49 }, p1x = Math.min(c.x0 - 90, S.x - 50), p1y = c.y0 + 2, p2x = CASH.x + 12, p2y = Math.max(60, S.y + 30);
      const pos = kk => { const u = 1 - kk, a = u * u * u, b = 3 * u * u * kk, cc = 3 * u * kk * kk, d = kk * kk * kk;
        return [a * c.x0 + b * p1x + cc * p2x + d * CASH.x, a * c.y0 + b * p1y + cc * p2y + d * CASH.y - 6 * Math.sin(kk * Math.PI)]; };
      if (k >= 1) {   // geland: kas licht op (langer bij een grote verkoop) en een paar vonkjes
        FX.land = { t: c.big ? 0.9 : 0.5, max: c.big ? 0.9 : 0.5, big: c.big };
        FX.sparkle(CASH.x, CASH.y, P.gold2, c.big ? 6 : 3);
        continue;
      }
      next.push(c);
      const r = c.big ? 4 : 3;   // gewone verkoop: het HUD-icoon (7 × 7); groot: 9 × 9 met twee kleine munten erachter
      if (c.big) for (const lag of [0.09, 0.17]) { const kk = Math.max(0, e - lag); if (kk > 0) { const [tx, ty] = pos(kk); coinAt(ctx, Math.round(tx), Math.round(ty), 2); } }
      const [x, y] = pos(e); coinAt(ctx, Math.round(x), Math.round(y), r);
    }
    FX.flying = next;
    if (FX.land) { FX.land.t -= dt; if (FX.land.t <= 0) FX.land = null; }
  };
  // De fles die gepakt wordt, komt zichtbaar uit de kast: een spookfles die even omhoog gaat en vervaagt
  // 12_WEEKKLUSSEN §5: eerst 3 px omhoog met een gouden plek eronder (een paar beelden), dan pas weg en vervagen
  FX.pluck = function (x, y, wine) { FX.parts.push({ x, y, vx: 0, vy: 0, g: 0, life: 0, max: 0.55, ghost: wine, lift: true }); };
  // Vak is op: het lege vak knippert één keer rood (rect uit R.vakRects)
  FX.vakFlash = {};
  FX.flashVak = function (vakId) { FX.vakFlash[vakId] = performance.now() / 1000; };
  FX.drawVakFlash = function (ctx, vakId, r) {   // vanuit R.paintedShelf, direct na de flessen van dat vak (juiste diepte)
    const t0 = FX.vakFlash[vakId]; if (t0 == null) return;
    const k = (performance.now() / 1000 - t0) / 0.5;
    if (k >= 1) { delete FX.vakFlash[vakId]; return; }
    ctx.globalAlpha = 0.5 * Math.sin(k * Math.PI);
    R().round(ctx, r.x, r.y, r.w, r.h, 2, P.red);
    ctx.globalAlpha = 1;
  };
  // Vuurwerk: een pijl die opstijgt en uiteenspat in een kring van vonken
  FX.firework = function (sx, sy, col) {
    FX.parts.push({ x: sx, y: sy + 60, vx: 0, vy: -140, g: 60, life: 0, max: 0.42, col: P.gold2, rocket: true, burst: col || P.gold });
  };
  FX.burst = function (x, y, col) {
    const n = 28, rot = Math.random() * Math.PI;
    for (let i = 0; i < n; i++) {
      const a = rot + i / n * Math.PI * 2, v = 62 + (i % 2) * 12;
      FX.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 22, drag: 1.5, life: 0, max: 1.1 + Math.random() * 0.4, col: i % 3 ? col : P.cream3, trail: true });
    }
    for (let i = 0; i < 10; i++) {   // binnenring
      const a = rot + i / 10 * Math.PI * 2, v = 26;
      FX.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 18, drag: 1.5, life: 0, max: 0.9, col: P.gold2, trail: false });
    }
    FX.parts.push({ x, y, vx: 0, vy: 0, g: 0, life: 0, max: 0.18, flash: true });
  };
  FX.drawParts = function (ctx, dt) {
    const next = [];
    for (const p of FX.parts) {
      p.life += dt;
      if (p.drag) { p.vx *= Math.exp(-p.drag * dt); p.vy *= Math.exp(-p.drag * dt); }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.life / p.max;
      if (p.rocket && k >= 1) { FX.burst(p.x, p.y, p.burst); continue; }
      if (k >= 1) continue;
      next.push(p);
      const x = Math.round(p.x), y = Math.round(p.y);
      ctx.globalAlpha = p.rocket ? 1 : Math.max(0, 1 - k * k);
      if (p.ghost) {
        const t = p.life;   // 0–0,12 s: 3 px omhoog en goud; daarna stijgt hij verder en vervaagt
        const dy = t < 0.12 ? -Math.round(t / 0.12 * 3) : -3 - Math.round((t - 0.12) * 30);
        if (t < 0.2) { R().rect(ctx, x - 1, y - 13, 6, 14, P.gold2); R().rect(ctx, x, y - 14, 4, 1, P.gold2); }   // de plek licht goud op
        ctx.globalAlpha = t < 0.12 ? 1 : Math.max(0, 1 - (t - 0.12) / 0.43);
        R().bottleP(ctx, x, y + dy, p.ghost); ctx.globalAlpha = 1; continue;
      }
      if (p.flash && p.small) { const r = Math.round(2 + k * 4); ctx.globalAlpha = 0.6 * (1 - k); R().round(ctx, x - r, y - r, r * 2, r * 2, r, P.cream3); ctx.globalAlpha = 1; continue; }
      if (p.flash) { const r = Math.round(6 + k * 10); ctx.globalAlpha = 0.5 * (1 - k); R().round(ctx, x - r, y - r, r * 2, r * 2, r, P.gold2); ctx.globalAlpha = 1; continue; }
      if (p.coin) { R().rect(ctx, x - 1, y - 1, 3, 3, P.ink); R().rect(ctx, x, y - 1, 1, 3, P.gold); R().rect(ctx, x - 1, y, 3, 1, P.gold); R().rect(ctx, x, y, 1, 1, P.gold2); }
      else if (p.star) { R().rect(ctx, x, y - 2, 1, 5, p.col); R().rect(ctx, x - 2, y, 5, 1, p.col); R().rect(ctx, x, y, 1, 1, '#ffffff'); }
      else {
        const sz = p.trail && k < 0.5 ? 2 : 1;
        R().rect(ctx, x, y, sz, sz, k < 0.25 ? '#ffffff' : p.col);
        if (p.trail || p.rocket) { ctx.globalAlpha *= 0.5; R().rect(ctx, Math.round(p.x - p.vx * 0.03), Math.round(p.y - p.vy * 0.03), 1, 1, p.col); }
      }
    }
    ctx.globalAlpha = 1;
    FX.parts = next;
  };

  // ---------- Kat en muis (als de winkel dicht is) ----------
  // De muis schiet van achter het vat langs de voorkant naar de deur; de kat erachteraan,
  // stopt bij de deur, kijkt verbaasd en sjokt terug.
  const ROUTE = [[0.85, 6.55], [2.2, 7.1], [5.6, 7.1], [7.9, 5.4]];
  function along(pts, d) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
      if (d <= L) return { x: ax + (bx - ax) * d / L, y: ay + (by - ay) * d / L, dx: bx - ax, dy: by - ay };
      d -= L;
    }
    const n = pts.length - 1; return { x: pts[n][0], y: pts[n][1], dx: 1, dy: 0, end: true };
  }
  const routeLen = (() => { let L = 0; for (let i = 0; i < ROUTE.length - 1; i++) L += Math.hypot(ROUTE[i + 1][0] - ROUTE[i][0], ROUTE[i + 1][1] - ROUTE[i][1]); return L; })();
  FX.critters = function (dt, closed) {
    if (!closed) { FX.critter = null; return []; }
    if (!FX.critter) {
      FX.nextCritter -= dt;
      if (FX.nextCritter <= 0) { FX.critter = { t: 0 }; FX.nextCritter = 30 + Math.random() * 30; }
      return [];
    }
    const c = FX.critter; c.t += dt;
    const out = [];
    const mouseD = c.t * 3.2, catStart = 0.9, catRun = 2.6;
    if (mouseD < routeLen + 0.5) { const m = along(ROUTE, mouseD); if (!m.end) out.push({ kind: 'mouse', x: m.x, y: m.y, face: (m.dx - m.dy) >= 0 ? 1 : -1, ph: c.t * 14 }); }
    const catD = Math.max(0, (c.t - catStart) * catRun);
    const stopD = routeLen - 1.0;
    if (c.t > catStart) {
      if (catD < stopD) { const k = along(ROUTE, catD); out.push({ kind: 'cat', x: k.x, y: k.y, face: (k.dx - k.dy) >= 0 ? 1 : -1, ph: c.t * 10, run: true }); }
      else {
        const tStop = catStart + stopD / catRun, wait = 2.2, back = c.t - tStop - wait;
        if (back < 0) { const k = along(ROUTE, stopD); out.push({ kind: 'cat', x: k.x, y: k.y, face: 1, ph: 0, sit: true, puzzled: c.t - tStop > 0.5 }); }
        else {
          const d = stopD - back * 1.2;
          if (d <= 0) { FX.critter = null; return out; }
          const k = along(ROUTE, d); out.push({ kind: 'cat', x: k.x, y: k.y, face: (k.dx - k.dy) >= 0 ? -1 : 1, ph: c.t * 5 });
        }
      }
    }
    return out;
  };
  // ---------- Straat (M7b): voorbijgangers, en grapjes als de winkel dicht is ----------
  // Twee stoepen langs de open voorkant van de winkel. Rechts loopt langs de deur.
  const LANES = {
    R: { from: { x: 9.6, y: -3.2 }, to: { x: 9.6, y: 10.6 }, stop: [3.2, 6.8], axis: 'y' },
    L: { from: { x: -3.6, y: 9.1 }, to: { x: 9.8, y: 9.1 }, stop: [1.8, 5.2], axis: 'x' },
  };
  // alle klantfiguren uit het manifest (geen personeel); zonder manifest de vier basistypen
  const LOOKS = Object.keys(CC.CUSTOMER_TYPES || {}).flatMap(t => (CC.SPRITE_VARIANTS || {})[t] || [t]);
  const DOOR_OUT = { x: 8.55, y: 5.4 };
  FX.passers = []; FX.nextPasser = 2; FX.jokeOrder = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function faceFor(lane, dir) {           // kijkrichting op het scherm + voor- of achteraanzicht
    return lane === 'R' ? { face: dir > 0 ? -1 : 1, toward: dir > 0 } : { face: dir > 0 ? 1 : -1, toward: dir > 0 };
  }
  function newPerson(lane, dir) {
    const look = pick(LOOKS), L = LANES[lane], A = dir > 0 ? L.from : L.to, B = dir > 0 ? L.to : L.from;
    return { lane, dir, look, sprite: look, type: look.replace(/\d+$/, ''), x: A.x, y: A.y, goal: B,
      alpha: 1, moving: true, walkPhase: Math.random() * 3, speed: rnd(0.95, 1.4), bubble: null, street: true,
      ...faceFor(lane, dir), plan: [] };
  }
  function stepTo(p, tx, ty, dt) {
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), sp = p.speed * dt;
    p.moving = true;
    if (d <= sp) { p.x = tx; p.y = ty; p.walkPhase += d * 2; return true; }
    p.x += dx / d * sp; p.y += dy / d * sp; p.walkPhase += sp * 2; return false;
  }
  function say(p, text, dur) { p.bubble = { text, tone: 'grey', t: dur || 2.2 }; }

  // Een stap in het plan van een voorbijganger. Stappen: {go:{x,y}} · {wait:s, look:{face,toward}, say} · {end}
  function runPerson(p, dt) {
    if (p.bubble) { p.bubble.t -= dt; if (p.bubble.t <= 0) p.bubble = null; }
    const st = p.plan[0];
    if (!st) return false;
    if (st.go) {
      if (st.face) Object.assign(p, st.face);
      if (stepTo(p, st.go.x, st.go.y, dt)) p.plan.shift();
    } else if (st.wait != null) {
      p.moving = false;
      if (!st.started) { st.started = true; if (st.look) Object.assign(p, st.look); if (st.say) say(p, st.say, Math.min(st.wait + 0.3, 2.6)); }
      st.wait -= dt; if (st.wait <= 0) p.plan.shift();
    }
    return p.plan.length > 0;
  }
  // Vanaf niveau 6 staat het terras (decor_terras, 5.6 / 9.0) over de linkerstoep: voorbijgangers lopen er dan
  // aan de straatkant voorlangs (vóór de stoelpoten, achter het tweede paaltje), in plaats van door de stoelen.
  const TERRAS_OM = [{ x: 3.9, y: 9.1 }, { x: 4.7, y: 10.6 }, { x: 8.1, y: 10.6 }, { x: 8.9, y: 9.1 }];
  FX.terras = false;
  function faceOf(a, b) {   // kijkrichting bij een stap van a naar b (op het scherm: links/rechts, naar je toe of van je af)
    const dx = (b.x - b.y) - (a.x - a.y), dy = (b.x + b.y) - (a.x + a.y);
    return { face: dx >= 0 ? 1 : -1, toward: dy > 0 };
  }
  function walk(lane, from, to) {   // loopstappen van from naar to, zo nodig om het terras heen
    if (lane !== 'L' || !FX.terras || Math.min(from.x, to.x) > TERRAS_OM[0].x || Math.max(from.x, to.x) < TERRAS_OM[3].x) return [{ go: to, face: faceOf(from, to) }];
    const pts = from.x < to.x ? TERRAS_OM : TERRAS_OM.slice().reverse(), steps = [];
    let prev = from;
    for (const q of [...pts, to]) { steps.push({ go: q, face: faceOf(prev, q) }); prev = q; }
    return steps;
  }
  function passerPlan(p, closed) {
    const L = LANES[p.lane], start = { x: p.x, y: p.y }, go = { x: p.goal.x, y: p.goal.y };
    if (Math.random() < 0.35) {           // even stilstaan bij de etalage
      const hi = p.lane === 'L' && FX.terras ? Math.min(L.stop[1], TERRAS_OM[0].x - 0.2) : L.stop[1];
      const k = rnd(L.stop[0], hi);
      const at = L.axis === 'y' ? { x: L.from.x, y: k } : { x: k, y: L.from.y };
      const look = { face: p.lane === 'R' ? -1 : 1, toward: false };
      const line = Math.random() < 0.45 ? pick(closed ? T().lookClosed : T().lookOpen) : null;
      p.plan = [...walk(p.lane, start, at), { wait: rnd(1.4, 2.6), look, say: line }, ...walk(p.lane, at, go)];
    } else p.plan = walk(p.lane, start, go);
  }
  const T = () => CC.TEXT.street;

  // Te laat: iemand loopt naar de deur, rammelt, zucht, loopt verder.
  function latePlan(p) {
    const f = faceFor('R', 1);
    p.plan = [{ go: { x: 9.6, y: DOOR_OUT.y } }, { go: DOOR_OUT, face: { face: -1, toward: false } },
      { wait: 1.6, look: { face: -1, toward: false }, say: pick(T().late) }, { wait: 0.5, look: { face: 1, toward: true } },
      { wait: 1.5, look: { face: 1, toward: true }, say: pick(T().lateBye) },
      { go: { x: 9.6, y: DOOR_OUT.y + 0.5 }, face: f }, { go: { x: 9.6, y: 10.6 }, face: f }];
  }

  // Kat die op de mat voor de deur een dutje doet
  function napStep(j, dt) {
    j.t += dt;
    const nap = 9, spd = 1.5;
    const A = { x: 9.6, y: -3 }, B = { x: 9.6, y: DOOR_OUT.y }, C = { x: DOOR_OUT.x + 0.2, y: DOOR_OUT.y + 0.3 };
    const path = [[A.x, A.y], [B.x, B.y], [C.x, C.y]];
    const len = Math.hypot(0, B.y - A.y) + Math.hypot(C.x - B.x, C.y - B.y);
    const d = j.t * spd;
    if (d < len) { const k = along(path, d); return [{ kind: 'cat', x: k.x, y: k.y, face: -1, ph: j.t * 5 }]; }
    const tSit = len / spd;
    if (j.t < tSit + nap) return [{ kind: 'cat', x: C.x, y: C.y, face: -1, ph: 0, sit: true, zzz: j.t - tSit }];
    const back = (j.t - tSit - nap) * spd;
    const out = [[C.x, C.y], [9.6, C.y + 0.4], [9.6, 10.8]];
    const k = along(out, back);
    if (k.end) return null;
    return [{ kind: 'cat', x: k.x, y: k.y, face: -1, ph: j.t * 5 }];
  }

  // ---------- Fietser (besluit 79/80, 98): af en toe langs, puur beeld, geen invloed op de sim ----------
  // Rijdt over dezelfde twee stoepen als de voorbijgangers, iets naar de straatkant (rechts vóór het stoepbord langs),
  // en alleen over een stoep waar op dat moment niemand loopt; zolang ze rijdt komt er op die stoep niemand bij.
  // Links gaat ze achter de lantaarnpaal en de paaltjes langs (assets/fg_straat.png komt eroverheen); vanaf niveau 6
  // staat daar het terras over de hele stoep, dan rijdt ze alleen rechts.
  FX.BIKE_SRC = { voor_1: 'assets/fietser_voor_1.png', voor_2: 'assets/fietser_voor_2.png',
    achter_1: 'assets/fietser_achter_1.png', achter_2: 'assets/fietser_achter_2.png' };
  const BIKE_LANES = {
    R: { from: { x: 10.9, y: -2.6 }, to: { x: 10.9, y: 13.2 } },    // vóór het stoepbord langs (9.4, 3.4)
    L: { from: { x: -4.4, y: 9.25 }, to: { x: 12.8, y: 9.25 } },    // net naast de voetgangers (9.1), achter paal en paaltjes langs
  };
  // waar de wielen de grond raken in het ongespiegelde beeld (voor kijkt naar links, achter naar rechts)
  // komt uit assets/fietser.js (tools/import_fietser.py schrijft het; met de hand bij te stellen); anders deze waarden
  const BIKE_WHEELS = (CC.FIETSER && CC.FIETSER.wheels) || { voor: [[8, 63], [38, 56]], achter: [[7, 62], [37, 51]] };
  const BIKE_SPEED = 3.0, BIKE_PEDAL = 1.1;   // tegels per seconde (voetganger ± 1,2); trapstand wisselt per 1,1 tegel
  FX.bike = null; FX.nextBike = 20 + Math.random() * 25;
  const bikeReady = images => images && ['voor_1', 'voor_2', 'achter_1', 'achter_2'].every(k => { const im = images['fiets_' + k]; return im && im.complete && im.naturalWidth; });
  const laneBusy = lane => FX.passers.some(p => p.lane === lane) || (lane === 'R' && FX.joke);
  function bikeStep(dt, images, s) {
    if (!FX.bike) {
      FX.nextBike -= dt;
      if (FX.nextBike > 0 || !bikeReady(images)) return;
      const free = ['R', 'L'].filter(l => !laneBusy(l) && !(l === 'L' && FX.terras));
      if (!free.length) { FX.nextBike = 2; return; }
      const lane = pick(free), dir = Math.random() < 0.5 ? 1 : -1, L = BIKE_LANES[lane];
      const A = dir > 0 ? L.from : L.to, B = dir > 0 ? L.to : L.from, len = Math.hypot(B.x - A.x, B.y - A.y);
      FX.bike = { lane, A, B, len, d: 0, x: A.x, y: A.y, ...faceFor(lane, dir), bubble: null,
        bell: Math.random() < 0.4 ? len * rnd(0.35, 0.55) : -1 };   // soms een belletje, ongeveer halverwege
      return;
    }
    const b = FX.bike;
    b.d += BIKE_SPEED * dt;
    if (b.d >= b.len) { FX.bike = null; FX.nextBike = rnd(30, 60); return; }
    const k = b.d / b.len; b.x = b.A.x + (b.B.x - b.A.x) * k; b.y = b.A.y + (b.B.y - b.A.y) * k;
    if (b.bell >= 0 && b.d >= b.bell) { b.bell = -1; b.bubble = { text: T().bell, tone: 'grey', t: 1.6 }; }
    if (b.bubble) { b.bubble.t -= dt; if (b.bubble.t <= 0) b.bubble = null; }
  }
  // Tekent de fietser; geeft [x, y] van de bovenkant terug (voor het ballonnetje), of null.
  FX.drawBike = function (ctx, b, images) {
    const view = b.toward ? 'voor' : 'achter', img = images['fiets_' + view + '_' + (1 + Math.floor(b.d / BIKE_PEDAL) % 2)];
    if (!img || !img.complete || !img.naturalWidth) return null;
    const w = img.naturalWidth, h = img.naturalHeight, flip = b.face !== (b.toward ? -1 : 1);
    const wh = BIKE_WHEELS[view].map(([x, y]) => [flip ? w - 1 - x : x, y]);
    const [sx, sy] = R().iso(b.x, b.y);
    const x = Math.round(sx - (wh[0][0] + wh[1][0]) / 2), y = Math.round(sy - (wh[0][1] + wh[1][1]) / 2);
    // schaduw: een smalle strook van wiel tot wiel, elke pixel één keer
    ctx.fillStyle = 'rgba(31,10,14,0.3)';
    const [[ax, ay], [bx, by]] = wh, n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)), seen = new Set();
    for (let i = 0; i <= n; i++) {
      const px = Math.round(ax + (bx - ax) * i / n), py = Math.round(ay + (by - ay) * i / n);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dy) === 1 && Math.abs(dx) === 2) continue;
        const key = (px + dx) + ',' + (py + dy); if (seen.has(key)) continue; seen.add(key);
        ctx.fillRect(x + px + dx, y + py + dy + 1, 1, 1);
      }
    }
    if (flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
    else ctx.drawImage(img, x, y);
    return [x + Math.round(w / 2), y + 2];
  };

  // Alles buiten: geeft tekenbare dingen terug ({c} voor mensen, {critter} voor dieren).
  FX.street = function (dt, phase, images, s) {
    const open = phase === 'sale', closed = phase === 'prep';
    if (!open && !closed) { FX.passers = []; FX.critter = null; FX.joke = null; FX.bike = null; return []; }
    FX.terras = !!(s && CC.SIM.activeFurniture(s).some(f => f.id === 'decor_terras'));
    // voorbijgangers
    FX.nextPasser -= dt;
    if (FX.nextPasser <= 0 && FX.passers.length < 3) {
      FX.nextPasser = open ? rnd(4, 9) : rnd(8, 15);
      let lane = Math.random() < 0.55 ? 'R' : 'L'; const dir = Math.random() < 0.5 ? 1 : -1;
      if (FX.bike && FX.bike.lane === lane) lane = lane === 'R' ? 'L' : 'R';   // niet op de stoep waar de fietser rijdt
      const p = newPerson(lane, dir); passerPlan(p, closed); FX.passers.push(p);
    }
    FX.passers = FX.passers.filter(p => runPerson(p, dt));
    const out = FX.passers.map(p => ({ depth: p.x + p.y, c: p }));
    // fietser: aan de straatkant, dus vóór alles in de winkel
    bikeStep(dt, images, s);
    if (FX.bike) out.push({ depth: 1000, bike: FX.bike });
    // grapjes als de winkel dicht is: om de beurt kat-en-muis, te laat, dutje
    if (closed) {
      if (!FX.joke && !(FX.bike && FX.bike.lane === 'R')) {   // de grapjes spelen op de rechterstoep
        FX.nextCritter -= dt;
        if (FX.nextCritter <= 0) {
          if (!FX.jokeOrder.length) FX.jokeOrder = ['catmouse', 'late', 'nap'].sort(() => Math.random() - 0.5);
          const kind = FX.jokeOrder.shift();
          FX.joke = { kind, t: 0 }; FX.nextCritter = rnd(25, 45);
          if (kind === 'catmouse') FX.critter = { t: 0 };
          if (kind === 'late') { const p = newPerson('R', 1); latePlan(p); FX.joke.p = p; }
        }
      }
      const j = FX.joke;
      if (j && j.kind === 'catmouse') {
        const cr = FX.critters(dt, true);
        for (const c of cr) out.push({ depth: c.x + c.y, critter: c });
        if (!FX.critter) FX.joke = null;
      } else if (j && j.kind === 'late') {
        if (runPerson(j.p, dt)) out.push({ depth: j.p.x + j.p.y, c: j.p }); else FX.joke = null;
      } else if (j && j.kind === 'nap') {
        const cr = napStep(j, dt);
        if (cr) for (const c of cr) out.push({ depth: c.x + c.y, critter: c }); else FX.joke = null;
      }
    } else { FX.joke = null; FX.critter = null; }
    return out;
  };

  FX.drawCritter = function (ctx, it) {
    const [sx, sy] = R().iso(it.x, it.y), f = it.face;
    const X = (dx, w) => (f > 0 ? sx + dx : sx - dx - (w || 1));
    ctx.fillStyle = 'rgba(31,10,14,0.3)'; ctx.fillRect(sx - 5, sy - 1, 10, 2);
    // sprites van HJ (assets/critters.js, tools/build_critters.py); anders de getekende versie hieronder
    const key = it.kind === 'mouse' ? 'mouse_run' + (Math.floor(it.ph) % 2 + 1)
      : it.sit ? 'cat_sit' : it.run ? 'cat_run' + (Math.floor(it.ph) % 2 + 1) : 'cat_walk';
    const im = CC.IMAGES && CC.IMAGES['crit_' + key];
    if (im && im.complete && im.naturalWidth) {
      const w = im.naturalWidth, h = im.naturalHeight, bob = !it.sit && !it.run && it.kind === 'cat' ? Math.floor(it.ph) % 2 : 0;
      ctx.fillStyle = 'rgba(31,10,14,0.3)'; ctx.fillRect(sx - Math.round(w * 0.35), sy - 1, Math.round(w * 0.7), 2);
      ctx.save(); ctx.translate(sx, sy + 1 - bob); if (f < 0) ctx.scale(-1, 1);
      ctx.drawImage(im, -Math.round(w / 2), -h); ctx.restore();
      if (it.puzzled) CC.FONT.draw(ctx, '?', sx + 4, sy - h - 10, P.cream3, { shadow: P.ink });
      if (it.zzz != null) FX.drawZzz(ctx, sx + 6, sy - h - 2, it.zzz);
      return;
    }
    if (it.kind === 'mouse') {
      const b = Math.floor(it.ph) % 2;
      R().rect(ctx, X(-3, 6), sy - 4, 6, 3, '#8a8078'); R().rect(ctx, X(2, 2), sy - 5, 2, 2, '#b5aca2'); R().rect(ctx, X(3, 1), sy - 3, 1, 1, P.ink);
      R().rect(ctx, X(-6, 3), sy - 3 + b, 3, 1, '#b58a7a');
      return;
    }
    const col = '#3a3431', col2 = '#5a514b', step = it.run ? Math.floor(it.ph) % 2 : 0;
    if (it.sit) {
      R().rect(ctx, X(-4, 8), sy - 9, 8, 8, col); R().rect(ctx, X(2, 6), sy - 13, 6, 5, col);
      R().rect(ctx, X(2, 1), sy - 15, 1, 2, col); R().rect(ctx, X(6, 1), sy - 15, 1, 2, col);
      R().rect(ctx, X(4, 1), sy - 11, 1, 1, P.gold); R().rect(ctx, X(-7, 3), sy - 2, 3, 1, col);
      if (it.puzzled) CC.FONT.draw(ctx, '?', X(6, 5), sy - 24, P.cream3, { shadow: P.ink });
      if (it.zzz != null) FX.drawZzz(ctx, sx + 6, sy - 16, it.zzz);
      return;
    }
    R().rect(ctx, X(-6, 12), sy - 7, 12, 4, col); R().rect(ctx, X(-6, 12), sy - 7, 12, 1, col2);
    R().rect(ctx, X(5, 5), sy - 10, 5, 4, col); R().rect(ctx, X(5, 1), sy - 12, 1, 2, col); R().rect(ctx, X(8, 1), sy - 12, 1, 2, col);
    R().rect(ctx, X(8, 1), sy - 9, 1, 1, P.gold);
    R().rect(ctx, X(-9, 3), sy - 9 - step, 3, 1, col); R().rect(ctx, X(-10, 1), sy - 10 - step, 1, 2, col);
    for (const [dx, up] of [[-5, step], [-2, 1 - step], [2, step], [4, 1 - step]]) R().rect(ctx, X(dx, 1), sy - 3 - up, 1, 3, col);
  };

  // drie z'jes die om beurten opstijgen en vervagen
  FX.drawZzz = function (ctx, x, y, t) {
    if (t < 0.6) return;
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.5) + i / 3) % 1;
      ctx.globalAlpha = Math.max(0, Math.min(1, (1 - k) * 1.6));
      CC.FONT.draw(ctx, 'z', Math.round(x + k * 8 + i), Math.round(y - k * 16), P.cream3, { shadow: P.ink });
    }
    ctx.globalAlpha = 1;
  };

  CC.FX = FX;
})(typeof window !== 'undefined' ? window : globalThis);
