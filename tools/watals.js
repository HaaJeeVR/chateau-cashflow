// Review 3: hoe betrouwbaar is de wat-als-regel? Draaien: node tools/watals.js [dagen=120] [andere=40] [niveaus=1,3,5,8]
// Per niveau: winkels met een willekeurige prijsmix; per dag DAY.whatIf. Komt er een regel, dan wordt die ene
// wijziging doorgerekend op 40 andere dagen (andere klanten en ander toeval, zelfde winkel), met de echte stapgrootte.
// Uitkomst: genoemd bedrag tegenover de echte opbrengst, hoe vaak het advies klopt (echte opbrengst > 0), en de rekentijd.
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
const DAYS = +process.argv[2] || 120, OTHER = +process.argv[3] || 40;
const LEVELS = (process.argv[4] || '1,3,5,8').split(',').map(Number);
let seedRng = CC.makeRng({ rng: 4242 });
function shop(seed, level) {
  const s = CC.newState(seed); s.cash = 9000; s.level = level; s.rep = C.levelRep[level - 1];
  s.week = 2 + (seed % 5); s.day = seed % 6; s.mishap = null; s.card = null;
  s.upgrades = {}; if (level >= 4) s.upgrades.kast3 = true; if (level >= 8) s.upgrades.kast4 = true;
  s.staff = {}; if (level >= 2) s.staff.sem = { xp: 0, level: 2 }; if (level >= 5) s.staff.fatima = { xp: 0, level: 2 };
  const vak = S.activeVakIds(s), un = S.unlockedWines(s).slice();
  for (let i = un.length - 1; i > 0; i--) { const j = Math.floor(seedRng() * (i + 1)); [un[i], un[j]] = [un[j], un[i]]; }
  vak.forEach((v, i) => { const w = un[i]; if (w) { S.buy(s, w.id, 24); S.assignVak(s, v, w.id); } });
  for (const L of S.listed(s)) S.setPrice(s, L.wine.id, seedRng() < 0.3 ? 'stevig' : 'normaal');
  if (seedRng() < 0.4) { const L = S.listed(s); S.setPrice(s, L[Math.floor(seedRng() * L.length)].wine.id, 'aanbieding'); }
  return s;
}
const clone = o => JSON.parse(JSON.stringify(o));
function realDay(snap, k, change) {   // echte stapgrootte, andere klanten en ander toeval
  const t = clone(snap); t.seed = (snap.seed + 7919 * (k + 101)) >>> 0; t.rng = (snap.rng + 104729 * (k + 101)) >>> 0;
  if (change) S.setPrice(t, change.wine, change.to);
  const d = DAY.start(t); DAY.finish(d, t); return d.log.revenue - d.log.cogs;
}
console.log(`wat-als: ${DAYS} dagen per niveau, wijziging doorgerekend op ${OTHER} andere dagen`);
console.log('niv  regels  genoemd(gem)  echt(gem)  echt/genoemd  advies klopt  tijd gem/max (ms)');
for (const L of LEVELS) {
  let rules = 0, said = 0, real = 0, right = 0, tSum = 0, tMax = 0;
  for (let i = 0; i < DAYS; i++) {
    const s = shop(10000 + L * 1000 + i, L), snap = clone(s);
    const t0 = Date.now(); const wi = DAY.whatIf(snap); const dt = Date.now() - t0;
    tSum += dt; tMax = Math.max(tMax, dt);
    if (!wi || wi.none) continue;
    rules++; said += wi.diff;
    let r = 0; for (let k = 0; k < OTHER; k++) r += realDay(snap, k, wi) - realDay(snap, k, null);
    r /= OTHER; real += r; if (r > 0) right++;
  }
  const pct = (a, b) => (b ? Math.round(100 * a / b) + '%' : '-');
  console.log(`${String(L).padStart(3)}  ${String(rules).padStart(6)}  ${('€' + (rules ? (said / rules).toFixed(1) : 0)).padStart(12)}  ${('€' + (rules ? (real / rules).toFixed(1) : 0)).padStart(9)}  ${pct(real, said).padStart(12)}  ${pct(right, rules).padStart(12)}  ${(tSum / DAYS).toFixed(0)}/${tMax}`);
}
