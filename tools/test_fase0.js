// Regressietests fase 0 (audit + speelronde 2026-09-27). Draaien: node tools/test_fase0.js
// Spelregels zonder browser. Het hervatten zelf (kassabon, zondag) test tools/test_hervatten.js in een echte browser.
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }
const stock4 = s => ['wine_merlot', 'wine_sauvignon', 'wine_provence', 'wine_rioja'].forEach((w, i) => { S.buy(s, w, 12); S.assignVak(s, 'vak_' + (i + 1), w); });
const accounted = l => l.buyers + l.soldOut + l.tooExpensive + l.nothing + (l.adviceLeft || 0);

console.log('F0-1: bank: een week betaal je één keer');
{
  const s = CC.newState(5); s.day = C.daysPerWeek; s.cash = 800;
  const r1 = S.payWeek(s), cash1 = s.cash;
  const r2 = S.payWeek(s);
  check('eerste betaling lukt', r1.ok && cash1 === 800 - C.repay[0], 'kas ' + cash1);
  check('tweede betaling in dezelfde week doet niets', !r2.ok && s.cash === cash1 && s.debtPaid === C.repay[0]);
  check('daarna staat er niets meer open deze week', S.weekDue(s) === 0);
  check('uitstellen na betalen kan niet', !S.postpone(s).ok);
  S.startWeek(s);
  check('volgende week: gewoon de nieuwe termijn', S.weekDue(s) === C.repay[1], '€' + S.weekDue(s));
}

console.log('F0-2: uitstel: geen dubbele rekening op dezelfde zondag');
{
  const s = CC.newState(6); s.day = C.daysPerWeek; s.cash = 20;
  const r = S.postpone(s);
  check('uitstel lukt', r.ok);
  check('dezelfde zondag vraagt de bank niets meer', S.weekDue(s) === 0, '€' + S.weekDue(s));
  check('betalen na uitstel doet niets', !S.payWeek(s).ok && s.cash === 20);
  S.startWeek(s);
  check('volgende week: termijn + uitgesteld + boete', S.weekDue(s) === C.repay[1] + C.repay[0] + C.postponeFine, '€' + S.weekDue(s));
  check('schuld over is juist', S.debtLeft(s) === C.repay.reduce((a, b) => a + b, 0) + C.postponeFine);
}

console.log('F0-3: weekkaarten: één keer kiezen, elke kaart één keer per run');
{
  const s = CC.newState(9); s.level = 8; s.cash = 5000;
  const offer = S.offerCards(s, CC.makeRng(s));
  check('eerste keuze lukt', S.chooseCard(s, offer[0], CC.makeRng(s)).ok);
  const cash = s.cash;
  check('tweede keuze dezelfde zondag geweigerd', !S.chooseCard(s, offer[1], CC.makeRng(s)).ok && s.cash === cash);
  // hele run: gekozen kaarten komen niet terug zolang er genoeg over zijn
  const t = CC.newState(11); t.level = 8; t.cash = 99999;
  const kansen = CC.CARDS.filter(c => c.kind !== 'mishap').length;
  let repeat = false;
  for (let w = 1; w <= kansen - 1; w++) {
    const o = S.offerCards(t, CC.makeRng(t));
    if (o.some(id => (t.cardsTaken || []).includes(id))) repeat = true;
    S.chooseCard(t, o[0], CC.makeRng(t)); t.week++;
  }
  check(`${kansen - 1} weken lang geen gekozen kaart opnieuw`, !repeat);
}

console.log('F0-4: elke bezoeker krijgt een uitkomst (ook op 4× en na een adviesvraag)');
{
  let bad1 = 0, bad4 = 0, badWrong = 0, days = 0;
  for (let seed = 1; seed <= 40; seed++) {
    for (const speed of [1, 4]) {
      const s = CC.newState(seed); stock4(s);
      const d = DAY.start(s); d.speed = speed; d.visual = true;
      let guard = 0; while (!d.done && guard++ < 60 * 200) DAY.step(d, s, DAY.STEP);
      if (accounted(d.log) !== d.log.customers) speed === 1 ? bad1++ : bad4++;
      days++;
    }
    // fout advies: klant loopt weg en telt mee
    const s = CC.newState(seed); stock4(s);
    const d = DAY.start(s);
    d.autoAdvice = (ask) => ask.opts.find(id => !S.adviceGood(s, ask.q).includes(id)) || null;
    DAY.finish(d, s);
    if (accounted(d.log) !== d.log.customers) badWrong++;
  }
  check('1×: alle bezoekers verantwoord', bad1 === 0, bad1 + ' dagen fout');
  check('4×: alle bezoekers verantwoord', bad4 === 0, bad4 + ' dagen fout');
  check('fout/eerlijk advies telt als vertrek', badWrong === 0, badWrong + ' dagen fout');
  // adviesvraag die na sluitingstijd nog open zou staan
  const s = CC.newState(2); stock4(s);
  const d = DAY.start(s); d.speed = 4;
  let openAfterClose = false, guard = 0;
  while (!d.done && guard++ < 60 * 200) { DAY.step(d, s, DAY.STEP); if (d.t > C.dayLength + 0.1 && d.customers.some(c => c.state === 'ask')) openAfterClose = true; }
  check('geen adviesvraag meer open na sluitingstijd', !openAfterClose);
}

console.log('F0-5: tegenvallers en levering');
{
  let koelingZonder = 0;
  for (let seed = 1; seed <= 400; seed++) { const s = CC.newState(seed); s.week = 3; if (S.rollMishap(s, CC.makeRng(s)) && s.mishap.id === 'koeling') koelingZonder++; }
  check('koeling stuk kan alleen als je een koeling hebt', koelingZonder === 0, koelingZonder + '×');
  let koelingMet = 0;
  for (let seed = 1; seed <= 400; seed++) { const s = CC.newState(seed); s.week = 3; s.upgrades.koeling = true; if (S.rollMishap(s, CC.makeRng(s)) && s.mishap.id === 'koeling') koelingMet++; }
  check('met koeling komt hij wel voor', koelingMet > 0, koelingMet + '×');

  // goedkoopste eerst als het geld krap is
  const s = CC.newState(3); s.level = 6; s.cash = 30;
  s.targets = { wine_bordeaux: 12, wine_merlot: 6 };
  const r = S.autoOrder(s);
  check('krap: Merlot (€3) gaat vóór Bordeaux (€13)', r.deliveries[0] && r.deliveries[0].id === 'wine_merlot', JSON.stringify(r.deliveries));
  check('tekort door geld heet "te weinig kas"', r.short.includes('wine_bordeaux') && !r.scarce.includes('wine_bordeaux'));
  // schaars: op voor deze week, terwijl er geld genoeg is
  const t = CC.newState(4); t.level = 8; t.cash = 5000;
  t.targets = { wine_champagne: 24 };
  const r2 = S.autoOrder(t);
  check('schaarste heet geen geldgebrek', r2.scarce.includes('wine_champagne') && !r2.short.includes('wine_champagne'), JSON.stringify({ short: r2.short, scarce: r2.scarce }));
  // deellevering: €15 en een lege Merlot-bestelling → 5 flessen
  const u = CC.newState(4); u.cash = 15; stock4; S.setTarget(u, 'wine_merlot', 6);
  check('met €15 krijg je 5 Merlot', S.totalBottles(u, 'wine_merlot') === 5 && u.cash === 0, S.totalBottles(u, 'wine_merlot') + ' flessen, kas ' + u.cash);
}

console.log('F0-6: Sem slentert, en de dag blijft reproduceerbaar');
{
  const run = () => { const s = CC.newState(21); s.level = 3; stock4(s); S.hire(s, 'sem'); const d = DAY.start(s); let moved = 0, g = 0; let last = null;
    while (!d.done && g++ < 60 * 200) { DAY.step(d, s, DAY.STEP); const a = d.staff[0]; if (a.state === 'home' && last && (a.x !== last.x || a.y !== last.y)) moved++; last = { x: a.x, y: a.y }; }
    return { rev: d.log.revenue, moved }; };
  const a = run(), b = run();
  check('Sem loopt ook als er niets bij te vullen is', a.moved > 30, a.moved + ' stapjes');
  check('twee keer dezelfde dag = dezelfde omzet', a.rev === b.rev, a.rev + ' vs ' + b.rev);
}

console.log('F0-7: nieuwe kaarten (keuze HJ 2026-09-27)');
{
  const s = CC.newState(3); s.level = 2; s.cash = 800; s.card = { id: 'bruiloft', week: 1 };
  S.buy(s, 'wine_cremant', 30); s.day = 3;
  check('bruiloft: nog niet op donderdag', S.settleOrder(s) === null);
  s.day = 4; const cash = s.cash; const r = S.settleOrder(s);
  check('vrijdag: 24 flessen weg, geld en reputatie erbij', r.ok && S.totalBottles(s, 'wine_cremant') === 6 && s.cash > cash, JSON.stringify(r));
  check('maar één keer', S.settleOrder(s) === null);
  const f = CC.newState(3); f.card = { id: 'bruiloft', week: 1 }; f.day = 4; f.rep = 10;
  const rf = S.settleOrder(f);
  check('te weinig: reputatie omlaag', !rf.ok && f.rep === 7);
  const p = CC.newState(3); p.card = { id: 'partij', week: 1 };
  check('partij: inkoop 20% goedkoper', S.buyPrice(p, CC.wineById('wine_bordeaux')) === 10.4);
  const q = CC.newState(3); q.mishap = { id: 'parkeren', choice: 'b' };
  check('parkeren (ma): Ronnie levert niet', !S.buy(q, 'wine_merlot', 6).ok); q.day = 2;
  check('parkeren (wo): weer levering', S.buy(q, 'wine_merlot', 6).ok);
  const t = CC.newState(3); t.mishap = { id: 'stroom', choice: 'b' }; t.day = 1; stock4(t);
  const d = DAY.start(t); DAY.finish(d, t);
  check('stroomstoring: dinsdag geen klanten, dag loopt af', d.done && d.log.customers === 0);
}

console.log('F0-8: ochtendbestelling ter goedkeuring');
{
  const s = CC.newState(4); s.cash = 800;
  check('nieuw spel: geen voorstel', Object.keys(S.orderProposal(s)).length === 0);
  const r = S.placeOrder(s, { wine_merlot: 12, wine_rioja: 6 });
  check('bestellen kost geld en zet de wijn in een schap', s.cash === 800 - 36 - 30 && S.vakOfWine(s, 'wine_merlot') && S.vakOfWine(s, 'wine_rioja'), 'kas ' + s.cash);
  s.vakken[S.vakOfWine(s, 'wine_merlot')].n -= 5;
  const cash = s.cash, p = S.orderProposal(s);
  check('volgende ochtend: voorstel = wat er weg is, nog niets betaald', p.wine_merlot === 5 && !p.wine_rioja && s.cash === cash, JSON.stringify(p));
  const t = CC.newState(4); t.cash = 20;
  const r2 = S.placeOrder(t, { wine_merlot: 12 });
  check('te weinig geld: Ronnie levert wat kan', S.totalBottles(t, 'wine_merlot') === 6 && r2.short.includes('wine_merlot'));
}

console.log(fails ? `\n${fails} FOUT(EN)` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
