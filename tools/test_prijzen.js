// 14_PRIJZEN §6: drie standen, aanbieding, "wie koopt dit nog?" en de wat-als-regel. Draaien: node tools/test_prijzen.js
const path = require('path'), fs = require('fs');
global.localStorage = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  OK    ' : '  FOUT  ') + msg); if (!cond) fails++; };

function shop(seed, level) {
  const s = CC.newState(seed); s.cash = 5000; s.level = level; s.rep = C.levelRep[level - 1]; s.week = 2; s.day = 1 + (seed % 6);
  if (level >= 4) s.upgrades.kast3 = true; if (level >= 8) s.upgrades.kast4 = true;
  if (level >= 2) s.staff = { sem: { xp: 0, level: 1 } };
  const ids = S.unlockedWines(s).map(w => w.id);
  S.activeVakIds(s).forEach((v, i) => { const id = ids[(i * 3 + seed) % ids.length]; if (id && !S.vakOfWine(s, id)) { S.buy(s, id, 24); S.assignVak(s, v, id); } });
  return s;
}

console.log('1. woeker is weg, oude saves laden');
{
  const files = fs.readdirSync(path.join(__dirname, '..', 'src')).filter(f => f.endsWith('.js'));
  const hits = files.filter(f => /woeker/i.test(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/st\.prices\[k\] === 'woeker'/g, '')));   // de omzetting van oude saves mag het woord kennen
  ok(!hits.length, 'geen "woeker" meer in de code (buiten commentaar)' + (hits.length ? ': ' + hits.join(', ') : ''));
  ok(C.priceStands.map(x => x.id).join() === 'aanbieding,normaal,stevig', 'drie standen: aanbieding, normaal, stevig');
  const old = CC.newState(9); old.prices.wine_merlot = 'woeker'; old.prices.wine_rioja = 'scherp'; old.prices.wine_sauvignon = 'scherp';
  localStorage.setItem('chateau-cashflow-save-v1', JSON.stringify(old));
  const st = CC.load();
  ok(st && st.prices.wine_merlot === 'stevig', 'woeker → stevig');
  const offers = Object.keys(st.prices).filter(k => st.prices[k] === 'aanbieding');
  ok(offers.length === 1 && Object.values(st.prices).every(v => CC.standById(v)), `scherp → één aanbieding, de rest normaal (${offers.join()})`);
  const d = DAY.start(st); DAY.finish(d, st); ok(d.done, 'oud spel speelt een dag zonder fout');
}

console.log('2. aanbieding: één wijn tegelijk, extra klanten in de prognose');
{
  const s = shop(3, 3), ids = S.listed(s).map(l => l.wine.id);
  S.setPrice(s, ids[0], 'aanbieding'); S.setPrice(s, ids[1], 'aanbieding');
  ok(s.prices[ids[0]] === 'normaal' && s.prices[ids[1]] === 'aanbieding', 'een tweede aanbieding zet de eerste terug op normaal');
  const f0 = (() => { const t = JSON.parse(JSON.stringify(s)); t.prices[ids[1]] = 'normaal'; return S.forecast(t); })(), f1 = S.forecast(s);
  ok(f1.offer > 0 && f1.offerWine === ids[1], `prognose noemt ${f1.offer} klanten door de aanbieding`);
  ok(f1.total - f0.total === f1.offer, 'en die zitten in het totaal');
  const plan = S.planDay(s, S.dayRng(s)).filter(p => p.src === 'offer');
  const lowEnd = plan.filter(p => p.type === 'koopjes' || p.type === 'buurt').length;
  ok(plan.length && lowEnd / plan.length >= 0.5, `vooral koopjesjagers en buurtbewoners (${lowEnd} van ${plan.length})`);
}

console.log('3. "wie koopt dit nog?" klopt met wat klanten die dag doen (200 dagen)');
{
  // per dag, wijn, stand en klanttype: voorspeld teken tegenover het deel dat de wijn echt wilde (budget en score met ruis)
  let same = 0, opposite = 0, total = 0;
  const conf = { koopt: { koopt: 0, twijfelt: 0, haakt: 0 }, twijfelt: { koopt: 0, twijfelt: 0, haakt: 0 }, haakt: { koopt: 0, twijfelt: 0, haakt: 0 } };
  const cls = r => r >= 0.45 ? 'koopt' : r >= 0.15 ? 'twijfelt' : 'haakt';
  for (let i = 0; i < 200; i++) {
    const L = 1 + (i % 8), s = shop(100 + i, L), ids = S.listed(s).map(l => l.wine.id);
    const stands = C.priceStands.map(x => x.id);
    ids.forEach((id, k) => S.setPrice(s, id, stands[(i + k) % 3]));
    const plan = S.planDay(s, S.dayRng(s));
    const pred = {};
    for (const id of ids) for (const t of Object.keys(CC.CUSTOMER_TYPES)) pred[id + '|' + t] = S.priceVerdict(s, CC.wineById(id), s.prices[id], t, plan).verdict;
    const seen = {};
    S.decideHook = (st, cust, scored) => { for (const x of scored) { const k = x.wine.id + '|' + cust.type, o = seen[k] = seen[k] || { n: 0, yes: 0 }; o.n++; if (x.affordable && x.score >= C.buyThreshold) o.yes++; } };
    const d = DAY.start(s); DAY.finish(d, s);
    S.decideHook = null;
    for (const k in seen) {
      if (seen[k].n < 3) continue;
      const p = pred[k], o = cls(seen[k].yes / seen[k].n);
      conf[p][o]++; total++;
      if (p === o) same++;
      if ((p === 'koopt' && o === 'haakt') || (p === 'haakt' && o === 'koopt')) opposite++;
    }
  }
  console.log('        voorspeld → gezien: ' + Object.keys(conf).map(p => `${p}: ` + Object.keys(conf[p]).map(o => `${o} ${conf[p][o]}`).join(', ')).join(' | '));
  ok(total > 500, `${total} vergelijkingen (dag × wijn × klanttype, minstens 3 klanten)`);
  ok(same / total >= 0.8, `zelfde teken in ${Math.round(100 * same / total)}% (eis ≥ 80%)`);
  ok(opposite / total <= 0.02, `"koopt" waar ze afhaakten of andersom: ${Math.round(1000 * opposite / total) / 10}% (eis ≤ 2%)`);
}

console.log('4. wat-als: alleen boven de drempel, en het bedrag klopt met de nagespeelde dag');
{
  let shown = 0, none = 0, maxErr = 0, belowMin = 0;
  for (let i = 0; i < 60; i++) {
    const s = shop(500 + i, 1 + (i % 8)), snap = JSON.parse(JSON.stringify(s));
    const wi = DAY.whatIf(snap);
    if (wi.none) { none++; continue; }
    shown++;
    const base = DAY.replay(snap).margin, alt = DAY.replay(snap, wi.wine, wi.to).margin, real = alt - base;
    maxErr = Math.max(maxErr, Math.abs(wi.diff - real) / Math.max(1, Math.abs(real)));
    if (wi.diff < C.whatIfMin * base) belowMin++;
  }
  ok(shown > 5 && none > 0, `regel op ${shown} van de 60 dagen, ${none} keer niets te winnen`);
  ok(belowMin === 0, 'nooit onder 10% van de dagmarge');
  ok(maxErr <= 0.1, `genoemd bedrag tegenover nagespeelde dag: hoogstens ${Math.round(maxErr * 100)}% verschil (eis ≤ 10%)`);
}

console.log(fails ? `\n${fails} fout(en).` : '\nAlles groen.');
process.exit(fails ? 1 : 0);
