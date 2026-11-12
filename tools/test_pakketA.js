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

  check('geen fouten in de console', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FOUT(EN)` : '\nAlles groen.');
  process.exit(fails ? 1 : 0);
})();
