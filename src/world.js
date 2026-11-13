// Château Cashflow — world.js
// De verkoopdag: klanten als agents in de kamer, met een vaste tijdstap.
// Let op: het adviesgeduld loopt in echte seconden (besluit 47), dus op 2×/4× kan een dag met een adviesvraag
// iets anders lopen dan op 1×. Wel geldt altijd: elke bezoeker krijgt precies één uitkomst (kopen of weg met reden).
(function (root) {
  const CC = root.CC = root.CC || {};
  const SIM = () => CC.SIM;
  const RM = CC.ROOM;

  const DAY = {};
  DAY.STEP = 1 / 60;

  DAY.start = function (s) {
    const rng = CC.makeRng(s);
    const plan = SIM().planDay(s, SIM().dayRng(s));   // zelfde klanten als de prognose
    DAY.markAdvice(s, plan, rng);
    return {
      rng, plan, t: 0, next: 0, speed: 1,
      customers: [], floats: [], log: SIM().newDayLog(), decisions: [],
      staff: DAY.staffAgents(s),
      idleRng: CC.makeRng({ rng: ((s.seed >>> 0) * 7 + s.week * 131 + s.day * 17 + 3) >>> 0 }),   // slenteren van Sem: vast per dag
      done: false,
      autoAdvice: null,   // (ask, s, rng) => wineId | null — voor tools/balance.js
    };
  };

  // Personeel als figuurtjes in de winkel (ook zichtbaar tijdens voorbereiden)
  DAY.staffAgents = function (s) {
    return Object.keys(s.staff || {}).map(id => {
      const h = CC.STAFF[id].home;
      return { id: 'staff_' + id, staffId: id, type: id, staff: true, x: h.x, y: h.y, alpha: 1, face: -1, toward: true,
        path: [], state: 'home', timer: 0.5, moving: false, walkPhase: 0, bubble: null, vak: null,
        speedMul: id === 'sem' ? CC.CONFIG.semSpeed[s.staff[id].level - 1] : 1, baseSpeed: id === 'sem' ? CC.CONFIG.semSpeed[s.staff[id].level - 1] : 1 };
    });
  };
  const staffOf = (d, id) => (d.staff || []).find(a => a.staffId === id);

  // 1–3 klanten per dag krijgen een adviesvraag (01_ONTWERP §7). De allereerste dag precies één (§11).
  DAY.markAdvice = function (s, plan, rng) {
    const C = CC.CONFIG, [lo, hi] = C.advicePerDay;
    let k = lo + Math.floor(rng() * (hi - lo + 1));
    if (s.week === 1 && s.day === 0) k = 1;
    const pool = plan.filter(p => p.at <= C.spawnWindow * C.adviceSpawnFrac);
    for (let i = 0; i < k && pool.length; i++) pool.splice(Math.floor(rng() * pool.length), 1)[0].advice = true;
  };

  // Route om obstakels (meubels met block:true) heen: steeds via de beste hoek.
  function blockers() {
    return CC.FURNITURE.filter(f => f.block || f.kind === 'counter').map(f => ({ x0: f.x - 0.45, x1: f.x + f.w + 0.45, y0: f.y - 0.45, y1: f.y + f.d + 0.45 }));
  }
  function hits(a, b, r) {
    for (let i = 1; i < 30; i++) {
      const k = i / 30, x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
      if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) return true;
    }
    return false;
  }
  function route(from, to) {
    const path = []; let cur = { x: from.x, y: from.y };
    const B = blockers();
    for (let it = 0; it < 4; it++) {
      const r = B.find(r2 => hits(cur, to, r2));
      if (!r) break;
      const corners = [[r.x0, r.y0], [r.x1, r.y0], [r.x0, r.y1], [r.x1, r.y1]].map(([x, y]) => ({ x, y }))
        .filter(c => Math.hypot(c.x - cur.x, c.y - cur.y) > 0.05 && !hits(cur, c, r));
      if (!corners.length) break;
      corners.sort((p, q) => (Math.hypot(p.x - cur.x, p.y - cur.y) + Math.hypot(to.x - p.x, to.y - p.y)) - (Math.hypot(q.x - cur.x, q.y - cur.y) + Math.hypot(to.x - q.x, to.y - q.y)));
      path.push(corners[0]); cur = corners[0];
    }
    path.push(to);
    return path;
  }

  function spawn(d, s, p) {
    const jitter = (d.rng() - 0.5) * 0.6;
    const c = {
      id: p.id, type: p.type, budget: p.budget,
      x: RM.door.x + 0.4, y: RM.door.y + jitter, alpha: 0, face: -1,
      path: [], state: 'enter', timer: 0, moving: false, walkPhase: 0,
      bubble: null, carry: null, want: null,
      advice: !!p.advice, ask: null, patience: 0, src: p.src || null,
    };
    SIM().recordVisit(d.log, p.type, p.src);
    // uiterlijk: willekeurige variant van het type (assets/sprites.js), niet twee keer dezelfde achter elkaar.
    // Math.random i.p.v. d.rng: puur beeld, de dag (en de prognose) blijft precies gelijk.
    const vars = (CC.SPRITE_VARIANTS || {})[p.type];
    if (vars && vars.length > 1) {
      d.lastLook = d.lastLook || {};
      const pool = vars.filter(v => v !== d.lastLook[p.type]);
      c.sprite = pool[Math.floor(Math.random() * pool.length)]; d.lastLook[p.type] = c.sprite;
    }
    if (CC.FX && d.visual) { const [sx, sy] = CC.R.iso(RM.door.x, RM.door.y); CC.FX.sparkle(sx, sy - 40, CC.PAL.gold2, 4); }
    const shelves = SIM().activeFurniture(s).filter(f => f.kind === 'shelf');
    const sh = shelves[Math.floor(d.rng() * shelves.length)];
    const spot = CC.shelfSpot(sh);
    c.path = [{ x: RM.door.x - 0.6, y: c.y }, ...route({ x: RM.door.x - 0.6, y: c.y }, { x: spot.x + (d.rng() - 0.5) * 0.8, y: spot.y + (d.rng() - 0.5) * 0.8 })];
    d.customers.push(c);
  }

  function say(c, text, tone, dur) { c.bubble = { text, tone, t: dur || 2.4 }; }

  function walk(c, dt) {
    if (!c.path.length) { c.moving = false; return true; }
    const tg = c.path[0];
    const dx = tg.x - c.x, dy = tg.y - c.y;
    const dist = Math.hypot(dx, dy);
    const sp = CC.CONFIG.walkSpeed * (c.speedMul || 1) * dt;
    c.moving = true;
    // Schermrichting: x-y bepaalt links/rechts
    const sdx = dx - dy;
    if (Math.abs(sdx) > 0.01) c.face = sdx > 0 ? 1 : -1;
    const sdy = dx + dy;                       // > 0: loopt naar de speler toe
    if (Math.abs(sdy) > 0.02) c.toward = sdy > 0;
    if (dist <= sp) { c.x = tg.x; c.y = tg.y; c.path.shift(); c.walkPhase += dist * 2; return !c.path.length; }
    c.x += dx / dist * sp; c.y += dy / dist * sp; c.walkPhase += sp * 2;
    return false;
  }

  function goCounter(d, c) {
    c.carry = CC.wineById(c.want.wineId);
    const q = d.customers.filter(o => o.state === 'toCounter' || o.state === 'pay').length;
    const Q = RM.queue || [[RM.counter.x, RM.counter.y]];
    const qs = Q[Math.min(q, Q.length - 1)];
    c.path = route(c, { x: qs[0] + (q >= Q.length ? (d.rng() - 0.5) * 0.3 : 0), y: qs[1] });
    c.state = 'toCounter';
  }

  // Antwoord op een adviesvraag (wineId of null = "heb ik niet"). Geeft de uitkomst terug voor het kaartje.
  DAY.answer = function (d, s, c, wineId) {
    const A = CC.TEXT.adviceReply;
    const res = SIM().answerAdvice(s, d.log, c.ask, wineId);
    res.q = c.ask.q; res.opts = c.ask.opts;
    res.reply = CC.pickText(A[res.result], d.rng, { wine: res.goodIds && res.goodIds.length ? CC.wineById(res.goodIds[0]).name : '' });
    c.ask = null; c.result = res;
    if (res.result === 'good' && SIM().take(s, res.wineId, 1) > 0) {
      c.want = { action: 'buy', wineId: res.wineId, qty: 1, price: res.price, advice: true };
      say(c, res.reply, 'green', 2.2);
      d.floats.push({ text: '+' + CC.R.euro(res.tip) + ' fooi · +' + res.dr + ' ★', x: c.x - 0.3, y: c.y - 0.3, t: 1.4, col: CC.PAL.gold });
      goCounter(d, c);
    } else {
      say(c, res.reply, res.result === 'honest' ? 'grey' : 'red', 2.4);
      SIM().recordLeave(d.log, 'adviceLeft', null, c.type);   // weg na advies (fout, eerlijk of toch op)
      leave(c);
    }
    return res;
  };

  function leave(c) {
    c.state = 'leave';
    c.path = [...route(c, { x: RM.door.x - 0.6, y: RM.door.y }), { x: RM.door.x + 0.4, y: RM.door.y }];
  }

  DAY.step = function (d, s, dt) {
    const T = CC.TEXT.bubble;
    d.t += dt;
    // spawnen
    while (d.next < d.plan.length && d.plan[d.next].at <= d.t) { spawn(d, s, d.plan[d.next]); d.next++; }

    for (const c of d.customers) {
      if (c.bubble) { c.bubble.t -= dt; if (c.bubble.t <= 0) c.bubble = null; }
      switch (c.state) {
        case 'enter':
          c.alpha = Math.min(1, c.alpha + dt * 4);
          if (walk(c, dt)) { c.toward = false; c.state = 'browse'; c.timer = 1.0 + d.rng() * 0.8; if (d.rng() < 0.3) say(c, CC.pickText(T.browsing, d.rng), 'grey', 1.2); }
          break;
        case 'browse':
          c.moving = false;
          c.timer -= dt;
          if (c.timer <= 0 && c.advice) {
            c.advice = false;
            const ask = SIM().pickAdvice(s, d.rng);
            if (ask) {
              c.ask = ask; c.state = 'ask'; c.patience = CC.CONFIG.advicePatience; c.toward = true;
              if (d.autoAdvice) DAY.answer(d, s, c, d.autoAdvice(ask, s, d.rng));
              break;
            }
          }
          if (c.timer <= 0) {
            const dec = SIM().decide(s, c, d.rng);
            d.decisions.push({ t: d.t, id: c.id, type: c.type, budget: c.budget, dec });
            if (d.decisions.length > 50) d.decisions.shift();
            if (dec.action === 'buy') {
              c.want = dec;
              const vak = SIM().vakOfWine(s, dec.wineId);
              const f = CC.FURNITURE.find(ff => ff.vakken && ff.vakken.includes(vak));
              const spot = CC.shelfSpot(f);
              c.path = route(c, { x: spot.x + (d.rng() - 0.5) * 0.8, y: spot.y });
              c.state = 'toShelf';
            } else if ((c.fatima = SIM().secondChance(s, c, d.rng))) {
              // Fatima grijpt in: tweede kans
              c.want = c.fatima; c.src = 'fatima'; d.log.fatima = (d.log.fatima || 0) + 1;
              const fa = staffOf(d, 'fatima'); if (fa) { say(fa, CC.pickText(CC.TEXT.staff.fatima, d.rng), 'green', 2.2); DAY.pose(fa, 'act1', 2.2, c); }
              const vak = SIM().vakOfWine(s, c.want.wineId);
              const f = CC.FURNITURE.find(ff => ff.vakken && ff.vakken.includes(vak));
              const spot = CC.shelfSpot(f);
              c.path = route(c, { x: spot.x + (d.rng() - 0.5) * 0.8, y: spot.y });
              c.state = 'toShelf';
            } else {
              const reason = dec.reason;
              if (reason === 'soldOut') {
                const w = CC.wineById(dec.wineId);
                if (d.visual && CC.FX) { const v = SIM().vakOfWine(s, dec.wineId); if (v) CC.FX.flashVak(v); }   // A10
                say(c, CC.pickText(T.soldOut, d.rng, { wine: w.name }), 'bord', 2.8);
              } else if (reason === 'tooExpensive') say(c, CC.pickText(T.tooExpensive, d.rng), 'red', 2.6);
              else say(c, CC.pickText(T.nothing, d.rng), 'grey', 2.6);
              SIM().recordLeave(d.log, reason, dec.wineId, c.type);
              leave(c);
            }
          }
          break;
        case 'toShelf':
          if (walk(c, dt)) { c.state = 'grab'; c.timer = 0.5; c.toward = false; }
          break;
        case 'grab':
          c.moving = false;
          c.timer -= dt;
          if (c.timer <= 0) {
            // A10: welke flessen gaan er uit welk vak? (voor de spookfles die zichtbaar uit de kast komt)
            const before = d.visual && CC.FX ? SIM().activeVakIds(s).filter(v => s.vakken[v].wine === c.want.wineId).map(v => [v, s.vakken[v].n]) : [];
            const got = SIM().take(s, c.want.wineId, c.want.qty);
            for (const [v, n0] of before) {
              const n1 = s.vakken[v].n, pos = n1 < n0 && CC.R.vakBottlePos(v);
              if (pos) for (let i = n1; i < n0; i++) { const [bx, by] = pos(i); CC.FX.pluck(bx, by, CC.wineById(c.want.wineId)); }
            }
            if (got <= 0) {
              const w = CC.wineById(c.want.wineId);
              if (d.visual && CC.FX) { const v = SIM().vakOfWine(s, c.want.wineId); if (v) CC.FX.flashVak(v); }
              say(c, CC.pickText(T.soldOut, d.rng, { wine: w.name }), 'bord', 2.8);
              SIM().recordLeave(d.log, 'soldOut', c.want.wineId, c.type);
              leave(c);
            } else {
              c.want.qty = got;
              goCounter(d, c);
            }
          }
          break;
        case 'ask':
          // wacht met een ! op advies; de tijd loopt in echte seconden (ook op 2× en 4×)
          c.moving = false;
          c.patience -= dt / (d.speed || 1);
          if (d.t >= CC.CONFIG.dayLength) c.patience = 0;   // na sluitingstijd wacht niemand meer op advies
          if (c.patience <= 0) {
            const du = SIM().hired(s, 'dubois') ? SIM().duboisAnswer(s, c.ask, d.rng) : undefined;
            if (du !== undefined) {
              // meneer Dubois neemt het over
              const a = staffOf(d, 'dubois'); if (a) { say(a, CC.pickText(CC.TEXT.staff.dubois, d.rng), 'gold', 2.2); DAY.pose(a, 'act2', 2.2, c); }
              const res = DAY.answer(d, s, c, du);
              res.byDubois = true; d.log.advice.dubois = (d.log.advice.dubois || 0) + 1; c.src = 'dubois';
            } else {
              SIM().ignoreAdvice(d.log);
              c.ask = null; c.state = 'browse'; c.timer = 0.4;
              say(c, CC.pickText(CC.TEXT.adviceReply.ignored, d.rng), 'grey', 2.2);
            }
          }
          break;
        case 'toCounter':
          if (walk(c, dt)) { c.state = 'pay'; c.timer = 0.6; c.toward = false; c.face = c.x > c.y ? -1 : 1; }
          break;
        case 'pay':
          c.moving = false;
          c.timer -= dt;
          if (c.timer <= 0) {
            const rev = SIM().paySale(s, d.log, c.want.wineId, c.want.qty, c.want.price, c.type, c.src);
            if (CC.FX && d.visual) {
              const rg = CC.BG && CC.BG.register, [sx, sy] = rg ? [rg.x + rg.w / 2, rg.y + 4] : ((p => [p[0] + 18, p[1] - 30])(CC.R.iso(RM.counter.x, RM.counter.y)));
              CC.FX.coins(sx, sy);
              CC.FX.saleCoin(rev, c.want.qty, sx, sy - 2);   // A10: munt vliegt naar de kas in de HUD
            }
            // bedrag boven de kassa (M7-juice): gouden label dat opstijgt; tegelijke verkopen stapelen
            const stack = d.floats.filter(f => f.cash && f.t > 1.0).length;
            // reputatie (besluit 76) staat in hetzelfde label: "+€13  +1 ★" (los boven de klant botste het met het bedrag)
            const dr = d.log.lastRep || 0;
            d.floats.push({ cash: true, text: '+' + CC.R.euro(rev), rep: dr, x: RM.counter.x - 0.7, y: RM.counter.y - 0.7, t: 1.6, max: 1.6, stack, col: CC.PAL.gold2 });
            if (d.rng() < 0.25) say(c, CC.pickText(T.bought, d.rng), 'green', 1.8);
            c.carry = null; c.bag = true;
            leave(c);
          }
          break;
        case 'leave':
          if (walk(c, dt)) { c.alpha -= dt * 4; if (c.alpha <= 0) c.gone = true; }
          break;
      }
    }
    for (const a of d.staff || []) stepStaff(d, s, a, dt);
    d.customers = d.customers.filter(c => !c.gone);
    for (const f of d.floats) { f.t -= dt; }
    d.floats = d.floats.filter(f => f.t > 0);

    // Einde dag: tijd om en iedereen weg. Na de sluitingstijd lopen blijvers sneller.
    const cfg = CC.CONFIG;
    if (d.t >= cfg.dayLength && d.next >= d.plan.length && d.customers.length === 0) d.done = true;
    if (d.t >= cfg.dayLength + 15) { // noodrem: wie er nog is, handelen we direct af (nooit stil laten verdwijnen)
      for (const c of d.customers) DAY.settle(d, s, c);
      d.customers = []; d.done = true;
    }
  };

  // Een klant direct afhandelen (einde dag): kopen wat hij wil als het er is, anders weg met reden.
  DAY.settle = function (d, s, c) {
    if (c.state === 'leave') return;                  // heeft al een uitkomst
    if (c.state === 'ask') { SIM().ignoreAdvice(d.log); c.ask = null; }
    if (c.state === 'enter' || c.state === 'browse' || c.state === 'ask') {
      const dec = SIM().decide(s, c, d.rng);
      if (dec.action !== 'buy') { SIM().recordLeave(d.log, dec.reason, dec.wineId, c.type); return; }
      c.want = dec;
    }
    if (c.state !== 'toCounter' && c.state !== 'pay') {   // nog niet gepakt
      const got = SIM().take(s, c.want.wineId, c.want.qty);
      if (got <= 0) { SIM().recordLeave(d.log, 'soldOut', c.want.wineId, c.type); return; }
      c.want.qty = got;
    }
    SIM().paySale(s, d.log, c.want.wineId, c.want.qty, c.want.price, c.type, c.src);
  };

  // Personeel tijdens de verkoopdag. Alleen Sem loopt; Fatima en Dubois reageren op klanten (zie hierboven).
  function stepStaff(d, s, a, dt) {
    if (a.bubble) { a.bubble.t -= dt; if (a.bubble.t <= 0) a.bubble = null; }
    if (a.poseT != null) { a.poseT -= dt; if (a.poseT <= 0) { a.pose = null; a.poseT = null; } }
    if (a.staffId !== 'sem') { if (a.poseT == null) DAY.idleStep(a, dt, d.idleRng); else a.moving = false; return; }
    switch (a.state) {
      case 'home':
        a.timer -= dt;
        if (a.timer <= 0) {
          a.timer = 0.5;
          const v = SIM().vakToRefill(s);
          if (v) {
            const f = CC.FURNITURE.find(ff => ff.vakken && ff.vakken.includes(v));
            const spot = CC.shelfSpot(f);
            a.idle = null; a.speedMul = a.baseSpeed;
            a.vak = v; a.path = route(a, { x: spot.x + 0.25, y: spot.y + 0.1 }); a.state = 'toShelf';
            break;
          }
        }
        DAY.idleStep(a, dt, d.idleRng);   // niets bij te vullen: rondslenteren i.p.v. stilstaan
        break;
      case 'toShelf':
        if (walk(a, dt)) { a.state = 'stock'; a.timer = a.stockT = 1.2 / a.speedMul; a.toward = false; }
        break;
      case 'stock':
        a.moving = false; a.timer -= dt;
        a.pose = a.timer > a.stockT * 0.6 ? 'act1' : 'act2';   // D2: fles pakken, dan in het schap zetten
        if (a.timer <= 0) {
          a.pose = null;
          const n = SIM().refillVak(s, a.vak);
          if (n > 0) { d.log.semRefill = (d.log.semRefill || 0) + n; if (d.rng() < 0.4) say(a, CC.pickText(CC.TEXT.staff.sem, d.rng), 'grey', 1.6); }
          const h = CC.STAFF.sem.home;
          a.path = route(a, h); a.state = 'back';
        }
        break;
      case 'back':
        if (walk(a, dt)) { a.state = 'home'; a.timer = 0.3; a.idle = null; }
        break;
    }
  }

  // Personeel dat niets te doen heeft: af en toe een paar stappen, even rondkijken, terug naar de vaste plek
  DAY.idleStep = function (a, dt, rnd) {
    const rand = rnd || Math.random;
    if (!rnd) { if (a.bubble) { a.bubble.t -= dt; if (a.bubble.t <= 0) a.bubble = null; } }
    const home = CC.STAFF[a.staffId].home;
    if (a.talkT != null) a.talkT -= dt;
    if (a.idle == null) { a.idle = 'rest'; a.idleT = 2 + rand() * 4; }
    if (a.idle === 'rest') {
      a.moving = false; a.idleT -= dt;
      if (a.idleT <= 0) {
        a.pose = null;
        const spots = CC.STAFF[a.staffId].spots;
        let tg;
        if (spots && spots.length) {   // D2: tussen vaste plekken, niet twee keer dezelfde
          const pool = spots.filter(p => Math.hypot(p.x - a.x, p.y - a.y) > 0.3);
          tg = pool[Math.floor(rand() * pool.length)] || spots[0];
        } else {
          tg = { x: Math.max(1.0, Math.min(7.2, home.x + (rand() - 0.5) * 2.4)), y: Math.max(1.0, Math.min(7.2, home.y + (rand() - 0.5) * 2.4)) };
        }
        a.path = route(a, tg); a.idle = 'walk'; a.speedMul = 0.55;
      } else if (a.idleT > 1 && !a.pose && CC.STAFF[a.staffId].idlePose && rand() < dt * 0.25) {
        a.pose = CC.STAFF[a.staffId].idlePose;   // D2: even iets doen tijdens het wachten (Dubois poetst een glas)
      }
    } else if (a.idle === 'walk') {
      if (walk(a, dt)) {
        a.idle = 'look'; a.idleT = 1.2 + rand() * 2; a.toward = rand() < 0.6;
        // af en toe iets zeggen (M7b): hooguit eens per ~20 s per persoon, en niet als er al een ballon staat
        const lines = CC.TEXT.staff.idle && CC.TEXT.staff.idle[a.staffId];
        if (lines && !a.bubble && (a.talkT == null || a.talkT <= 0) && rand() < 0.45) {
          a.bubble = { text: CC.pickText(lines, rand), tone: 'grey', t: 2.6 }; a.idleT = Math.max(a.idleT, 2.4); a.talkT = 18 + rand() * 16;
        }
      }
    } else if (a.idle === 'look') {
      a.moving = false; a.idleT -= dt;
      if (a.idleT <= 0) { a.path = route(a, home); a.idle = 'home'; }
    } else if (a.idle === 'home') {
      if (walk(a, dt)) { a.idle = 'rest'; a.idleT = 4 + rand() * 6; a.toward = true; a.speedMul = a.staffId === 'sem' ? a.baseSpeed : 1; }
    }
  };

  // D2: actiebeeld voor even (alleen beeld); kijkt naar wie hij aanspreekt
  DAY.pose = function (a, pose, t, who) {
    a.pose = pose; a.poseT = t; a.moving = false; a.path = []; a.idle = 'look'; a.idleT = t;
    if (who) { const sdx = (who.x - a.x) - (who.y - a.y), sdy = (who.x - a.x) + (who.y - a.y); a.face = sdx >= 0 ? 1 : -1; a.toward = sdy > -0.3; }
  };

  // Alles in één keer doorrekenen (knop 'overslaan')
  DAY.finish = function (d, s) {
    let guard = 0; d.speed = 1;
    while (!d.done && guard++ < 60 * 120) DAY.step(d, s, DAY.STEP);
  };

  CC.DAY = DAY;
})(typeof window !== 'undefined' ? window : globalThis);
