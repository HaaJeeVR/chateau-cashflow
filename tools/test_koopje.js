// 20_HANDOFF taak 1: groene ballon "dit had meer mogen kosten". Draaien: node tools/test_koopje.js
// Controleert: (1) nooit een groene ballon bij een wijn op Aanbieding of Stevig, nooit bij adviesklanten of Fatima;
// (2) hoogstens 3 per dag en niet twee keer dezelfde wijn binnen 5 s; (3) alleen bij een klant die de teller verhoogt;
// (4) de dag verandert niet: zonder de ballon (DAY.roomFor uit) dezelfde marge, klanten en eindstand van d.rng;
// (5) een nagespeelde dag geeft precies dezelfde groene ballonnen.
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }

const seedRng = CC.makeRng({ rng: 777 });
function shop(seed, level) {
  const s = CC.newState(seed); s.cash = 9000; s.level = level; s.rep = C.levelRep[level - 1];
  s.week = 2 + (seed % 5); s.day = seed % 6; s.mishap = null; s.card = null;
  s.upgrades = {}; if (level >= 4) s.upgrades.kast3 = true; if (level >= 8) s.upgrades.kast4 = true;
  s.staff = {}; if (level >= 2) s.staff.sem = { xp: 0, level: 2 }; if (level >= 5) s.staff.fatima = { xp: 0, level: 2 }; if (level >= 6 && seed % 2) s.staff.dubois = { xp: 0, level: 2 };
  const vak = S.activeVakIds(s), un = S.unlockedWines(s).slice();
  for (let i = un.length - 1; i > 0; i--) { const j = Math.floor(seedRng() * (i + 1)); [un[i], un[j]] = [un[j], un[i]]; }
  vak.forEach((v, i) => { const w = un[i]; if (w) { S.buy(s, w.id, 24); S.assignVak(s, v, w.id); } });
  for (const L of S.listed(s)) S.setPrice(s, L.wine.id, seedRng() < 0.35 ? 'stevig' : 'normaal');
  if (seedRng() < 0.6) { const L = S.listed(s); S.setPrice(s, L[Math.floor(seedRng() * L.length)].wine.id, 'aanbieding'); }
  return s;
}
const clone = o => JSON.parse(JSON.stringify(o));
// speel een dag stap voor stap en noteer elke nieuwe groene ballon
function play(snap, adv) {
  const s = clone(snap), d = DAY.start(s);
  if (adv) d.autoAdvice = (ask, s2, rng) => (rng() < 0.5 ? (S.adviceGood(s2, ask.q)[0] || null) : null);
  const seen = new Set(), list = [];
  let guard = 0;
  while (!d.done && guard++ < 60 * 120) {
    DAY.step(d, s, DAY.STEP);
    for (const c of d.customers) if (c.bubble && c.bubble.tone === 'bargain' && !seen.has(c.bubble)) {
      seen.add(c.bubble);
      list.push({ t: d.t, id: c.id, wine: c.want && c.want.wineId, stand: c.want && s.prices[c.want.wineId], advice: c.wasAdvice || (c.want && c.want.advice), fatima: !!c.fatima, room: c.room, text: c.bubble.text });
    }
  }
  let room = 0; for (const id in d.log.wines) room += d.log.wines[id].room || 0;
  return { list, log: d.log, rngEnd: s.rng, room };
}

let total = 0, wrongStand = 0, wrongCust = 0, tooMany = 0, sameWine = 0, noRoom = 0, unchanged = 0, changed = 0, replayDiff = 0, days = 0, texts = new Set();
for (const L of [3, 5, 6, 8]) for (let i = 0; i < 60; i++) {
  const snap = shop(30000 + L * 1000 + i, L), adv = i % 3 === 0;
  const a = play(snap, adv); days++;
  total += a.list.length;
  for (const b of a.list) { if (b.stand !== 'normaal') wrongStand++; if (b.advice || b.fatima) wrongCust++; if (!b.room) noRoom++; texts.add(b.text); }
  if (a.list.length > 3) tooMany++;
  for (let j = 0; j < a.list.length; j++) for (let k = j + 1; k < a.list.length; k++) if (a.list[j].wine === a.list[k].wine && a.list[k].t - a.list[j].t < 5) sameWine++;
  // (5) nagespeeld: dezelfde ballonnen
  const b2 = play(snap, adv);
  if (JSON.stringify(b2.list) !== JSON.stringify(a.list)) replayDiff++;
  // (4) zonder de groene ballon: dezelfde dag
  const keep = DAY.roomFor; DAY.roomFor = () => false;
  const z = play(snap, adv); DAY.roomFor = keep;
  const same = z.log.revenue === a.log.revenue && z.log.cogs === a.log.cogs && z.log.customers === a.log.customers && z.log.buyers === a.log.buyers && z.rngEnd === a.rngEnd && z.list.length === 0;
  if (same) unchanged++; else changed++;
}
check(`er komen groene ballonnen (${total} op ${days} dagen, ${texts.size} van ${CC.TEXT.bubble.bargain.length} zinnen)`, total > 20 && texts.size >= 6);
check('nooit bij een wijn op Aanbieding of Stevig', wrongStand === 0, wrongStand + ' keer');
check('nooit bij een adviesklant of een klant van Fatima', wrongCust === 0, wrongCust + ' keer');
check('alleen bij een klant die de teller verhoogt', noRoom === 0, noRoom + ' keer');
check('hoogstens 3 per dag', tooMany === 0, tooMany + ' dagen');
check('niet twee keer dezelfde wijn binnen 5 s', sameWine === 0, sameWine + ' keer');
check('de dag verandert niet (marge, klanten, kopers, eindstand d.rng gelijk zonder ballon)', changed === 0, `${unchanged} gelijk, ${changed} anders`);
check('nagespeelde dag: precies dezelfde groene ballonnen', replayDiff === 0, replayDiff + ' dagen anders');

// teller in "Gisteren": komt in de geschiedenis terecht
{
  const s = shop(41234, 5); const d = DAY.start(s); DAY.finish(d, s); const sm = S.endDay(s, d.log);
  const n = Object.values(sm.wines).reduce((a, w) => a + (w.room || 0), 0);
  check('teller per wijn staat in de dagsamenvatting (sm.wines[id].room)', Object.values(sm.wines).every(w => w.room == null || w.room >= 0) && n === Object.values(d.log.wines).reduce((a, w) => a + (w.room || 0), 0), n + ' kopers');
}
console.log(fails ? `\n${fails} fout(en).` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
