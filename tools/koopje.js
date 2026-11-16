// 20_HANDOFF taak 1: misleidt de groene ballon ("dit had meer mogen kosten")?
// Per niveau 300 dagen in een winkel als tools/prijzen.js, met de prijzen van de alles-bot (stevig op prestige 3+ of een
// stevige rode vanaf niveau 3, aanbieding op de duurste populaire wijn die op normaal staat). Per wijn waar de teller
// log.wines[id].room op die dag ≥ DREMPEL was: speel dezelfde dag na (zelfde klanten, zelfde toeval) met die wijn op
// Stevig. Leverde dat echt meer dagmarge op? Doel: in minstens 70 % van de gevallen ja.
// Draaien: node tools/koopje.js [dagen=300] [niveaus=3,5,8] [drempel=3]   ·   PRIJS=normaal: alle wijnen op normaal
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
const DAYS = +process.argv[2] || 300;
const LEVELS = (process.argv[3] || '3,5,8').split(',').map(Number);
const MIN = +process.argv[4] || 3;

// zelfde winkel als tools/prijzen.js
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
  if (process.env.PRIJS === 'normaal') return s;   // ter vergelijking: alles op normaal (zoals de nooit-bot, zonder aanbieding)
  // prijzen van de alles-bot (tools/balance.js: stevig + offer 'heur')
  for (const w of pick) S.setPrice(s, w.id, s.level >= 3 && (CC.roleById(w.role).prest >= 3 || (w.stijl || []).includes('stevig')) ? 'stevig' : 'normaal');
  const of = pick.filter(w => CC.roleById(w.role).pop >= 3 && s.prices[w.id] === 'normaal')
    .sort((a, b) => CC.roleById(b.role).pop - CC.roleById(a.role).pop || CC.wineCost(b) - CC.wineCost(a))[0];
  if (of) S.setPrice(s, of.id, 'aanbieding');
  return s;
}
const clone = o => JSON.parse(JSON.stringify(o));
function play(snap, change) {
  const t = clone(snap); if (change) S.setPrice(t, change, 'stevig');
  const d = DAY.start(t); DAY.finish(d, t); return d.log;
}
const sh = id => id.replace('wine_', '');
console.log(`Groene ballon: ${DAYS} dagen per niveau, wijnen met ≥ ${MIN} "had ook stevig betaald" op een dag; Stevig nagespeeld met dezelfde klanten.\n`);
console.log('niveau  gevallen  stevig beter  aandeel  marge-verschil (gem)  ballon-kandidaten/dag  per wijn (beter/gevallen)');
let allN = 0, allOk = 0;
for (const L of LEVELS) {
  let n = 0, ok = 0, diff = 0, roomSum = 0; const per = {};
  for (let i = 0; i < DAYS; i++) {
    const snap = shop(5000 + i * 7, L);
    const base = play(snap, null), m0 = base.revenue - base.cogs;
    for (const id in base.wines) roomSum += base.wines[id].room || 0;
    for (const id in base.wines) {
      if ((base.wines[id].room || 0) < MIN) continue;
      const alt = play(snap, id), m1 = alt.revenue - alt.cogs;
      n++; diff += m1 - m0; if (m1 > m0) ok++;
      const p = per[id] = per[id] || [0, 0]; p[1]++; if (m1 > m0) p[0]++;
    }
  }
  allN += n; allOk += ok;
  console.log(`${String(L).padStart(6)}  ${String(n).padStart(8)}  ${String(ok).padStart(12)}  ${(n ? Math.round(100 * ok / n) + '%' : '-').padStart(7)}  ${('€' + (n ? (diff / n).toFixed(1) : '0')).padStart(20)}  ${(roomSum / DAYS).toFixed(1).padStart(21)}  ${Object.keys(per).map(id => `${sh(id)} ${per[id][0]}/${per[id][1]}`).join(', ')}`);
}
console.log(`\nTotaal: ${allOk}/${allN} = ${allN ? Math.round(100 * allOk / allN) : 0}% (doel ≥ 70%)`);
