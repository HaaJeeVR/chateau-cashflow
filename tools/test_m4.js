// Acceptatietests M4 — advies (03_BOUWPLAN §4). Draaien: node tools/test_m4.js
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  OK    ' : '  FOUT  ') + msg); if (!cond) fails++; };

// Winkel met vier wijnen op het schap
function shop(seed, level) {
  const s = CC.newState(seed); s.cash = 5000;
  if (level) { s.level = level; s.rep = C.levelRep[level - 1]; }
  const ids = S.unlockedWines(s).map(w => w.id);
  S.activeVakIds(s).forEach((v, i) => { if (ids[i]) { S.buy(s, ids[i], 12); S.assignVak(s, v, ids[i]); } });
  return s;
}

console.log('M4-1: 1–2 adviesvragen per dag, de eerste dag precies één');
{
  const counts = [];
  for (let seed = 1; seed <= 40; seed++) {
    const s = shop(seed); s.day = 2;
    const d = DAY.start(s); let n = 0;
    d.autoAdvice = () => { n++; return null; };
    DAY.finish(d, s); counts.push(n);
  }
  ok(Math.min(...counts) >= 1 && Math.max(...counts) <= C.advicePerDay[1] && Math.min(...counts) >= C.advicePerDay[0], `aantal per dag tussen ${Math.min(...counts)} en ${Math.max(...counts)}`);
  const s = shop(7); const d = DAY.start(s); let n = 0; d.autoAdvice = () => { n++; return null; }; DAY.finish(d, s);
  ok(n === 1, `dag 1: ${n} vraag`);
}

console.log('M4-2: altijd oplosbaar met wat op het kaartje staat');
{
  let asks = 0, bad = 0, noneRight = 0;
  for (let lv = 1; lv <= 8; lv++) for (let seed = 1; seed <= 30; seed++) {
    const s = shop(seed * 13 + lv, lv); s.day = 1;
    const d = DAY.start(s);
    d.autoAdvice = (ask) => {
      asks++;
      const good = S.adviceGood(s, ask.q);
      if (good.length && ask.opts.filter(id => good.includes(id)).length !== 1) bad++;
      if (!good.length) noneRight++;
      return null;
    };
    DAY.finish(d, s);
  }
  ok(bad === 0, `${asks} vragen: precies één goed antwoord op het kaartje als dat er is (fout: ${bad})`);
  ok(noneRight > 0 && noneRight < asks * 0.35, `"Heb ik niet" is soms het goede antwoord (${noneRight}×)`);
}

console.log('M4-3: beloning');
{
  // goed
  let s = shop(3); s.day = 1; let d = DAY.start(s); let res = null, rep0, cash0;
  d.autoAdvice = (ask) => { if (res) return null; rep0 = s.rep; cash0 = s.cash; const g = S.adviceGood(s, ask.q).find(id => ask.opts.includes(id)); return g || null; };
  const orig = DAY.answer; DAY.answer = function (dd, ss, c, w) { const r = orig(dd, ss, c, w); if (!res) res = r; return r; };
  DAY.finish(d, s); DAY.answer = orig;
  if (res && res.result === 'good') {
    ok(res.tip >= 1, `goed: fooi ${CC.R.euro(res.tip)}`);
    ok(res.dr === C.adviceRepGood, `goed: reputatie +${res.dr}`);
    ok(d.log.advice.good === 1 && d.log.advice.tips === res.tip, 'goed: telt mee op de kassabon (advies + fooi)');
    ok(d.log.perWine[res.wineId] >= 1, 'goed: de klant rekent de fles af');
  } else ok(false, 'geen goed antwoord gevonden in testdag');

  // fout
  s = shop(3); s.day = 1; d = DAY.start(s); let r2 = null;
  d.autoAdvice = (ask) => { const g = S.adviceGood(s, ask.q); const w = ask.opts.find(id => !g.includes(id)); return w || null; };
  DAY.answer = function (dd, ss, c, w) { const r = orig(dd, ss, c, w); if (!r2) r2 = r; return r; };
  DAY.finish(d, s); DAY.answer = orig;
  ok(r2 && (r2.result === 'wrong' || r2.result === 'tooExpensive' || r2.result === 'honest' || r2.result === 'falseNone'), `fout: uitkomst ${r2 && r2.result}`);
  if (r2 && r2.wineId) {
    const why = CC.adviceWhy(r2.q, CC.wineById(r2.wineId), r2.miss, r2.price);
    ok(why && why.length > 5, `fout: klant legt uit: "${why}"`);
    ok(r2.dr === C.adviceRepWrong, `fout: reputatie ${r2.dr}`);
  }
}

console.log('M4-4: negeren = geen straf, klant kiest dan zelf');
{
  const s = shop(5); s.day = 1; const d = DAY.start(s); const rep0 = s.rep;
  DAY.finish(d, s);   // niemand beantwoordt: alle vragen verlopen
  ok(d.log.advice && d.log.advice.ignored === d.log.advice.asked && d.log.advice.asked >= 1, `${d.log.advice.asked} vraag/vragen verlopen`);
  ok(s.rep - rep0 === d.log.rep, 'reputatie alleen uit gewone verkoop');
}

console.log('M4-5: geen vraag twee keer achter elkaar');
{
  const s = shop(11, 3); let prev = null, rep = 0;
  for (let i = 0; i < 200; i++) { const a = S.pickAdvice(s, CC.makeRng(s)); if (a.q.id === prev) rep++; prev = a.q.id; }
  ok(rep === 0, `200 vragen, ${rep} herhalingen direct na elkaar`);
  const arr = CC.TEXT.bubble.bought; let last = null, dup = 0;
  for (let i = 0; i < 500; i++) { const t = CC.pickText(arr); if (t === last) dup++; last = t; }
  ok(dup === 0, `ballonteksten: ${dup} herhalingen direct na elkaar`);
}

console.log(fails ? `\n${fails} test(s) fout.` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
