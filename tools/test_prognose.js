// Tests klantprognose + vaste bestelling (besluit 57). Draaien: node tools/test_prognose.js
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY;
let fails = 0;
const ok = (c, m) => { console.log((c ? '  OK    ' : '  FOUT  ') + m); if (!c) fails++; };

console.log('P-1: de prognose klopt precies met de dag');
{
  let bad = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = CC.newState(seed); s.level = 1 + (seed % 6); s.day = seed % 6; s.week = 1 + (seed % 5);
    S.setTarget(s, 'wine_merlot', 12);
    const fc = S.forecast(s);
    const d = DAY.start(s); DAY.finish(d, s);
    const real = {}; for (const p of d.plan) real[p.type] = (real[p.type] || 0) + 1;
    if (JSON.stringify(Object.entries(real).sort()) !== JSON.stringify(Object.entries(fc.counts).sort())) bad++;
  }
  ok(bad === 0, `40 dagen: prognose = werkelijkheid (${bad} afwijkingen)`);
  const s = CC.newState(3); const a = S.forecast(s); s.rng = 12345; const b = S.forecast(s);
  ok(JSON.stringify(a) === JSON.stringify(b), 'kijken of bestellen verandert de prognose niet');
  s.staff = { sem: { xp: 0, level: 1 } }; const c = S.forecast(s);
  ok(c.total === a.total + CC.CONFIG.semCustomers[0], `Sem aannemen: prognose ${a.total} → ${c.total} klanten`);
}

console.log('P-2: vaste bestelling');
{
  const s = CC.newState(4); const cash = s.cash;
  S.setTarget(s, 'wine_merlot', 12);
  ok(S.totalBottles(s, 'wine_merlot') === 12 && s.cash === cash - 36, 'doel 12: direct 12 Merlot gekocht (€36)');
  ok(S.vakOfWine(s, 'wine_merlot') === 'vak_1', 'en meteen in het eerste lege schap gezet');
  S.take(s, 'wine_merlot', 7);
  const r = S.autoOrder(s);
  ok(r.deliveries.length === 1 && r.deliveries[0].n === 7 && S.totalBottles(s, 'wine_merlot') === 12, 'ochtend: 7 verkocht → 7 aangevuld');
  S.setTarget(s, 'wine_merlot', 6);
  ok(S.totalBottles(s, 'wine_merlot') === 12, 'doel omlaag: niets terugverkocht');
  s.cash = 10; S.setTarget(s, 'wine_sauvignon', 12);
  ok(S.totalBottles(s, 'wine_sauvignon') === 2, 'te weinig kas: zoveel als kan (2 flessen)');
  const r2 = S.autoOrder(s);
  ok(r2.short.includes('wine_sauvignon'), 'en de levering meldt wat er te kort is');
}
console.log(fails ? `\n${fails} test(s) fout.` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
