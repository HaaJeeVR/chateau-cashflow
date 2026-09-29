// Acceptatietests M6 — weekkaarten (03_BOUWPLAN §4). Draaien: node tools/test_m6.js
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  OK    ' : '  FOUT  ') + msg); if (!cond) fails++; };

function shop(seed, level) {
  const s = CC.newState(seed); s.cash = 5000; s.level = level; s.rep = C.levelRep[level - 1]; s.day = 2;
  const ids = S.unlockedWines(s).map(w => w.id);
  S.activeVakIds(s).forEach((v, i) => { if (ids[i]) { S.buy(s, ids[i], 24); S.assignVak(s, v, ids[i]); } });
  return s;
}
function withCard(s, id) { s.card = { id, week: s.week }; return s; }
function play(s) { const d = DAY.start(s); DAY.finish(d, s); return d.log; }
const sum = (n, f) => { let t = 0; for (let i = 1; i <= n; i++) t += f(i); return t; };

console.log('M6-1: pool en teksten');
{
  ok(CC.CARDS.length === 25, `25 kaarten (${CC.CARDS.filter(c => c.kind !== 'mishap').length} kansen, ${CC.CARDS.filter(c => c.kind === 'mishap').length} tegenvallers)`);
  ok(CC.CARDS.every(c => CC.TEXT.cards[c.id] && CC.TEXT.cards[c.id].title), 'elke kaart heeft een tekst');
  const s = shop(1, 1); const seen = new Set(); let same = 0;
  for (let i = 0; i < 60; i++) { const o = S.offerCards(s, CC.makeRng(s)); if (o[0] === o[1]) same++; o.forEach(x => seen.add(x)); ok; }
  ok(same === 0, 'altijd twee verschillende kaarten');
  ok(![...seen].some(id => CC.cardById(id).lvl > 1 || CC.cardById(id).kind === 'mishap'), `op niveau 1 alleen niveau-1-kansen (${seen.size} verschillende gezien)`);
}

console.log('M6-2: kaart geldt pas volgende week');
{
  const s = shop(2, 1); s.week = 1;
  S.chooseCard(s, 'braderie', CC.makeRng(s));
  ok(S.effects(s).length === 0, 'op zondag nog geen effect');
  S.startWeek(s); s.mishap = null;
  ok(S.effects(s).length === 1 && S.effects(s)[0].id === 'braderie', 'in week 2 actief');
}

console.log('M6-3: effecten werken');
{
  const base = sum(20, i => play(shop(i, 1)).customers);
  const brad = sum(20, i => play(withCard(shop(i, 1), 'braderie')).customers);
  ok(brad > base, `braderie: klanten ${base} → ${brad}`);
  const rose = w => w === 'wine_provence';
  const r0 = sum(20, i => play(shop(i, 1)).perWine.wine_provence || 0);
  const r1 = sum(20, i => play(withCard(shop(i, 1), 'rose')).perWine.wine_provence || 0);
  ok(r1 > r0 * 1.3, `rosé-zomer: rosé verkocht ${r0} → ${r1}`);
  const kd = sum(20, i => { const s = withCard(shop(i, 1), 'koningsdag'); s.day = 5; return play(s).customers; });
  const k0 = sum(20, i => { const s = shop(i, 1); s.day = 5; return play(s).customers; });
  ok(kd > k0 * 1.7, `koningsdag zaterdag: klanten ${k0} → ${kd}`);
  const k2 = sum(20, i => { const s = withCard(shop(i, 1), 'koningsdag'); s.day = 2; return play(s).customers; });
  ok(Math.abs(k2 - sum(20, i => play(shop(i, 1)).customers)) === 0, 'koningsdag doordeweeks: geen effect');
}

console.log('M6-4: doos zonder etiket');
{
  const s = shop(3, 3); const cash = s.cash;
  const r = S.chooseCard(s, 'doos', CC.makeRng(s));
  ok(r.ok && r.box && s.cash === cash - 60, `€60 betaald, 12 flessen ${CC.wineById(r.box).name} (waarde ${CC.R.euro(r.worth)})`);
  const poor = shop(4, 1); poor.cash = 30;
  ok(!S.chooseCard(poor, 'doos', CC.makeRng(poor)).ok, 'te weinig kas: kan niet');
}

console.log('M6-5: tegenvallers');
{
  let n = 0; for (let i = 0; i < 400; i++) { const s = CC.newState(i); s.week = 2; if (S.rollMishap(s, CC.makeRng(s))) n++; }
  ok(n > 60 && n < 140, `kans per week ± ${CC.CARD_CFG.mishapChance * 100}%: ${n}/400`);
  const s0 = CC.newState(9); s0.week = 1; ok(!S.rollMishap(s0, CC.makeRng(s0)), 'week 1: nooit');
  // koeling b: ma–wo geen wit
  const s = shop(5, 2); s.mishap = { id: 'koeling', choice: null }; S.decideMishap(s, 'b', CC.makeRng(s));
  s.day = 1; let l = play(s);
  ok(!Object.keys(l.perWine).some(id => CC.roleById(CC.wineById(id).role).kind === 'wit'), 'koeling (wachten): dinsdag geen wit verkocht');
  s.day = 4; l = play(s);
  ok(Object.keys(l.perWine).some(id => CC.roleById(CC.wineById(id).role).kind === 'wit'), 'koeling (wachten): vrijdag weer wel');
  const s2 = shop(6, 1); s2.mishap = { id: 'koeling', choice: null }; const c2 = s2.cash; S.decideMishap(s2, 'a', CC.makeRng(s2));
  s2.day = 1; ok(s2.cash === c2 - 90 && !S.blocked(s2, CC.wineById('wine_sauvignon')), 'koeling (repareren): €90 en wit gewoon te koop');
}

console.log(fails ? `\n${fails} test(s) fout.` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
