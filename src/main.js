// Château Cashflow — main.js
// Opstarten, schaling, invoer, fases (titel → voorbereiden → verkoop → kassabon → zondag).
(function () {
  const CC = window.CC;
  const R = CC.R, UI = CC.UI, SIM = CC.SIM, DAY = CC.DAY, DBG = CC.DBG, P = CC.PAL;

  // Alles tekent naar een buffer van 640×360 (één pixelgrid). De zichtbare canvas krijgt die buffer
  // elke frame op een hele schaal k; CSS zet hem op de maat van het venster (besluit 87).
  const canvas = document.getElementById('game');
  const out = canvas.getContext('2d');
  const buf = document.createElement('canvas');
  buf.width = R.W; buf.height = R.H;
  const ctx = buf.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const app = {
    s: null, phase: 'title', day: null, summary: null,
    panel: null, panelVak: null, panelT: 0,
    speed: 1, acc: 0, t: 0, resultT: 0, resultQuip: '',
    mouse: { x: -1, y: -1 }, hoverId: null, click: null,
    worldRects: {}, images: {}, hasSave: CC.hasSave(), hasBackup: CC.hasBackup(), saveFailed: false, confirmNew: false,
    roomLevel: 0, phaseT: 0, levelQuip: '', sunday: null, advice: null,
  };
  window.app = app; // handig voor debug in de console

  // ---------- Afbeeldingen ----------
  const logo = new Image(); logo.src = 'assets/logo_main.png'; app.images.logo = logo;
  if (CC.TITLE) { const tb = new Image(); tb.src = CC.TITLE.image; app.images.title = tb; }
  const loadImg = (k, src) => { const im = new Image(); im.src = src; app.images[k] = im; return im; };
  if (CC.SPRITES) for (const t in CC.SPRITES) for (const v in CC.SPRITES[t]) loadImg('chr_' + t + '_' + v, CC.SPRITES[t][v].src);
  if (CC.PORTRAITS) for (const who in CC.PORTRAITS) for (const m in CC.PORTRAITS[who]) loadImg('por_' + who + '_' + m, CC.PORTRAITS[who][m].src);
  if (CC.BG) { loadImg('bg', CC.BG.image); for (const k in CC.BG.layers) loadImg('layer_' + k, CC.BG.layers[k]); }
  if (CC.WINE_SPRITES) for (const id in CC.WINE_SPRITES) for (const sz in CC.WINE_SPRITES[id]) loadImg('wine_' + id.slice(5) + '_' + sz, CC.WINE_SPRITES[id][sz].src);
  if (CC.CARD_ART) for (const id in CC.CARD_ART) loadImg('card_' + id, CC.CARD_ART[id].src);
  if (CC.CRITTERS) for (const k in CC.CRITTERS) loadImg('crit_' + k, CC.CRITTERS[k].src);
  if (CC.TILES) for (const k in CC.TILES) loadImg('tile_' + k, CC.TILES[k].src);
  if (CC.ICONS) for (const k in CC.ICONS) loadImg('icon_' + k, CC.ICONS[k].src);
  if (CC.DECOR_TILES) for (const lv in CC.DECOR_TILES) loadImg('tile_decor' + lv, CC.DECOR_TILES[lv]);
  if (CC.INTRO_ART) for (const k in CC.INTRO_ART) loadImg('intro_' + k, CC.INTRO_ART[k].src);
  loadImg('fg_straat', 'assets/fg_straat.png');   // lantaarnpaal en paaltjes vóór de figuren op straat (besluit 98)
  if (CC.FX && CC.FX.BIKE_SRC) for (const k in CC.FX.BIKE_SRC) loadImg('fiets_' + k, CC.FX.BIKE_SRC[k]);   // fietser (besluit 98); ontbreekt een beeld, dan rijdt ze niet
  // Eindbeeld failliet (B3): bestaat assets/rolluik.png, dan vervangt hij vanzelf het getekende rolluik (besluit 94).
  { const rl = new Image(); rl.onerror = () => { app.images.rolluik = null; }; rl.src = 'assets/rolluik.png'; app.images.rolluik = rl; }
  // Feestbeeld schuldenvrij (D1): bestaat assets/schuldenvrij.png (640 × 360), dan is dat de achtergrond van het
  // schuldenvrij-scherm in plaats van de winkel (besluit 101); ontbreekt het, dan blijft alles zoals het was.
  { const sv = new Image(); sv.onerror = () => { app.images.schuldenvrij = null; }; sv.src = 'assets/schuldenvrij.png'; app.images.schuldenvrij = sv; }
  CC.IMAGES = app.images;
  const logoSign = new Image(); logoSign.onload = () => { R.roomCache = null; if (app.portrait && typeof checkPortrait === 'function') checkPortrait(); }; logoSign.src = 'assets/logo_sign.png'; app.images.logoSign = logoSign;

  // ---------- Schaling (besluit 87, vervangt 12): venster vullen, 16:9 ----------
  // Doelmaat in apparaatpixels = zo groot mogelijk binnen het venster. De canvas krijgt de kleinste hele
  // schaal k van 640×360 die minstens zo groot is; CSS verkleint hem naar de doelmaat. Past het exact
  // (bv. 1920×1080 = 3×), dan wordt er niets geschaald en is het beeld pixel voor pixel gelijk aan 3×.
  let K = 1;
  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.min(window.innerWidth, window.innerHeight * R.W / R.H);
    const devW = Math.max(16, Math.floor(cssW * dpr / 16) * 16);   // veelvoud van 16: hoogte blijft heel (16:9)
    const devH = devW * R.H / R.W;
    const k = Math.max(1, Math.ceil(devW / R.W - 1e-9));
    if (canvas.width !== R.W * k) { canvas.width = R.W * k; canvas.height = R.H * k; }
    K = k;
    out.imageSmoothingEnabled = false;
    canvas.style.width = (devW / dpr) + 'px';
    canvas.style.height = (devH / dpr) + 'px';
    // Exact passend: geen schaling. Anders verkleint de browser met zijn gewone (zachte) filter:
    // dat oogt rustiger dan nearest-neighbour, dat pixels ongelijk breed maakt (tekst!).
    canvas.style.imageRendering = devW === R.W * k ? 'pixelated' : 'auto';
    app.scale = devW / dpr / R.W;                                   // CSS-px per spelpixel
  }
  // A9: telefoon staand: het spel is liggend. Melding in een eigen canvas, met het pixelfont en de vensterstijl,
  // op een hele schaal zodat het scherp blijft. De verkoopdag staat zolang stil.
  const rot = document.getElementById('rotate');
  const coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
  function checkPortrait() {
    const portrait = window.innerHeight > window.innerWidth && ((coarse && coarse.matches) || window.innerWidth < 600);
    app.portrait = portrait;
    document.body.classList.toggle('portrait', portrait);
    if (!portrait || !rot) return;
    const dpr = window.devicePixelRatio || 1, W = Math.round(window.innerWidth * dpr), H = Math.round(window.innerHeight * dpr);
    const s = Math.max(1, Math.round(W / 210));                 // ± 200 spelpixels breed
    const w = Math.ceil(W / s), h = Math.ceil(H / s);
    rot.width = w * s; rot.height = h * s;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    R.rect(g, 0, 0, w, h, P.ink);
    const pw = Math.min(w - 12, 184), ph = 132, px = Math.round((w - pw) / 2), py = Math.round((h - ph) / 2);
    R.panel(g, px, py, pw, ph);
    const sign = app.images.logoSign;   // het uithangbord van de winkel erboven
    if (sign && sign.complete && sign.naturalWidth) g.drawImage(sign, Math.round(w / 2 - sign.naturalWidth / 2), py - sign.naturalHeight - 10);
    // telefoontje dat kantelt: staand (grijs) en liggend (goud) met een boogpijl ertussen
    const cx = Math.round(w / 2);
    R.round(g, cx - 40, py + 16, 18, 30, 3, P.stone1); R.round(g, cx - 38, py + 18, 14, 24, 2, P.cream1); R.rect(g, cx - 33, py + 43, 4, 1, P.stone1);
    R.round(g, cx + 10, py + 22, 30, 18, 3, P.wood2); R.round(g, cx + 12, py + 24, 24, 14, 2, P.gold); R.rect(g, cx + 37, py + 29, 1, 4, P.wood2);
    for (let i = 0; i < 9; i++) R.rect(g, cx - 14 + i * 2, py + 18 + Math.round(Math.pow(i - 4, 2) / 4), 2, 2, P.bord2);
    R.rect(g, cx + 2, py + 20, 2, 2, P.bord2); R.rect(g, cx + 1, py + 23, 3, 2, P.bord2); R.rect(g, cx - 1, py + 21, 3, 2, P.bord2);
    CC.FONT.head.draw(g, 'Draai je telefoon', cx, py + 58, P.bord2, { align: 'center' });
    CC.FONT.wrap('Château Cashflow speel je liggend. Kantel je telefoon, dan gaat het spel verder.', pw - 24).forEach((l, i) => CC.FONT.draw(g, l, cx, py + 80 + i * 10, P.ink, { align: 'center' }));
    const o = rot.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(c, 0, 0, w * s, h * s);
  }
  window.addEventListener('resize', () => { fit(); checkPortrait(); }); fit();
  window.addEventListener('orientationchange', () => setTimeout(() => { fit(); checkPortrait(); }, 50));
  setTimeout(checkPortrait, 0);
  if (window.matchMedia) {   // schaal 100% ↔ 125% of ander scherm: devicePixelRatio verandert zonder resize
    const watchDpr = () => { const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`); const h = () => { fit(); watchDpr(); }; mq.addEventListener ? mq.addEventListener('change', h, { once: true }) : mq.addListener(h); };
    watchDpr();
  }
  function present() { out.drawImage(buf, 0, 0, R.W * K, R.H * K); }

  // ---------- Volledig scherm (Fullscreen API) ----------
  // Het hele document gaat fullscreen (niet alleen de canvas), zodat de HTML-vensters erboven blijven werken.
  const fsEl = document.documentElement;
  app.fsAvailable = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
  app.isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  app.toggleFullscreen = function () {
    if (!app.fsAvailable) return;
    try {
      if (app.isFullscreen()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const p = (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl); if (p && p.catch) p.catch(() => {}); }
    } catch (e) { /* geweigerd door de browser: niets aan de hand */ }
  };
  const fsChange = () => { document.body.classList.toggle('fs', app.isFullscreen()); fit(); };
  document.addEventListener('fullscreenchange', fsChange); document.addEventListener('webkitfullscreenchange', fsChange);

  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) / r.width * R.W), y: Math.floor((e.clientY - r.top) / r.height * R.H) };
  }
  // A9: tik of muis? pointerdown komt vóór de nagebootste mousedown van een tik
  app.touchInput = false;
  canvas.addEventListener('pointerdown', e => { app.touchInput = e.pointerType === 'touch' || e.pointerType === 'pen'; app.mouse = toGame(e); }, true);
  app.touchMin = () => Math.ceil(40 / (app.scale || 1));   // 40 CSS-px in spelpixels
  canvas.addEventListener('mousemove', e => { app.mouse = toGame(e); });
  canvas.addEventListener('mouseleave', () => { app.mouse = { x: -1, y: -1 }; });
  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    app.actT = app.t;   // de speler handelt: hints linksonder verdwijnen (besluit 89)
    const p = toGame(e);
    // fullscreen moet binnen de klik zelf (gebruikersgebaar), niet pas in de volgende frame
    const h = app.phase !== 'intro' && (app.touchInput ? UI.pickTouch(p.x, p.y, app.touchMin()) : UI.pick(p.x, p.y));
    if (h && h.id === 'fullscreen') { app.toggleFullscreen(); return; }
    app.click = p; p.touch = app.touchInput;
  });

  // ---------- Intro (besluit 86): bij de eerste start, vóór het titelscherm ----------
  // Speelt één keer (vlag in de instellingen, niet in de spelsave); klik, toets of tik slaat over; "Intro" in het menu speelt hem opnieuw.
  // Testen: index.html?intro speelt hem altijd; index.html?intro=12.5 staat stil op 12,5 s, met ← → (Shift = 1 s) scrub je.
  const qs = new URLSearchParams(location.search);
  const introParam = qs.has('intro') ? qs.get('intro') : null;
  app.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  app.playIntro = function (at, pause) {
    if (!CC.INTRO) return;
    app.phase = 'intro'; app.phaseT = 0; app.panel = null; app.confirmNew = false; app.click = null;
    app.introT = at || 0; app.introPause = !!pause; app.introWait = 0;
  };
  app.endIntro = function (notSeen) {
    if (!notSeen) CC.setSetting('introSeen', true);   // niet bij laadproblemen: dan volgende keer opnieuw proberen
    app.click = null; app.introPause = false;
    app.setPhase('title');
  };
  if (CC.INTRO && (introParam !== null || !CC.getSetting('introSeen'))) {
    const at = introParam ? parseFloat(introParam) : NaN;
    app.playIntro(isFinite(at) ? at : 0, isFinite(at));
  }
  // Tik op een touchscreen: direct overslaan, en geen nagebootste muisklik die daarna een menuknop raakt.
  canvas.addEventListener('touchstart', e => { if (app.phase === 'intro') { e.preventDefault(); app.endIntro(); } }, { passive: false });
  function introKey(e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;           // sneltoetsen van de browser, Alt-Tab
    if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock', 'F5', 'F11', 'F12'].includes(e.key)) return;
    if (e.key === 'F1') { e.preventDefault(); DBG.toggle(); return; }
    if (app.introPause && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault(); app.introT = Math.max(0, app.introT + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 : 0.1)); return;
    }
    e.preventDefault(); app.endIntro();
  }

  window.addEventListener('keydown', e => {
    if (!e.repeat) app.actT = app.t;
    if (app.phase === 'intro') return introKey(e);
    if (app.dialog) { if (e.key === 'Escape') app.closeDialog(); return; }   // feedback- of codevenster open (typen gaat via het tekstvak)
    if (app.confirmNew) { if (e.key === 'Escape') app.confirmNew = false; if (e.key === 'Enter') app.newGame(); return; }
    if (e.key === 'F1') { e.preventDefault(); DBG.toggle(); }
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) { app.toggleFullscreen(); return; }
    if (app.advice) {
      const A = app.advice;
      if (e.key === 'Escape') app.closeAdvice();
      if (A.stage === 'ask') {
        const i = parseInt(e.key, 10) - 1;
        if (A.c.ask && i >= 0 && i < A.c.ask.opts.length) app.answerAdvice(A.c.ask.opts[i]);
        if (e.key === 'n' || e.key === 'N' || e.key === '0') app.answerAdvice(null);
      } else if ((e.key === ' ' || e.key === 'Enter') && A.t > 0.3) { e.preventDefault(); app.closeAdvice(); }
      return;
    }
    if (e.key === 'Escape') { if (app.shelfPick) app.shelfPick = null; else app.closePanel(); }
    if (e.key === 'Tab' && app.panel === 'assort') { e.preventDefault(); app.assortTab = app.assortTab === 'prices' ? 'order' : 'prices'; app.shelfPick = null; }
    if ((e.key === 'p' || e.key === 'P') && app.phase === 'prep' && app.s && app.staffOpen()) { if (app.panel === 'staff') app.closePanel(); else app.openPanel('staff'); }
    if ((e.key === 'i' || e.key === 'I') && app.phase === 'prep' && app.s && app.investOpen()) { if (app.panel === 'invest') app.closePanel(); else app.openPanel('invest'); }
    if ((e.key === 'g' || e.key === 'G') && app.phase === 'prep' && app.s && app.s.history.length) { if (app.panel === 'lastday') app.closePanel(); else app.openPanel('lastday'); }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (app.phase === 'prep' && app.notice) app.closeNotice();
      else if (app.phase === 'prep' && app.mishapMsg) app.mishapMsg = null;
      else if (app.phase === 'prep' && !app.panel) app.openShop();
      else if (app.phase === 'result' && app.resultT > 0.3) app.afterResult();
      else if (app.phase === 'levelup' && app.phaseT > 0.4) app.afterLevel();
      else if (app.phase === 'staffup' && app.phaseT > 0.4) app.afterStaffUp();
      else if (app.phase === 'sunday' && app.ring) app.ring = null;
      else if (app.phase === 'sunday' && app.sunday && app.sunday.stage === 'done') app.bankNextWeek();
      else if (app.phase === 'prep' && app.mishapMsg) app.mishapMsg = null;
    }
    if (app.phase === 'sale') {
      if (e.key === '1') app.setSpeed(1);
      if (e.key === '2') app.setSpeed(2);
      if (e.key === '3' || e.key === '4') app.setSpeed(4);
      if (e.key === 's' || e.key === 'S') app.skipDay();
    }
  });

  // ---------- Opslaan ----------
  // Mislukt opslaan (vol, geblokkeerd)? Dan een blijvende melding in de HUD; de vorige goede save blijft staan.
  app.save = function () {
    if (!app.s) return;
    const ok = CC.save(app.s);
    app.saveFailed = !ok;
    if (ok) app.hasSave = true;
    return ok;
  };

  // ---------- Vensters met tekstinvoer, in de canvas (besluit 92) ----------
  // Feedback en spelcode worden in de stijl van het spel getekend (UI.textDialog). Typen, plakken en tikken gaan
  // via één onzichtbaar tekstvak dat precies over het tekstvak in beeld ligt; de canvas tekent de tekst zelf.
  const tin = document.createElement('textarea');
  tin.id = 'txtin'; tin.spellcheck = false; tin.setAttribute('autocomplete', 'off'); tin.setAttribute('aria-label', 'Tekst');
  Object.assign(tin.style, { position: 'fixed', display: 'none', zIndex: '6', opacity: '0', resize: 'none', border: '0', padding: '0', margin: '0',
    fontSize: '16px', lineHeight: '1', color: 'transparent', background: 'transparent', caretColor: 'transparent', outline: 'none', overflow: 'hidden' });
  document.body.appendChild(tin);
  app.textInput = tin;
  tin.addEventListener('keydown', e => {
    e.stopPropagation();   // spatie, cijfers, S, P, F ... niet naar het spel
    if (e.key === 'Escape') { e.preventDefault(); app.closeDialog(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); app.dialogAction(); }
  });
  tin.addEventListener('input', () => { if (app.dialog && !app.dialog.busy) { app.dialog.msg = ''; app.dialog.err = false; } });
  app.openDialog = function (d) {
    app.dialog = Object.assign({ t0: app.t, msg: '', err: false, busy: false, done: false }, d);
    tin.value = d.value || ''; tin.readOnly = !!d.readOnly; tin.maxLength = d.max || 200000;
    tin.style.display = 'block';
    setTimeout(() => { tin.focus(); if (d.readOnly) tin.select(); else tin.setSelectionRange(tin.value.length, tin.value.length); }, 0);
  };
  app.closeDialog = function () {
    const d = app.dialog; app.dialog = null; app.codeOpen = null; app.feedbackOpen = false;
    tin.style.display = 'none'; tin.blur();
    if (d && d.onClose) d.onClose();
  };
  app.dialogAction = function () { const d = app.dialog; if (d && d.action && !d.busy && !d.done) d.action(tin.value); };
  // het onzichtbare tekstvak over het tekstvak in de canvas leggen (elke frame, het venster kan schalen)
  app.placeTextInput = function (r) {
    const b = canvas.getBoundingClientRect(), k = b.width / R.W;
    tin.style.left = (b.left + r.x * k) + 'px'; tin.style.top = (b.top + r.y * k) + 'px';
    tin.style.width = Math.max(1, r.w * k) + 'px'; tin.style.height = Math.max(1, r.h * k) + 'px';
  };
  app.copyText = function (text) {
    const done = () => { if (app.dialog) { app.dialog.msg = 'Gekopieerd.'; app.dialog.err = false; } };
    const legacy = () => { try { tin.focus(); tin.select(); if (document.execCommand('copy')) done(); } catch (e) { /* */ } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, legacy); else legacy();
  };

  // ---------- Spelcode (export/import) ----------
  app.openCode = function (mode) {
    const st = app.s || CC.load();
    app.codeOpen = mode;
    if (mode === 'export') {
      app.openDialog({ kind: 'code', title: 'Je spelcode', readOnly: true, value: st ? CC.exportCode(st) : '',
        info: 'Bewaar deze code (bijvoorbeeld in een notitie). Met "Code laden" op het titelscherm zet je het spel terug.',
        actionLabel: 'Kopiëren', action: v => app.copyText(v) });
    } else {
      app.openDialog({ kind: 'code', title: 'Spelcode laden', value: '', placeholder: 'Plak hier je spelcode (Ctrl+V)',
        info: 'Plak hier een spelcode. Je huidige spel wordt eerst de reservekopie.',
        actionLabel: 'Laden', action: v => {
          const st2 = CC.importCode(v);
          if (!st2) { app.dialog.msg = 'Deze code klopt niet. Controleer of je hem helemaal hebt gekopieerd.'; app.dialog.err = true; return; }
          app.hasSave = true; app.hasBackup = CC.hasBackup(); app.closeDialog(); app.continueGame();
        } });
    }
    app.codeOpen = mode;
  };
  app.closeCode = function () { if (app.dialog && app.dialog.kind === 'code') app.closeDialog(); };

  // ---------- Acties ----------
  app.rebuildRoom = function () { R.roomCache = R.buildRoom(app.s ? app.s.level : 1, app.images); app.roomLevel = app.s ? app.s.level : 1; };
  // Nieuw spel: bestaat er een lopend spel, dan eerst vragen (titelscherm) en het oude als reservekopie bewaren.
  app.newGame = function () {
    const old = CC.load();
    if (old && (old.status === 'playing' || old.status === 'endless')) CC.backupSave();
    app.hasBackup = CC.hasBackup();
    app.confirmNew = false;
    app.s = CC.newState(); app.rebuildRoom(); app.startPrep();
  };
  app.askNewGame = function () {
    const old = app.hasSave && CC.load();
    if (old && (old.status === 'playing' || old.status === 'endless') && (old.week > 1 || old.day > 0 || old.totals.days > 0)) { app.confirmOld = old; app.confirmNew = true; }
    else app.newGame();
  };
  app.restoreBackup = function () { if (CC.restoreBackup()) { app.hasSave = CC.hasSave(); app.hasBackup = CC.hasBackup(); app.continueGame(); } };
  // Hervatten precies waar je was: open kassabon, zondag (bank/kaarten), einde. Nooit een dag of betaling dubbel.
  app.continueGame = function () {
    const s = CC.load(); if (!s) return app.newGame();
    app.s = s; app.rebuildRoom();
    if (s.status === 'bankrupt') return app.setPhase('gameover');
    if (s.status === 'won') { app.recordBest(); return app.setPhase('won'); }   // herladen op het schuldenvrij-scherm: score staat al (of komt er alsnog in)
    if (s.resultOpen && s.history.length) {
      app.summary = s.history[s.history.length - 1];
      app.resultQuip = CC.pickText(app.summary.margin > 60 ? CC.TEXT.result.goodDay : CC.TEXT.result.badDay);
      app.phase = 'result'; app.phaseT = 0; app.panel = null; app.day = null;
      app.resultT = 2;   // bedragen direct definitief
      return;
    }
    if (s.day >= CC.CONFIG.daysPerWeek) return app.openSunday();
    app.startPrep();
  };
  app.setPhase = function (p) { app.phase = p; app.phaseT = 0; app.panel = null; };
  app.restart = function () { CC.clearSave(); app.hasSave = false; app.s = CC.newState(); app.rebuildRoom(); app.startPrep(); };
  app.startPrep = function () {
    app.phase = 'prep'; app.phaseT = 0; app.day = null; app.panel = null;
    app.emptyWarn = false;
    SIM.refill(app.s);
    // ochtendlevering volgens de vaste bestelling
    // Ronnie zet de bestelling klaar; er gaat pas geld af als je op "Bestellen" drukt (besluit 66, 1B)
    app.delivery = null; app.ordered = false;
    app.order = SIM.orderProposal(app.s);
    app.proposed = Object.keys(app.order).length > 0;   // A4: heeft Ronnie iets klaargezet?
    // nieuw vrijgespeelde schaarse wijn: één keer uitleggen
    const seen = app.s.flags.scarceSeen || [];
    const sc = SIM.unlockedWines(app.s).find(w => CC.roleById(w.role).scarce && !seen.includes(w.id));
    app.notice = sc ? { wine: sc.id } : null;
    // klik op het avondinzicht van gisteren: nu het venster op die wijn openen
    // allereerste ochtend: de bankier legt het doel uit (M7, besluit 78)
    if (!app.s.flags.introSeen && app.s.week === 1 && app.s.day === 0) {
      const T = CC.TEXT.tutorial, R2 = CC.CONFIG.repay;
      app.notice = { who: 'bankier', title: T.introTitle, text: T.intro.map(l => l.split('{first}').join(R.euro(R2[0])).split('{last}').join(R.euro(R2[R2.length - 1]))).join('\n'), btn: T.introBtn, flag: 'introSeen', next: app.notice };
    }
    if (app.pendingFocus) { const f = app.pendingFocus; app.pendingFocus = null; app.focusWine(f.tab, f.wine); }
    app.save();
  };
  app.openPanel = function (p, vak) {
    // bestellen, prijzen en schappen zitten samen in het middenvenster (besluit 66)
    if (p === 'phone' || p === 'prices' || p.startsWith('vak:')) {
      if (app.panel !== 'assort') app.panelT = 0;
      app.assortTab = p === 'prices' ? 'prices' : 'order';
      app.assortVak = p.startsWith('vak:') ? p.slice(4) : null;
      app.shelfPick = null; app.orderMsg = null;
      app.panel = 'assort'; app.panelSide = 'center';
      return;
    }
    if (app.panel !== p && !(app.panel && app.panel.startsWith('vak:') && p.startsWith('vak:'))) app.panelT = 0;
    // paneel aan de kant tegenover het object
    let side = 'left';
    if (p === 'phone' || p === 'prices' || p === 'staff' || p === 'invest') side = 'right';
    if (p === 'invest' && app.s) app.s.flags.investSeenLvl = Math.max(app.s.flags.investSeenLvl || 0, app.s.level);
    if (p === 'staff' && app.s) app.s.flags.staffSeen = true;
    if (p.startsWith('vak:')) { const f = CC.FURNITURE.find(ff => ff.vakken && ff.vakken.includes(p.slice(4))); if (f && f.o === 'left') side = 'right'; }
    if (app.panel && app.panelSide !== side) app.panelT = 0;
    app.panel = p; app.panelVak = vak || null; app.panelSide = side;
  };
  app.closePanel = function () { app.panel = null; };
  // Middenvenster openen op één wijn (avondinzicht, besluit 75)
  app.focusWine = function (tab, wine) {
    app.openPanel(tab === 'prices' ? 'prices' : 'phone');
    app.assortFocus = wine ? { wine, t0: app.t } : null;
  };
  app.buy = function (id, n) { const r = SIM.buy(app.s, id, n); if (r.ok) { app.s.flags.bought = true; app.save(); } };
  // Vaste bestelling (besluit 57): doel omhoog = direct bijbestellen; elke ochtend vult Ronnie aan.
  app.setTarget = function (id, n) {
    SIM.setTarget(app.s, id, n);
    app.s.flags.bought = true;
    if (SIM.vakOfWine(app.s, id)) app.s.flags.shelved = true;
    app.save();
  };
  app.assign = function (vak, id, wineId) {
    if (!vak && wineId) { const cur = SIM.vakOfWine(app.s, wineId); if (cur) SIM.assignVak(app.s, cur, null); }
    else SIM.assignVak(app.s, vak, id);
    if (id) app.s.flags.shelved = true; app.save();
  };
  // Ochtendbestelling plaatsen (knop "Bestellen" in het middenvenster)
  app.placeOrder = function () {
    const r = SIM.placeOrder(app.s, app.order || {});
    if (!r.deliveries.length) return;
    app.delivery = r; app.ordered = true;
    app.order = SIM.orderProposal(app.s);
    app.proposed = Object.keys(app.order).length > 0;   // A4: heeft Ronnie iets klaargezet?
    app.s.flags.bought = true; if (SIM.listed(app.s).length) app.s.flags.shelved = true;
    if (CC.FX) CC.FX.sparkle(app.mouse.x, app.mouse.y, P.gold2, 10);
    app.save();
  };
  // Personeel
  app.staffOpen = function () { return app.s && (app.s.level >= Math.min(...Object.values(CC.STAFF).map(x => x.minLevel)) || SIM.staffCount(app.s) > 0); };
  app.hire = function (id) { const r = SIM.hire(app.s, id); if (r.ok) app.save(); return r; };
  app.fire = function (id) { if (SIM.fire(app.s, id)) app.save(); };
  // Investeringen (besluit 60)
  app.investOpen = function () { return app.s && CC.UPGRADES.some(u => SIM.upgradeUnlocked(app.s, u.id)); };
  app.investNew = function () { const s = app.s; return CC.UPGRADES.some(u => SIM.upgradeUnlocked(s, u.id) && !SIM.owns(s, u.id) && u.lvl > (s.flags.investSeenLvl || 0)); };
  app.buyUpgrade = function (id) {
    const r = SIM.buyUpgrade(app.s, id);
    if (!r.ok) return r;
    const u = CC.upgradeById(id);
    if (id === 'kast3' || id === 'kast4') app.rebuildRoom();
    if (CC.FX) {
      CC.FX.sparkle(app.mouse.x, app.mouse.y, P.gold2, 10);
      // en een vonkenregen op de plek in de winkel zelf
      setTimeout(() => {
        let at = null;
        if (id === 'uithangbord' && CC.BG) at = { x: CC.BG.sign.x + 36, y: CC.BG.sign.y + 16 };
        const sh = (app.worldRects.shelves || []).find(x => CC.FURNITURE.find(f => f.id === x.id && f.upgrade === id));
        if (sh && sh.rects.length) { const r = sh.rects[0]; at = { x: r.x + r.w / 2, y: r.y + 10 }; }
        if (at) CC.FX.burst(at.x, at.y, P.gold);
      }, 60);
    }
    app.save(); return r;
  };
  app.setVitrine = function (id) { SIM.setVitrine(app.s, id); app.save(); };
  app.setPrice = function (id, st) { SIM.setPrice(app.s, id, st); app.s.flags.priced = true; app.save(); };
  app.closeNotice = function () {
    if (!app.notice) return;
    if (!app.notice.wine) { const open = app.notice.thenOpen; if (app.notice.flag) app.s.flags[app.notice.flag] = true; app.notice = app.notice.next || null; app.save(); if (open && !app.notice) app.openShop(); return; }
    app.s.flags.scarceSeen = (app.s.flags.scarceSeen || []).concat([app.notice.wine]);
    app.notice = null; app.save();
    const seen = app.s.flags.scarceSeen, sc = SIM.unlockedWines(app.s).find(w => CC.roleById(w.role).scarce && !seen.includes(w.id));
    if (sc) app.notice = { wine: sc.id };
  };
  app.openShop = function () {
    if (app.phase !== 'prep') return;
    if (app.notice) return;
    if (!SIM.listed(app.s).some(l => l.n > 0) && !app.emptyWarn) { app.emptyWarn = true; return; }   // lege winkel: eerst waarschuwen
    app.emptyWarn = false;
    app.delivery = null;
    if (app.s.mishap && !app.s.mishap.choice) return;   // eerst de tegenvaller afhandelen
    // opdracht van een weekkaart (bruiloft): tellen op het moment dat de winkel opengaat, dus na de ochtendbestelling (A3).
    // Eerst de melding; wegklikken opent de winkel meteen.
    const ord = SIM.settleOrder(app.s);
    if (ord) {
      const T = CC.TEXT.orderNotice, txt = (ord.ok ? T.ok : T.fail).split('{paid}').join(R.euro(ord.paid || 0)).split('{rep}').join(ord.rep).split('{have}').join(ord.have);
      app.notice = { title: T.title, text: txt, good: ord.ok, thenOpen: true };
      app.save(); return;
    }
    app.panel = null; app.phase = 'sale'; app.speed = app.speed || 1; app.acc = 0;
    app.s.flags.opened = true;
    app.day = DAY.start(app.s);
    app.day.visual = true;
  };
  app.setSpeed = function (n) { app.speed = n; };
  // Advies: klik op een klant met ! → kaartje, spel pauzeert
  app.openAdvice = function (c) {
    if (app.phase !== 'sale' || app.advice || c.state !== 'ask') return;
    app.advice = { c, stage: 'ask', t: 0 };
    app.s.flags.advised = true;
  };
  app.answerAdvice = function (wineId) {
    const A = app.advice;
    if (!A || A.stage !== 'ask' || A.c.state !== 'ask') return;
    A.res = DAY.answer(app.day, app.s, A.c, wineId);
    A.stage = 'result'; A.t = 0;
  };
  app.closeAdvice = function () { app.advice = null; };
  app.skipDay = function () { if (app.phase === 'sale' && !app.advice) { app.day.visual = false; DAY.finish(app.day, app.s); } };
  function endDay() {
    app.advice = null;
    app.summary = SIM.endDay(app.s, app.day.log);
    app.s.resultOpen = true;   // herladen op de bon = dezelfde bon, geen herhaling van de dag
    app.phase = 'result'; app.resultT = 0;
    const T = CC.TEXT.result;
    app.resultQuip = CC.pickText(app.summary.margin > 60 ? T.goodDay : T.badDay);
    app.save();
  }
  app.afterResult = function () {
    if (app.resultT < 1.25) { app.resultT = 1.25; return; }   // eerste klik: telling direct afmaken
    app.staffUps = (app.summary && app.summary.staffUp || []).slice();
    if (app.summary && app.summary.levelUp) {
      app.levelQuip = CC.pickText(CC.TEXT.levelUp);
      app.rebuildRoom();
      return app.setPhase('levelup');
    }
    app.afterLevel();
  };
  app.afterLevel = function () {
    if (app.staffUps && app.staffUps.length) return app.setPhase('staffup');
    app.s.resultOpen = false;
    const r = SIM.advanceDay(app.s);
    app.save();
    if (r === 'sunday') app.openSunday(); else app.startPrep();
  };

  app.afterStaffUp = function () { app.staffUps.shift(); app.afterLevel(); };

  // ---------- Zondag: de bank ----------
  const money = v => R.euro(v);
  // app.sunday is hetzelfde object als s.sun, zodat bank- en kaartstand mee opgeslagen worden.
  app.setSunday = function (o) { app.s.sun = o; app.sunday = o; };
  app.openSunday = function () {
    const s = app.s, B = CC.TEXT.bank, C = CC.CONFIG;
    app.setPhase('sunday');
    if (s.sun && s.sun.week === s.week) {   // hervatten: dezelfde zondag, zelfde kaarten
      app.sunday = s.sun; s.sun.t0 = app.t; s.sun.chosenT = s.sun.chosen ? app.t - 10 : null;
      if (s.sun.stage === 'ask' && SIM.bankDone(s)) Object.assign(s.sun, { stage: 'done', mood: 'happy', text: CC.pickText(CC.TEXT.bank.paid) });
      if (s.sun.stage === 'done' && !s.sun.cards) app.offerCards();
      return;
    }
    if (!SIM.inLoan(s)) { app.setSunday({ week: s.week, stage: 'done', mood: 'happy', text: B.endless, due: 0 }); app.offerCards(); app.save(); return; }
    const due = SIM.weekDue(s), cash = s.cash;
    const canPay = cash >= due, canPostpone = !s.postponed && s.week < C.repay.length;
    let text, mood;
    if (canPay && cash - due >= due * 0.5) { text = s.week === 1 ? B.firstWeek.split('{due}').join(money(due)).split('{next}').join(money(C.repay[1])).split('{last}').join(money(C.repay[C.repay.length - 1])) : s.week === C.repay.length ? B.lastWeek.split('{due}').join(money(due)) : CC.pickText(B.ok, null, { due: money(due) }); mood = 'neutral'; }
    else if (canPay) { text = CC.pickText(B.tight, null, { due: money(due), left: money(cash - due) }); mood = 'neutral'; }
    else {
      text = CC.pickText(B.short, null, { due: money(due), cash: money(Math.max(0, cash)), short: money(due - cash) }) + ' ' +
        (canPostpone ? CC.pickText(B.postponeOffer, null, { fine: money(C.postponeFine) }) : CC.pickText(B.noMore));
      mood = 'grim';
    }
    app.setSunday({ week: s.week, stage: 'ask', mood, text, due, canPay, canPostpone });
    app.ring = { t0: app.t };   // eerst gaat de telefoon op de toonbank (M7-juice); klik of Enter slaat over
    app.save();
  };
  // A7: beste score bewaren in de instellingen (los van de spelsave, net als introSeen).
  // app.prevBest = de beste score van vóór deze run, zodat het schuldenvrij-scherm "nieuw record" kan zeggen.
  app.recordBest = function () {
    const sc = UI.finalScore(app.s).total, prev = CC.getSetting('bestScore');
    app.prevBest = prev && prev.score ? prev.score : 0;
    if (sc > app.prevBest) CC.setSetting('bestScore', { score: sc, level: app.s.level, date: new Date().toISOString().slice(0, 10) });
  };
  app.bestScore = function () { const b = CC.getSetting('bestScore'); return b && b.score ? b.score : 0; };
  app.ringDur = 1.6;
  app.ringing = function () { if (app.ring && app.t - app.ring.t0 >= app.ringDur) app.ring = null; return !!app.ring; };
  app.bankPay = function () {
    const r = SIM.payWeek(app.s);
    if (!r.ok) return;
    app.save();
    if (r.won) { app.recordBest(); return app.setPhase('won'); }
    app.setSunday(Object.assign({}, app.sunday, { stage: 'done', mood: 'happy', text: CC.pickText(CC.TEXT.bank.paid) }));
    app.offerCards();
  };
  // Weekkaarten: na de bank kies je 1 van 2 kaarten voor volgende week
  app.offerCards = function () {
    const s = app.s;
    if (s.status !== 'playing' && s.status !== 'endless') return;
    SIM.offerWeekKlus(s);   // B1: klus voor volgende week (staat in de save)
    if (app.sunday.cards) return;   // al aangeboden (bijv. na herladen)
    app.sunday.cards = SIM.offerCards(s, CC.makeRng(s));
    app.sunday.chosen = null; app.sunday.cardMsg = null; app.sunday.t0 = app.t; app.sunday.chosenT = null;
    app.save();
  };
  app.chooseCard = function (id) {
    const sun = app.sunday; if (!sun || sun.chosen) return;
    const r = SIM.chooseCard(app.s, id, CC.makeRng(app.s));
    if (!r.ok) return;
    sun.chosen = id; sun.chosenT = app.t;
    if (r.box) sun.cardMsg = CC.TEXT.cardUi.boxResult.split('{wine}').join(CC.wineById(r.box).name).split('{worth}').join(R.euro(r.worth));
    app.save();
  };
  // Tegenvaller op maandag
  app.decideMishap = function (choice) {
    const s = app.s; if (!s.mishap || s.mishap.choice) return;
    const r = SIM.decideMishap(s, choice, CC.makeRng(s));
    if (!r.ok) return;
    if (r.lost != null) app.mishapMsg = r.lost ? CC.TEXT.cardUi.gambleLose : CC.TEXT.cardUi.gambleWin;
    app.save();
  };
  app.bankPostpone = function () {
    const r = SIM.postpone(app.s);
    if (!r.ok) return;
    app.save();
    app.setSunday(Object.assign({}, app.sunday, { stage: 'done', mood: 'neutral', text: CC.pickText(CC.TEXT.bank.postponed, null, { next: money(r.next) }) }));
    app.offerCards();
  };
  app.canAffordCard = function () { const sun = app.sunday; return !!(sun && sun.cards && sun.cards.some(id => { const c = CC.cardById(id); return !c.cost || app.s.cash >= c.cost; })); };
  app.bankBankrupt = function () { SIM.bankrupt(app.s); app.bankQuote = CC.pickText(CC.TEXT.bank.bankrupt); app.save(); app.setPhase('gameover'); };
  app.bankNextWeek = function () {
    // eerst een kaart kiezen, behalve als je geen van beide kunt betalen (anders zit je vast)
    if (app.sunday && app.sunday.cards && !app.sunday.chosen && app.canAffordCard()) return;
    SIM.startWeek(app.s); app.sunday = null; app.mishapMsg = null; app.startPrep();   // startWeek wist ook s.sun
  };
  app.hintText = function () {
    const s = app.s, f = s.flags;
    if (!f.bought) return 'Welkom in je eigen wijnhandel. Kijk linksboven wie er vandaag komt, en klik dan op de telefoon om wijn te bestellen bij Ronnie.';
    if (!f.shelved) return 'Klik op een kast en zet er een wijn in. Het schap vult zich vanzelf uit je magazijn.';
    if (!f.opened) return 'Elke ochtend zet Ronnie een bestelling klaar; jij beslist of die doorgaat. Prijzen zet je bij de kassa. Klaar? Open de winkel.';
    if (!SIM.listed(s).some(l => l.n > 0)) return CC.TEXT.hint.emptyShop;
    if (app.investNew()) { const u = CC.UPGRADES.filter(x => SIM.upgradeUnlocked(s, x.id) && !SIM.owns(s, x.id)).pop(); return CC.TEXT.invest.newHint.split('{name}').join(u.name.toLowerCase()).split('{cost}').join(R.euro(u.cost)); }
    if (app.staffOpen() && !f.staffSeen) return 'Je kunt nu personeel aannemen. Klik op "Personeel" (toets P).';
    // bestelling van Ronnie staat nog klaar
    if (!app.ordered && app.order && Object.values(app.order).some(n => n > 0)) {
      const n = Object.values(app.order).reduce((a, b) => a + b, 0);
      return CC.TEXT.order.pending.split('{n}').join(n).split('{cost}').join(R.euro(SIM.orderCost(s, app.order)));
    }
    return null;
  };

  // Dag/nacht is geschrapt (besluit 56): altijd schemer.

  // ---------- Tekenen ----------
  function painted() { const b = app.images.bg; return !!(CC.BG && b && b.complete && b.naturalWidth); }
  function drawWorld(dt) {
    const s = app.s || CC.newState(1);
    const hover = app.hoverId || '';
    const PAINT = painted();
    if (PAINT) { R.drawLayer(ctx, app.images, 'bg', { x: 0, y: 0 }); R.paintedSign(ctx, app.images, app.s && SIM.owns(app.s, 'uithangbord') ? app.t : null); if (CC.FX) CC.FX.ambience(ctx, app.t, dt); }
    else {
      if (!R.roomCache || app.roomLevel !== (app.s ? app.s.level : 1)) app.rebuildRoom();
      ctx.drawImage(R.roomCache, 0, 0);
    }
    // wandobjecten
    // meubels + klanten, gesorteerd op diepte
    const items = [];
    for (const f of SIM.activeFurniture(s)) items.push({ depth: f.x + f.w / 2 + f.y + f.d / 2, f });
    if (app.day) { R.spreadCrowd(app.day.customers, dt); for (const c of app.day.customers) items.push({ depth: c.x + c.y, c }); }
    // personeel: tijdens de dag de levende figuurtjes, anders op hun vaste plek
    // personeel: tijdens de dag de levende figuurtjes; daarbuiten slenteren ze rond hun vaste plek
    let staff = app.day ? app.day.staff : null;
    if (!staff && app.s) {
      const key = Object.keys(app.s.staff || {}).sort().join(',');
      if (!app.idleStaff || app.idleKey !== key) { app.idleStaff = CC.DAY.staffAgents(app.s); app.idleKey = key; }
      if (app.phase === 'prep') for (const a of app.idleStaff) CC.DAY.idleStep(a, dt);
      staff = app.idleStaff;
    }
    for (const a of staff || []) items.push({ depth: a.x + a.y, c: a });
    // buiten: voorbijgangers; als de winkel dicht is ook kat en muis, te laat, dutje (M7b)
    if (CC.FX && PAINT) for (const it of CC.FX.street(dt, app.phase, app.images, app.s)) items.push(it);
    items.sort((a, b) => a.depth - b.depth);
    const shelves = [];
    const heads = [];
    const asks = [];
    let shelfN = 0;
    for (const it of items) {
      if (it.f) {
        const f = it.f;
        if (f.kind === 'shelf') {
          shelfN++;
          const hv = hover.startsWith('w_vak') ? hover.slice(2) : null;
          const rects = PAINT ? R.paintedShelf(ctx, f, s, hv, app.images) : R.drawShelf(ctx, f, s, hv);
          shelves.push({ id: f.id, name: 'Schap ' + (CC.FURNITURE.filter(ff => ff.kind === 'shelf').indexOf(f) + 1), rects });
        } else if (f.kind === 'counter') app.worldRects.counter = R.drawCounter(ctx, f, hover === 'w_counter');
        else if (f.kind === 'counterFront' && PAINT) { app.worldRects.counter = CC.BG.register; app.worldRects.phone = CC.BG.phone; }
        else if (PAINT && (f.kind === 'barrel' || f.kind === 'crates' || f.kind === 'plant')) { /* geschilderd */ }
        else if (f.kind === 'table' && PAINT) R.paintedTable(ctx, f, s, app.images);
        else if (f.kind === 'decor') { if (PAINT) R.paintedDecor(ctx, f, app.images, app.t); }
        else if (f.kind === 'counterFront') { const r = R.drawCounterFront(ctx, f, hover === 'w_counter' ? 'register' : (hover === 'w_phone' ? 'phone' : null)); app.worldRects.counter = r.register; app.worldRects.phone = r.phone; }
        else if (f.kind === 'crates') R.drawCrates(ctx, f);
        else if (f.kind === 'plant') R.drawPlant(ctx, f, app.t);
        else if (f.kind === 'barrel') R.drawBarrel(ctx, f);
        else if (f.kind === 'table') app.worldRects.table = R.drawTable(ctx, f, s, hover === 'w_table');
        else if (f.kind === 'chalkboard') R.drawChalkboard(ctx, f);
        else if (f.kind === 'umbrellas') R.drawUmbrellas(ctx, f);
      } else if (it.critter) {
        CC.FX.drawCritter(ctx, it.critter);
      } else if (it.bike) {
        const head = CC.FX.drawBike(ctx, it.bike, app.images);
        if (head && it.bike.bubble) heads.push({ head, b: it.bike.bubble, c: it.bike });
      } else {
        const head = R.drawCustomerSprite(ctx, it.c, app.images) || R.drawCustomer(ctx, it.c, app.t);
        if (it.c.bubble) heads.push({ head, b: it.c.bubble, c: it.c });
        if (it.c.state === 'ask') asks.push({ head, c: it.c });
      }
    }
    // voorgrond van de straat: paal en paaltjes staan vóór de stoep, dus over voorbijgangers en fietser heen
    const fg = app.images.fg_straat; if (PAINT && fg && fg.complete && fg.naturalWidth) ctx.drawImage(fg, 0, 0);
    app.worldRects.shelves = shelves;
    if (PAINT) { if (hover === 'w_counter') R.hoverBox(ctx, CC.BG.register); if (hover === 'w_phone') R.hoverBox(ctx, CC.BG.phone); }
    if (PAINT && hover === 'w_vitrine' && CC.BG_LAYERS && app.images.layer_table) { const TL = CC.BG_LAYERS.table, im = app.images.layer_table; R.hoverBox(ctx, { x: TL.x + 6, y: TL.y, w: im.naturalWidth - 12, h: Math.round(im.naturalHeight * 0.6) }); }
    // tekstballonnen en zwevende bedragen boven alles
    const placed = asks.map(a => ({ x: a.head[0] - 9, y: a.head[1] - 30, w: 19, h: 28 }));   // ballonnen niet over een !
    // besluit 90: nooit over het uithangbord (en de HUD: R.bubble houdt y ≥ 18)
    const sg = CC.BG && CC.BG.sign, sgi = app.images.logoSign;
    if (sg) placed.push({ x: sg.x - 2, y: sg.y - 2, w: (sgi && sgi.naturalWidth || 72) + 4, h: (sgi && sgi.naturalHeight || 33) + 4 });
    // bedragen bij de kassa (UI.cashFloat) bezetten de zone onder het bord
    const rgz = CC.BG && CC.BG.register;
    if (app.day && app.day.floats.some(f => f.cash) && sg && rgz) placed.push({ x: rgz.x + rgz.w / 2 - 46, y: sg.y + 34, w: 92, h: 46 });
    // hooguit drie ballonnen tegelijk; nieuwe wachten tot er plek is (en vervallen als hun tijd erop zit)
    const MAXB = 3, shown = app.bubblesShown || (app.bubblesShown = new Set());
    for (const b of shown) if (!heads.some(h => h.b === b)) shown.delete(b);
    heads.sort((a, b) => a.head[1] - b.head[1]);
    // A5: geen ballonnen zolang een venster met verduistering open is (advies, zondag, dagrapport, niveau, meldingen),
    // anders steekt er een stukje tekst uit de wereld naast het venster uit
    const modal = app.advice || !['prep', 'sale'].includes(app.phase) || (app.phase === 'prep' && (app.notice || app.mishapMsg || (s.mishap && !s.mishap.choice)));
    if (!modal) {
      const fits = new Map();
      for (const h of heads) if (shown.has(h.b)) { const f = R.bubbleFit(h.head[0], h.head[1] - 1, h.b.text, placed); fits.set(h, f); if (f) placed.push({ x: f.bx, y: f.by, w: f.w, h: f.h }); }
      for (const h of heads) if (!shown.has(h.b) && shown.size < MAXB && h.b.t > 1.0) {
        const f = R.bubbleFit(h.head[0], h.head[1] - 1, h.b.text, placed);
        if (f) { shown.add(h.b); fits.set(h, f); placed.push({ x: f.bx, y: f.by, w: f.w, h: f.h }); }
      }
      for (const [h, f] of fits) if (f) R.bubble(ctx, h.head[0], h.head[1] - 1, h.b.text, h.b.tone, Math.min(1, h.b.t * 3), null, f);
    }
    // adviesvragen: ! boven het hoofd, klik op de klant
    for (const a of asks) {
      const frac = Math.max(0, a.c.patience / CC.CONFIG.advicePatience);
      const m = R.askMark(ctx, a.head[0], a.head[1], app.t, frac);
      if (app.phase === 'sale' && !app.advice) UI.hit(app, 'ask_' + a.c.id, m.x - 4, m.y, m.w + 8, a.head[1] - m.y + 60, () => app.openAdvice(a.c), 'Klant heeft een vraag');
    }
    if (app.day) for (const f of app.day.floats) {
      if (f.cash) { UI.cashFloat(app, ctx, f); continue; }
      const [sx, sy] = R.iso(f.x, f.y);
      const rise = Math.round((1.2 - f.t) * 14);
      // leesbaar: donkere rand rondom, kleine sprong aan het begin
      const hop = f.t > 1.0 ? Math.round((f.t - 1.0) * 10) : 0, yy = sy - rise - hop - (f.lift || 0);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) CC.FONT.draw(ctx, f.text, sx + dx, yy + dy, P.ink, { align: 'center' });
      CC.FONT.draw(ctx, f.text, sx, yy, f.col, { align: 'center' });
    }
    // tutorialpijl
    if (app.phase === 'prep' && !app.panel) {
      const f = s.flags;
      if (!f.bought && app.worldRects.phone) { const r = app.worldRects.phone; R.arrow(ctx, r.x + 8, r.y, app.t); }
      else if (!f.shelved && shelves[0]) { const r = shelves[0].rects[0]; R.arrow(ctx, r.x + r.w / 2, r.y - 4, app.t); }
      else if (!f.opened) R.arrow(ctx, 580, 332, app.t);
    }
  }

  // Intro-frame: alles komt uit CC.INTRO.renderAt(t); klik = overslaan (of: beginnen, als hij klaar is).
  function introFrame(dt) {
    UI.hits = [];
    const st = CC.INTRO.status(app.images);
    if (st === 'fail') { app.endIntro(true); return false; }   // een beeld laadt niet: gewoon naar het titelscherm
    if (st !== 'ok' || !CC.INTRO.ready(app.images)) {          // nog aan het laden: zwart, en na 8 s opgeven
      R.rect(ctx, 0, 0, R.W, R.H, P.ink);
      app.introWait = (app.introWait || 0) + dt;
      if (app.introWait > 8) { app.endIntro(true); return false; }
      return true;
    }
    if (!app.introPause) app.introT += dt;
    CC.INTRO.renderAt(ctx, app.introT, { reduced: app.reducedMotion });
    if (app.introPause) F.draw(ctx, 'intro ' + app.introT.toFixed(2) + ' s  (◀ ▶ scrubben, Shift = 1 s)', 6, 4, P.gold2, { shadow: P.ink });
    app.hoverId = null; canvas.style.cursor = 'pointer';
    return true;
  }
  const F = CC.FONT;
  let lastPhase = null;
  const TOUCH_TIP = /^(pr_|klus_|bh_|bb_|fc_|tut_)/;   // A9: elementen waar de tooltip nieuwe informatie geeft

  function frame(dt) {
    app.t += dt;
    DBG.tick(dt);
    if (app.phase !== lastPhase) { lastPhase = app.phase; document.body.classList.toggle('intro', app.phase === 'intro'); }
    if (app.phase === 'intro') {
      if (app.click) app.endIntro();                       // klik overslaat; de klik zelf raakt het menu niet
      else { ctx.imageSmoothingEnabled = false; if (introFrame(dt)) return; }
      document.body.classList.remove('intro'); lastPhase = app.phase;
    }
    // klik verwerken met de klikvlakken van de vorige frame
    if (app.click) {
      const c = app.click, h = c.touch ? UI.pickTouch(c.x, c.y, app.touchMin()) : UI.pick(c.x, c.y);
      // A9: op touch toont de eerste tik op een prijsstand, klus of klanttype eerst de tooltip; de tweede tik voert uit
      const tipFirst = c.touch && h && h.onClick && h.tip && TOUCH_TIP.test(h.id) && app.touchTip !== h.id;
      app.touchTip = c.touch && h && h.tip ? h.id : null;
      if (tipFirst) { /* alleen de tooltip: die staat onder de vinger (app.mouse) */ }
      else if (h && h.onClick) h.onClick();
      else if (!h && app.panel && app.phase === 'prep') app.closePanel();
      app.click = null;
      if (app.phase === 'intro') { lastPhase = null; return; }   // "Intro" in het menu: vanaf de volgende frame speelt de intro
    }
    // simulatie
    if (app.advice) app.advice.t += dt;
    if (app.phase === 'sale' && (app.advice || app.dialog || app.portrait)) { /* pauze: adviesvraag, feedback/codevenster open of telefoon staand */ }
    else if (app.phase === 'sale') {
      app.day.speed = app.speed;
      app.acc += Math.min(dt, 0.1) * app.speed;
      let n = 0;
      while (app.acc >= DAY.STEP && !app.day.done && n++ < 40) { DAY.step(app.day, app.s, DAY.STEP); app.acc -= DAY.STEP; }
      if (app.day.done) endDay();
    }
    if (app.panel) app.panelT += dt;
    if (app.phase === 'result') app.resultT += dt;
    app.phaseT += dt;

    // tekenen
    UI.hits = [];
    ctx.imageSmoothingEnabled = false;
    drawWorld(dt);
    const feest = app.images.schuldenvrij;
    if (app.phase === 'won' && feest && feest.complete && feest.naturalWidth) {   // vloeit in 0,6 s over de winkel heen
      ctx.globalAlpha = Math.min(1, app.phaseT / 0.6); ctx.drawImage(feest, 0, 0, 640, 360); ctx.globalAlpha = 1;
    }
    if (app.phase === 'title') { UI.title(app, ctx); }
    else {
      UI.worldHits(app);
      UI.hud(app, ctx);
      if (app.phase === 'prep' || app.phase === 'sale') UI.weekChips(app, ctx);
      if (app.phase === 'prep') {
        UI.prepBar(app, ctx);
        if (app.panel === 'lastday') UI.lastDayPanel(app, ctx);
        else if (app.panel === 'staff') UI.staffPanel(app, ctx);
        else if (app.panel === 'invest') UI.investPanel(app, ctx);
        if ((app.panelSide === 'right' || !app.panel) && !(app.s.mishap && (!app.s.mishap.choice || app.mishapMsg))) UI.forecastBoard(app, ctx);
        if (app.panel === 'assort') UI.assortPanel(app, ctx);
        if (app.s.mishap && (!app.s.mishap.choice || app.mishapMsg)) UI.mishapPanel(app, ctx);
        else if (app.notice) UI.noticePanel(app, ctx);
      }
      if (app.phase === 'sale') { UI.saleBar(app, ctx); UI.saleHint(app, ctx); if (app.advice) UI.advicePanel(app, ctx); }
      if (app.phase === 'result') UI.resultPanel(app, ctx);
      if (app.phase === 'levelup') UI.levelPanel(app, ctx);
      if (app.phase === 'staffup') UI.staffUpPanel(app, ctx);
      if (app.phase === 'sunday') UI.sundayPanel(app, ctx);
      if (app.phase === 'gameover') UI.endPanel(app, ctx, false);
      if (app.phase === 'won') UI.endPanel(app, ctx, true);
    }
    if (app.phase !== 'title') UI.confirmNewPanel(app, ctx);   // A8: Opnieuw beginnen (zondag na uitstel)
    if (CC.FX) CC.FX.drawParts(ctx, dt);   // deeltjes boven alles (muntjes, deurbel, vuurwerk)
    if (CC.FX) { if (app.phase === 'sale') CC.FX.drawCoins(ctx, dt); else if (CC.FX.flying.length) CC.FX.clearCoins(); }   // A10: munten naar de kas
    if (app.dialog) UI.textDialog(app, ctx);
    DBG.draw(app, ctx);
    const h = app.touchInput ? UI.pickTouch(app.mouse.x, app.mouse.y, app.touchMin()) : UI.pick(app.mouse.x, app.mouse.y);
    app.hoverId = h ? h.id : null;
    canvas.style.cursor = h && h.onClick ? 'pointer' : 'default';
    UI.tooltip(app, ctx);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    frame(dt);
    present();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
