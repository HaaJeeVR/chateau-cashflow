// Pakket B (handoff na review 2) in een echte browser. Vraagt Playwright (npm i playwright).
// Draaien: node tools/test_pakketB.js [map-voor-screenshots]
// Bedient het spel waar het kan met muisklikken op de klikvlakken (CC.UI.hits).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const SHOTS = process.argv[2] || null;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }

const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); res.end(data); });
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const [VW, VH] = (process.env.VIEW || '1280x720').split('x').map(Number);   // andere schermmaat: VIEW=844x390
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const wait = ms => page.waitForTimeout(ms);
  const frames = (n = 2) => ev(n => new Promise(r => { const f = k => k ? requestAnimationFrame(() => f(k - 1)) : r(); f(n); }), n);
  const shot = async name => { if (!SHOTS) return; await page.mouse.move(2, 700); await frames(2); await page.locator('#game').screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const hit = async id => { await frames(2); return ev(id => { const h = CC.UI.hits.find(h => h.id === id); return h && { x: h.x, y: h.y, w: h.w, h: h.h, on: !!h.onClick, tip: h.tip }; }, id); };
  const click = async id => {
    const h = await hit(id); if (!h) return false;
    const b = await page.locator('#game').boundingBox(), k = b.width / 640;
    await page.mouse.click(b.x + (h.x + h.w / 2) * k, b.y + (h.y + h.h / 2) * k);
    await frames(3);
    return h.on;
  };
  await page.goto(url); await ev(() => { localStorage.clear(); CC.setSetting('introSeen', true); }); await page.reload(); await wait(500);

  // ---------- B1: weekklus ----------
  console.log('B1: weekklus');
  // drie weken snel spelen (sim), dan de zondag van week 3 in het spel
  await ev(() => {
    const S = CC.SIM, s = CC.newState(7); s.flags.introSeen = true; s.flags.opened = true; s.flags.bought = true; s.flags.shelved = true;
    ['wine_merlot', 'wine_sauvignon', 'wine_provence', 'wine_rioja'].forEach((w, k) => { s.targets[w] = 18; S.assignVak(s, 'vak_' + (k + 1), w); });
    s.cash = 900;
    for (let w = 1; w <= 3; w++) {
      for (s.day = 0; s.day < 6; s.day++) { S.refill(s); S.placeOrder(s, S.orderProposal(s)); const d = CC.DAY.start(s); CC.DAY.finish(d, s); S.endDay(s, d.log); }
      if (w < 3) { S.payWeek(s); S.startWeek(s); s.mishap = null; s.card = null; }
    }
    s.cash = Math.max(s.cash, 1500); s.day = 6;
    app.s = s; app.rebuildRoom(); app.openSunday(); app.ring = null;
  });
  check('week 1–3: geen weekklus', (await ev(() => !app.s.weekKlus)));
  await click('pay'); await wait(1800);
  const nk = await ev(() => app.s.nextWeekKlus);
  check('zondag van week 3: klus voor week 4 aangekondigd', nk && nk.week === 4 && nk.need > 0, JSON.stringify(nk));
  const strip = await hit('weekklus_next');
  check('strook met de klus staat bij de kaartkeuze', !!strip && /Beloning/.test(strip.tip || ''), strip && strip.tip);
  await shot('B1-zondag-weekklus');
  const card = await ev(() => app.sunday.cards[0]);
  await click('card_' + card); await wait(1600);
  await click('newweek'); await ev(() => { while (app.notice) app.closeNotice(); app.s.mishap = null; });
  const wk = await ev(() => app.s.weekKlus);
  check('week 4: dezelfde klus is nu de klus van de week', wk && wk.week === 4 && wk.id === nk.id && wk.need === nk.need, JSON.stringify(wk));
  check('klus van de week staat bovenaan het klussenbord', !!(await hit('klus_wk')));
  await shot('B1-klussenbord');
  // bijna gehaald: één dag spelen haalt hem (behalve variety: dan het aantal wijnen op één dag)
  const res = await ev(() => {
    const s = app.s, k = s.weekKlus; k.id = 'wk_variety'; k.need = 2; k.n = 0;
    const rep0 = s.rep; app.openShop(); app.skipDay();
    return { rep0, discount0: s.orderDiscount || 0 };
  });
  await frames(4);
  const after = await ev(() => ({ done: app.s.weekKlus.done, disc: app.s.orderDiscount, kd: app.summary.klusDone.map(k => k.wk || k.lvl) }));
  check('gehaald: korting voor de volgende bestelling, en een vinkje in het dagrapport', after.done && after.disc === 0.15 && after.kd.includes('wk_variety'), JSON.stringify(after));
  await ev(() => { app.resultT = 9; }); await wait(300); await shot('B1-dagrapport');
  await ev(() => { app.afterResult(); while (app.phase === 'levelup' || app.phase === 'staffup') { if (app.phase === 'levelup') app.afterLevel(); else app.afterStaffUp(); } while (app.notice) app.closeNotice(); app.order = {}; });
  check('gehaalde klus staat niet meer op het bord', !(await hit('klus_wk')));
  await click('w_phone'); await wait(500);
  const c0 = await ev(() => ({ p: CC.SIM.buyPrice(app.s, CC.wineById('wine_merlot')), c: CC.wineCost(CC.wineById('wine_merlot')) }));
  check('inkoop met 15% korting', Math.abs(c0.p - Math.round(c0.c * 0.85 * 100) / 100) < 0.001, JSON.stringify(c0));
  await shot('B1-ronnie-korting');
  await click('op_wine_merlot'); await click('place_order');
  check('na de bestelling is de korting op', (await ev(() => !app.s.orderDiscount)));
  // reputatie- en geldbeloning
  const rw = await ev(() => {
    const S = CC.SIM, s = app.s, log = S.newDayLog(), out = {};
    s.weekKlus = { id: 'wk_type', week: s.week, type: 'liefhebber', need: 3, n: 0, done: false }; log.types = { liefhebber: { bottles: 3 } };
    let r0 = s.rep; S.klusDay(s, log, {}); out.rep = s.rep - r0;
    s.weekKlus = { id: 'wk_flessen', week: s.week, need: 5, n: 0, done: false }; const log2 = S.newDayLog(); log2.bottles = 5;
    const c0 = s.cash; S.klusDay(s, log2, {}); out.cash = s.cash - c0;
    s.weekKlus = { id: 'wk_flessen', week: s.week - 1, need: 5, n: 0, done: false }; out.stale = S.weekKlusOpen(s);
    return out;
  });
  check('beloningen: +25 reputatie (klanttype), +€100 (flessen), en een klus van vorige week telt niet meer', rw.rep === 25 && rw.cash === 100 && rw.stale === null, JSON.stringify(rw));
  // de nieuwe soorten tellen uit het dagrapport
  const kinds = await ev(() => {
    const S = CC.SIM, s = app.s, out = {};
    const run = (k, prep) => { s.weekKlus = Object.assign({ week: s.week, n: 0, done: false }, k); const log = S.newDayLog(); prep(log); S.klusDay(s, log, {}); return s.weekKlus; };
    out.winst = run({ id: 'wk_winst', need: 500 }, l => { l.dayProfit = 180; }).n;
    out.verlies = (() => { s.weekKlus.n = 180; const log = S.newDayLog(); log.dayProfit = -40; S.klusDay(s, log, {}); return s.weekKlus.n; })();
    out.duur = run({ id: 'wk_duur', need: 10 }, l => { l.perWine = { wine_barolo: 3, wine_merlot: 9 }; l.prices = { wine_barolo: 24, wine_merlot: 6 }; }).n;
    out.advies = run({ id: 'wk_advies', need: 6 }, l => { l.advice = { good: 2 }; }).n;
    out.bubbels = run({ id: 'wk_bubbels', need: 12 }, l => { l.perWine = { wine_cremant: 4, wine_champagne: 2, wine_merlot: 9 }; }).n;
    // wk_op: na drie dagen met een lege plank niet meer haalbaar
    s.weekKlus = { id: 'wk_op', week: s.week, need: 4, n: 0, done: false };   // lat 4: na drie gemiste dagen klaar (bij lat 2 na vijf)
    for (const so of [0, 3, 1, 2]) { const log = S.newDayLog(); log.soldOut = so; S.klusDay(s, log, {}); }
    out.op = { n: s.weekKlus.n, miss: s.weekKlus.miss, dead: !!s.weekKlus.dead };
    return out;
  });
  check('winst telt per dag, een verliesdag telt mee', kinds.winst === 180 && kinds.verlies === 140, JSON.stringify(kinds));
  check('duur: alleen flessen van €20+; advies: goede antwoorden; bubbels: Crémant + Champagne', kinds.duur === 3 && kinds.advies === 2 && kinds.bubbels === 6);
  check('wk_op: na drie gemiste dagen niet meer haalbaar', kinds.op.n === 1 && kinds.op.miss === 3 && kinds.op.dead, JSON.stringify(kinds.op));
  await ev(() => { app.s.weekKlus = { id: 'wk_op', week: app.s.week, need: 4, n: 1, miss: 3, dead: true, done: false }; app.s.klussen = [{ lvl: 5, n: 2 }]; app.closePanel(); });
  const dead = await hit('klus_wk');
  check('wk_op grijs op het klussenpaneel, met uitleg', dead && /Niet meer haalbaar/.test(dead.tip || ''), dead && dead.tip);
  await shot('B1-wk_op-grijs');
  // zondag met een klus die niet gehaald is: eerst die regel, dan de nieuwe klus
  await ev(() => { const s = app.s; s.day = 6; s.cash = Math.max(s.cash, 2000); s.weekKlus = { id: 'wk_winst', giver: 'bankier', week: s.week, need: 900, n: 400, done: false }; s.sun = null; app.openSunday(); app.ring = null; });
  await click('pay'); await wait(1800);
  const fl = await ev(() => ({ next: app.s.nextWeekKlus, cur: app.s.weekKlus }));
  check('zondag: niet gehaald + nieuwe klus van een andere opdrachtgever', fl.next && fl.next.giver === 'ronnie' && !!(await hit('weekklus_next')), JSON.stringify(fl.next));
  await shot('B1-zondag-niet-gehaald');
  // score: 50 punten per weekklus
  const sc = await ev(() => { app.s.weekKlusDone = 3; const f = CC.UI.finalScore(app.s); return f.rows.find(r => r.l === CC.TEXT.weekKlus.scoreRow); });
  check('score: 3 weekklussen = 150 punten', sc && sc.p === 150, JSON.stringify(sc));
  // voorwaarden en opdrachtgever over veel staten
  const cond = await ev(() => {
    const S = CC.SIM; let bad = [], same = 0, seen = {};
    for (let seed = 1; seed <= 300; seed++) {
      const s = CC.newState(seed); s.level = 1 + seed % 8; s.week = 4 + seed % 4; s.status = 'playing';
      if (seed % 2) s.upgrades = { kast3: true, kast4: seed % 4 === 1 };
      CC.SIM.unlockedWines(s).slice(-(2 + seed % 7)).forEach((w, i) => { const v = S.activeVakIds(s)[i]; if (v) { S.buy(s, w.id, 6); S.assignVak(s, v, w.id); } });
      if (seed % 3 === 0 && S.staffUnlocked(s, 'fatima')) s.staff = { fatima: { xp: 0, level: 1 } };
      for (let d = 0; d < 6; d++) s.history.push({ week: s.week - 1, day: d, bottles: 30, profit: seed % 5 ? 60 : -10, wines: {}, types: {}, stands: {}, work: {} });
      const prevs = CC.WEEKKLUS.list.map(x => x.id);
      s.weekKlus = { id: prevs[seed % 9], week: s.week - 1, done: true };
      const k = S.planWeekKlus(s, s.week); if (!k) continue;
      seen[k.id] = 1;
      if (!S.weekKlusOk(s, k)) bad.push(seed + ':' + k.id);
      if (k.id === s.weekKlus.id) bad.push(seed + ':zelfde');
      const g0 = S.weekKlusDef(s.weekKlus.id).giver;
      const others = CC.WEEKKLUS.list.filter(x => x.giver !== g0 && x.id !== s.weekKlus.id);
      if (k.giver === g0) same++;
    }
    return { bad, same, seen: Object.keys(seen).length, ids: Object.keys(seen).join(',') };
  });
  check('nooit een klus zonder voorwaarde of twee keer dezelfde', cond.bad.length === 0, cond.bad.slice(0, 5).join(' '));
  check('alle negen klussen komen voor', cond.seen === 9, cond.ids);
  // deterministisch: zondag en startWeek kiezen dezelfde klus
  const det = await ev(() => { const S = CC.SIM, s = app.s; const a = S.planWeekKlus(s, s.week + 1), b = S.planWeekKlus(s, s.week + 1); return JSON.stringify(a) === JSON.stringify(b); });
  check('weekklus is deterministisch per seed en week', det);

  check('geen fouten in de console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FOUT(EN)` : '\nAlles groen.');
  process.exit(fails ? 1 : 0);
})();
