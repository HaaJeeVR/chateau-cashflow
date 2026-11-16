// Screenshots voor 20_HANDOFF_VERGELIJKING (taak 1 tot 3). Vraagt Playwright (npm i playwright).
// Draaien: node tools/shots_20.js <map> [taak1|taak2|taak3]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || '/tmp/shots';
const ONLY = process.argv[3] || 'taak1';
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
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
  const shot = async name => { await page.mouse.move(2, 700); await frames(3); await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('  ' + name + '.png'); };
  await page.goto(url); await ev(() => { localStorage.clear(); CC.setSetting('introSeen', true); }); await page.reload(); await wait(600);

  // winkel op niveau L, volle schappen, alle prijzen normaal (zoals een speler die de prijzen laat staan)
  const setup = (L, seed) => ev(([L, seed]) => {
    const S = CC.SIM, C = CC.CONFIG, s = CC.newState(seed);
    Object.assign(s.flags, { introSeen: true, opened: true, bought: true, shelved: true, priced: true });
    s.cash = 2500; s.level = L; s.rep = C.levelRep[L - 1] + 5; s.week = 4; s.day = 2; s.mishap = null; s.card = null;
    s.upgrades = { kast3: true }; if (L >= 7) s.upgrades.uithangbord = true; if (L >= 8) s.upgrades.kast4 = true;
    s.staff = { sem: { xp: 0, level: 2 }, fatima: { xp: 0, level: 2 } };
    s.klussen = []; s.weekKlus = null;
    const vak = S.activeVakIds(s), un = S.unlockedWines(s);
    vak.forEach((v, i) => { const w = un[i]; if (w) { S.buy(s, w.id, 24); S.assignVak(s, v, w.id); s.targets[w.id] = 24; } });
    S.refill(s);
    app.s = s; app.rebuildRoom(); app.phase = 'prep'; app.panel = null; app.notice = null;
  }, [L, seed]);

  if (ONLY === 'taak1') {
    // Taak 1: groene ballon in een drukke winkel (niveau 6 of hoger)
    let ok = false;
    for (const [L, seed] of [[6, 11], [6, 12], [7, 13], [8, 14], [6, 15], [7, 16], [8, 17], [6, 18], [7, 19]]) {
      await setup(L, seed);
      await ev(() => { app.openShop(); app.speed = 2; app.bubblesShown = new Set(); });
      // echt spelen (op 2×) tot de groene ballon echt in beeld staat; dan pauzeren
      for (let k = 0; k < 220 && !ok; k++) {
        await wait(80);
        ok = await ev(() => {
          const shown = [...(app.bubblesShown || [])].some(b => b.tone === 'bargain' && b.t > 1.2);
          if (shown && app.day.customers.length >= 12) { app.speed = 0; return true; }
          return false;
        });
        if (await ev(() => app.phase !== 'sale')) break;
      }
      if (ok) { await frames(4); await shot(`T1-groene-ballon-niveau${L}`); break; }
    }
    if (!ok) console.log('  geen groene ballon gevonden');
    // Gisteren met tooltip
    await ev(() => { app.speed = 4; });
    await ev(() => { const d = app.day; while (!d.done) CC.DAY.step(d, app.s, CC.DAY.STEP); });
    await page.waitForFunction(() => app.phase === 'result', null, { timeout: 15000 }); await wait(500);
    await ev(() => { if (app.phase === 'result') { app.afterResult(); if (app.phase === 'result') app.afterResult(); } while (app.phase === 'levelup' || app.phase === 'staffup') { if (app.phase === 'levelup') app.afterLevel(); else app.afterStaffUp(); } while (app.notice) app.closeNotice(); app.s.mishap = null; });
    await frames(3);
    await wait(400);
    const st = await ev(() => { app.openPanel('lastday'); const sm = app.s.history[app.s.history.length - 1]; return { phase: app.phase, panel: app.panel, room: sm && Object.values(sm.wines).map(w => w.room || 0) }; });
    console.log('  ' + JSON.stringify(st));
    await frames(3);
    const h = await ev(() => { const h = CC.UI.hits.find(h => h.id.startsWith('ld_room_')); return h && { x: h.x, y: h.y, w: h.w, h: h.h, tip: h.tip }; });
    if (h) {
      const b = await page.locator('#game').boundingBox(), k = b.width / 640;
      await page.mouse.move(b.x + (h.x + 40) * k, b.y + (h.y + h.h / 2) * k); await wait(900); await frames(4);
      await page.screenshot({ path: path.join(OUT, 'T1-gisteren-tooltip.png') }); console.log('  T1-gisteren-tooltip.png  (' + h.tip + ')');
    } else console.log('  geen tooltip-regel in Gisteren');
  }
  if (errors.length) console.log('FOUTEN in de pagina:\n' + errors.join('\n'));
  await browser.close(); server.close();
})();
