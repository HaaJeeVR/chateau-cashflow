// B3: op-koers-meter (SIM.onCourse) en B4: reputatie na niveau 8 (SIM.repBonus). Draaien: node tools/test_koers.js
// De echte toets (verliezers zien het in week 5/6 aankomen) staat in de balans: KOERS=1 node tools/balance.js 150
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js');
const S = CC.SIM, C = CC.CONFIG;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  OK    ' : '  FOUT  ') + msg); if (!cond) fails++; };
const st = (week, day, cash, profit, n) => { const s = CC.newState(1); s.week = week; s.day = day; s.cash = cash; s.history = [];
  for (let d = 1; d <= n; d++) s.history.push({ week, day: d, profit }); return s; };

ok(S.onCourse(CC.newState(1)) === null, 'zonder verkoopdagen geen meter');
let s = st(5, 6, 500, 130, 6), oc = S.onCourse(s);
ok(oc && oc.terms === 2 && oc.debt === C.repay[4] + C.repay[5] && oc.daysLeft === 6, 'zondag week 5 vóór betalen: termijn 5 en 6, nog 6 verkoopdagen');
ok(oc.need === Math.round((oc.debt - 500) / 6) && oc.avg === 130, 'nodig per dag = (termijnen − kas) / dagen');
ok(oc.state === 'krap', 'ratio ≈ 1,05 → krap');
ok(S.onCourse(st(5, 6, 500, 300, 6)).state === 'ruim', 'ruim boven ' + C.koers.ruim);
ok(S.onCourse(st(5, 6, 500, 60, 6)).state === 'weinig', 'te weinig onder ' + C.koers.krap);
ok(S.onCourse(st(5, 6, 5000, 10, 6)).state === 'ruim', 'kas dekt alles: ruim');
s = st(8, 3, 500, 100, 3); oc = S.onCourse(s);
ok(oc && oc.terms === 1 && oc.daysLeft === 3, 'week 8: alleen de laatste termijn, de resterende dagen');
s = st(4, 0, 500, 100, 0); s.history = [{ week: 3, day: 6, profit: 222 }]; oc = S.onCourse(s);
ok(oc && oc.avg === 222 && oc.days === 1, 'maandagochtend: tempo van vorige week');
// B4: reputatie boven niveau 8
const L = C.levelRep, top = L[L.length - 1], B = C.repBonus;
let r = CC.newState(1); r.level = L.length - 1; r.rep = top + 5 * B.step;
ok(S.repBonus(r).n === 0, 'onder niveau 8 geen reputatieklanten');
r.level = L.length; r.rep = top + B.step - 1; ok(S.repBonus(r).n === 0, 'net onder de eerste stap: 0');
r.rep = top + 3 * B.step; ok(S.repBonus(r).n === 3 && S.repBonus(r).next === top + 4 * B.step, '3 stappen: +3, volgende klopt');
r.rep = top + 40 * B.step; ok(S.repBonus(r).n === B.max && S.repBonus(r).next === null, 'maximum ' + B.max);
r.rep = top + 2 * B.step; r.week = 2; r.day = 1;
const a = S.customerParts(r, CC.makeRng({ rng: 5 })); r.rep = top; const b0 = S.customerParts(r, CC.makeRng({ rng: 5 }));
ok(a.n - b0.n === 2 && a.rep === 2, 'klanten per dag +2 bij 2 stappen (zelfde toeval)');
r.rep = top + 2 * B.step; ok(S.forecast(r).rep === 2, 'prognose noemt de 2 reputatieklanten');
console.log(fails ? `\n${fails} fout(en).` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
