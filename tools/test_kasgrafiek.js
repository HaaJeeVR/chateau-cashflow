// 20_HANDOFF taak 2: kasgrafiek op zondag. Draaien: node tools/test_kasgrafiek.js
// Controleert: (1) de lat per week is gelijk aan SIM.weekDue op die zondag (vóór betalen), ook met uitstel en boete,
// voor alle drie de leningen; (2) de komende week (gestippeld) is gelijk aan SIM.weekDue een week later;
// (3) uitgestelde weken zijn rood, de rest goud; (4) de lijn volgt s.history[].cash; (5) vrij doorspelen: de laatste 48
// dagen, geen lat na de lening; (6) een oud bewaard spel (dagen zonder cash, lege geschiedenis) geeft geen fout,
// ook niet bij het tekenen.
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js'); src('ui.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG, UI = CC.UI;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }

CC.FONT.draw = () => {};   // in node geen document: de letters zelf tekenen we niet (de breedtes wel)
// een tekenvlak dat niets doet (de grafiek mag nooit een fout geven)
const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = typeof k === 'string' && /^[a-z]/.test(k) && !['fillStyle', 'globalAlpha', 'font', 'strokeStyle', 'lineWidth', 'imageSmoothingEnabled', 'globalCompositeOperation'].includes(k) ? () => ({ addColorStop() {} }) : undefined)), set: (t, k, v) => { t[k] = v; return true; } });
function draw(s) {
  const app = { s, images: {}, mouse: { x: -1, y: -1 }, t: 0, panelT: 1 };
  CC.UI.hits = [];
  UI.cashChart(app, ctx, 154, 72, 332, 92);
  return CC.UI.hits.filter(h => h.id.startsWith('cc_'));
}
const lat = (s, w) => (UI.cashChartData(s).weeks.find(x => x.week === w) || null);

let checks = 0, latBad = [], nextBad = [], redBad = [], lineBad = 0, drawErr = 0, postponed = 0, runs = 0, endlessOk = 0, endlessRuns = 0, tipBad = 0;
const loans = ['ruim', 'normaal', 'krap'];
for (let r = 0; r < 60; r++) {
  const s = CC.newState(2000 + r, loans[r % 3]); runs++;
  const drain = r % 2 === 1;   // de helft van de runs: op een zaterdag de kas leeg, zodat er uitstel komt
  const seen = {}; let predicted = null;
  let rng = CC.makeRng({ rng: 99 + r });
  while (s.status === 'playing' || (s.status === 'endless' && s.week < 12)) {
    for (s.day = 0; s.day < C.daysPerWeek; s.day++) {
      S.refill(s);
      if (s.history.length === 0) S.placeOrder(s, { wine_merlot: 12, wine_sauvignon: 12 });
      else S.placeOrder(s, S.orderProposal(s));
      const d = DAY.start(s); DAY.finish(d, s);
      if (drain && s.day === C.daysPerWeek - 1 && s.status === 'playing' && !s.postponed && s.week >= 2 && s.week < S.repaySched(s).length && rng() < 0.4) s.cash = Math.min(s.cash, S.weekDue(s) - 1 + C.rent + S.wages(s));
      if (!drain && s.day === C.daysPerWeek - 1 && s.status === 'playing') s.cash += 450;   // andere helft: goede speler, haalt de eindstreep
      S.endDay(s, d.log);
      // midden in de week (Gisteren): komende zondag = deze week
      if (s.status === 'playing' && s.day === 2) { const L = lat(s, s.week); checks++; if (!L || L.due !== S.weekDue(s)) latBad.push(`wk${s.week} di`); }
    }
    s.day = C.daysPerWeek;
    if (s.status === 'endless') { S.startWeek(s); continue; }
    const due = S.weekDue(s);
    if (predicted != null) { checks++; if (predicted !== due) nextBad.push(`wk${s.week}: ${predicted} vs ${due}`); }
    seen[s.week] = due;
    // zondag vóór betalen: lat van deze week en alle voorbije weken
    for (const w in seen) { const L = lat(s, +w); checks++; if (!L || L.due !== seen[w]) latBad.push(`r${r} wk${w}: ${L && L.due} vs ${seen[w]}`); }
    try { const hits = draw(s); for (const h of hits) if (!/^(Ma|Di|Wo|Do|Vr|Za) week \d+ · kas -?€/.test(h.tip)) tipBad++; } catch (e) { drawErr++; console.log(e); }
    // lijn = kas uit de geschiedenis
    const cd = UI.cashChartData(s);
    if (cd.days.length !== s.history.filter(h => typeof h.cash === 'number').length || cd.days.some((h, i) => h.cash !== s.history[i].cash)) lineBad++;
    const pr = S.payWeek(s);
    let late = false;
    if (!pr.ok) { if (!S.postpone(s).ok) { S.bankrupt(s); break; } late = true; postponed++; }
    // na afhandelen: deze week rood bij uitstel, anders goud; volgende week gestippeld
    const L = lat(s, s.week); checks++;
    if (!L || L.red !== late || L.due !== due) redBad.push(`r${r} wk${s.week} ${JSON.stringify(L)} late=${late}`);
    const N = s.status === 'playing' ? lat(s, s.week + 1) : null;
    predicted = N ? N.due : null;
    if (s.status === 'playing' && (!N || !N.dotted)) redBad.push(`r${r} wk${s.week + 1} niet gestippeld`);
    if (s.status === 'won') {
      // vrij doorspelen
      S.startWeek(s); endlessRuns++;
      continue;
    }
    S.startWeek(s); s.mishap = null;
  }
  if (s.status === 'endless') {
    const cd = UI.cashChartData(s);
    const ok = cd.days.length === Math.min(48, s.history.length) && cd.weeks.every(x => x.week <= S.repaySched(s).length && !x.dotted)
      && cd.weeks.every(x => !x.red || true);
    let err = false; try { draw(s); } catch (e) { err = true; console.log(e); }
    if (ok && !err) endlessOk++;
  }
}
check(`lat = SIM.weekDue op die zondag (${checks} vergelijkingen, ${runs} runs, drie leningen)`, latBad.length === 0, latBad.slice(0, 3).join('; '));
check('gestippelde lat = SIM.weekDue een week later', nextBad.length === 0, nextBad.slice(0, 3).join('; '));
check(`uitgestelde weken rood, andere goud (${postponed} keer uitstel)`, redBad.length === 0 && postponed >= 10, redBad.slice(0, 2).join('; '));
check('lijn = kas aan het eind van elke dag', lineBad === 0, lineBad + ' keer anders');
check('tekenen zonder fout; hover "Wo week 3 · kas €412"', drawErr === 0 && tipBad === 0, `${drawErr} fouten, ${tipBad} tooltips`);
check(`vrij doorspelen: laatste 48 dagen, geen lat na de lening (${endlessRuns} runs)`, endlessRuns > 0 && endlessOk === endlessRuns, `${endlessOk}/${endlessRuns}`);

// oud bewaard spel
{
  const s = CC.newState(4242, 'normaal');
  for (let k = 0; k < 9; k++) { s.day = k % 6; s.week = 1 + Math.floor(k / 6); S.refill(s); S.placeOrder(s, S.orderProposal(s)); const d = DAY.start(s); DAY.finish(d, s); S.endDay(s, d.log); }
  s.day = 3;
  const old = JSON.parse(JSON.stringify(s));
  old.history.forEach((h, i) => { if (i % 2 === 0) delete h.cash; });   // oude dagen zonder kas
  old.history.push({ week: 2, day: 2 });                                  // half lege dag
  delete old.carry; delete old.bankDoneWeek;
  let ok = true, n = 0;
  try { n = UI.cashChartData(old).days.length; draw(old); } catch (e) { ok = false; console.log(e); }
  check('oud spel: dagen zonder kas overgeslagen, geen fout', ok && n === s.history.filter((h, i) => i % 2 === 1).length, n + ' dagen getekend');
  const empty = CC.newState(1); let ok2 = true;
  try { draw(empty); const lo = CC.newState(2); lo.history = undefined; draw(lo); } catch (e) { ok2 = false; console.log(e); }
  check('nieuw spel en spel zonder geschiedenis: geen fout', ok2);
}
console.log(fails ? `\n${fails} fout(en).` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
