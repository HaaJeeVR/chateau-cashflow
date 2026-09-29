// Acceptatietests D — investeringen (besluit 60). Draaien: node tools/test_invest.js
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  OK    ' : '  FOUT  ') + msg); if (!cond) fails++; };

function shop(seed, level, ups) {
  const s = CC.newState(seed); s.cash = 5000; s.level = level; s.rep = C.levelRep[level - 1]; s.day = 2;
  for (const id of ups || []) s.upgrades[id] = true;
  const ids = S.unlockedWines(s).map(w => w.id);
  S.activeVakIds(s).forEach((v, i) => { if (ids[i]) { S.buy(s, ids[i], 24); S.assignVak(s, v, ids[i]); } });
  return s;
}
function play(s) { const d = DAY.start(s); DAY.finish(d, s); return d.log; }
const sum = (n, f) => { let t = 0; for (let i = 1; i <= n; i++) t += f(i); return t; };

console.log('D-1: vrijspelen is nog niet hebben');
{
  const LK = CC.upgradeById('kast3').lvl, s = shop(1, LK);
  ok(S.activeVakIds(s).length === 4, `niveau ${LK} zonder aankoop: ${S.activeVakIds(s).length} schappen`);
  s.level = LK - 1;
  ok(!S.buyUpgrade(s, 'kast3').ok && S.buyUpgrade(s, 'kast3').reason === 'locked', `derde kast op niveau ${LK - 1}: nog niet te koop`);
  s.level = LK; const c0 = s.cash;
  ok(S.buyUpgrade(s, 'kast3').ok && s.cash === c0 - CC.upgradeById('kast3').cost, `gekocht voor ${CC.R.euro(CC.upgradeById('kast3').cost)}`);
  ok(S.activeVakIds(s).length === 6, 'daarna 6 schappen');
  ok(S.buyUpgrade(s, 'kast3').reason === 'owned', 'geen dubbele aankoop');
  const poor = shop(2, CC.upgradeById('uithangbord').lvl); poor.cash = 50;
  ok(S.buyUpgrade(poor, 'uithangbord').reason === 'cash', 'te weinig kas: kan niet');
}

console.log('D-2: kassabon houdt investering apart');
{
  const s = shop(3, CC.upgradeById('koeling').lvl); s.dayBuy = 0; s.dayInvest = 0;
  S.buyUpgrade(s, 'koeling');
  const log = play(s); const sm = S.endDay(s, log);
  ok(sm.invest === CC.upgradeById('koeling').cost && sm.bought === 0, `investering ${CC.R.euro(sm.invest)} apart van inkoop`);
  ok(Math.abs(sm.cashflow - (sm.revenue + sm.tips - sm.bought - sm.invest - sm.rent - sm.wages)) < 0.01, 'kasstroom rekent de investering mee');
  ok(sm.profit === sm.revenue - sm.cogs + sm.tips - sm.rent - sm.wages, 'winst niet (investering is geen kosten van de dag)');
  ok(!s.dayInvest, 'volgende dag weer op 0');
}

console.log('D-3: effecten');
{
  const s0 = shop(4, CC.upgradeById('vitrine').lvl); S.buyUpgrade(s0, 'vitrine');
  ok(s0.vitrine && S.onShelf(s0, s0.vitrine) > 0, `vitrine kiest meteen een wijn van het schap (${s0.vitrine && CC.wineById(s0.vitrine).name})`);
  const pick = s0.vitrine;
  const a = sum(20, i => play(shop(i, 2)).perWine[pick] || 0);
  const b = sum(20, i => { const s = shop(i, 2, ['vitrine']); s.vitrine = pick; return play(s).perWine[pick] || 0; });
  ok(b > a * 1.2, `vitrine: ${CC.wineById(pick).name} verkocht ${a} → ${b}`);
  const e = shop(5, 2, ['vitrine']); e.vitrine = pick; const vk = S.vakOfWine(e, pick); e.vakken[vk].n = 0;
  ok(S.upgradeBonus(e, CC.wineById(pick)) === 0, 'lege vitrine: geen bonus');
  const c0 = sum(20, i => play(shop(i, 4)).customers), c1 = sum(20, i => play(shop(i, 4, ['uithangbord'])).customers);
  ok(c1 - c0 === 20 * CC.upgradeById('uithangbord').cust, `uithangbord: klanten ${c0} → ${c1}`);
  const w0 = sum(20, i => { const l = play(shop(i, 3)); return Object.keys(l.perWine).filter(id => ['wit', 'bubbels', 'rosé'].includes(CC.roleById(CC.wineById(id).role).kind)).reduce((t, id) => t + l.perWine[id], 0); });
  const w1 = sum(20, i => { const l = play(shop(i, 3, ['koeling'])); return Object.keys(l.perWine).filter(id => ['wit', 'bubbels', 'rosé'].includes(CC.roleById(CC.wineById(id).role).kind)).reduce((t, id) => t + l.perWine[id], 0); });
  ok(w1 > w0, `koeling: wit/rosé/bubbels ${w0} → ${w1}`);
}

console.log('I-3: zichtbaar wat investeringen opleveren (besluit 72)');
{
  const k0 = sum(20, i => play(shop(i, 5)).customers), k1 = sum(20, i => play(shop(i, 5, ['kast3', 'kast4'])).customers);
  ok(k1 - k0 === 20 * (CC.upgradeById('kast3').cust + CC.upgradeById('kast4').cust), `kasten trekken klanten: ${k0} → ${k1}`);
  let okSrc = true, buyers = 0, margin = 0;
  for (let i = 0; i < 20; i++) {
    const s = shop(i, 5, ['uithangbord', 'kast3']); const parts = S.customerParts(s, S.dayRng(s)); const l = play(s); const u = (l.src || {}).upg || { n: 0, buyers: 0, margin: 0 };
    if (u.n !== parts.upg || u.buyers > u.n) okSrc = false; buyers += u.buyers; margin += u.margin;
  }
  ok(okSrc && buyers > 0 && margin > 0, `extra klanten gemarkeerd en geteld op de bon (${buyers} kopers, marge €${Math.round(margin)} in 20 dagen)`);
}

console.log(fails ? `\n${fails} test(s) fout.` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
