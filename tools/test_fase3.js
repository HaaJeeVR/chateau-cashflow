// Tests fase 3 (besluit 75+): avondinzicht en niveaus. Draaien: node tools/test_fase3.js
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }
const sm = (wines, extra) => Object.assign({ customers: 20, wines, stands: Object.fromEntries(Object.keys(wines).map(id => [id, 'normaal'])), types: {} }, extra || {});
const W = (sold, soldOut, tooExpensive) => ({ sold, rev: sold * 5, margin: sold * 2, soldOut: soldOut || 0, tooExpensive: tooExpensive || 0 });

console.log('F3-1: avondinzicht');
{
  const s = CC.newState(1);
  let i = S.insight(s, sm({ wine_merlot: W(10, 6), wine_rioja: W(3, 0, 2) }));
  check('uitverkocht weegt het zwaarst', i && i.key === 'soldOut' && i.wine === 'wine_merlot' && i.tab === 'order', JSON.stringify(i));
  i = S.insight(s, sm({ wine_merlot: W(10), wine_chablis: W(1, 0, 5) }));
  check('te duur → naar prijzen', i && i.key === 'tooExpensive' && i.wine === 'wine_chablis' && i.tab === 'prices', JSON.stringify(i));
  i = S.insight(s, sm({ wine_merlot: W(10), wine_rioja: W(4) }));
  check('niets mis → de topper van de dag', i && i.key === 'best' && i.wine === 'wine_merlot');
  check('lege dag → geen inzicht', S.insight(s, { customers: 0 }) === null);
  i = S.insight(s, sm({ wine_merlot: W(10), wine_rioja: W(4) }, { types: { buurt: { n: 12, nothing: 6 } } }));
  check('veel klanten vonden niets → assortiment', i && i.key === 'nothing' && i.type === 'buurt', JSON.stringify(i));
  // en in een echte dag: er komt altijd een zin uit
  let ok = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const t = CC.newState(seed); ['wine_merlot', 'wine_sauvignon', 'wine_provence', 'wine_rioja'].forEach((w, k) => { S.buy(t, w, k === 0 ? 3 : 12); S.assignVak(t, 'vak_' + (k + 1), w); });
    const d = CC.DAY.start(t); CC.DAY.finish(d, t); const r = S.endDay(t, d.log);
    if (S.insight(t, r)) ok++;
  }
  check('elke echte dag levert een inzicht', ok === 20, ok + '/20');
}

console.log('F3-2: niveaus: één hoofdprijs en één bijprijs, klopt met wat er vrijkomt');
{
  for (let L = 2; L <= 8; L++) {
    const lv = CC.LEVELS[L], u = S.unlocksFor(L);
    const want = [].concat(lv.main, lv.side).map(r => r.wine || r.type || r.staff || r.upgrade).sort().join(',');
    const got = [].concat(u.wines.map(w => w.id), u.upgrades.map(x => x.id), u.staff, Object.keys(CC.CUSTOMER_TYPES).filter(k => CC.CUSTOMER_TYPES[k].minLevel === L)).sort().join(',');
    check(`niveau ${L}: ${want}`, want === got, got);
  }
  check('elk niveau heeft een klus', [1, 2, 3, 4, 5, 6, 7, 8].every(L => CC.LEVELS[L].klus && CC.TEXT.klus[L]));
}

console.log('F3-3: klus en reputatie');
{
  const s = CC.newState(4); s.level = 2; s.klussen = [{ lvl: 2, n: 0 }];
  const log = S.newDayLog(); log.perWine = { wine_cremant: 7 };
  let r = S.klusDay(s, log, {})[0]; check('Crémant telt mee', r.n === 7 && !r.now);
  const rep0 = s.rep; log.perWine = { wine_cremant: 9 };
  r = S.klusDay(s, log, {})[0]; check(`gehaald: +${CC.LEVELS[2].klus.rep} reputatie`, r.now && s.rep === rep0 + CC.LEVELS[2].klus.rep && log.repParts.klus === CC.LEVELS[2].klus.rep);
  check('gehaalde klus gaat van de lijst', s.klussen.length === 0 && S.klusDay(s, log, {}).length === 0 && s.rep === rep0 + CC.LEVELS[2].klus.rep);
  const v = CC.newState(4); v.level = 4; v.klussen = [{ lvl: 4, n: 0 }];
  const l2 = S.newDayLog(); l2.perWine = { a: 1, b: 2, c: 1 }; S.klusDay(v, l2, {}); S.klusDay(v, l2, {});
  check('verschillende wijnen: telt per dag, niet opgeteld', v.klussen[0].n === 3, v.klussen[0].n);
  const q = CC.newState(4); q.level = 3; q.klussen = [{ lvl: 3, n: 2 }]; S.klusAdd(q, 4, 5);
  check('nieuw niveau: oude klus blijft, nieuwe erbij', q.klussen.map(k => k.lvl).join(',') === '3,4,5');
  // reputatie-uitsplitsing telt op tot de reputatie van de dag
  let okSum = true;
  for (let seed = 1; seed <= 15; seed++) {
    const t2 = CC.newState(seed); t2.level = 3; ['wine_merlot', 'wine_sauvignon', 'wine_gewurz', 'wine_rioja'].forEach((w, k) => { S.buy(t2, w, 12); S.assignVak(t2, 'vak_' + (k + 1), w); });
    const d = CC.DAY.start(t2); d.autoAdvice = (ask) => ask.opts[0] || null; CC.DAY.finish(d, t2); const sm2 = S.endDay(t2, d.log);
    const parts = Object.values(sm2.repParts).reduce((a2, b2) => a2 + b2, 0);
    if (Math.abs(parts - sm2.rep) > 1e-6) okSum = false;
  }
  check('verkoop + prestige + advies + klus = reputatie van de dag', okSum);
}

console.log('F3-4: failliet: wat ging er mis, en de bankier');
{
  const s = CC.newState(8); s.week = 3; s.level = 3;
  ['wine_merlot', 'wine_sauvignon', 'wine_gewurz', 'wine_rioja'].forEach((w, k) => { S.buy(s, w, k ? 18 : 3); S.assignVak(s, 'vak_' + (k + 1), w); });
  for (let d = 0; d < 6; d++) { s.day = d; const dd = CC.DAY.start(s); CC.DAY.finish(dd, s); S.endDay(s, dd.log); }
  s.day = 6; s.cash = 50; const due = S.weekDue(s); S.bankrupt(s);
  const pm = S.postmortem(s);
  check('tekort en termijn kloppen', pm.due === due && pm.short === due - 50, JSON.stringify({ due: pm.due, short: pm.short }));
  check('precies twee regels, zwaarste eerst', pm.lines.length === 2 && pm.lines[0].loss >= pm.lines[1].loss, pm.lines.map(l => l.key).join(','));
  check('elke regel heeft een tekst', pm.lines.every(l => CC.TEXT.postmortem[l.key]));
  const B = CC.TEXT.bank;
  check('bankier heeft genoeg variatie', B.ok.length >= 6 && B.tight.length >= 5 && B.short.length >= 4 && B.paid.length >= 5 && B.bankrupt.length >= 3 && B.postponeOffer.length >= 3);
}

console.log('F3-5: failliet-analyse noemt de echte oorzaak (A2, handoff na review 2)');
{
  // alles op "stevig", geen advies, elke ochtend Ronnies voorstel tot 12: de prijs moet bovenaan staan
  const s = CC.newState(4); const ids = ['wine_merlot', 'wine_sauvignon', 'wine_provence', 'wine_rioja'];
  ids.forEach((w, k) => { s.prices[w] = 'stevig'; s.targets[w] = 12; S.assignVak(s, 'vak_' + (k + 1), w); });
  let guard = 0;
  while (s.status === 'playing' && guard++ < 20) {
    for (s.day = 0; s.day < CC.CONFIG.daysPerWeek; s.day++) {
      S.refill(s); S.placeOrder(s, S.orderProposal(s));
      S.unlockedWines(s).forEach(w => { s.prices[w.id] = 'stevig'; });
      const d = CC.DAY.start(s); CC.DAY.finish(d, s); S.endDay(s, d.log);
    }
    const r = S.payWeek(s);
    if (!r.ok && !S.postpone(s).ok) { S.bankrupt(s); break; }
    if (r.won) break;
    S.startWeek(s); s.mishap = null; s.card = null;
  }
  const pm = s.status === 'bankrupt' ? S.postmortem(s) : null;
  check('run op "stevig" gaat failliet', !!pm, s.status + ' week ' + s.week);
  check('de prijs staat bovenaan', pm && pm.lines[0].key === 'tooExpensive', pm && pm.lines.map(l => l.key + ' ' + Math.round(l.loss)).join(', '));
  // lege kas: wijn op op dagen dat er geen geld was om bij te bestellen → geen wijn noemen, maar de kas
  const t = CC.newState(5); t.week = 4; t.bust = { week: 4, due: 360, cash: 10 };
  for (let d = 0; d < 6; d++) t.history.push({ week: 4, day: d, revenue: 40, cogs: 20, margin: 20, rent: 20, wages: 0, tips: 0, bought: 0, invest: 0, cash: 10, bottles: 5, buyers: 4, customers: 30, soldOut: 15, tooExpensive: 2, nothing: 0, wines: { wine_merlot: { soldOut: 15, tooExpensive: 2 } } });
  const pm2 = S.postmortem(t);
  check('lege kas wint van "wijn op"', pm2.lines[0].key === 'cashOut' && !pm2.lines.some(l => l.key === 'soldOut'), pm2.lines.map(l => l.key).join(','));
  check('regel lege kas heeft een tekst', !!CC.TEXT.postmortem.cashOut);
}

console.log(fails ? `\n${fails} test(s) fout.` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
