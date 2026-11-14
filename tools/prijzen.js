// Prijzen meten (14_PRIJZEN §4): marge per dag onder verschillende prijskeuzes, per niveau, zelfde klanten.
// Gebruik: node tools/prijzen.js [runs=300] [niveaus=1-8]   (één proces per niveau: LEVEL=3 node tools/prijzen.js 300)
// Winkel per niveau: kasten volgens niveau (kast 3 vanaf 4, kast 4 vanaf 8), Sem vanaf 2 en Fatima vanaf 5, geen kaarten,
// schappen half op populariteit, half op prestige gevuld, 12 per vak. Marge = omzet − inkoopwaarde verkocht.
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
// OVR='{"cfg":{"offerAppeal":0.5},"types":{"buurt":{"sens":2}}}' om af te stellen zonder config.js te wijzigen
if (process.env.OVR) { const o = JSON.parse(process.env.OVR); Object.assign(C, o.cfg || {}); if (o.offer) Object.assign(C.offer, o.offer); for (const k in o.types || {}) Object.assign(CC.CUSTOMER_TYPES[k], o.types[k]); }
const RUNS = +process.argv[2] || 300;
const LV = (process.env.LEVEL || process.argv[3] || '1-8').split('-').map(Number);
const STANDS = C.priceStands.map(x => x.id);
const LOW = STANDS[0];   // scherp / aanbieding

function shop(seed, level) {
  const s = CC.newState(seed); s.cash = 9000; s.level = level; s.rep = C.levelRep[level - 1];
  s.week = 3; s.day = 1 + (seed % 6); s.mishap = null; s.card = null;
  s.upgrades = {}; if (level >= 4) s.upgrades.kast3 = true; if (level >= 8) s.upgrades.kast4 = true;
  // personeel zoals de alles-bot: Sem vanaf 2 (vult bij), Fatima vanaf 5
  s.staff = {}; if (level >= 2) s.staff.sem = { xp: 0, level: 2 }; if (level >= 5) s.staff.fatima = { xp: 0, level: 2 };
  const vak = S.activeVakIds(s), n = vak.length;
  const un = S.unlockedWines(s);
  const pop = un.slice().sort((a, b) => CC.roleById(b.role).pop - CC.roleById(a.role).pop || CC.wineCost(a) - CC.wineCost(b));
  const pre = un.slice().sort((a, b) => CC.roleById(b.role).prest - CC.roleById(a.role).prest || CC.wineCost(b) - CC.wineCost(a));
  const pick = [];
  for (const w of pop) { if (pick.length >= Math.ceil(n / 2)) break; pick.push(w); }
  for (const w of pre) { if (pick.length >= n) break; if (!pick.includes(w)) pick.push(w); }
  for (const w of un) { if (pick.length >= n) break; if (!pick.includes(w)) pick.push(w); }
  pick.forEach((w, i) => { S.buy(s, w.id, 24); S.assignVak(s, vak[i], w.id); });
  return s;
}
const clone = s => JSON.parse(JSON.stringify(s));
function day(base, prices) {
  const s = clone(base); for (const id in prices) S.setPrice ? S.setPrice(s, id, prices[id]) : (s.prices[id] = prices[id]);
  const d = DAY.start(s); DAY.finish(d, s); return d.log.revenue - d.log.cogs;
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const pct = (a, b) => (100 * (a - b) / b).toFixed(1) + '%';
for (let L = LV[0]; L <= (LV[1] || LV[0]); L++) {
  const bases = []; for (let i = 0; i < RUNS; i++) bases.push(shop(5000 + i * 7, L));
  const ids = S.listed(bases[0]).map(l => l.wine.id);
  const all = st => Object.fromEntries(ids.map(id => [id, st]));
  const N = bases.map(b => day(b, all('normaal')));
  const one = (id, st) => bases.map(b => day(b, { ...all('normaal'), [id]: st }));
  const per = {};
  for (const id of ids) per[id] = { [LOW]: mean(one(id, LOW)), stevig: mean(one(id, 'stevig')) };
  const mN = mean(N);
  const offers = ids.map(id => [id, per[id][LOW]]).sort((a, b) => b[1] - a[1]);
  const right = ids.filter(id => per[id].stevig > mN);
  const SA = mean(bases.map(b => day(b, all('stevig'))));
  const SR = right.length ? mean(bases.map(b => day(b, { ...all('normaal'), ...Object.fromEntries(right.map(id => [id, 'stevig'])) }))) : mN;
  const prest3 = ids.filter(id => CC.roleById(CC.wineById(id).role).prest >= 3);
  const SP = prest3.length ? mean(bases.map(b => day(b, { ...all('normaal'), ...Object.fromEntries(prest3.map(id => [id, 'stevig'])) }))) : mN;
  const bestStand = ids.map(id => { const o = { normaal: mN, [LOW]: per[id][LOW], stevig: per[id].stevig }; return [id, Object.keys(o).reduce((a, k) => (o[k] > o[a] ? k : a), 'normaal')]; });
  const sh = id => id.replace('wine_', '');
  console.log(`niveau ${L}  normaal €${mN.toFixed(0)}  | beste ${LOW} ${sh(offers[0][0])} ${pct(offers[0][1], mN)} · slechtste ${sh(offers[offers.length - 1][0])} ${pct(offers[offers.length - 1][1], mN)}` +
    `  | stevig alles ${pct(SA, mN)} · stevig juist [${right.map(sh).join(',')}] ${pct(SR, mN)} · stevig prest≥3 ${pct(SP, mN)}` +
    (process.env.DETAIL ? '  | aanb: ' + offers.map(([id, v]) => sh(id) + ' ' + pct(v, mN)).join(' ') + ' | stevig: ' + ids.map(id => sh(id) + ' ' + pct(per[id].stevig, mN)).join(' ') : '') +
    `  | beste stand per wijn (los): ${bestStand.map(([id, st]) => sh(id) + '=' + st.slice(0, 3)).join(' ')}` +
    // met maar één aanbieding: normaal is de beste stand voor elke wijn die niet stevig hoort en niet de beste aanbieding is
    `  · normaal beste bij ${ids.filter(id => !right.includes(id) && id !== offers[0][0]).length} (${ids.filter(id => !right.includes(id) && id !== offers[0][0]).map(sh).join(',')})`);
}
