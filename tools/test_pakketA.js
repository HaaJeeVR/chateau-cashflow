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

  // ---------- A6: weetje alleen bij de gekozen wijn ----------
  console.log('A6: weetje alleen als het over de gekozen wijn gaat');
  const advShow = async (wineId, result) => {
    await ev(([wineId, result]) => {
      const q = CC.TEXT.advice.find(x => x.id === 'q12');
      if (app.phase !== 'sale') { app.newGame(); const s = app.s; s.flags.introSeen = true; s.mishap = null; CC.SIM.buy(s, 'wine_merlot', 12); CC.SIM.assignVak(s, 'vak_1', 'wine_merlot'); app.startPrep(); while (app.notice) app.closeNotice(); app.openShop(); }
      app.advice = { c: { type: 'buurt' }, stage: 'result', t: 1, res: { result, q, wineId, price: 9, tip: 1, dr: result === 'good' ? 1 : -1, miss: ['regio'], goodIds: ['wine_chablis'], reply: 'Hm.' } };
    }, [wineId, result]);
    await frames(3);
    return ev(() => !!CC.UI.hits.find(h => h.id === 'adv_ok'));
  };
  check('Chablis gekozen bij de oestervraag: venster tekent', await advShow('wine_chablis', 'good'));
  await shot('A6-weetje-chablis');
  check('Sauvignon gekozen: venster tekent zonder weetje', await advShow('wine_sauvignon', 'wrong'));
  await shot('A6-geen-weetje-sauvignon');
  const a6 = await ev(() => { const o = CC.TEXT.weetjeOver; return Object.keys(o).every(k => CC.TEXT.advice.some(q => q.id === k) && o[k].every(id => CC.wineById(id))); });
  check('weetjeOver verwijst naar bestaande vragen en wijnen', a6);
  await ev(() => { app.advice = null; app.skipDay(); });
  await frames(4);

  // ---------- A7: na de winst ----------
  console.log('A7: opnieuw spelen, beste score, weekkaart na week 8');
  const winSetup = () => ev(() => {
    app.newGame(); const s = app.s; s.flags.introSeen = true; s.level = 8; s.rep = 800; s.week = 8; s.day = 6; s.cash = 6000; s.debtPaid = 3280;
    s.totals.bottles = 900; s.card = { id: 'hittegolf', week: 8 }; s.mishap = null; app.rebuildRoom(); app.openSunday(); app.ring = null;
    app.bankPay();
  });
  await ev(() => CC.setSetting('bestScore', null));
  await winSetup(); await wait(5500);
  const best1 = await ev(() => ({ ph: app.phase, b: CC.getSetting('bestScore'), sc: CC.UI.finalScore(app.s).total }));
  check('schuldenvrij, score bewaard als beste', best1.ph === 'won' && best1.b && best1.b.score === best1.sc, JSON.stringify(best1));
  const rp = await hit('replay'), en = await hit('endless');
  check('knoppen "Opnieuw spelen" en "Verder spelen" naast elkaar', rp && en && rp.on && en.on && Math.abs(rp.y - en.y) < 1 && rp.x + rp.w <= en.x);
  await shot('A7-schuldenvrij-beste');
  await click('endless');
  const w9 = await ev(() => ({ week: app.s.week, card: app.s.card, st: app.s.status, ph: app.phase }));
  check('week 9: vrij spelen, oude weekkaart leeg', w9.week === 9 && w9.card === null && w9.st === 'endless' && w9.ph === 'prep', JSON.stringify(w9));
  await ev(() => CC.setSetting('bestScore', { score: 99999 }));
  await winSetup(); await wait(5500);
  check('lagere score overschrijft de beste niet', (await ev(() => CC.getSetting('bestScore').score)) === 99999);
  await click('replay');
  check('"Opnieuw spelen" start een nieuw spel', (await ev(() => app.phase === 'prep' && app.s.week === 1 && app.s.day === 0 && app.s.status === 'playing')));
  await ev(() => { while (app.notice) app.closeNotice(); app.setPhase('title'); app.hasSave = CC.hasSave(); });
  await wait(300); await shot('A7-titel-beste');

  // ---------- A8: opnieuw beginnen na uitstel ----------
  console.log('A8: "Opnieuw beginnen" op de zondag na uitstel, met bevestiging');
  await ev(() => { app.newGame(); const s = app.s; s.flags.introSeen = true; s.week = 3; s.day = 6; s.cash = 10; s.level = 2; s.mishap = null; app.rebuildRoom(); app.openSunday(); app.ring = null; });
  check('voor uitstel: geen knop', !(await hit('restart_ask')));
  await click('postpone'); await wait(1600);
  check('na uitstel: knop staat er', !!(await hit('restart_ask')));
  await shot('A8-zondag-na-uitstel');
  await click('restart_ask');
  check('eerst bevestigen', (await ev(() => app.confirmNew)) === true && (await ev(() => app.s.week)) === 3);
  await shot('A8-bevestigen');
  await click('confirm_no');
  check('Terug: niets veranderd', (await ev(() => !app.confirmNew && app.s.week === 3 && app.phase === 'sunday')));
  await click('restart_ask'); await click('confirm_yes');
  check('Ja: nieuw spel in week 1, oude als reservekopie', (await ev(() => app.s.week === 1 && app.phase === 'prep' && CC.hasBackup() && CC.backupInfo().week === 3)));
  await ev(() => { while (app.notice) app.closeNotice(); });

  // ---------- A10: het moment van verkopen, in beeld ----------
  console.log('A10: munt naar de kas, fles uit de kast, drukte, doos');
  await ev(() => {
    app.newGame(); const s = app.s; s.flags.introSeen = true; s.flags.opened = true; s.level = 8; s.rep = 900; s.cash = 3000; s.mishap = null; app.rebuildRoom();
    CC.SIM.activeVakIds(s).forEach((v, i) => { const w = CC.SIM.unlockedWines(s)[i]; if (w) { CC.SIM.buy(s, w.id, 12); CC.SIM.assignVak(s, v, w.id); } });
    app.startPrep(); while (app.notice) app.closeNotice(); app.openShop(); app.day.speed = 4; app.speed = 4;
  });
  let seen = { coin: false, lag: false, ghost: false, maxFly: 0 };
  for (let i = 0; i < 160; i++) {
    const r = await ev(() => ({ fly: CC.FX.flying.length, pend: CC.FX.cashPending(), lag: app.cashShown < app.s.cash - 0.5, ghost: CC.FX.parts.some(p => p.ghost) }));
    if (r.fly) seen.coin = true; if (r.pend > 0 && r.lag) seen.lag = true; if (r.ghost) seen.ghost = true; seen.maxFly = Math.max(seen.maxFly, r.fly);
    await wait(50);
  }
  check('verkoop: munt vliegt naar de kas, kas telt pas op als hij landt', seen.coin && seen.lag, JSON.stringify(seen));
  check('fles komt zichtbaar uit de kast bij het pakken', seen.ghost);
  check('4×, niveau 8: hooguit 5 munten tegelijk', seen.maxFly >= 1 && seen.maxFly <= 5, String(seen.maxFly));
  await ev(() => app.skipDay()); await frames(4);
  check('na de dag: geen munten meer onderweg', (await ev(() => CC.FX.flying.length === 0 && CC.FX.cashPending() === 0)));
  await ev(() => { app.newGame(); const s = app.s; s.flags.introSeen = true; s.level = 2; s.cash = 800; s.day = 6; s.mishap = null; app.openSunday(); app.ring = null; app.bankPay(); app.sunday.cards = ['doos', 'hittegolf']; app.chooseCard('doos'); });
  await wait(3000);
  check('doos: onthulling met de wijn en daarna "Week 2"', (await ev(() => !!app.s.card.box)) && !!(await hit('newweek')));
  await shot('A10-doos');

  // ---------- A9: telefoon liggend en staand, delen ----------
  console.log('A9: touch op 844 x 390, staand scherm, favicon en deelvoorbeeld');
  {
    const tp = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    tp.on('pageerror', e => errors.push(String(e)));
    const tev = (fn, a) => tp.evaluate(fn, a);
    const tframes = () => tev(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await tp.goto(url); await tev(() => { localStorage.clear(); CC.setSetting('introSeen', true); }); await tp.reload(); await tp.waitForTimeout(500);
    const box = await tp.locator('#game').boundingBox(), k = box.width / 640;
    const tap = async (gx, gy) => { await tp.touchscreen.tap(box.x + gx * k, box.y + gy * k); await tframes(); await tframes(); };
    const thit = async id => { await tframes(); return tev(id => { const h = CC.UI.hits.find(h => h.id === id); return h && { x: h.x, y: h.y, w: h.w, h: h.h }; }, id); };
    await tev(() => { app.newGame(); const s = app.s; s.flags.introSeen = true; s.level = 8; s.rep = 900; s.cash = 3000; s.mishap = null; app.rebuildRoom(); app.startPrep(); while (app.notice) app.closeNotice(); app.order = {}; app.openPanel('phone'); });
    await tp.waitForTimeout(400);
    const min = await tev(() => app.touchMin());
    check('40 CSS-px = ' + min + ' spelpixels', min >= 36 && min <= 38, String(min));
    const p12 = await thit('oq_wine_merlot');
    await tap(p12.x + p12.w + 7, p12.y + p12.h / 2);   // 7 spelpixels rechts naast +12, waar geen knop staat
    check('tik naast +12 telt als +12 (Merlot)', (await tev(() => app.order.wine_merlot)) === 12, JSON.stringify(await tev(() => app.order)));
    const p6 = await thit('op_wine_merlot');
    await tap(p6.x + p6.w / 2, p6.y - 1);   // net boven +6 (in de naad met de rij erboven): de dichtstbijzijnde knop wint
    check('tik in de naad tussen twee rijen: dichtstbijzijnde knop (+6 Merlot)', (await tev(() => app.order.wine_merlot)) === 18 && (await tev(() => Object.keys(app.order).length)) === 1, JSON.stringify(await tev(() => app.order)));
    const cl = await thit('close');
    await tap(cl.x + cl.w + 6, cl.y + cl.h / 2);   // naast het kruisje
    check('tik naast het kruisje sluit het venster', (await tev(() => app.panel)) === null);
    await tev(() => { CC.SIM.buy(app.s, 'wine_merlot', 12); CC.SIM.assignVak(app.s, 'vak_1', 'wine_merlot'); app.openPanel('prices'); }); await tp.waitForTimeout(400);
    const pr = await thit('pr_wine_merlot_stevig');
    const st0 = await tev(() => app.s.prices.wine_merlot);
    await tap(pr.x + pr.w / 2, pr.y + pr.h / 2);
    check('eerste tik op een prijsstand: alleen de tooltip', (await tev(() => app.s.prices.wine_merlot)) === st0 && (await tev(() => app.touchTip)) === 'pr_wine_merlot_stevig');
    if (SHOTS) await tp.screenshot({ path: path.join(SHOTS, 'A9-tooltip-touch.png') });
    await tap(pr.x + pr.w / 2, pr.y + pr.h / 2);
    check('tweede tik voert uit', (await tev(() => app.s.prices.wine_merlot)) === 'stevig');
    await tev(() => { app.openPanel('phone'); }); await tp.waitForTimeout(400);
    if (SHOTS) await tp.screenshot({ path: path.join(SHOTS, 'A9-bestellen-844x390.png') });
    // staand: melding, en de verkoopdag staat stil
    await tev(() => { app.closePanel(); app.openShop(); });
    await tp.setViewportSize({ width: 390, height: 844 }); await tp.waitForTimeout(300);
    const pt = await tev(() => ({ p: app.portrait, cls: document.body.classList.contains('portrait'), t: app.day && app.day.t }));
    await tp.waitForTimeout(500);
    const t2 = await tev(() => app.day && app.day.t);
    check('staand: melding "Draai je telefoon" en de dag staat stil', pt.p && pt.cls && t2 === pt.t, JSON.stringify(pt) + ' ' + t2);
    if (SHOTS) await tp.screenshot({ path: path.join(SHOTS, 'A9-staand.png') });
    await tp.setViewportSize({ width: 844, height: 390 }); await tp.waitForTimeout(300);
    check('weer liggend: melding weg', (await tev(() => !app.portrait && !document.body.classList.contains('portrait'))));
    const meta = await tev(() => ({ icon: !!document.querySelector('link[rel=icon]'), og: ['og:title', 'og:description', 'og:image'].every(p => document.querySelector(`meta[property="${p}"]`)), d: !!document.querySelector('meta[name=description]') }));
    check('favicon, og:title/description/image en description in index.html', meta.icon && meta.og && meta.d, JSON.stringify(meta));
    const fav = await tp.request.get(url + 'assets/favicon.png'), og = await tp.request.get(url + 'assets/og_image.jpg'), ico = await tp.request.get(url + 'favicon.ico');
    check('favicon.png, favicon.ico en og_image.jpg bestaan', fav.ok() && og.ok() && ico.ok());
    await tp.close();
  }

  check('geen fouten in de console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FOUT(EN)` : '\nAlles groen.');
  process.exit(fails ? 1 : 0);
})();
