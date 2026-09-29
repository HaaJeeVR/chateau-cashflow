// Acceptatietests M1 (03_BOUWPLAN §4). Draaien: node tools/test_m1.js
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }

console.log('M1-1: inkopen en schap vullen');
{
  const s = CC.newState(1);
  const r = S.buy(s, 'wine_merlot', 12);
  check('kas daalt met €36', s.cash === CC.CONFIG.startCash - 36, 'kas ' + s.cash);
  S.assignVak(s, 'vak_1', 'wine_merlot');
  check('12 flessen in vak 1', s.vakken.vak_1.n === 12);
  check('magazijn leeg', (s.stock.wine_merlot || 0) === 0);
  const r2 = S.buy(s, 'wine_rioja', 1000);
  check('te weinig kas → geweigerd', !r2.ok && s.cash === CC.CONFIG.startCash - 36);
}

console.log('M1-2: verkoopdag verkoopt echt uit het schap');
{
  const s = CC.newState(7);
  ['wine_merlot', 'wine_sauvignon', 'wine_provence', 'wine_rioja'].forEach((w, i) => { S.buy(s, w, 12); S.assignVak(s, 'vak_' + (i + 1), w); });
  const cash0 = s.cash; const shelf0 = S.listed(s).reduce((a, l) => a + l.n, 0);
  const d = DAY.start(s); DAY.finish(d, s);
  const shelf1 = S.listed(s).reduce((a, l) => a + l.n, 0);
  check('dag eindigt', d.done);
  check('verkochte flessen = weg uit schap', shelf0 - shelf1 === d.log.bottles, `${shelf0}-${shelf1} vs ${d.log.bottles}`);
  check('kas stijgt met omzet', Math.abs(s.cash - cash0 - d.log.revenue) < 1e-9, 'omzet ' + d.log.revenue);
  check('elke klant koopt of vertrekt met reden', d.log.customers === d.log.buyers + d.log.soldOut + d.log.tooExpensive + d.log.nothing,
    JSON.stringify({ c: d.log.customers, b: d.log.buyers, so: d.log.soldOut, te: d.log.tooExpensive, n: d.log.nothing }));
}

console.log('M1-3: lege wijn → uitverkocht');
{
  const s = CC.newState(3);
  S.buy(s, 'wine_merlot', 2); S.assignVak(s, 'vak_1', 'wine_merlot');
  const d = DAY.start(s); DAY.finish(d, s);
  check('uitverkocht geteld', d.log.soldOut > 0, 'uitverkocht ' + d.log.soldOut);
  check('niet meer verkocht dan er was', d.log.bottles <= 2);
}

console.log('M1-4: deterministisch (zelfde seed = zelfde dag, ook bij overslaan)');
{
  const mk = () => { const s = CC.newState(99); ['wine_merlot', 'wine_sauvignon'].forEach((w, i) => { S.buy(s, w, 12); S.assignVak(s, 'vak_' + (i + 1), w); }); return s; };
  const a = mk(), b = mk();
  const da = DAY.start(a); DAY.finish(da, a);
  const db = DAY.start(b); let n = 0; while (!db.done && n++ < 100000) DAY.step(db, b, DAY.STEP);
  check('zelfde omzet', da.log.revenue === db.log.revenue, da.log.revenue + ' / ' + db.log.revenue);
}

console.log('M1-5: prijsstanden');
{
  const w = CC.wineById('wine_merlot');
  check('normaal = €5', CC.priceFor(w, 'normaal') === 5);
  check('woeker = €8', CC.priceFor(w, 'woeker') === 8);
}

console.log(fails ? `\n${fails} FOUT(EN)` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
