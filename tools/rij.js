// 20_HANDOFF taak 3, eerst meten: hoe lang staat een klant stil in de rij voor de kassa?
// Stilstaan = in toestand 'toCounter' na aankomst op zijn plek (niet meer lopend) plus de toestand 'pay'.
// Per niveau 20 dagen (winkel als tools/prijzen.js, prijzen van de alles-bot), gemeten in spelseconden met de
// echte stapgrootte. Drempel uit de handoff: op niveau 8 wacht minstens één op de tien klanten langer dan 3 s.
// Draaien: node tools/rij.js [dagen=20] [niveaus=3,5,8]
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
const DAYS = +process.argv[2] || 20;
const LEVELS = (process.argv[3] || '3,5,8').split(',').map(Number);

function shop(seed, level) {
  const s = CC.newState(seed); s.cash = 9000; s.level = level; s.rep = C.levelRep[level - 1];
  s.week = 3; s.day = 1 + (seed % 6); s.mishap = null; s.card = null;
  s.upgrades = {}; if (level >= 4) s.upgrades.kast3 = true; if (level >= 8) s.upgrades.kast4 = true;
  s.staff = {}; if (level >= 2) s.staff.sem = { xp: 0, level: 2 }; if (level >= 5) s.staff.fatima = { xp: 0, level: 2 };
  const vak = S.activeVakIds(s), n = vak.length, un = S.unlockedWines(s);
  const pop = un.slice().sort((a, b) => CC.roleById(b.role).pop - CC.roleById(a.role).pop || CC.wineCost(a) - CC.wineCost(b));
  const pre = un.slice().sort((a, b) => CC.roleById(b.role).prest - CC.roleById(a.role).prest || CC.wineCost(b) - CC.wineCost(a));
  const pick = [];
  for (const w of pop) { if (pick.length >= Math.ceil(n / 2)) break; pick.push(w); }
  for (const w of pre) { if (pick.length >= n) break; if (!pick.includes(w)) pick.push(w); }
  for (const w of un) { if (pick.length >= n) break; if (!pick.includes(w)) pick.push(w); }
  pick.forEach((w, i) => { S.buy(s, w.id, 24); S.assignVak(s, vak[i], w.id); });
  for (const w of pick) S.setPrice(s, w.id, s.level >= 3 && (CC.roleById(w.role).prest >= 3 || (w.stijl || []).includes('stevig')) ? 'stevig' : 'normaal');
  return s;
}
const q = (a, p) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
console.log(`Rij voor de kassa: ${DAYS} dagen per niveau, stilstaan in spelseconden (toCounter na aankomst + pay)\n`);
console.log('niveau  kopers/dag  mediaan  p90   langste  >3 s per dag  aandeel >3 s  rij tegelijk (max)');
for (const L of LEVELS) {
  const waits = []; let over = 0, buyers = 0, maxQ = 0;
  for (let i = 0; i < DAYS; i++) {
    const s = shop(7000 + L * 100 + i, L), d = DAY.start(s), W = new Map();
    let guard = 0;
    while (!d.done && guard++ < 60 * 120) {
      DAY.step(d, s, DAY.STEP);
      let inQ = 0;
      for (const c of d.customers) {
        const still = (c.state === 'toCounter' && !c.moving && !c.path.length) || c.state === 'pay';
        if (c.state === 'toCounter' || c.state === 'pay') inQ++;
        if (still) W.set(c.id, (W.get(c.id) || 0) + DAY.STEP);
        if (c.state === 'leave' && W.has(c.id) && !W.get(c.id + ':done')) W.set(c.id + ':done', true);
      }
      maxQ = Math.max(maxQ, inQ);
    }
    for (const [k, v] of W) if (typeof k === 'number') { waits.push(v); buyers++; if (v > 3) over++; }
  }
  console.log(`${String(L).padStart(6)}  ${(buyers / DAYS).toFixed(1).padStart(10)}  ${q(waits, 0.5).toFixed(2).padStart(7)}  ${q(waits, 0.9).toFixed(2).padStart(4)}  ${Math.max(0, ...waits).toFixed(2).padStart(7)}  ${(over / DAYS).toFixed(1).padStart(12)}  ${(buyers ? (100 * over / buyers).toFixed(1) + '%' : '-').padStart(12)}  ${String(maxQ).padStart(18)}`);
}
