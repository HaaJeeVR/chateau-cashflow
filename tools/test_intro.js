// Intro in een echte browser (besluit 86). Vraagt Playwright (npm i playwright).
// Draaien: node tools/test_intro.js [map-voor-screenshots]
// Controleert: speelt bij de eerste start, overslaan met klik/toets/tik op elk moment (zonder dat de klik een menuknop raakt),
// vlag blijft staan, "Intro" in het menu speelt opnieuw, reduced motion, deterministisch renderAt(t),
// pixel-perfect op ×2/×3/×4 en werkt ook vanaf schijf (file://, zoals dubbelklikken op index.html).
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
const SHOT_TIMES = [0.3, 2.6, 5.2, 7.6, 10.4, 10.95, 12.6, 14.5, 16.4, 18.2, 19.75, 20.5, 22];
const SKIP_TIMES = [0.2, 2.5, 4.4, 6.5, 10.5, 11.7, 14, 17.5, 19.2, 21, 23];

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const wait = ms => page.waitForTimeout(ms);
  const frames = (n = 2) => ev(n => new Promise(r => { const f = k => k ? requestAnimationFrame(() => f(k - 1)) : r(); f(n); }), n);
  const fresh = async (q) => { await page.goto(url + (q || '')); await ev(() => localStorage.clear()); await page.goto(url + (q || '')); await page.waitForFunction(() => window.app && CC.INTRO && CC.INTRO.status(app.images) === 'ok', null, { timeout: 15000 }); await frames(); };
  const at = async t => { await ev(t => { app.introT = t; }, t); await frames(); };
  const state = () => ev(() => ({ phase: app.phase, seen: CC.getSetting('introSeen'), hasSave: !!localStorage.getItem('chateau-cashflow-save-v1'), s: !!app.s, confirm: app.confirmNew }));

  console.log('I-1: eerste start speelt de intro, daarna niet meer');
  await fresh();
  let s = await state();
  check('eerste start: intro', s.phase === 'intro', s.phase);
  check('feedbackknop verborgen tijdens de intro', await ev(() => getComputedStyle(document.getElementById('fb-btn')).visibility === 'hidden'));
  await wait(1500);
  check('de tijd loopt', await ev(() => app.introT > 1), String(await ev(() => app.introT.toFixed(2))));
  await page.mouse.click(640, 640);   // waar straks "Nieuw spel" staat
  await frames(3);
  s = await state();
  check('klik: naar het titelscherm', s.phase === 'title', s.phase);
  check('klik raakt geen menuknop (geen nieuw spel, geen vraag)', !s.s && !s.hasSave && !s.confirm);
  check('vlag gezet', s.seen === true);
  check('feedbackknop weer zichtbaar', await ev(() => getComputedStyle(document.getElementById('fb-btn')).visibility === 'visible'));
  await page.reload(); await wait(400);
  check('herladen: direct het titelscherm', (await state()).phase === 'title');
  // "Nieuw spel" wist de vlag niet
  await ev(() => { app.newGame(); CC.clearSave(); }); await page.reload(); await wait(400);
  check('na nieuw spel + opnieuw beginnen: geen intro', (await state()).phase === 'title');

  console.log('I-2: "Intro" in het menu speelt hem opnieuw');
  const hit = await ev(() => { const h = CC.UI.hits.find(x => x.id === 'intro'); return h && { x: h.x + h.w / 2, y: h.y + h.h / 2 }; });
  check('knop "Intro" staat in het menu', !!hit);
  if (hit) {
    const r = await page.locator('#game').boundingBox();
    await page.mouse.click(r.x + hit.x / 640 * r.width, r.y + hit.y / 360 * r.height); await frames(3);
    check('klik op "Intro": intro speelt', (await state()).phase === 'intro', (await state()).phase);
    await page.keyboard.press('Escape'); await frames(2);
    check('Escape: terug naar het menu', (await state()).phase === 'title');
  }

  console.log('I-3: overslaan werkt op elk moment, met klik, toets en tik');
  for (const how of ['klik', 'spatie', 'enter', 'letter']) {
    let okAll = true, info = [];
    for (const t of SKIP_TIMES) {
      await ev(() => app.playIntro(0)); await at(t);
      if (how === 'klik') { const r = await page.locator('#game').boundingBox(); await page.mouse.click(r.x + r.width / 2, r.y + r.height * 0.89); }
      if (how === 'spatie') await page.keyboard.press(' ');
      if (how === 'enter') await page.keyboard.press('Enter');
      if (how === 'letter') await page.keyboard.press('n');
      await frames(3);
      const st = await state();
      if (st.phase !== 'title' || st.s || st.confirm) { okAll = false; info.push(t + 's→' + st.phase); }
    }
    check('overslaan met ' + how + ' op ' + SKIP_TIMES.length + ' momenten', okAll, info.join(', '));
  }
  // tik op een touchscreen, precies waar straks "Nieuw spel" staat: de nagebootste muisklik mag die knop niet raken
  const tctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const tp = await tctx.newPage(); await tp.goto(url); await tp.evaluate(() => localStorage.clear());
  let tOk = true; const tInfo = [];
  for (const t of SKIP_TIMES) {
    await tp.goto(url + '?intro=' + t); await tp.waitForFunction(() => window.app && CC.INTRO.status(app.images) === 'ok'); await tp.evaluate(() => { app.introPause = false; });
    const r = await tp.locator('#game').boundingBox();
    await tp.touchscreen.tap(r.x + r.width / 2, r.y + r.height * 323 / 360); await tp.waitForTimeout(150);
    const st = await tp.evaluate(() => ({ phase: app.phase, s: !!app.s, confirm: app.confirmNew }));
    if (st.phase !== 'title' || st.s || st.confirm) { tOk = false; tInfo.push(t + 's→' + JSON.stringify(st)); }
  }
  check('overslaan met tik op ' + SKIP_TIMES.length + ' momenten, zonder menuknop te raken', tOk, tInfo.join(', '));
  await tctx.close();
  await ev(() => app.playIntro(0)); await at(3);
  await page.keyboard.down('Alt'); await page.keyboard.press('Tab'); await page.keyboard.up('Alt'); await page.keyboard.press('Shift'); await frames(2);
  check('Alt-Tab en Shift slaan niet over', (await state()).phase === 'intro');
  await page.keyboard.press('Escape'); await frames(2);

  console.log('I-4: deterministisch en scrubbaar');
  const det = await ev(() => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360; const g = c.getContext('2d');
    const shot = t => { g.clearRect(0, 0, 640, 360); CC.INTRO.renderAt(g, t); return c.toDataURL(); };
    const a = shot(15.3), b = shot(4.9), a2 = shot(15.3), b2 = shot(4.9), e = shot(7.4), e2 = shot(7.4);
    return a === a2 && b === b2 && e === e2 && a !== b;
  });
  check('zelfde t = zelfde beeld, ook na terugspoelen', det);
  await page.goto(url + '?intro=12.5'); await page.waitForFunction(() => window.app && CC.INTRO.status(app.images) === 'ok'); await wait(500);
  check('?intro=12.5 staat stil op 12,5 s', await ev(() => app.phase === 'intro' && app.introPause && Math.abs(app.introT - 12.5) < 1e-6));
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowRight'); await frames(2);
  check('pijltjes scrubben (12,5 → 13,6)', await ev(() => Math.abs(app.introT - 13.6) < 1e-6), String(await ev(() => app.introT)));
  if (SHOTS) for (const t of SHOT_TIMES) { await at(t); await page.locator('#game').screenshot({ path: path.join(SHOTS, `intro_${String(t.toFixed(2)).padStart(5, '0')}.png`) }); }

  console.log('I-5: pixel-perfect op hele schaalfactoren');
  for (const [w, h, sc] of [[1280, 720, 2], [1920, 1080, 3], [2560, 1440, 4]]) {
    const p2 = await browser.newPage({ viewport: { width: w, height: h } });
    await p2.goto(url + '?intro=16.4'); await p2.waitForFunction(() => window.app && CC.INTRO.status(app.images) === 'ok'); await p2.waitForTimeout(400);
    const buf = await p2.locator('#game').screenshot();
    const res = await p2.evaluate(async ({ b64, sc }) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data; let bad = 0, n = 0;
      for (let by = 0; by + sc <= c.height; by += sc) for (let bx = 0; bx + sc <= c.width; bx += sc) {
        const i0 = (by * c.width + bx) * 4; n++;
        outer: for (let y = 0; y < sc; y++) for (let x = 0; x < sc; x++) { const i = ((by + y) * c.width + bx + x) * 4; if (d[i] !== d[i0] || d[i + 1] !== d[i0 + 1] || d[i + 2] !== d[i0 + 2]) { bad++; break outer; } }
      }
      return { w: c.width, h: c.height, bad, n };
    }, { b64: buf.toString('base64'), sc });
    check(`${w}×${h}: canvas ${res.w}×${res.h}, elk ${sc}×${sc}-blok één kleur`, res.w === 640 * sc && res.h === 360 * sc && res.bad === 0, `${res.bad} van ${res.n} blokken gemengd`);
    await p2.close();
  }

  console.log('I-6: prefers-reduced-motion');
  const rctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  const rp = await rctx.newPage(); await rp.goto(url); await rp.waitForFunction(() => window.app && CC.INTRO && CC.INTRO.status(app.images) === 'ok'); await rp.waitForTimeout(1300);
  const rr = await rp.evaluate(() => ({ phase: app.phase, reduced: app.reducedMotion, dur: CC.INTRO.REDUCED_DUR }));
  check('korte versie: intro speelt met reduced motion', rr.phase === 'intro' && rr.reduced, JSON.stringify(rr));
  const still = await rp.evaluate(() => { const c = document.createElement('canvas'); c.width = 640; c.height = 360; const g = c.getContext('2d'); CC.INTRO.renderAt(g, 1.0, { reduced: true }); const a = c.toDataURL(); CC.INTRO.renderAt(g, 9.0, { reduced: true }); return a === c.toDataURL(); });
  check('na de fade staat het beeld stil (geen regen, geen vallend logo, geen knipperen)', still);
  if (SHOTS) await rp.locator('#game').screenshot({ path: path.join(SHOTS, 'intro_reduced.png') });
  await rctx.close();

  console.log('I-7: vanaf schijf (file://), zoals dubbelklikken op index.html');
  const fp = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const ferr = []; fp.on('pageerror', e => ferr.push(String(e)));
  await fp.goto('file://' + path.join(ROOT, 'index.html').replace(/\\/g, '/') + '?intro=0');
  await fp.waitForFunction(() => window.app && CC.INTRO && CC.INTRO.status(app.images) === 'ok', null, { timeout: 15000 });
  for (const t of SHOT_TIMES) { await fp.evaluate(t => { app.introT = t; }, t); await fp.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
  check('alle shots tekenen zonder fouten', ferr.length === 0, ferr[0]);
  await fp.close();

  check('geen JavaScript-fouten', errors.length === 0, errors[0]);
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FOUT(EN)` : '\nAlles in orde.');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
