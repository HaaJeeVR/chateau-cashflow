// Pakket A (handoff na review 2) in een echte browser. Vraagt Playwright (npm i playwright).
// Draaien: node tools/test_pakketA.js [map-voor-screenshots]
// Bedient het spel met muisklikken op de klikvlakken (CC.UI.hits), niet via SIM, zodat knoppen die
// de bots overslaan ook getest worden.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const SHOTS = process.argv[2] || null;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }

const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); res.end(data); });
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const wait = ms => page.waitForTimeout(ms);
  const frames = (n = 2) => ev(n => new Promise(r => { const f = k => k ? requestAnimationFrame(() => f(k - 1)) : r(); f(n); }), n);
  const shot = async name => { if (SHOTS) await page.locator('#game').screenshot({ path: path.join(SHOTS, name + '.png') }); };
  // klikvlak op id zoeken (na een paar frames, want de UI is immediate-mode) en er met de muis op klikken
  const hit = async id => { await frames(2); return ev(id => { const h = CC.UI.hits.find(h => h.id === id); return h && { x: h.x, y: h.y, w: h.w, h: h.h, on: !!h.onClick }; }, id); };
  const click = async id => {
    const h = await hit(id); if (!h) return false;
    const b = await page.locator('#game').boundingBox();
    const k = b.width / 640;
    await page.mouse.click(b.x + (h.x + h.w / 2) * k, b.y + (h.y + h.h / 2) * k);
    await frames(3);
    return h.on;
  };
  const closeNotices = () => ev(() => { let i = 0; while (app.notice && i++ < 10) app.closeNotice(); });

  await page.goto(url); await ev(() => { localStorage.clear(); CC.setSetting('introSeen', true); }); await page.reload(); await wait(500);

  // ---------- A1: schaarse wijn bestellen ----------
  console.log('A1: schaarse wijn is met muisklikken te bestellen');
  await ev(() => { app.newGame(); app.s.level = 8; app.s.rep = 2000; app.s.cash = 5000; app.s.flags.introSeen = true; app.rebuildRoom(); app.startPrep(); });
  await closeNotices();
  await ev(() => { app.order = {}; });
  check('telefoon opent het bestelvenster', (await click('w_phone')) && (await ev(() => app.panel)) === 'assort');
  await wait(500);   // venster schuift in beeld
  const cap = await ev(() => ({ gev: CC.SIM.scarceLeft(app.s, 'wine_gevrey'), cha: CC.SIM.scarceLeft(app.s, 'wine_champagne') }));
  check('Gevrey 4 en Champagne 8 per week', cap.gev === 4 && cap.cha === 8, JSON.stringify(cap));
  const gp = await hit('op_wine_gevrey'), gq = await hit('oq_wine_gevrey');
  check('+6 en +12 bij Gevrey staan aan', gp && gp.on && gq && gq.on);
  await click('op_wine_gevrey');
  check('+6 bij Gevrey geeft 4', (await ev(() => app.order.wine_gevrey)) === 4, await ev(() => app.order.wine_gevrey));
  check('daarna staan de plusknoppen uit', !(await hit('op_wine_gevrey')).on && !(await hit('oq_wine_gevrey')).on);
  await click('oq_wine_champagne');
  check('+12 bij Champagne geeft 8', (await ev(() => app.order.wine_champagne)) === 8);
  await click('om_wine_champagne');
  check('−6 bij 8 Champagne geeft 2', (await ev(() => app.order.wine_champagne)) === 2);
  await click('om_wine_champagne');
  check('−6 bij 2 Champagne geeft 0', !(await ev(() => app.order.wine_champagne)));
  await click('op_wine_champagne'); await click('op_wine_champagne');
  check('+6 +6 bij Champagne geeft 8', (await ev(() => app.order.wine_champagne)) === 8);
  await shot('A1-gevrey-besteld');
  await click('place_order');
  const got = await ev(() => ({ gev: CC.SIM.totalBottles(app.s, 'wine_gevrey'), cha: CC.SIM.totalBottles(app.s, 'wine_champagne') }));
  check('na Bestellen: 4 Gevrey en 8 Champagne in huis', got.gev === 4 && got.cha === 8, JSON.stringify(got));

  // ---------- A2: failliet-scherm noemt de prijs ----------
  console.log('A2: failliet met alles op "stevig" noemt de prijs als eerste');
  const pmA2 = await ev(() => {
    const S = CC.SIM, s = CC.newState(4); const ids = ['wine_merlot', 'wine_sauvignon', 'wine_provence', 'wine_rioja'];
    ids.forEach((w, k) => { s.prices[w] = 'stevig'; s.targets[w] = 12; S.assignVak(s, 'vak_' + (k + 1), w); });
    s.flags.introSeen = true;
    for (let g = 0; g < 20 && s.status === 'playing'; g++) {
      for (s.day = 0; s.day < CC.CONFIG.daysPerWeek; s.day++) {
        S.refill(s); S.placeOrder(s, S.orderProposal(s)); S.unlockedWines(s).forEach(w => { s.prices[w.id] = 'stevig'; });
        const d = CC.DAY.start(s); CC.DAY.finish(d, s); S.endDay(s, d.log);
      }
      const r = S.payWeek(s); if (!r.ok && !S.postpone(s).ok) { S.bankrupt(s); break; } if (r.won) break;
      S.startWeek(s); s.mishap = null; s.card = null;
    }
    app.s = s; app.rebuildRoom(); app.setPhase('gameover');
    return s.status === 'bankrupt' && S.postmortem(s).lines.map(l => l.key);
  });
  check('failliet, eerste regel = te duur', pmA2 && pmA2[0] === 'tooExpensive', String(pmA2));
  await wait(3500); await shot('A2-failliet-prijs');

  // ---------- A3: bruiloft telt als de winkel opengaat ----------
  console.log('A3: bruiloft telt bij opening, met herinnering op donderdag');
  await ev(() => {
    app.newGame(); const s = app.s; s.flags.introSeen = true; s.level = 2; s.rep = 40; s.cash = 1500; s.mishap = null;
    app.rebuildRoom();
    CC.SIM.buy(s, 'wine_merlot', 24); CC.SIM.assignVak(s, 'vak_1', 'wine_merlot');
    CC.SIM.buy(s, 'wine_cremant', 10); CC.SIM.assignVak(s, 'vak_2', 'wine_cremant');
    s.card = { id: 'bruiloft', week: s.week }; s.day = 3; app.startPrep();
  });
  await closeNotices();
  await ev(() => { app.openShop(); app.skipDay(); }); await frames(4);
  const rem = await ev(() => { const po = CC.SIM.pendingOrder(app.s); return po && app.summary.day === po.day - 1 && po.have < po.need; });
  check('donderdag: herinnering in het dagrapport', rem);
  await ev(() => { app.resultT = 3; }); await wait(300); await shot('A3-donderdag-herinnering');
  await ev(() => { app.resultT = 9; app.afterResult(); while (app.phase === 'levelup' || app.phase === 'staffup') { if (app.phase === 'levelup') app.afterLevel(); else app.afterStaffUp(); } });
  await closeNotices();
  // vrijdagochtend: 18 in huis, 6 erbij bestellen
  await ev(() => { const s = app.s; s.mishap = null; const n = CC.SIM.totalBottles(s, 'wine_cremant'); s.stock.wine_cremant = (s.stock.wine_cremant || 0) + (18 - n); app.order = {}; });
  check('vrijdag, nog niet afgehandeld bij het begin van de ochtend', (await ev(() => app.s.day === 4 && !app.s.card.orderDone && !app.notice)));
  await click('w_phone'); await wait(500); await click('op_wine_cremant');
  await click('place_order'); await click('close');
  check('18 in huis + 6 besteld = 24', (await ev(() => CC.SIM.totalBottles(app.s, 'wine_cremant'))) === 24);
  const cash0 = await ev(() => app.s.cash);
  await click('open');
  const nt = await ev(() => ({ n: app.notice && app.notice.good, done: app.s.card.orderDone, phase: app.phase }));
  check('bij openen: bruiloft gelukt', nt.n === true && nt.done && nt.phase === 'prep', JSON.stringify(nt));
  check('geld van het bruidspaar binnen', (await ev(() => app.s.cash)) > cash0);
  await shot('A3-bruiloft-gelukt');
  await click('notice_ok');
  check('melding weg: de winkel gaat meteen open', (await ev(() => app.phase)) === 'sale');

  // ---------- A4: Ronnies voorstel ----------
  console.log('A4: Ronnie stelt geen wijnen zonder schap voor; eigen zin op dag 1');
  await ev(() => { app.newGame(); app.s.flags.introSeen = true; app.startPrep(); });
  await closeNotices();
  check('dag 1: Ronnie heeft niets klaargezet', (await ev(() => app.proposed)) === false);
  await click('w_phone'); await wait(500); await click('op_wine_merlot'); await click('op_wine_sauvignon');
  check('na +6: nog steeds geen "aangevuld"-zin', (await ev(() => !app.proposed && !app.s.history.length && !app.orderMsg)));
  await shot('A4-dag1-ronnie');
  await click('place_order');
  await ev(() => {
    app.openShop(); app.skipDay();
  });
  await frames(4);
  const a4 = await ev(() => {
    const s = app.s; app.resultT = 9; app.afterResult();
    while (app.notice) app.closeNotice();
    // sauvignon van het schap halen: morgen niet meer voorstellen
    const v = CC.SIM.vakOfWine(s, 'wine_sauvignon'); if (v) CC.SIM.assignVak(s, v, null);
    s.stock.wine_merlot = 0; for (const k in s.vakken) if (s.vakken[k].wine) s.vakken[k].n = 0; s.stock.wine_sauvignon = 0;
    app.startPrep();
    return { o: app.order, p: app.proposed };
  });
  check('wijn zonder schap niet in het voorstel', !a4.o.wine_sauvignon && a4.o.wine_merlot > 0 && a4.p, JSON.stringify(a4));

  // ---------- A5: beeldfoutjes die je kunt meten ----------
  console.log('A5: ballonnen zonder los woord, klussen over twee regels');
  const bl = await ev(() => ['Crémant de Loire', 'Gevrey-Chambertin', 'Sauvignon Blanc', 'Champagne brut', 'Provence rosé', 'Rioja Crianza'].map(n => CC.R.bubbleLines('Hè, ' + n + ' op.')));
  check('"Hè, X op.": geen regel van één woord', bl.every(ls => ls.length === 1 || ls.every(l => l.includes(' ') || l.endsWith('-'))), JSON.stringify(bl));
  await ev(() => { app.newGame(); const s = app.s; s.flags.introSeen = true; s.flags.opened = true; s.level = 7; s.klussen = [{ lvl: 6, n: 4 }, { lvl: 7, n: 2 }]; app.rebuildRoom(); app.startPrep(); while (app.notice) app.closeNotice(); });
  const kh = await hit('klus_6');
  check('klus krijgt ruimte voor twee regels', kh && kh.h >= 30, kh && kh.h);

  check('geen fouten in de console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FOUT(EN)` : '\nAlles groen.');
  process.exit(fails ? 1 : 0);
})();
