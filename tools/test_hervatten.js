// Hervatten in een echte browser (fase 0). Optioneel: vraagt Playwright (npm i playwright).
// Draaien: node tools/test_hervatten.js [map-voor-screenshots]
// Speelt echte fases af via window.app, herlaadt de pagina op elk overgangsmoment en controleert dat er niets dubbel gebeurt.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const SHOTS = process.argv[2] || null;
let fails = 0;
function check(name, cond, info) { console.log((cond ? '  OK  ' : '  FOUT') + '  ' + name + (info ? '  (' + info + ')' : '')); if (!cond) fails++; }

const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
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
  const shot = async name => { if (SHOTS) await page.locator('#game').screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const wait = ms => page.waitForTimeout(ms);
  const reload = async () => { await page.reload(); await wait(400); await ev(() => app.continueGame()); await wait(150); };
  const st = () => ev(() => ({ phase: app.phase, week: app.s.week, day: app.s.day, cash: app.s.cash, hist: app.s.history.length, paid: app.s.debtPaid, due: CC.SIM.weekDue(app.s), sun: app.sunday && { stage: app.sunday.stage, cards: app.sunday.cards, chosen: app.sunday.chosen }, card: app.s.card }));
  // een verkoopdag afmaken tot en met de kassabon
  const playDay = () => ev(() => { app.openShop(); app.skipDay(); });
  const nextFromResult = () => ev(() => { app.resultT = 9; app.afterResult(); while (app.phase === 'levelup' || app.phase === 'staffup') { if (app.phase === 'levelup') app.afterLevel(); else app.afterStaffUp(); } });

  await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.reload(); await wait(500);
  await shot('01-titel-leeg');

  console.log('H-1: herladen op de kassabon herhaalt de dag niet');
  await ev(() => { app.newGame(); while (app.notice) app.closeNotice(); ['wine_merlot', 'wine_sauvignon', 'wine_provence', 'wine_rioja'].forEach(id => app.setTarget(id, 12)); });
  await playDay(); await wait(100);
  const a = await st();
  await reload();
  const b = await st();
  check('na herladen: weer de kassabon', b.phase === 'result', b.phase);
  check('zelfde dag, kas en historie', a.day === b.day && a.cash === b.cash && a.hist === b.hist, `${a.day}/${a.cash}/${a.hist} → ${b.day}/${b.cash}/${b.hist}`);
  await shot('02-bon-na-herladen');
  await nextFromResult();
  const c = await st();
  check('daarna gewoon de volgende ochtend', c.phase === 'prep' && c.day === a.day + 1, `${c.phase} dag ${c.day}`);

  console.log('H-2: betaalde zondag blijft betaald');
  for (let i = 0; i < 6 && (await st()).phase === 'prep'; i++) { await playDay(); await nextFromResult(); }
  let s1 = await st();
  check('zondag bereikt', s1.phase === 'sunday', s1.phase);
  await ev(() => { if (app.s.cash < CC.SIM.weekDue(app.s)) { app.s.cash = 500; app.setPhase('title'); app.s.sun = null; app.openSunday(); } });
  await ev(() => app.bankPay());
  const p1 = await st();
  await reload();
  const p2 = await st();
  check('na herladen: geen nieuw betaalverzoek', p2.phase === 'sunday' && p2.sun.stage === 'done', JSON.stringify(p2.sun && p2.sun.stage));
  check('kas en afgelost gelijk', p1.cash === p2.cash && p1.paid === p2.paid, `${p1.cash}/${p1.paid} → ${p2.cash}/${p2.paid}`);
  check('dezelfde kaarten', JSON.stringify(p1.sun.cards) === JSON.stringify(p2.sun.cards), p1.sun.cards + ' / ' + p2.sun.cards);
  await ev(() => app.bankPay());
  check('nog eens betalen boekt niets af', (await st()).cash === p2.cash);
  await shot('03-kaarten-na-herladen');
  await ev(() => app.chooseCard(app.sunday.cards[0]));
  const k1 = await st();
  await reload();
  const k2 = await st();
  check('gekozen kaart blijft gekozen', k2.sun.chosen === k1.sun.chosen && k2.card && k2.card.id === k1.card.id, k2.sun.chosen);
  await ev(() => app.chooseCard(app.sunday.cards[1]));
  check('tweede kaart kiezen kan niet, kas gelijk', (await st()).cash === k1.cash && (await st()).card.id === k1.card.id);
  await ev(() => app.bankNextWeek());
  const w2 = await st();
  check("week 2, maandag", w2.week === 2 && w2.day === 0 && w2.phase === "prep", `week ${w2.week} dag ${w2.day} ${w2.phase}`);

  console.log('H-3: uitstel overleeft herladen');
  for (let i = 0; i < 6 && (await st()).phase === 'prep'; i++) { await ev(() => { if (app.s.mishap && !app.s.mishap.choice) app.decideMishap('b'); app.mishapMsg = null; }); await playDay(); await nextFromResult(); }
  await ev(() => { app.s.cash = 20; app.s.sun = null; app.openSunday(); });
  const u0 = await st();
  const REP = await ev(() => CC.CONFIG.repay);
  check('bank vraagt de termijn van week 2', u0.sun.stage === 'ask' && u0.due === REP[1], '€' + u0.due);
  await ev(() => app.bankPostpone());
  await reload();
  const u1 = await st();
  check("na herladen: uitstel staat, niets te betalen", u1.sun && u1.sun.stage === 'done' && u1.due === 0 && u1.cash === 20, `stage ${u1.sun.stage}, due ${u1.due}, kas ${u1.cash}`);
  await ev(() => { const ok = app.sunday.cards.find(id => { const c = CC.cardById(id); return !c.cost || app.s.cash >= c.cost; }); if (ok) app.chooseCard(ok); app.bankNextWeek(); });
  const u2 = await st(); const CCfine = await ev(() => CC.CONFIG.postponeFine);
  check('week 3 vraagt termijn + uitgesteld + boete', u2.due === REP[2] + REP[1] + CCfine, '€' + u2.due + ` (fase ${u2.phase}, week ${u2.week})`);

  console.log('H-4: nieuw spel vraagt eerst, reservekopie werkt');
  const before = await st();
  await page.reload(); await wait(400);
  await ev(() => app.askNewGame());
  check('vraagt om bevestiging', await ev(() => app.confirmNew));
  await wait(100); await shot('04-bevestiging-nieuw-spel');
  await ev(() => app.newGame());
  const n1 = await st();
  check('nieuw spel begint in week 1', n1.week === 1 && n1.day === 0);
  await page.reload(); await wait(400);
  check('reservekopie beschikbaar', await ev(() => app.hasBackup));
  await wait(100); await shot('05-titel-met-reserve');
  await ev(() => app.restoreBackup()); await wait(100);
  const r1 = await st();
  check('reservekopie terug: week ' + before.week, r1.week === before.week && r1.cash === before.cash, `week ${r1.week}, kas ${r1.cash}`);

  console.log('H-5: spelcode en mislukt opslaan');
  const code = await ev(() => CC.exportCode(app.s));
  await ev(() => { localStorage.clear(); });
  const imp = await ev(c => !!CC.importCode(c), code);
  check('spelcode inladen werkt', imp && (await ev(() => CC.load().week)) === before.week);
  await ev(() => { app.openCode('export'); }); await wait(100);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, '06-spelcode.png') });
  await ev(() => app.closeCode());
  await ev(() => { const orig = localStorage.setItem.bind(localStorage); Storage.prototype.setItem = () => { throw new Error('quota'); }; app.save(); window._orig = orig; });
  await wait(100);
  check('mislukt opslaan geeft een melding', await ev(() => app.saveFailed));
  await shot('07-niet-opgeslagen');

  check('geen scriptfouten', errors.length === 0, errors.join(' | '));
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FOUT(EN)` : '\nAlles groen.');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
