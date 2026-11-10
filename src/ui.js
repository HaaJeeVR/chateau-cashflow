// Château Cashflow — ui.js
// HUD, panelen, schermen. Immediate-mode: elke frame registreren knoppen hun klikvlak.
(function (root) {
  const CC = root.CC = root.CC || {};
  const P = CC.PAL;
  const UI = {};
  const R = () => CC.R;
  const F = () => CC.FONT;
  const HF = () => CC.FONT.head;   // kopfont (besluit 88): koppen en grote bedragen, nooit geschaald tekstfont

  // ---------- Klikvlakken ----------
  UI.hits = [];
  UI.hit = function (app, id, x, y, w, h, onClick, tip) {
    UI.hits.push({ id, x, y, w, h, onClick, tip });
    return app.hoverId === id;
  };
  UI.pick = function (x, y) {
    for (let i = UI.hits.length - 1; i >= 0; i--) {
      const h = UI.hits[i];
      if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return h;
    }
    return null;
  };

  UI.btn = function (app, ctx, id, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    const hover = UI.hit(app, id, x, y, w, h, opts.disabled ? null : onClick, opts.tip);
    R().button(ctx, x, y, w, h, label, { hover, disabled: opts.disabled, active: opts.active, tone: opts.tone });
    return hover;
  };

  // ---------- Verkoopbedrag boven de kassa (M7-juice) ----------
  // Donker label met munt en "+€12", springt op boven de kassa, stijgt en vervaagt. Meerdere tegelijk stapelen.
  UI.cashFloat = function (app, ctx, f) {
    const rg = (CC.BG && CC.BG.register) || { x: 326, y: 108, w: 30, h: 32 };
    const age = f.max - f.t;                                  // 0 → 1,6 s
    const pop = Math.min(1, age / 0.12), fade = Math.min(1, f.t / 0.35);
    const extra = f.rep ? `  ${f.rep > 0 ? '+' : ''}${String(Math.round(f.rep * 10) / 10).replace('.', ',')} ★` : '';
    const tw = F().width(f.text), ew = extra ? F().width(extra) : 0;
    const w = tw + ew + 17, h = 13;
    const cx = rg.x + rg.w / 2;
    // besluit 90: onder het uithangbord in plaats van erover. Rij van hooguit drie, van boven naar beneden;
    // het label springt omhoog op zijn plek en zakt niet verder door naar het bord.
    const sg = (CC.BG && CC.BG.sign) || { x: 285, y: 49 }, sgImg = CC.IMAGES && CC.IMAGES.logoSign;
    const top = sg.y + (sgImg && sgImg.naturalHeight ? sgImg.naturalHeight : 33) + 3;
    const slot = (f.stack || 0) % 3;
    const y = Math.round(top + slot * 15 + (1 - pop) * 5);
    const x = Math.round(cx - w / 2);
    ctx.globalAlpha = fade;
    R().round(ctx, x - 1, y - 1, w + 2, h + 2, 4, P.ink);
    R().round(ctx, x, y, w, h, 3, P.bord1 || '#45101a');
    R().rect(ctx, x + 2, y + 1, w - 4, 1, 'rgba(255,241,168,0.25)');
    // munt
    R().round(ctx, x + 3, y + 3, 7, 7, 3, P.gold); R().rect(ctx, x + 5, y + 5, 3, 3, '#b88a2a'); R().rect(ctx, x + 4, y + 4, 1, 1, P.gold2);
    F().draw(ctx, f.text, x + 13, y + 3, P.gold2);
    if (extra) F().draw(ctx, extra, x + 13 + tw, y + 3, f.rep > 0 ? P.gold : P.bord4);
    ctx.globalAlpha = 1;
  };

  // Kleine pixelster (9 × 7) met donkere rand; (x, y) = linksboven
  UI.star = function (ctx, x, y, col) {
    const rows = ['....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.'];
    for (const [ox, oy, c] of [[1, 0, P.ink], [-1, 0, P.ink], [0, 1, P.ink], [0, -1, P.ink], [0, 0, col]])
      rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') R().rect(ctx, x + i + ox, y + j + oy, 1, 1, c); });
  };

  // Kop in het kopfont, met een gouden lijn en ruitje aan weerszijden (niveauscherm, eindschermen).
  UI.ornateTitle = function (ctx, text, cx, y, col, opts) {
    opts = opts || {};
    const tw = HF().width(text), len = opts.len || 40, gap = opts.gap || 9, line = opts.line || P.gold;
    if (opts.shadow) HF().draw(ctx, text, cx, y + 1, opts.shadow, { align: 'center' });
    HF().draw(ctx, text, cx, y, col, { align: 'center' });
    for (const side of [-1, 1]) {
      const inner = Math.round(cx + side * (tw / 2 + gap)), outer = inner + side * len;
      R().rect(ctx, Math.min(inner, outer), y + 5, len, 1, line);
      R().rect(ctx, inner - 1, y + 4, 3, 3, line); R().rect(ctx, inner, y + 3, 1, 5, line);   // ruitje bij de tekst
      R().rect(ctx, outer - (side > 0 ? 1 : 0), y + 4, 1, 3, line);                            // stipje aan het eind
    }
  };

  // ---------- Volledig scherm (besluit 87) ----------
  // Pixelicoon 7×7: hoeken naar buiten (volledig scherm) of naar binnen (terug naar venster).
  UI.fsGlyph = function (ctx, x, y, col, exit) {
    const rows = exit ? ['.#...#.', '##...##', '.......', '.......', '.......', '##...##', '.#...#.']
                      : ['##...##', '#.....#', '.......', '.......', '.......', '#.....#', '##...##'];
    rows.forEach((r, j) => { for (let i = 0; i < 7; i++) if (r[i] === '#') R().rect(ctx, x + i, y + j, 1, 1, col); });
  };
  // Klein vierkant knopje (HUD) of knop met tekst (titelscherm). Klikvlak-id 'fullscreen': main.js
  // vangt die klik direct in de muisklik af, omdat de browser fullscreen alleen binnen een gebaar toestaat.
  UI.fsButton = function (app, ctx, x, y, withLabel) {
    if (!app.fsAvailable) return;
    const on = app.isFullscreen(), tip = on ? 'Terug naar venster (F)' : 'Volledig scherm (F)';
    if (withLabel) {
      const label = on ? 'Venster' : 'Volledig scherm', w = F().width(label) + 25, h = 13;
      const hv = UI.btn(app, ctx, 'fullscreen', x - w, y, w, h, '', () => {}, { tone: 'wood', tip });
      UI.fsGlyph(ctx, x - w + 6, y + 3 + (hv ? 1 : 0), hv ? P.gold2 : P.gold, on);
      F().draw(ctx, label, x - w + 17, y + 3 + (hv ? 1 : 0), P.cream3, { shadow: P.wood1 });
      return;
    }
    const hv = UI.hit(app, 'fullscreen', x - 1, y - 1, 13, 13, () => {}, tip);
    if (hv) R().round(ctx, x - 1, y - 1, 13, 13, 3, P.wood1);
    UI.fsGlyph(ctx, x + 2, y + 2, hv ? P.gold2 : P.stone2, on);
  };

  // Feedback als pixelicoon (tekstballon 8×7), alleen als de HTML-knop naast het beeld geen plek heeft
  // (exact 16:9-venster of volledig scherm). Klik opent hetzelfde venster als de knop (feedback.js).
  UI.fbGlyph = function (ctx, x, y, line, fill) {
    const rows = ['.######.', '#......#', '#......#', '#......#', '.###.##.', '..##....', '..#.....'];
    rows.forEach((r, j) => { for (let i = 0; i < 8; i++) if (r[i] === '#') R().rect(ctx, x + i, y + j, 1, 1, line); });
    R().rect(ctx, x + 1, y + 1, 6, 3, fill); R().rect(ctx, x + 4, y + 4, 1, 1, fill);
  };
  UI.fbButton = function (app, ctx, x, y, withLabel) {
    if (!CC.feedbackInCanvas || !CC.openFeedback) return false;
    if (withLabel) {   // titelscherm: knop met tekst, links, als tegenhanger van "Volledig scherm"
      const label = 'Feedback', w = F().width(label) + 26, h = 13;
      const hb = UI.btn(app, ctx, 'feedback', x, y, w, h, '', () => CC.openFeedback(), { tone: 'wood', tip: 'Een bug, een idee, iets onduidelijks: laat het weten' });
      UI.fbGlyph(ctx, x + 5, y + 3 + (hb ? 1 : 0), hb ? P.gold2 : P.gold, P.cream3);
      F().draw(ctx, label, x + 17, y + 3 + (hb ? 1 : 0), P.cream3, { shadow: P.wood1 });
      return true;
    }
    const hv = UI.hit(app, 'feedback', x - 1, y - 1, 13, 13, () => CC.openFeedback(), 'Feedback geven op het spel');
    if (hv) R().round(ctx, x - 1, y - 1, 13, 13, 3, P.wood1);
    UI.fbGlyph(ctx, x + 2, y + 2, hv ? P.gold2 : P.gold, hv ? P.cream3 : P.stone2);
    return true;
  };

  // ---------- HUD ----------
  UI.hud = function (app, ctx) {
    const s = app.s; const C = CC.CONFIG;
    R().rect(ctx, 0, 0, 640, 16, P.ink);
    R().rect(ctx, 0, 16, 640, 1, P.wood2);
    const sun = s.day >= C.daysPerWeek;
    const dayName = sun ? 'zondag' : C.dayNamesLong[s.day];
    F().draw(ctx, `WEEK ${s.week}`, 6, 4, P.gold);
    F().draw(ctx, '· ' + dayName, 48, 4, P.cream2);
    // kas
    R().rect(ctx, 116, 4, 7, 7, P.ink); R().rect(ctx, 117, 4, 5, 7, P.gold); R().rect(ctx, 116, 5, 7, 5, P.gold); R().rect(ctx, 118, 6, 3, 3, '#b88a2a');
    // kas telt op of af naar het echte bedrag, kort groen (erbij) of rood (eraf) (M7-juice)
    const now = app.t || 0, dtc = Math.min(0.1, Math.max(0, now - (app.cashT || now))); app.cashT = now;
    if (app.cashShown == null || app.cashShownS !== s) { app.cashShown = s.cash; app.cashShownS = s; }
    const diff = s.cash - app.cashShown;
    if (Math.abs(diff) > 0.01) { app.cashFlash = { up: diff > 0, t: 0.45 }; app.cashShown += diff * Math.min(1, dtc * 7) + Math.sign(diff) * Math.min(Math.abs(diff), dtc * 20); if (Math.abs(s.cash - app.cashShown) < 0.5) app.cashShown = s.cash; }
    if (app.cashFlash) { app.cashFlash.t -= dtc; if (app.cashFlash.t <= 0) app.cashFlash = null; }
    const shown = Math.abs(s.cash - app.cashShown) < 0.01 ? s.cash : Math.round(app.cashShown);
    const cashCol = app.cashFlash ? (app.cashFlash.up ? P.green4 : P.red) : (s.cash < 0 ? P.red : P.gold2);
    F().draw(ctx, R().euro(shown), 127, 4, cashCol);
    // aflossing (zondag), besluit 89: "Zondag €720" en een balk die iets zegt. Beschikbaar = kas min de huur en
    // lonen die deze week nog van de kas gaan (SIM.costsLeft), tegenover de termijn. Groen = gedekt, goud = krap
    // (nog niet gedekt, wel binnen bereik), rood = tekort.
    const due = CC.SIM.weekDue(s);
    if (due > 0) {
      const left = CC.SIM.costsLeft(s), avail = s.cash - left;
      const frac = Math.max(0, Math.min(1, avail / due));
      const col = avail >= due ? P.ok : (frac >= 0.6 ? P.gold : P.red);
      const lbl = 'Zondag', amt = R().euro(due), lw = F().width(lbl);
      F().draw(ctx, lbl, 196, 4, P.stone2);
      F().draw(ctx, amt, 200 + lw, 4, avail >= due ? P.green4 : P.cream2);
      const bx = 205 + lw + F().width(amt), bw = Math.max(24, 312 - bx);
      R().rect(ctx, bx, 5, bw, 7, P.wood1);
      R().rect(ctx, bx + 1, 6, Math.round((bw - 2) * frac), 5, col);
      const tip = `Aflossing zondag: ${R().euro(due)}. Kas ${R().euro(s.cash)}` + (left > 0 ? ` min nog te betalen huur en loon deze week ${R().euro(left)} = ${R().euro(Math.round(avail))}.` : '.') +
        (avail >= due ? ' Gedekt.' : ` Nog ${R().euro(Math.ceil(due - avail))} nodig.`) + ` Nog te gaan in totaal: ${R().euro(CC.SIM.debtLeft(s))}.`;
      UI.hit(app, 'hud_due', 194, 0, 120, 16, null, tip);
    } else if (s.status === 'endless') F().draw(ctx, 'Schuldenvrij', 196, 4, P.green4);
    // reputatie
    const rp = CC.SIM.repProgress(s);
    F().draw(ctx, `Niv ${rp.lv}`, 318, 4, P.gold);
    R().rect(ctx, 346, 5, 42, 7, P.wood1);
    R().rect(ctx, 347, 6, Math.round(40 * rp.frac), 5, P.gold);   // goud: rood is alleen voor "fout" (02_ART §4)
    UI.hit(app, 'hud_rep', 316, 0, 76, 16, null, rp.next ? `Reputatie ${s.rep} · niveau ${rp.lv + 1} bij ${rp.next}` : `Reputatie ${s.rep} · hoogste niveau`);
    // opslaan mislukt: blijvende melding, klik = spelcode bewaren
    if (app.saveFailed) {
      const lbl = '! Niet opgeslagen', w = F().width(lbl) + 10;
      const hv = UI.hit(app, 'hud_save', 396, 3, w, 11, () => app.openCode('export'), 'Opslaan in de browser lukte niet. Klik om je spel als tekstcode te bewaren.');
      R().pill(ctx, 396, 3, w, 11, hv ? P.bord3 : P.bord2, P.ink);
      F().draw(ctx, lbl, 396 + w / 2, 5, P.cream3, { align: 'center' });
    }
    // rechts: fase
    if (app.phase === 'sale') {
      const d = app.day; const frac = Math.min(1, d.t / C.dayLength);
      const mins = 9 * 60 + Math.floor(frac * 9 * 60);
      const hh = String(Math.floor(mins / 60)).padStart(2, '0'), mm = String(mins % 60 - (mins % 15)).padStart(2, '0');
      F().draw(ctx, `${hh}:${mm}`, 442, 4, P.cream2);
      R().rect(ctx, 474, 6, 102, 5, P.wood1);
      R().rect(ctx, 475, 7, Math.round(100 * frac), 3, frac >= 1 ? P.bord3 : P.green3);
      F().draw(ctx, frac >= 1 ? 'dicht' : 'open', 582, 4, frac >= 1 ? P.bord4 : P.green4);
    } else if (app.phase === 'prep') {
      F().draw(ctx, 'Voorbereiden', CC.feedbackInCanvas ? 606 : 620, 4, P.stone2, { align: 'right' });
    }
    UI.fsButton(app, ctx, 627, 3, false);
    UI.fbButton(app, ctx, 613, 3);
  };

  // ---------- Wereld-interactie (voorbereiden) ----------
  UI.worldHits = function (app) {
    if (app.phase !== 'prep') return;
    const W = app.worldRects;
    if (W.phone) UI.hit(app, 'w_phone', W.phone.x, W.phone.y, W.phone.w, W.phone.h, () => app.openPanel('phone'), 'Telefoon: wijn bestellen');
    if (W.counter) UI.hit(app, 'w_counter', W.counter.x, W.counter.y, W.counter.w, W.counter.h, () => app.openPanel('prices'), 'Kassa: prijzen instellen');
    // de tafel met het trapje = de vitrine: klikken opent de keuze (of het kopen) in Investeren
    const TL = CC.BG_LAYERS && CC.BG_LAYERS.table, timg = app.images.layer_table;
    if (TL && timg && timg.naturalWidth && CC.SIM.upgradeUnlocked(app.s, 'vitrine')) {
      const own = CC.SIM.owns(app.s, 'vitrine'), vw = app.s.vitrine && CC.wineById(app.s.vitrine);
      UI.hit(app, 'w_vitrine', TL.x + 6, TL.y, timg.naturalWidth - 12, Math.round(timg.naturalHeight * 0.6), () => app.openPanel('invest'),
        own ? `Vitrine: ${vw ? vw.name + ' (+1 score)' : 'nog leeg'} · klik om te kiezen` : 'Vitrine: te koop bij Investeren');
    }
    for (const sh of W.shelves || []) {
      for (const v of sh.rects) {
        const vk = app.s.vakken[v.vak], w = vk.wine ? CC.wineById(vk.wine) : null;
        UI.hit(app, 'w_' + v.vak, v.x, v.y, v.w, v.h, () => app.openPanel('vak:' + v.vak), `Schap ${CC.vakNumber(v.vak)}: ` + (w ? `${w.name} (${vk.n})` : 'leeg'));
      }
    }
  };

  UI.tooltip = function (app, ctx) {
    const h = UI.pick(app.mouse.x, app.mouse.y);
    if (!h || !h.tip) return;
    // lange tips breken af; het vakje blijft altijd helemaal in beeld
    const lines = F().wrap(h.tip, 240);
    const w = Math.max(...lines.map(l => F().width(l))) + 8, th = lines.length * 10 + 4;
    let x = app.mouse.x + 8, y = app.mouse.y + 10;
    if (x + w + 2 > 638) x = app.mouse.x - w - 6;
    x = Math.max(2, Math.min(636 - w, x));
    if (y + th > 358) y = app.mouse.y - th - 4;
    y = Math.max(18, y);
    R().round(ctx, x, y, w + 2, th, 4, P.ink);
    R().round(ctx, x + 1, y + 1, w, th - 2, 3, P.wood1);
    R().round(ctx, x + 2, y + 2, w - 2, th - 4, 3, P.bord1);
    lines.forEach((l, i) => F().draw(ctx, l, x + 5, y + 4 + i * 10, P.cream2));
  };

  // ---------- Klantprognose (besluit 57) ----------
  // Linkerkolom (besluit 89): 148 px breed, zodat de kasten op de linkerwand (vanaf x 154) met hun flessen vrij blijven.
  const LX = 4, LW = 148;
  UI.forecastBoard = function (app, ctx) {
    const s = app.s, fc = CC.SIM.forecast(s), T = CC.TEXT;
    const order = ['buurt', 'koopjes', 'liefhebber', 'snob'].filter(k => fc.counts[k]);
    const x = LX, y = 34, w = LW, h = 22 + order.length * 12;
    R().round(ctx, x + 2, y + 3, w, h, 6, 'rgba(31,10,14,0.35)');
    R().round(ctx, x, y, w, h, 6, P.ink);
    R().round(ctx, x + 1, y + 1, w - 2, h - 2, 5, P.wood1);
    R().round(ctx, x + 2, y + 2, w - 4, h - 4, 5, 'rgba(31,10,14,0.92)');
    F().draw(ctx, T.forecast.title, x + 7, y + 6, P.gold);
    // totaal als compact getal in een pil; de volle tekst ("46 klanten") in de tooltip
    const tt = String(fc.total), tw = F().width(tt) + 10;
    R().pill(ctx, x + w - tw - 5, y + 4, tw, 11, P.gold, P.ink);
    F().draw(ctx, tt, x + w - 5 - tw / 2, y + 6, P.ink, { align: 'center' });
    UI.hit(app, 'fc_total', x + w - tw - 6, y + 3, tw + 2, 13, null, T.forecast.total.split('{n}').join(fc.total));
    let yy = y + 19;
    for (const k of order) {
      const n = fc.counts[k], info = T.typeInfo[k], ct = CC.CUSTOMER_TYPES[k];
      const hv = UI.hit(app, 'fc_' + k, x + 3, yy - 2, w - 6, 12, null, `${info.many}: budget €${ct.budget[0]}-${ct.budget[1]}; ${info.want}`);
      if (hv && !s.flags.seenForecast) s.flags.seenForecast = true;
      if (hv) R().round(ctx, x + 3, yy - 2, w - 6, 12, 3, 'rgba(232,181,58,0.18)');
      R().round(ctx, x + 6, yy, 7, 7, 3, P.ink); R().round(ctx, x + 7, yy + 1, 5, 5, 2, ct.look.body);
      F().draw(ctx, `${n} ${n === 1 ? info.one : info.many}`, x + 16, yy, P.cream2);
      F().draw(ctx, `€${ct.budget[0]}-${ct.budget[1]}`, x + w - 6, yy, P.stone2, { align: 'right' });
      yy += 12;
    }
    UI.klusBoard(app, ctx, y + h + 5);
  };
  // Ochtendlevering als melding linksonder (in plaats van de hint)
  UI.deliveryNote = function (app) {
    const d = app.delivery; if (!d) return null;
    const T = CC.TEXT.order;
    if (d.blocked) return T.blocked;
    if (!d.deliveries.length && !d.short.length && !(d.scarce && d.scarce.length)) return null;   // niets te melden: ruimte voor de hint
    let txt = d.deliveries.length ? T.delivered.split('{list}').join(d.deliveries.map(x => `${x.n}× ${CC.wineById(x.id).name}`).join(', ')).split('{cost}').join('-' + R().euro(d.cost)) : '';
    if (d.short.length) txt += (txt ? ' ' : '') + T.short.split('{list}').join(d.short.map(id => CC.wineById(id).name).join(', '));
    if (d.scarce && d.scarce.length) txt += (txt ? ' ' : '') + T.scarce.split('{list}').join(d.scarce.map(id => CC.wineById(id).name).join(', '));
    return txt;
  };

  // ---------- Onderbalk voorbereiden ----------
  UI.prepBar = function (app, ctx) {
    const s = app.s;
    const listed = CC.SIM.listed(s).filter(l => l.n > 0).length;
    // knoppen van rechts naar links; de hint linksonder krijgt de rest van de breedte
    let bx = 526;
    UI.btn(app, ctx, 'open', bx, 332, 108, 20, 'Winkel openen ▶', () => app.openShop(), { tone: 'bord', tip: listed ? null : 'Let op: je schappen zijn leeg' });
    const side = (id, label, panel, tip) => { bx -= 86; UI.btn(app, ctx, id, bx, 332, 80, 20, label, () => (app.panel === panel ? app.closePanel() : app.openPanel(panel)), { tone: 'wood', active: app.panel === panel, tip }); return bx; };
    if (s.history.length) side('lastday', 'Gisteren', 'lastday', 'Wat verkocht je gisteren, en wie liep weg? (toets G)');
    if (app.staffOpen()) side('staffbtn', 'Personeel', 'staff', 'Personeel aannemen of ontslaan (toets P)');
    if (app.investOpen()) {
      const ix = side('investbtn', 'Investeren', 'invest', 'Je winkel uitbreiden (toets I)');
      if (app.investNew() && app.panel !== 'invest') {   // nieuw te koop: gouden stip
        const k = 0.5 + 0.5 * Math.sin(app.t * 5);
        R().round(ctx, ix + 72, 328, 10, 10, 5, P.ink); R().round(ctx, ix + 73, 329, 8, 8, 4, P.gold);
        ctx.globalAlpha = k; R().round(ctx, ix + 75, 331, 3, 3, 1, P.gold2); ctx.globalAlpha = 1;
      }
    }
    // hint linksonder: verdwijnt na de leestijd of zodra de speler iets doet (besluit 89)
    const hint = app.panel ? null : (app.emptyWarn ? CC.TEXT.hint.emptyOpen : (app.hintText() || UI.deliveryNote(app)));   // hulp gaat voor de routinemelding
    const ha = hint ? UI.hintAlpha(app, hint) : 0;
    if (ha > 0) {
      const hw = Math.min(310, bx - 12);
      const lines = F().wrap(hint, hw - 10);
      const h = lines.length * 10 + 6;
      ctx.globalAlpha = ha;
      R().round(ctx, 6, 352 - h, hw, h, 5, 'rgba(31,10,14,0.85)'); R().rect(ctx, 11, 352 - h, hw - 10, 1, P.wood2);
      lines.forEach((l, i) => F().draw(ctx, l, 10, 352 - h + 4 + i * 10, P.cream2));
      ctx.globalAlpha = 1;
    }
  };

  // Zichtbaarheid van een hint (0..1). Per tekst en per dag: een nieuwe tekst of een nieuwe dag laat hem weer zien.
  // Weg na de leestijd (6–14 s, naar lengte) of zodra de speler klikt of een toets indrukt (app.actT, main.js).
  UI.hintAlpha = function (app, text) {
    const s = app.s, key = text + '|' + app.phase + '|' + (s ? s.week + '.' + s.day : '');
    const H = app.hintSt || (app.hintSt = {});
    if (H.key !== key) { H.key = key; H.t0 = app.t; H.end = null; }
    if (H.end == null) {
      const read = Math.max(6, Math.min(14, 4 + text.length * 0.06));
      if (app.t - H.t0 > read) H.end = H.t0 + read;
      else if ((app.actT || 0) > H.t0 + 0.6) H.end = app.actT;   // gehandeld nadat de hint verscheen
    }
    const fadeIn = Math.min(1, (app.t - H.t0) / 0.25);
    const fadeOut = H.end == null ? 1 : Math.max(0, 1 - (app.t - H.end) / 0.4);
    return fadeIn * fadeOut;
  };

  UI.saleBar = function (app, ctx) {
    const sp = app.speed;
    UI.btn(app, ctx, 'sp1', 538, 334, 22, 18, '1×', () => app.setSpeed(1), { active: sp === 1, tone: 'wood', tip: 'Normale snelheid (toets 1)' });
    UI.btn(app, ctx, 'sp2', 562, 334, 22, 18, '2×', () => app.setSpeed(2), { active: sp === 2, tone: 'wood', tip: 'Twee keer zo snel (toets 2)' });
    UI.btn(app, ctx, 'sp4', 586, 334, 22, 18, '4×', () => app.setSpeed(4), { active: sp === 4, tone: 'wood', tip: 'Vier keer zo snel (toets 4)' });
    UI.btn(app, ctx, 'skip', 610, 334, 24, 18, '▶▶', () => app.skipDay(), { tone: 'wood', tip: 'Dag overslaan (toets S)' });
  };

  // ---------- Panelen ----------
  const PX = 336, PY = 22, PW = 300, PH = 330;

  UI.panelFrame = function (app, ctx, title) {
    const slide = Math.min(1, app.panelT / 0.14);
    const ease = 1 - Math.pow(1 - slide, 3);
    const left = app.panelSide === 'left';
    const target = left ? 4 : PX, from = left ? -PW : 640;
    const x = Math.round(from + (target - from) * ease);
    UI.hit(app, 'panel_block', x, PY, PW, PH, () => {}, null);
    R().panel(ctx, x, PY, PW, PH);
    const tw = F().width(title) + 18;
    R().pill(ctx, x + 9, PY + 7, tw, 13, P.bord2, P.ink);
    R().rect(ctx, x + 14, PY + 9, tw - 10, 1, P.bord3);
    F().draw(ctx, title, x + 9 + tw / 2, PY + 10, P.cream3, { align: 'center' });
    R().rect(ctx, x + 10, PY + 22, PW - 20, 1, P.cream1);
    UI.btn(app, ctx, 'close', x + PW - 24, PY + 7, 15, 13, '×', () => app.closePanel(), { tone: 'bord' });
    return x;
  };


  // ---------- Kassabon ----------
  UI.dim = function (app, ctx, a) { R().rect(ctx, 0, 17, 640, 343, `rgba(31,10,14,${a || 0.5})`); UI.hit(app, 'dim_block', 0, 17, 640, 343, () => {}, null); };

  // Avondinzicht (besluit 75): zin + knop. go(ins) opent het middenvenster op die wijn (of morgenochtend, vanuit het dagrapport).
  UI.insightText = function (ins) {
    if (!ins) return null;
    const T = CC.TEXT.insight, w = ins.wine && CC.wineById(ins.wine);
    const o = { n: ins.n, wine: w ? w.name : '', stand: ins.stand ? CC.standById(ins.stand).name.toLowerCase() : '', price: ins.price != null ? R().euro(ins.price) : '', margin: ins.margin != null ? R().euro(Math.round(ins.margin)) : '', type: ins.type ? CC.TEXT.typeInfo[ins.type].many : '' };
    return Object.keys(o).reduce((a2, k2) => a2.split('{' + k2 + '}').join(o[k2]), T[ins.key]);
  };
  // Zin en tip over de volle breedte; de knop rechts op de titelregel. noTip: alleen de zin (als de ruimte krap is).
  // Hoogte van het inzichtkader zonder te tekenen (om vooraf te kiezen tussen met en zonder tip)
  UI.insightHeight = function (ins, w, noTip) {
    const T = CC.TEXT.insight, txt = UI.insightText(ins); if (!txt) return 0;
    const lines = F().wrap(txt, w - 14).slice(0, 2);
    const tipRaw = !noTip && T.tip && T.tip[ins.key] ? T.tip[ins.key] : '';
    const tip = ins.type ? tipRaw.split('{type}').join(CC.TEXT.typeInfo[ins.type].many.replace(/^./, c => c.toUpperCase())).split('{want}').join(CC.TEXT.typeInfo[ins.type].want) : tipRaw;
    const tipLines = tip ? F().wrap(tip, w - 14).slice(0, 2) : [];
    return 18 + lines.length * 10 + (tipLines.length ? tipLines.length * 10 + 2 : 0) + 3;
  };
  UI.insightBox = function (app, ctx, ins, x, y, w, go, title, noTip) {
    const T = CC.TEXT.insight, txt = UI.insightText(ins); if (!txt) return 0;
    const lbl = ins.tab === 'prices' ? T.goPrices : T.goOrder, bw = F().width(lbl) + 12;
    const lines = F().wrap(txt, w - 14).slice(0, 2);
    const tipRaw = !noTip && T.tip && T.tip[ins.key] ? T.tip[ins.key] : '';
    const tip = ins.type ? tipRaw.split('{type}').join(CC.TEXT.typeInfo[ins.type].many.replace(/^./, c => c.toUpperCase())).split('{want}').join(CC.TEXT.typeInfo[ins.type].want) : tipRaw;
    const tipLines = tip ? F().wrap(tip, w - 14).slice(0, 2) : [];
    const h = 18 + lines.length * 10 + (tipLines.length ? tipLines.length * 10 + 2 : 0) + 3;
    const bad = ins.key !== 'best';
    R().round(ctx, x, y, w, h, 5, P.ink);
    R().round(ctx, x + 1, y + 1, w - 2, h - 2, 4, bad ? '#fbe9d0' : '#e9f2dc');
    R().rect(ctx, x + 1, y + 4, 2, h - 8, bad ? P.gold : P.green3);
    F().draw(ctx, title || T.title, x + 8, y + 5, bad ? P.bord2 : P.green2);
    lines.forEach((l, i) => F().draw(ctx, l, x + 8, y + 17 + i * 10, P.ink));
    const ty = y + 17 + lines.length * 10 + 2;
    tipLines.forEach((l, i) => F().draw(ctx, l, x + 8, ty + i * 10, bad ? P.wood2 : P.green2));
    UI.btn(app, ctx, 'insight_go', x + w - bw - 4, y + 3, bw, 13, lbl, go, { tone: 'wood', tip: go.tip || (ins.tab === 'prices' ? T.tipPrices : T.tipOrder) });
    return h;
  };

  // Dagrapport (besluit 74): breed venster. Links de kassabon (alleen geld), rechts wat er in de winkel gebeurde.
  UI.resultPanel = function (app, ctx) {
    const sm = app.summary; const s = app.s;
    const t = app.resultT;
    const sold = Object.keys(sm.wines || {}).filter(id => sm.wines[id].sold > 0).sort((a, b) => sm.wines[b].rev - sm.wines[a].rev);
    const adv = sm.advice || { asked: 0, tips: 0 };
    const k = Math.min(1, Math.max(0, (t - 0.3) / 0.9));
    const cnt = v => Math.round(v * k);
    const money = v => R().euro(Math.round(v * k * 2) / 2);
    const signed = v => (v < 0 && Math.round(Math.abs(v) * k * 2) > 0 ? '-' : '') + money(Math.abs(v));
    const minus = v => (Math.round(v * k * 2) > 0 ? '-' : '') + money(v);   // geen "-€0" tijdens het optellen
    const cf = sm.cashflow != null ? sm.cashflow : sm.profit;
    const due = CC.SIM.weekDue(s);
    // hoogte vooraf uitrekenen (bon links, winkel rechts), zodat het venster nooit leeg of te krap is
    const nShop = ((sm.src || {}).upg && sm.src.upg.n ? 1 : 0) + ((sm.vitrine && s.vitrine) || sm.koeling ? 1 : 0);
    const nStaff = Object.keys(sm.work || {}).length;
    const nWines = Math.min(4, Object.keys(sm.wines || {}).filter(id => sm.wines[id].sold > 0).length) || 1;
    const bonH = 30 + 20 + 10 + (due > 0 ? 11 : 0) + 15 + nWines * 10 + (3 + (adv.tips > 0 ? 1 : 0) + (sm.wages > 0 ? 1 : 0)) * 10 + (1 + (sm.invest > 0 ? 1 : 0) + (sm.bought > 0 || !(sm.invest > 0) ? 1 : 0)) * 10 + 4;
    const ins = app.insightFor === sm ? app.insight : (app.insightFor = sm, app.insight = CC.SIM.insight(s, sm));
    const rightH = 2 + 52 + (adv.asked > 0 ? 11 : 0) + 43 + (sm.week === 1 && sm.day === 0 ? 40 : 0) + (sm.klusDone || []).length * 14 + (ins ? 58 : 0) + (nShop ? 18 + nShop * 11 : 0) + (nStaff ? 14 + nStaff * 20 : 0) + 4;
    const W = 448, H = Math.min(312, Math.max(306, bonH + 44, rightH + 44)), X = 96, y0 = 20;   // altijd groot (wens HJ); lege ruimte mag
    const slide = Math.min(1, t / 0.35), ease = 1 - Math.pow(1 - slide, 3);
    const y = Math.round(360 + (y0 - 360) * ease);
    UI.dim(app, ctx, 0.45);
    R().panel(ctx, X, y, W, H);
    // kop
    const title = `Week ${sm.week} · ${CC.CONFIG.dayNamesLong[sm.day]}`, tw = F().width(title) + 18;
    R().pill(ctx, X + 12, y + 8, tw, 13, P.bord2, P.ink);
    F().draw(ctx, title, X + 12 + tw / 2, y + 11, P.cream3, { align: 'center' });

    // ----- links: kassabon (alleen geld) -----
    const L = [];
    const row = (l, r, col, lcol) => L.push({ k: 'row', l, r, col, lcol });
    const dash = () => L.push({ k: 'dash' });
    L.push({ k: 'big', l: 'Winst vandaag', r: signed(sm.profit), col: sm.profit >= 0 ? P.green2 : P.red });
    row('Kas', R().euro(sm.cash), P.ink);
    if (due > 0) L.push({ k: 'center', text: s.cash >= due ? `Zondag: ${R().euro(due)} ✔` : `Zondag: ${R().euro(due)} · nog ${R().euro(due - s.cash)}`, col: s.cash >= due ? P.green2 : P.red });
    dash();
    if (!sold.length) row('Niets verkocht', '', P.stone1, P.stone1);
    const shown = sold.length > 4 ? sold.slice(0, 3) : sold;   // top 3; de rest staat onder "Gisteren"
    for (const id of shown) { const ws = sm.wines[id], wn = CC.wineById(id), best = id === sm.best && sold.length > 1; row(`${cnt(ws.sold)}× ${wn.name}`, money(ws.rev), null, best ? P.bord2 : P.ink); if (best) L[L.length - 1].best = true; }
    if (shown.length < sold.length) { const rest = sold.slice(3); row(`en ${rest.length} andere (${rest.reduce((a, id) => a + sm.wines[id].sold, 0)} fl.)`, money(rest.reduce((a, id) => a + sm.wines[id].rev, 0)), P.stone1, P.stone1); }
    dash();
    row('Omzet', money(sm.revenue));
    row('Inkoopwaarde verkocht', minus(sm.cogs), P.bord3);
    if (adv.tips > 0) row('Fooi (advies)', money(adv.tips), P.green2);
    row('Huur en energie', '-' + R().euro(sm.rent), P.bord3);
    if (sm.wages > 0) row('Personeel', '-' + R().euro(sm.wages), P.bord3);
    dash();
    if (sm.bought > 0 || !(sm.invest > 0)) row('Ingekocht', minus(sm.bought || 0), P.bord3);
    if (sm.invest > 0) row('Investering', minus(sm.invest), P.bord3);
    row('Kasstroom vandaag', signed(cf), cf >= 0 ? P.green2 : P.red, P.bord2);
    const HH = { row: 10, dash: 5, big: 16, center: 11 };
    const bw = 204, bx = X + 12, by = y + 28;
    const bh = Math.max(30 + L.reduce((a, it) => a + HH[it.k], 0) + 26, H - 40);   // de bon loopt door tot onderaan, als een echte kassabon
    R().rect(ctx, bx + 2, by + 2, bw, bh, 'rgba(31,10,14,0.25)');
    R().rect(ctx, bx - 1, by - 1, bw + 2, bh + 1, P.ink);
    R().rect(ctx, bx, by, bw, bh, P.cream3);
    for (let i = 0; i < bw; i += 6) { R().rect(ctx, bx + i, by + bh, 3, 2, P.cream3); R().rect(ctx, bx + i + 3, by + bh, 3, 1, P.ink); }
    let yy = by + 8;
    HF().draw(ctx, 'KASSABON', bx + bw / 2, yy + 1, P.ink, { align: 'center' });
    for (let i = 8; i < bw - 8; i += 2) R().rect(ctx, bx + i, yy + 15, 1, 1, P.stone2); yy += 20;   // bonnetjeslijn onder de kop
    for (const it of L) {
      if (it.k === 'dash') { for (let i = 8; i < bw - 8; i += 4) R().rect(ctx, bx + i, yy, 2, 1, P.stone2); yy += 5; }
      else if (it.k === 'row') {
        // beste wijn: zodra alles is opgeteld een gouden band en een ster die er even in springt (M7-juice)
        const sa = t - 1.25;
        if (it.best && sa > 0) {
          R().rect(ctx, bx + 5, yy - 2, bw - 10, 11, `rgba(232,181,58,${Math.min(0.35, sa * 1.2)})`);
          const sxs = bx + 12 + F().width(it.l) + 2, bounce = sa < 0.25 ? Math.round(Math.sin(sa / 0.25 * Math.PI) * 3) : 0;
          UI.star(ctx, sxs, yy - 1 - bounce, (Math.floor(app.t * 2) % 4) === 0 ? P.gold2 : P.gold);
        }
        F().draw(ctx, it.l, bx + 9, yy, it.lcol || P.ink); F().draw(ctx, it.r, bx + bw - 9, yy, it.col || P.ink, { align: 'right' }); yy += 10;
      }
      else if (it.k === 'big') { F().draw(ctx, it.l, bx + 9, yy + 3, P.ink); HF().draw(ctx, it.r, bx + bw - 9, yy, it.col, { align: 'right' }); yy += 16; }
      else if (it.k === 'center') { F().draw(ctx, it.text, bx + bw / 2, yy, it.col, { align: 'center' }); yy += 11; }
    }
    for (let i = 8; i < bw - 8; i += 4) R().rect(ctx, bx + i, by + bh - 20, 2, 1, P.stone2);
    F().draw(ctx, 'Bedankt en tot morgen!', bx + bw / 2, by + bh - 13, P.stone1, { align: 'center' });

    // ----- rechts: de winkel vandaag -----
    const rx = X + 232, rw = W - 244;
    let ry = y + 30;
    const head = (txt) => { HF().draw(ctx, txt, rx, ry - 2, P.bord2); R().rect(ctx, rx, ry + 10, rw, 1, P.cream1); ry += 14; };   // zelfde regelafstand als voorheen
    const line = (l, r, col, rcol) => { F().draw(ctx, l, rx, ry, col || P.ink); if (r) F().draw(ctx, r, rx + rw, ry, rcol || P.ink, { align: 'right' }); ry += 11; };
    // klanten: één balk met kopers en weglopers
    head('Klanten');
    line(`${cnt(sm.customers)} binnen, ${cnt(sm.buyers)} kochten`, sm.customers ? Math.round(100 * sm.buyers / sm.customers) + '%' : '', P.ink, P.green2);
    const segs = [[sm.buyers, P.green3, 'kocht'], [sm.tooExpensive, P.red, 'te duur'], [sm.soldOut, '#d98a2b', 'op'], [sm.nothing + (sm.adviceLeft || 0), P.stone2, 'niks']];
    const tot = Math.max(1, segs.reduce((a, x) => a + x[0], 0));
    R().round(ctx, rx, ry, rw, 9, 3, P.ink);
    let sx = rx + 1;
    segs.forEach(([n, col], i) => { const w = i === segs.length - 1 ? rx + rw - 1 - sx : Math.round((rw - 2) * n / tot * k); if (w > 0) { R().rect(ctx, sx, ry + 1, w, 7, col); sx += w; } });
    ry += 13;
    let lx = rx;
    segs.slice(1).forEach(([n, col, lbl]) => { const txt = `${cnt(n)} ${lbl}`; R().rect(ctx, lx, ry + 2, 5, 5, col); F().draw(ctx, txt, lx + 8, ry, n ? P.ink : P.stone2); lx += F().width(txt) + 16; });
    UI.hit(app, 'res_weg', rx, ry - 14, rw, 24, null, 'Weg: te duur = liep weg om de prijs · op = wijn was uitverkocht · niks = niets naar zijn smaak (of weg na advies).');
    ry += 14;
    if (adv.asked > 0) line('Advies goed', `${cnt(adv.good)} van ${cnt(adv.asked)}`, P.ink, adv.good ? P.green2 : P.stone1);
    // reputatie + voortgang naar het volgende niveau
    const rp = CC.SIM.repProgress(s);
    line('Reputatie', (sm.rep >= 0 ? '+' : '') + cnt(sm.rep), P.ink, P.bord2);
    R().rect(ctx, rx, ry, rw, 4, P.cream1); R().rect(ctx, rx, ry, Math.round(rw * rp.frac), 4, P.gold); R().rect(ctx, rx, ry + 3, Math.round(rw * rp.frac), 1, "#b88a2a");   // goud, zoals in de HUD
    ry += 6;
    F().draw(ctx, rp.next ? `niveau ${rp.lv} · nog ${rp.next - Math.round(s.rep)} tot niveau ${rp.lv + 1}` : `niveau ${rp.lv} · hoogste niveau`, rx, ry, P.stone1); ry += 11;
    // waar kwam de reputatie vandaan? (besluit 76)
    const RP = sm.repParts || {}, rn = v => (v > 0 ? '+' : '') + String(Math.round(v * 10) / 10).replace('.', ',');
    const parts = [['verkoop', RP.sale], ['prestige', RP.prestige], ['advies', RP.advice], ['klus', RP.klus], ['woeker', RP.woeker]].filter(p2 => p2[1]);
    if (parts.length) {   // past het niet op één regel, dan over twee
      const pl = parts.map(p2 => `${p2[0]} ${rn(p2[1])}`), one = pl.join(' · ');
      const rowsP = F().width(one) <= rw ? [one] : [pl.slice(0, Math.ceil(pl.length / 2)).join(' · '), pl.slice(Math.ceil(pl.length / 2)).join(' · ')];
      rowsP.forEach(l => { F().draw(ctx, l, rx, ry, P.wood2); ry += 10; }); ry += 1;
    }
    ry += 3;
    for (const kd of sm.klusDone || []) {   // klus gehaald: groen vinkje
      R().round(ctx, rx, ry - 2, rw, 12, 4, '#e9f2dc');
      const kr = kd.rep ? `+${kd.rep} ★` : '+' + R().euro(kd.cash), maxW = rw - F().width(kr) - 16;
      let kt = '✔ ' + UI.klusText(kd.lvl); while (F().width(kt) > maxW && kt.length > 4) kt = kt.slice(0, -2) + '.';
      F().draw(ctx, kt, rx + 4, ry, P.green2);
      F().draw(ctx, kr, rx + rw - 4, ry, P.green2, { align: 'right' });
      ry += 14;
    }
    // allereerste dag: uitleg hoe je reputatie verdient (M7)
    if (sm.week === 1 && sm.day === 0) {
      const tl = F().wrap(CC.TEXT.tutorial.firstReport, rw - 12);
      R().round(ctx, rx, ry - 2, rw, tl.length * 10 + 6, 4, 'rgba(232,181,58,0.18)');
      tl.forEach((l, i) => F().draw(ctx, l, rx + 6, ry + 1 + i * 10, P.wood1));
      ry += tl.length * 10 + 10;
    }
    // avondinzicht: de klik opent morgenochtend het middenvenster op die wijn
    if (ins) {
      const go = () => { app.pendingFocus = { tab: ins.tab, wine: ins.wine || null }; app.resultT = Math.max(app.resultT, 1.25); app.afterResult(); };
      go.tip = CC.TEXT.insight.goTip;
      // ruimte die er na het kader nog nodig is: precies wat "Je winkel" en "Personeel" hieronder innemen
      const room = y + H - 9 - ry - 8 - (nShop ? 18 + nShop * 11 : 0) - (nStaff ? 14 + nStaff * 21 : 0);
      ry += UI.insightBox(app, ctx, ins, rx, ry, rw, go, null, UI.insightHeight(ins, rw, false) > room) + 8;
    }

    // je winkel: investeringen
    const TW = CC.TEXT.work, TS = CC.TEXT.staff.bon, fill = (str, o) => Object.keys(o).reduce((a2, k2) => a2.split('{' + k2 + '}').join(o[k2]), str);
    const src = sm.src || {}, work = sm.work || {}, U = src.upg;
    const vw = s.vitrine && CC.wineById(s.vitrine);
    const shopRows = [];
    if (U && U.n) { shopRows.push([`Extra klanten: ${U.n}, ${U.buyers} kochten`, '+' + money(U.margin), P.green2]); UI.hit(app, 'res_upg', rx, ry + 14, rw, 11, null, 'Klanten die komen dankzij je uithangbord en extra kasten, en de marge op wat zij kochten.'); }
    if (sm.vitrine && vw && sm.koeling) shopRows.push([fill(TW.shop, { v: sm.vitrine, k: sm.koeling }), '', P.ink]);
    else if (sm.vitrine && vw) shopRows.push([`Vitrine: ${sm.vitrine} fl. ${vw.name}`, '', P.ink]);
    else if (sm.koeling) shopRows.push([fill(TW.koeling, { k: sm.koeling }), '', P.ink]);
    if (shopRows.length) { head('Je winkel'); shopRows.forEach(([l, r, c]) => line(l, r, P.ink, c)); ry += 4; }

    // personeel: wat deed wie, en XP
    const ids = Object.keys(work);
    // te weinig ruimte over (drukke dag)? Dan per medewerker één regel met een dun XP-balkje eronder.
    const tightStaff = ids.length && (y + H - 9 - ry) < 14 + ids.length * 21;
    if (ids.length) {
      head('Personeel');
      for (const id of ids) {
        const w = work[id], st = s.staff[id];
        let txt = id === 'sem' ? fill(TS.sem, { refill: w.refill, folder: w.folder }) : id === 'fatima' ? fill(TS.fatima, { saved: w.saved, s: w.saved === 1 ? '' : 'en' }) : fill(TS.dubois, { answered: w.answered, bottles: w.bottles });
        const xp = '+' + String(Math.round(w.xp * 10) / 10).replace('.', ',') + ' XP';
        F().draw(ctx, txt, rx, ry, P.ink);
        const pw = F().width(xp) + 8;
        R().pill(ctx, rx + rw - pw, ry - 2, pw, 11, w.xp > 0 ? P.gold : P.cream1, P.ink);
        F().draw(ctx, xp, rx + rw - pw / 2, ry, P.ink, { align: 'center' });
        ry += 12;
        if (st && tightStaff) {   // compact: alleen een dun balkje, het level staat in de tooltip
          const next = CC.SIM.staffNext(s, id), Lx = CC.CONFIG.staffXp, a = Lx[st.level - 1];
          const f = next == null ? 1 : Math.max(0, Math.min(1, (st.xp - a) / (next - a)));
          R().rect(ctx, rx, ry - 2, rw - pw - 6, 1, P.cream1); R().rect(ctx, rx, ry - 2, Math.round((rw - pw - 6) * f), 1, P.gold);
          UI.hit(app, 'res_xp_' + id, rx, ry - 14, rw, 13, null, next == null ? `level ${st.level} · max` : `level ${st.level} · ${Math.floor(st.xp)}/${next} XP`);
          ry += 1;
        } else if (st) {   // XP-balk naar het volgende level
          const next = CC.SIM.staffNext(s, id), Lx = CC.CONFIG.staffXp, a = Lx[st.level - 1];
          const f = next == null ? 1 : Math.max(0, Math.min(1, (st.xp - a) / (next - a)));
          const lt = next == null ? `level ${st.level} · max` : `level ${st.level} · ${Math.floor(st.xp)}/${next} XP`, lw = rw - F().width(lt) - 8;
          R().rect(ctx, rx, ry + 1, lw, 3, P.cream1); R().rect(ctx, rx, ry + 1, Math.round(lw * f), 3, P.gold);
          F().draw(ctx, lt, rx + rw, ry - 1, P.stone1, { align: 'right' });
          ry += 9;
        }
      }
    }
    // onderaan rechts: nieuw niveau of een droge opmerking
    const foot = sm.levelUp ? `★ NIEUW NIVEAU: ${sm.levelUp.to} ★` : (due <= 0 ? app.resultQuip : '');
    if (foot && k >= 1 && ry < y + H - 34) F().wrap(foot, rw).slice(0, 2).forEach((l, i) => F().draw(ctx, l, rx + rw / 2, y + H - 30 + i * 10, sm.levelUp ? P.bord2 : P.stone1, { align: 'center' }));
    const last = s.day === CC.CONFIG.daysPerWeek - 1;
    if (t > 0.3) UI.btn(app, ctx, 'next', X + W / 2 - 80, y + H + 6, 160, 20, k < 1 ? 'Verder ▶' : (sm.levelUp ? 'Verder ▶' : (last ? 'Naar zondag ▶' : 'Volgende dag ▶')), () => app.afterResult(), { tone: 'bord' });
  };

  // ---------- Gisteren: verkoop per wijn en per klanttype (knop tijdens voorbereiden) ----------
  UI.lastDayPanel = function (app, ctx) {
    const s = app.s, sm = s.history[s.history.length - 1];
    const x = UI.panelFrame(app, ctx, 'Gisteren');
    if (!sm) { F().draw(ctx, 'Nog geen verkoopdag gehad.', x + 12, PY + 30, P.stone1); return; }
    F().draw(ctx, `${CC.CONFIG.dayNamesLong[sm.day]}, week ${sm.week}`, x + PW - 30, PY + 10, P.wood2, { align: 'right' });
    let y = PY + 28;
    // per wijn
    const cols = [['Wijn', 14, 'left'], ['Prijs', 108, 'left'], ['Verk.', 172, 'right'], ['Marge', 214, 'right'], ['Duur', 248, 'right'], ['Op', 282, 'right']];
    const head = () => { cols.forEach(([t, cx, al]) => F().draw(ctx, t, x + cx, y, P.bord2, { align: al })); y += 11; R().rect(ctx, x + 10, y - 2, PW - 20, 1, P.cream1); };
    head();
    const W = sm.wines || {}, stands = sm.stands || {};
    const ids = Array.from(new Set([...Object.keys(stands), ...Object.keys(W)]));
    ids.sort((a, b) => ((W[b] || {}).rev || 0) - ((W[a] || {}).rev || 0));
    if (!ids.length) { F().draw(ctx, 'Er stond niets op het schap.', x + 14, y + 2, P.stone1); y += 12; }
    ids.forEach((id, i) => {
      const ws = W[id] || { sold: 0, margin: 0, tooExpensive: 0, soldOut: 0 }, wn = CC.wineById(id);
      if (i % 2 === 0) R().round(ctx, x + 8, y - 2, PW - 16, 12, 3, P.cream3);
      const st = stands[id] ? CC.standById(stands[id]).name : '-';
      F().draw(ctx, wn.name, x + 14, y, P.ink);
      F().draw(ctx, st, x + 108, y, stands[id] === 'scherp' ? P.green2 : (stands[id] === 'stevig' || stands[id] === 'woeker' ? P.bord3 : P.stone1));
      F().draw(ctx, String(ws.sold), x + 172, y, ws.sold ? P.ink : P.stone2, { align: 'right' });
      F().draw(ctx, R().euro(ws.margin), x + 214, y, ws.margin ? P.green2 : P.stone2, { align: 'right' });
      F().draw(ctx, String(ws.tooExpensive), x + 248, y, ws.tooExpensive ? P.red : P.stone2, { align: 'right' });
      F().draw(ctx, String(ws.soldOut), x + 282, y, ws.soldOut ? P.red : P.stone2, { align: 'right' });
      y += 12;
    });
    y += 2;
    F().draw(ctx, `Totaal ${sm.bottles} flessen · marge ${R().euro(sm.margin)} · winst ${R().euro(sm.profit)}`, x + 14, y, P.wood2); y += 16;
    // per klanttype
    const tc = [['Klanten', 14, 'left'], ['Binnen', 150, 'right'], ['Kocht', 186, 'right'], ['Duur', 218, 'right'], ['Op', 248, 'right'], ['Niks', 282, 'right']];
    tc.forEach(([t, cx, al]) => F().draw(ctx, t, x + cx, y, P.bord2, { align: al })); y += 11; R().rect(ctx, x + 10, y - 2, PW - 20, 1, P.cream1);
    const T = sm.types || {};
    Object.keys(CC.CUSTOMER_TYPES).filter(k => T[k]).forEach((k, i) => {
      const ts = T[k];
      if (i % 2 === 0) R().round(ctx, x + 8, y - 2, PW - 16, 12, 3, P.cream3);
      F().draw(ctx, CC.CUSTOMER_TYPES[k].name, x + 14, y, P.ink);
      F().draw(ctx, String(ts.n), x + 150, y, P.ink, { align: 'right' });
      F().draw(ctx, String(ts.buyers), x + 186, y, ts.buyers ? P.green2 : P.stone2, { align: 'right' });
      F().draw(ctx, String(ts.tooExpensive), x + 218, y, ts.tooExpensive ? P.red : P.stone2, { align: 'right' });
      F().draw(ctx, String(ts.soldOut), x + 248, y, ts.soldOut ? P.red : P.stone2, { align: 'right' });
      F().draw(ctx, String(ts.nothing), x + 282, y, ts.nothing ? P.bord3 : P.stone2, { align: 'right' });
      y += 12;
    });
    if (!Object.keys(T).length) { F().draw(ctx, '(van vóór deze versie: geen details)', x + 14, y, P.stone1); y += 12; }
    UI.hit(app, 'ld_help', x + 10, PY + 26, PW - 20, 12, null, 'Marge = omzet min inkoopwaarde van wat er verkocht is. Duur = liep weg om de prijs. Op = wijn was uitverkocht. Niks = er stond niets naar zijn smaak.');
    // avondinzicht (besluit 75): klik opent het middenvenster op die wijn
    const ins = CC.SIM.insight(s, sm);
    if (ins) {
      const go = () => app.focusWine(ins.tab, ins.wine || null); go.tip = null;
      const lines = F().wrap(UI.insightText(ins), PW - 36).slice(0, 2);
      UI.insightBox(app, ctx, ins, x + 10, PY + PH - 26 - lines.length * 10, PW - 20, go, CC.TEXT.insight.titleYesterday);
    }
  };

  // ---------- Nieuw niveau ----------
  // Vuurwerk bij een feestelijk scherm: een paar pijlen bij binnenkomst, daarna af en toe één (besluit 59)
  UI.celebrate = function (app, x0, x1, yTop) {
    if (!CC.FX) return;
    if (app.fwPhase !== app.phase + app.s.week + '-' + app.s.day) { app.fwPhase = app.phase + app.s.week + '-' + app.s.day; app.fwNext = 0.05; app.fwN = 0; }
    if (app.phaseT >= app.fwNext && app.fwN < 7) {
      const cols = [P.gold, P.bord4, P.green4, P.gold2];
      // links en rechts van het venster, waar je het ziet
      const left = app.fwN % 2 === 0, lo = left ? 30 : x1 + 30, hi = left ? x0 - 30 : 610;
      const fx = hi > lo ? lo + Math.random() * (hi - lo) : (left ? 40 : 600);
      CC.FX.firework(fx, 70 + Math.random() * 90, cols[app.fwN % cols.length]);
      app.fwN++; app.fwNext += app.fwN < 3 ? 0.35 : 1.4 + Math.random();
    }
  };
  // Stralenkrans achter een feestelijk venster
  UI.rays = function (ctx, cx, cy, r, t, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = P.gold;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a0 = t * 0.15 + i * Math.PI * 2 / n, a1 = a0 + Math.PI / n * 0.7;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r); ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  function unlockTiles(app, u) {
    const tiles = [];
    for (const wn of u.wines) tiles.push({ kind: 'wine', wine: wn, a: wn.name, b: CC.roleById(wn.role).name });
    for (const up of u.upgrades || []) tiles.push({ kind: 'upgrade', id: up.id, a: up.short || up.name, b: `nu te koop · ${R().euro(up.cost)}`, gold: true });
    for (const id of u.staff || []) tiles.push({ kind: 'staff', id, a: CC.STAFF[id].name, b: 'kan komen werken' });
    for (const k of Object.keys(CC.CUSTOMER_TYPES).filter(k => CC.CUSTOMER_TYPES[k].minLevel === app.summary.levelUp.to)) tiles.push({ kind: 'type', id: k, a: CC.TEXT.typeInfo[k].many.replace(/^./, c => c.toUpperCase()), b: 'nieuwe klanten' });
    const to = app.summary.levelUp.to, dt = CC.TEXT.decorTile && CC.TEXT.decorTile[to];
    if (dt && CC.DECOR_TILES && CC.DECOR_TILES[to]) tiles.push({ kind: 'decor', id: 'decor' + to, a: dt.a, b: dt.b });
    tiles.push({ kind: 'crowd', a: `+${u.moreCustomers} klanten`, b: 'per dag' });
    return tiles;
  }
  function tileIcon(app, ctx, tl, cx, by) {
    // illustratie van HJ (assets/tiles.js, tools/build_tiles.py); anders de getekende versie
    const key = tl.kind === 'decor' ? tl.id : tl.kind === 'crowd' ? 'crowd' : tl.kind === 'upgrade' ? (/^kast/.test(tl.id) ? 'kast' : tl.id) : (tl.kind === 'staff' || tl.kind === 'type') ? tl.id : null;
    const ti = key && app.images['tile_' + key];
    if (ti && ti.complete && ti.naturalWidth) { ctx.drawImage(ti, Math.round(cx - ti.naturalWidth / 2), by - 1 - ti.naturalHeight); return; }
    if (tl.kind === 'wine') {
      if (tl.solo) { R().wineSprite(ctx, tl.wine, 'icoon', cx - 15, by - 3); R().wineSprite(ctx, tl.wine, 'icoon', cx + 15, by - 3); }   // alleen een wijn: kleine opstelling
      if (!R().wineSprite(ctx, tl.wine, 'groot', cx, by)) R().rect(ctx, cx - 5, by - 30, 10, 30, tl.wine.glass);
      return;
    }
    if (tl.kind === 'staff' || tl.kind === 'type') {
      const im = app.images['chr_' + tl.id + '_front'];
      if (im && im.complete && im.naturalWidth) { const h = 40, w = Math.round(im.naturalWidth * h / im.naturalHeight); ctx.drawImage(im, Math.round(cx - w / 2), by - h, w, h); }
      return;
    }
    if (tl.kind === 'upgrade') { UI.upgradeIcon(app, ctx, tl.id, cx, by); return; }
    for (const [dx, dy] of [[-12, 4], [0, 0], [12, 4]]) {   // groepje mensen
      R().round(ctx, cx + dx - 4, by - 32 + dy, 8, 8, 4, P.skin1); R().round(ctx, cx + dx - 6, by - 23 + dy, 12, 18 - dy, 4, dx ? P.green3 : P.bord3);
    }
  }
  // Niveauscherm (besluit 76): thema, twee nieuwe dingen (even groot, geen rangorde), +klanten, en de nieuwe klus.
  function refTile(app, ref) {
    if (ref.wine) { const wn = CC.wineById(ref.wine); return { kind: 'wine', wine: wn, a: wn.name }; }
    if (ref.upgrade) { const up = CC.upgradeById(ref.upgrade); return { kind: 'upgrade', id: up.id, a: up.short || up.name }; }
    if (ref.staff) return { kind: 'staff', id: ref.staff, a: CC.STAFF[ref.staff].name };
    if (ref.type) return { kind: 'type', id: ref.type, a: CC.TEXT.typeInfo[ref.type].many };
    return null;
  }
  UI.klusText = function (lvl) { const d = CC.SIM.klusDef(lvl); return d ? CC.TEXT.klus[lvl].split('{need}').join(d.need) : ''; };
  UI.klusReward = function (lvl) { const d = CC.SIM.klusDef(lvl), U = CC.TEXT.klusUi; return d.rep ? U.repR.split('{n}').join(d.rep) : U.cashR.split('{n}').join(R().euro(d.cash)); };
  UI.levelPanel = function (app, ctx) {
    const lu = app.summary.levelUp, L = lu.to, t = app.phaseT;
    const LV = CC.LEVELS[L] || {}, TX = (CC.TEXT.levels || {})[L] || {};
    UI.dim(app, ctx, 0.6);
    const w = 400, h = 290, x = 120, y = 36;
    UI.rays(ctx, 320, y + 34, 300, app.t, 0.13 * Math.min(1, t / 0.4));
    UI.celebrate(app, x + 20, x + w - 20, y - 10);
    const pop = Math.min(1, t / 0.25), yy0 = y + Math.round((1 - pop) * 24);
    R().panel(ctx, x, yy0, w, h);
    UI.ornateTitle(ctx, `NIVEAU ${L}`, 320, yy0 + 19, P.bord2, { shadow: P.gold, len: 48 });
    if (TX.theme) { const tw = F().width(TX.theme) + 20; R().pill(ctx, 320 - tw / 2, yy0 + 42, tw, 13, P.bord2, P.ink); F().draw(ctx, TX.theme, 320, yy0 + 45, P.cream3, { align: 'center' }); }
    F().draw(ctx, app.levelQuip, 320, yy0 + 60, P.stone1, { align: 'center' });
    const appear = i => Math.max(0, Math.min(1, (t - 0.35 - i * 0.18) / 0.22));
    // één nieuw ding per tegel, met één of twee plaatjes
    const drawPrize = (i, bx, by, bw, bh, refs, label, sub, big) => {
      const k = appear(i); if (k <= 0) return;
      ctx.globalAlpha = k; const oy = Math.round((1 - k) * 8);
      R().round(ctx, bx, by + oy, bw, bh, 8, P.gold);
      R().round(ctx, bx + 1, by + 1 + oy, bw - 2, bh - 2, 7, '#fffaf0');
      R().round(ctx, bx + 5, by + 5 + oy, bw - 10, bh - 36, 6, R().pattern(ctx, 'lattice', bx + 5, by + 5 + oy));   // ruitjes (besluit 91)
      R().round(ctx, bx + 24, by + bh - 36 + oy, bw - 48, 4, 2, 'rgba(122,74,36,0.18)');                            // vloertje onder de figuren
      const tiles = (refs || []).map(r => refTile(app, r)).filter(Boolean);
      if (tiles.length === 1 && tiles[0].kind === 'wine') tiles[0].solo = true;
      tiles.forEach((tl, j) => { const cx = bx + bw / 2 + (tiles.length > 1 ? (j ? 1 : -1) * bw / 5 : 0); tileIcon(app, ctx, tl, cx, by + bh - 32 + oy); });
      F().draw(ctx, label || '', bx + bw / 2, by + bh - 26 + oy, P.ink, { align: 'center' });
      F().draw(ctx, sub || '', bx + bw / 2, by + bh - 15 + oy, P.bord3, { align: 'center' });
      ctx.globalAlpha = 1;
    };
    // twee nieuwe dingen naast elkaar, even groot: geen rangorde (wens HJ)
    drawPrize(0, x + 20, yy0 + 74, 176, 118, LV.main, TX.main, TX.mainSub);
    drawPrize(1, x + 204, yy0 + 74, 176, 118, LV.side, TX.side, TX.sideSub);
    // extra: meer klanten en (op niveau 3 en 6) nieuwe aankleding
    const k2 = appear(2);
    if (k2 > 0) {
      ctx.globalAlpha = k2;
      const extras = [`+${CC.CONFIG.customersPerLevel} klanten per dag`];
      const dt = CC.TEXT.decorTile && CC.TEXT.decorTile[L]; if (dt) extras.push(`${dt.a}: ${dt.b}`);
      let ex = 320 - (extras.reduce((a, e) => a + F().width(e) + 22, 0) - 8) / 2;
      for (const e of extras) { const ew = F().width(e) + 14; R().pill(ctx, ex, yy0 + 198, ew, 12, P.cream2, P.wood2); F().draw(ctx, e, ex + ew / 2, yy0 + 201, P.wood1, { align: 'center' }); ex += ew + 8; }
      ctx.globalAlpha = 1;
    }
    // nieuwe klus
    const k3 = appear(3);
    if (k3 > 0 && CC.SIM.klusDef(L)) {
      ctx.globalAlpha = k3;
      const kx = x + 20, ky = yy0 + 218, kw = w - 40, kh = 34;
      R().round(ctx, kx, ky, kw, kh, 6, P.ink); R().round(ctx, kx + 1, ky + 1, kw - 2, kh - 2, 5, '#fbe9d0');
      R().rect(ctx, kx + 1, ky + 5, 2, kh - 10, P.gold);
      F().draw(ctx, CC.TEXT.klusUi.newKlus, kx + 10, ky + 6, P.bord2);
      F().draw(ctx, UI.klusText(L), kx + 10, ky + 19, P.ink);
      F().draw(ctx, UI.klusReward(L), kx + kw - 10, ky + 6, P.green2, { align: 'right' });
      ctx.globalAlpha = 1;
    }
    UI.btn(app, ctx, 'lvl_ok', 320 - 55, yy0 + h - 30, 110, 20, 'Mooi!', () => app.afterLevel(), { tone: 'bord' });
  };

  // Checklist "Je eerste dag" (M7, besluit 78): niets blokkeert, vinkjes gaan vanzelf aan
  UI.firstDayList = function (app, ctx, y) {
    const s = app.s, f = s.flags, T = CC.TEXT.tutorial;
    const items = [['forecast', f.seenForecast], ['order', f.bought], ['prices', f.priced || f.pricesSeen], ['open', f.opened]];
    const x = LX, w = LW, h = 18 + items.length * 13;
    R().round(ctx, x + 2, y + 3, w, h, 6, 'rgba(31,10,14,0.35)');
    R().round(ctx, x, y, w, h, 6, P.ink); R().round(ctx, x + 1, y + 1, w - 2, h - 2, 5, P.gold); R().round(ctx, x + 2, y + 2, w - 4, h - 4, 5, 'rgba(31,10,14,0.92)');
    F().draw(ctx, T.listTitle, x + 8, y + 6, P.gold);
    const next = items.findIndex(it => !it[1]);
    items.forEach(([k, done], i) => {
      const iy = y + 19 + i * 13, it = T.items[k];
      const hv = UI.hit(app, 'tut_' + k, x + 3, iy - 2, w - 6, 12, null, it.tip);
      if (i === next) R().round(ctx, x + 4, iy - 2, w - 8, 12, 3, `rgba(232,181,58,${0.18 + 0.1 * Math.sin(app.t * 4)})`);
      else if (hv) R().round(ctx, x + 4, iy - 2, w - 8, 12, 3, 'rgba(232,181,58,0.15)');
      R().round(ctx, x + 8, iy - 1, 9, 9, 2, done ? P.green3 : P.wood1);
      if (done) F().draw(ctx, '✔', x + 9, iy, P.cream3);
      F().draw(ctx, it.text, x + 22, iy, done ? P.stone2 : (i === next ? P.gold2 : P.cream2));
    });
  };

  // Open klussen in de winkel (voorbereiden), onder "Vandaag verwacht"
  UI.klusBoard = function (app, ctx, y) {
    const s = app.s;
    if (!s.flags.opened) return UI.firstDayList(app, ctx, y);   // eerste dag: eerst de checklist
    const open = CC.SIM.klusOpen(s).slice(0, 2); if (!open.length) return;
    const x = LX, w = LW, h = 14 + open.length * 22;
    R().round(ctx, x + 2, y + 3, w, h, 6, 'rgba(31,10,14,0.35)');
    R().round(ctx, x, y, w, h, 6, P.ink); R().round(ctx, x + 1, y + 1, w - 2, h - 2, 5, P.wood1); R().round(ctx, x + 2, y + 2, w - 4, h - 4, 5, 'rgba(31,10,14,0.92)');
    F().draw(ctx, CC.SIM.klusOpen(s).length > 1 ? 'Klussen' : 'Klus', x + 8, y + 6, P.gold);
    open.forEach((k, i) => {
      const d = CC.SIM.klusDef(k.lvl), ky = y + 17 + i * 22;
      const txt = UI.klusText(k.lvl), lines = F().wrap(txt, w - 16);
      F().draw(ctx, lines[0] + (lines.length > 1 ? '..' : ''), x + 8, ky, P.cream2);
      UI.hit(app, 'klus_' + k.lvl, x + 3, ky - 2, w - 6, 20, null, `${txt} · ${UI.klusReward(k.lvl)} (klus van niveau ${k.lvl})`);
      const bw = w - 66, f = Math.min(1, k.n / d.need);
      R().rect(ctx, x + 8, ky + 10, bw, 4, P.wood1); R().rect(ctx, x + 8, ky + 10, Math.round(bw * f), 4, P.gold);
      F().draw(ctx, `${k.n}/${d.need}`, x + w - 8, ky + 9, P.cream2, { align: 'right' });
    });
  };

  // ---------- Zondag: de bank belt ----------
  // Portret: gegenereerde afbeelding (assets/portraits.js, tools/build_portraits.py) of anders de code-placeholder.
  UI.portrait = function (app, ctx, who, mood, x, y, size) {
    const P0 = (CC.PORTRAITS || {})[who];
    if (P0) {
      const key = P0[mood] ? mood : (P0.neutral ? 'neutral' : Object.keys(P0)[0]);
      const im = app.images['por_' + who + '_' + key];
      if (im && im.complete && im.naturalWidth) {
        R().round(ctx, x - 1, y - 1, size + 2, size + 2, 5, P.ink);
        ctx.drawImage(im, x, y, size, size);
        R().roundCorners(ctx, x, y, size, size, 4, P.ink);
        R().roundCorners(ctx, x - 1, y - 1, size + 2, size + 2, 5, P.cream2);
        return;
      }
    }
    R().rect(ctx, x - 1, y - 1, size + 2, size + 2, P.ink); R().rect(ctx, x, y, size, size, '#c9d4cf'); R().rect(ctx, x, y, size, 22, '#b7c4be');
    UI.portraitBanker(ctx, x + Math.round((size - 44) / 2), y + size - 48, mood, true);
  };

  UI.hasPortrait = function (app, who) {
    const P0 = (CC.PORTRAITS || {})[who]; if (!P0) return false;
    const im = app.images['por_' + who + '_' + (P0.neutral ? 'neutral' : Object.keys(P0)[0])];
    return !!(im && im.complete && im.naturalWidth);
  };
  UI.portraitBanker = function (ctx, x, y, mood, bare) {
    if (!bare) { R().rect(ctx, x, y, 44, 48, P.ink); R().rect(ctx, x + 1, y + 1, 42, 46, '#c9d4cf'); R().rect(ctx, x + 1, y + 1, 42, 16, '#b7c4be'); }
    // pak + stropdas
    R().rect(ctx, x + 6, y + 32, 32, 15, '#3a4150'); R().rect(ctx, x + 18, y + 32, 8, 15, P.cream3); R().rect(ctx, x + 21, y + 33, 3, 12, P.bord3);
    // hoofd
    R().rect(ctx, x + 12, y + 9, 20, 22, P.ink); R().rect(ctx, x + 13, y + 10, 18, 20, P.skin1);
    R().rect(ctx, x + 13, y + 9, 18, 5, '#8a8a8a'); R().rect(ctx, x + 12, y + 11, 2, 8, '#8a8a8a'); R().rect(ctx, x + 30, y + 11, 2, 8, '#8a8a8a');
    // bril
    R().rect(ctx, x + 15, y + 17, 6, 4, P.ink); R().rect(ctx, x + 23, y + 17, 6, 4, P.ink); R().rect(ctx, x + 16, y + 18, 4, 2, '#dfe8e6'); R().rect(ctx, x + 24, y + 18, 4, 2, '#dfe8e6'); R().rect(ctx, x + 21, y + 18, 2, 1, P.ink);
    // mond per stemming
    if (mood === 'happy') { R().rect(ctx, x + 18, y + 25, 8, 1, P.ink); R().rect(ctx, x + 17, y + 24, 1, 1, P.ink); R().rect(ctx, x + 26, y + 24, 1, 1, P.ink); }
    else if (mood === 'grim') { R().rect(ctx, x + 18, y + 26, 8, 1, P.ink); R().rect(ctx, x + 17, y + 27, 1, 1, P.ink); R().rect(ctx, x + 26, y + 27, 1, 1, P.ink); R().rect(ctx, x + 15, y + 15, 5, 1, P.ink); R().rect(ctx, x + 24, y + 15, 5, 1, P.ink); }
    else R().rect(ctx, x + 18, y + 25, 8, 1, P.ink);
    // telefoonhoorn
    R().rect(ctx, x + 30, y + 14, 8, 20, P.ink); R().rect(ctx, x + 31, y + 15, 6, 18, '#2a2226');
  };

  // Zondag begint met de telefoon op de toonbank die rinkelt en trilt (M7-juice)
  UI.phoneRing = function (app, ctx) {
    const k = app.t - app.ring.t0, ph = CC.BG && CC.BG.phone, bg = app.images.bg;
    UI.hit(app, 'ring_skip', 0, 17, 640, 343, () => { app.ring = null; }, null);
    if (!ph) return;
    const on = (k % 0.8) < 0.55;                                    // twee keer "tring", met een pauze
    const cx = ph.x + ph.w / 2, top = ph.y;
    if (bg && bg.complete) {   // telefoon onverduisterd (spotlicht), trilt als hij rinkelt
      const dx = on ? Math.round(Math.sin(k * 90) * 1.5) : 0, dy = on && (Math.floor(k * 30) % 2) ? -1 : 0;
      ctx.drawImage(bg, ph.x, ph.y, ph.w, ph.h, ph.x + dx, ph.y + dy, ph.w, ph.h);
    }
    // trillingsstreepjes links en rechts van de telefoon
    if (on) for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const x0 = side < 0 ? ph.x - 4 - i * 3 : ph.x + ph.w + 3 + i * 3, y0 = top + 4 + i * 2, hh = 10 - i * 3;
      R().rect(ctx, x0 - 1, y0 - 1, 3, hh + 2, P.ink); R().rect(ctx, x0, y0, 1, hh, P.gold2);
    }
    const a = Math.min(1, k / 0.15);
    R().bubble(ctx, cx, top - 2, 'Tring... tring!', 'grey', a, []);
  };

  UI.sundayPanel = function (app, ctx) {
    const s = app.s, B = CC.TEXT.bank, sun = app.sunday;
    if (app.ringing && app.ringing() && sun.stage === 'ask') return UI.phoneRing(app, ctx);
    UI.dim(app, ctx, 0.6);
    if (sun.stage === 'done' && sun.cards) { UI.dim(app, ctx, 0.4); return UI.cardPick(app, ctx); }
    const x = 140, y = 42, w = 360, h = 262;
    R().panel(ctx, x, y, w, h);
    UI.ornateTitle(ctx, 'ZONDAG', x + w / 2, y + 14, P.bord2, { shadow: P.gold });
    // weekoverzicht
    const wk = s.history.filter(hh => hh.week === s.week);
    const sum = k => wk.reduce((a, b) => a + (b[k] || 0), 0);
    let yy = y + 36;
    const row = (l, r, col) => { F().draw(ctx, l, x + 16, yy, P.ink); F().draw(ctx, r, x + 170, yy, col || P.ink, { align: 'right' }); yy += 11; };
    F().draw(ctx, `Week ${s.week}`, x + 16, yy, P.bord2); yy += 12;
    row('Omzet', R().euro(sum('revenue')));
    row('Winst na huur', R().euro(sum('profit')), sum('profit') >= 0 ? P.green2 : P.red);
    row('Flessen', String(sum('bottles')));
    row('Reputatie', '+' + sum('rep'));
    row('Kas', R().euro(s.cash));
    // schuldmeter
    if (s.status === 'endless') { F().draw(ctx, 'Lening afgelost', x + 190, y + 48, P.ink); HF().draw(ctx, 'Schuldenvrij ★', x + 190, y + 62, P.green2); }
    else {
    const total = CC.CONFIG.repay.reduce((a, b) => a + b, 0);
    const paid = Math.min(total, s.debtPaid);
    F().draw(ctx, 'Lening afgelost', x + 190, y + 48, P.ink);
    R().round(ctx, x + 190, y + 60, 150, 9, 4, P.wood1); if (paid > 0) R().round(ctx, x + 191, y + 61, Math.max(7, Math.round(148 * paid / total)), 7, 3, P.green3);
    F().draw(ctx, `${R().euro(paid)} van ${R().euro(total)}`, x + 190, y + 71, P.stone1);
    }
    // gesprek
    const by = y + 128;
    R().rect(ctx, x + 12, by - 4, w - 24, 1, P.cream1);
    UI.portrait(app, ctx, 'bankier', sun.mood, x + 16, by + 4, 80);
    F().draw(ctx, B.name, x + 106, by + 4, P.bord2);
    F().draw(ctx, B.role, x + 106, by + 14, P.stone1);
    const lines = F().wrap(sun.text, w - 120);
    lines.forEach((l, i) => F().draw(ctx, l, x + 106, by + 28 + i * 10, P.ink));
    // knoppen
    const bx = x + 106, byy = y + h - 30;
    if (sun.stage === 'ask') {
      if (sun.canPay) UI.btn(app, ctx, 'pay', bx, byy, 130, 20, `Aflossen ${R().euro(sun.due)}`, () => app.bankPay(), { tone: 'green' });
      else {
        if (sun.canPostpone) UI.btn(app, ctx, 'postpone', bx, byy, 130, 20, `Uitstel (+${R().euro(CC.CONFIG.postponeFine)})`, () => app.bankPostpone(), { tone: 'wood' });
        UI.btn(app, ctx, 'bankrupt', bx + 136, byy, 112, 20, 'Failliet gaan', () => app.bankBankrupt(), { tone: 'bord' });
      }
    } else {
      UI.btn(app, ctx, 'newweek', bx, byy, 130, 20, `Week ${s.week + 1} ▶`, () => app.bankNextWeek(), { tone: 'bord' });
    }
  };

  // ---------- Personeel (01_ONTWERP §9) ----------
  UI.staffSprite = function (app, ctx, id, x, y, scale) {
    const im = app.images['chr_' + id + '_front'];
    if (im && im.complete && im.naturalWidth) { ctx.drawImage(im, x, y, im.naturalWidth * (scale || 1), im.naturalHeight * (scale || 1)); return; }
    const look = CC.STAFF[id].look; // placeholder
    R().rect(ctx, x + 6, y + 4, 12, 12, P[look.skin] || look.skin); R().rect(ctx, x + 4, y + 18, 16, 26, look.body); R().rect(ctx, x + 6, y + 44, 12, 18, look.legs);
  };
  // ---------- Investeren (besluit 60) ----------
  // Getekende iconen, ±36 px hoog; (cx, by) = midden onderkant.
  UI.upgradeIcon = function (app, ctx, id, cx, by) {
    const s = app.s;
    // illustratie van HJ (assets/tiles.js → CC.ICONS, tools/build_tiles.py); anders de getekende versie hieronder
    const ic = app.images['icon_' + (/^kast/.test(id) ? 'kast' : id)];
    if (ic && ic.complete && ic.naturalWidth) { ctx.drawImage(ic, Math.round(cx - ic.naturalWidth / 2), by - 2 - ic.naturalHeight); return; }
    if (id === 'kast3' || id === 'kast4') {
      R().round(ctx, cx - 13, by - 37, 26, 37, 3, P.ink); R().rect(ctx, cx - 12, by - 36, 24, 35, P.wood2); R().rect(ctx, cx - 12, by - 36, 24, 2, P.wood3);
      const cols = [P.bord3, P.green3, '#e6d58a', P.bord2];
      for (let i = 0; i < 4; i++) {
        R().rect(ctx, cx - 10, by - 32 + i * 8, 20, 6, P.wood1);
        for (let j = 0; j < 5; j++) { R().rect(ctx, cx - 9 + j * 4, by - 31 + i * 8, 2, 5, cols[(i + j) % 4]); R().rect(ctx, cx - 9 + j * 4, by - 31 + i * 8, 2, 1, P.ink); }
      }
      R().rect(ctx, cx - 12, by - 2, 24, 1, P.wood1);
      // plus-badge
      R().round(ctx, cx + 7, by - 41, 11, 11, 5, P.ink); R().round(ctx, cx + 8, by - 40, 9, 9, 4, P.green3);
      R().rect(ctx, cx + 10, by - 36, 5, 1, P.cream3); R().rect(ctx, cx + 12, by - 38, 1, 5, P.cream3);
      return;
    }
    if (id === 'vitrine') {
      const w = (s && s.vitrine && CC.wineById(s.vitrine)) || CC.WINES.find(x => x.id === 'wine_bordeaux') || CC.WINES[0];
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, by - 18, 2, cx, by - 18, 20); g.addColorStop(0, 'rgba(255,200,110,0.55)'); g.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 22, by - 40, 44, 40); ctx.restore();
      R().round(ctx, cx - 17, by - 9, 34, 5, 2, P.ink); R().rect(ctx, cx - 16, by - 8, 32, 3, P.wood3); R().rect(ctx, cx - 16, by - 8, 32, 1, P.wood4);
      R().rect(ctx, cx - 10, by - 5, 3, 5, P.wood1); R().rect(ctx, cx + 7, by - 5, 3, 5, P.wood1);
      R().rect(ctx, cx - 12, by - 9, 24, 1, P.bord3);   // loper
      for (const dx of [-8, 0, 8]) { if (!R().wineSprite(ctx, w, 'icoon', cx + dx, by - 8)) R().bottleIcon(ctx, cx + dx - 3, by - 28, w); }
      // sterretje
      const sx = cx + 13, sy = by - 32;
      R().rect(ctx, sx - 1, sy - 3, 2, 7, P.gold2); R().rect(ctx, sx - 3, sy - 1, 6, 2, P.gold2); R().rect(ctx, sx, sy - 1, 1, 2, '#fff');
      return;
    }
    if (id === 'koeling') {
      const w = CC.WINES.find(x => x.id === 'wine_champagne') || CC.WINES[0];
      if (!R().wineSprite(ctx, w, 'icoon', cx + 2, by - 12)) R().bottleIcon(ctx, cx - 1, by - 32, w);
      // emmer
      R().round(ctx, cx - 14, by - 18, 28, 4, 2, P.ink);
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.moveTo(cx - 13, by - 15); ctx.lineTo(cx + 13, by - 15); ctx.lineTo(cx + 10, by); ctx.lineTo(cx - 10, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b9c2c8'; ctx.beginPath(); ctx.moveTo(cx - 12, by - 15); ctx.lineTo(cx + 12, by - 15); ctx.lineTo(cx + 9, by - 1); ctx.lineTo(cx - 9, by - 1); ctx.closePath(); ctx.fill();
      R().rect(ctx, cx - 11, by - 12, 21, 1, '#e7eef0'); R().rect(ctx, cx - 10, by - 5, 19, 1, '#8b969c'); R().rect(ctx, cx - 8, by - 14, 2, 12, '#eef5f7');
      R().round(ctx, cx - 14, by - 18, 28, 4, 2, '#d8e1e4'); R().rect(ctx, cx - 13, by - 18, 26, 1, '#ffffff');
      // ijsblokjes
      for (const [dx, dy] of [[-10, -21], [-5, -22], [6, -21]]) { R().rect(ctx, cx + dx, by + dy, 5, 4, P.glass1); R().rect(ctx, cx + dx, by + dy, 4, 3, P.glass2); R().rect(ctx, cx + dx, by + dy, 1, 1, '#fff'); }
      // druppel
      R().rect(ctx, cx - 16, by - 9, 1, 2, P.glass2); R().rect(ctx, cx + 15, by - 7, 1, 2, P.glass2);
      return;
    }
    if (id === 'uithangbord') {
      const im = app.images.logoSign;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, by - 14, 3, cx, by - 14, 26); g.addColorStop(0, 'rgba(255,190,90,0.6)'); g.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 28, by - 40, 56, 40); ctx.restore();
      R().rect(ctx, cx - 18, by - 36, 36, 2, P.ink); R().rect(ctx, cx - 17, by - 35, 34, 1, P.stone2);   // beugel
      R().rect(ctx, cx - 11, by - 34, 1, 6, P.stone2); R().rect(ctx, cx + 10, by - 34, 1, 6, P.stone2);   // kettinkjes
      if (im && im.complete && im.naturalWidth) {
        const w = 40, h = Math.round(im.naturalHeight * w / im.naturalWidth);
        ctx.imageSmoothingEnabled = true; ctx.drawImage(im, cx - w / 2, by - 29, w, h); ctx.imageSmoothingEnabled = false;
      } else { R().round(ctx, cx - 18, by - 29, 36, 18, 3, P.bord2); }
      return;
    }
  };

  UI.investPanel = function (app, ctx) {
    const s = app.s, SIM = CC.SIM, T = CC.TEXT.invest;
    const x = UI.panelFrame(app, ctx, 'Investeren');
    F().draw(ctx, 'Kas ' + R().euro(s.cash), x + PW - 30, PY + 10, P.wood2, { align: 'right' });
    const lastInv = s.history[s.history.length - 1], up = lastInv && lastInv.src && lastInv.src.upg;
    if (up && up.n) F().draw(ctx, CC.TEXT.work.investYesterday.split('{n}').join(up.n).split('{margin}').join(R().euro(Math.round(up.margin))), x + 12, PY + 28, P.green2);
    else F().draw(ctx, T.intro, x + 12, PY + 28, P.stone1);
    let y = PY + 40;
    for (const u of CC.UPGRADES) {
      const own = SIM.owns(s, u.id), open = SIM.upgradeUnlocked(s, u.id), fresh = open && !own && u.lvl > (s.flags.investSeenLvl || 0);
      const vit = u.id === 'vitrine' && own;
      const dl = F().wrap(u.desc, PW - 148).slice(0, 3);
      const h = Math.max(48, 22 + dl.length * 10) + (vit ? 28 : 0);
      R().round(ctx, x + 8, y, PW - 16, h, 6, own ? P.cream3 : P.cream1);
      if (own) R().rect(ctx, x + 8, y + 4, 2, h - 8, P.green3);
      // icoonvak
      R().round(ctx, x + 13, y + 5, 38, 38, 5, open ? '#fffaf0' : P.cream1);
      ctx.globalAlpha = open ? 1 : 0.35; UI.upgradeIcon(app, ctx, u.id, x + 32, y + 42); ctx.globalAlpha = 1;
      F().draw(ctx, u.name, x + 58, y + 6, open ? P.ink : P.stone1);
      if (fresh) { const nw = F().width('nieuw') + 8; R().pill(ctx, x + 62 + F().width(u.name), y + 5, nw, 10, P.gold, P.ink); F().draw(ctx, 'nieuw', x + 62 + F().width(u.name) + nw / 2, y + 7, P.ink, { align: 'center' }); }
      dl.forEach((l, i) => F().draw(ctx, l, x + 58, y + 18 + i * 10, open ? P.ink : P.stone1));
      const bx = x + PW - 78, by = y + 16;
      if (own) {
        R().pill(ctx, bx, by, 62, 16, P.green3, P.ink);
        F().draw(ctx, 'Gekocht ✔', bx + 31, by + 4, P.cream3, { align: 'center' });
      } else if (!open) {
        R().pill(ctx, bx, by, 62, 16, P.stone3, P.stone2);
        F().draw(ctx, `Niveau ${u.lvl}`, bx + 31, by + 4, P.stone1, { align: 'center' });
      } else {
        const short = u.cost - s.cash;
        UI.btn(app, ctx, 'inv_' + u.id, bx, by, 62, 16, R().euro(u.cost), () => app.buyUpgrade(u.id), { tone: 'green', disabled: short > 0, tip: short > 0 ? `Nog ${R().euro(short)} tekort` : T.buyTip });
      }
      if (vit) {   // welke wijn staat er in de vitrine?
        const listed = SIM.listed(s).filter(l => l.n > 0);
        const vy = y + 20 + dl.length * 10;
        F().draw(ctx, T.vitrinePick, x + 58, vy + 4, P.bord2);
        let cx = x + 58 + F().width(T.vitrinePick) + 6;
        if (!listed.length) F().draw(ctx, T.vitrineEmpty, cx, vy + 4, P.stone1);
        for (const l of listed.slice(0, 10)) {
          const sel = s.vitrine === l.wine.id;
          const hv = UI.hit(app, 'vit_' + l.wine.id, cx - 1, vy, 14, 26, () => app.setVitrine(sel ? null : l.wine.id), l.wine.name + (sel ? ' (in de vitrine)' : ''));
          if (sel) { R().round(ctx, cx - 2, vy - 1, 16, 28, 4, P.gold); R().round(ctx, cx - 1, vy, 14, 26, 3, '#fffaf0'); }
          else if (hv) R().round(ctx, cx - 1, vy, 14, 26, 3, 'rgba(232,181,58,0.3)');
          R().bottleMid(ctx, cx + 6, vy + 13, l.wine);
          cx += 16;
          if (cx > x + PW - 20) break;
        }
      }
      y += h + 4;
    }
  };

  UI.staffPanel = function (app, ctx) {
    const s = app.s, C = CC.CONFIG, SIM = CC.SIM;
    const x = UI.panelFrame(app, ctx, 'Personeel');
    const n = SIM.staffCount(s);
    F().draw(ctx, `In dienst ${n} / ${C.staffMax} · loon ${R().euro(SIM.wages(s))} per dag`, x + 12, PY + 28, P.wood2);
    let y = PY + 42;
    for (const id of Object.keys(CC.STAFF)) {
      const st = CC.STAFF[id], hired = SIM.hired(s, id), unlocked = SIM.staffUnlocked(s, id);
      const h = 92;
      R().round(ctx, x + 8, y, PW - 16, h, 6, hired ? P.cream3 : P.cream1);
      if (hired) R().rect(ctx, x + 8, y, 2, h, P.green3);
      ctx.globalAlpha = unlocked ? 1 : 0.35;
      const hasPor = UI.hasPortrait(app, id);
      if (hasPor) UI.portrait(app, ctx, id, 'neutral', x + 15, y + 8, 40); else UI.staffSprite(app, ctx, id, x + 14, y + 14);
      ctx.globalAlpha = 1;
      const tx = hasPor ? x + 62 : x + 48;
      F().draw(ctx, st.name, tx, y + 6, unlocked ? P.ink : P.stone1);
      F().draw(ctx, st.role + ' · ' + R().euro(st.wage) + ' per dag', tx, y + 16, P.stone1);
      F().wrap(st.desc, PW - 24 - (tx - x)).slice(0, 2).forEach((l, i) => F().draw(ctx, l, tx, y + 28 + i * 10, unlocked ? P.ink : P.stone1));
      if (!unlocked) {
        F().draw(ctx, `Vanaf niveau ${st.minLevel}`, tx, y + 54, P.bord3);
      } else if (hired) {
        const me = s.staff[id], next = SIM.staffNext(s, id);
        F().draw(ctx, `Level ${me.level} · ${st.perk(me.level)}`, tx, y + 52, P.green2);
        const L = C.staffXp, a = L[me.level - 1], b = next == null ? a : next;
        R().rect(ctx, tx, y + 63, 100, 3, P.cream1);
        R().rect(ctx, tx, y + 63, next == null ? 100 : Math.round(100 * (me.xp - a) / (b - a)), 3, P.gold);
        const xpv = v => String(Math.floor(v));
        F().draw(ctx, next == null ? 'max' : `${xpv(me.xp)}/${next} XP`, tx + 106, y + 61, P.stone1);
        UI.hit(app, 'xp_' + id, tx - 2, y + 58, 150, 12, null, CC.TEXT.staff.xpHow[id]);
        const last = s.history[s.history.length - 1], wk = last && last.work && last.work[id];
        if (wk) F().draw(ctx, CC.TEXT.staff.yesterday.split('{xp}').join(String(Math.round(wk.xp * 10) / 10).replace('.', ',')), tx, y + 74, wk.xp > 0 ? P.green2 : P.stone1);
        UI.btn(app, ctx, 'fire_' + id, x + PW - 84, y + h - 22, 70, 16, 'Ontslaan', () => app.fire(id), { tone: 'bord', tip: 'Wie weggaat, begint bij terugkomst weer op level 1' });
      } else {
        F().draw(ctx, `Start: ${st.perk(1)}`, tx, y + 52, P.wood2);
        const full = n >= C.staffMax;
        UI.btn(app, ctx, 'hire_' + id, x + PW - 84, y + h - 22, 70, 16, 'Aannemen', () => app.hire(id), { tone: 'green', disabled: full, tip: full ? `Maximaal ${C.staffMax} tegelijk` : 'Begint vandaag; loon gaat elke verkoopdag van de kas' });
      }
      y += h + 6;
    }
  };
  UI.staffUpPanel = function (app, ctx) {
    const up = app.staffUps[0], st = CC.STAFF[up.id];
    UI.dim(app, ctx, 0.55);
    const w = 280, h = 132, x = 180, y = 114;
    UI.rays(ctx, 320, y + 60, 200, app.t, 0.08 * Math.min(1, app.phaseT / 0.4));
    UI.celebrate(app, x + 20, x + w - 20, y - 10);
    const pop = Math.min(1, app.phaseT / 0.25), yy = y + Math.round((1 - pop) * 20);
    R().panel(ctx, x, yy, w, h);
    if (UI.hasPortrait(app, up.id)) UI.portrait(app, ctx, up.id, 'happy', x + 16, yy + 18, 72);
    else UI.staffSprite(app, ctx, up.id, x + 24, yy + 16, 2);
    HF().draw(ctx, `LEVEL ${up.to}`, x + 100, yy + 24, P.bord2);
    F().draw(ctx, st.name + ' · ' + st.role.toLowerCase(), x + 100, yy + 44, P.stone1);
    const txt = CC.TEXT.staff.levelUp[up.id].split('{name}').join(st.name).split('{pct}').join(st.pct(up.to));
    F().wrap(txt, w - 116).forEach((l, i) => F().draw(ctx, l, x + 100, yy + 62 + i * 10, P.ink));
    UI.btn(app, ctx, 'staffup_ok', x + 100, yy + h - 30, 100, 20, 'Top!', () => app.afterStaffUp(), { tone: 'bord' });
  };

  // ---------- Advies: het kaartje (01_ONTWERP §7) ----------
  // Spel staat stil zolang het kaartje open is. Stap 1: kies een wijn van je schap. Stap 2: uitkomst + weetje.
  UI.advicePanel = function (app, ctx) {
    const A = app.advice, s = app.s;
    UI.dim(app, ctx, 0.55);
    const x = 96, w = 448;
    const pop = Math.min(1, A.t / 0.18), ease = 1 - Math.pow(1 - pop, 3);
    const typeName = CC.CUSTOMER_TYPES[A.c.type].name;
    if (A.stage === 'ask') {
      const q = A.c.ask ? A.c.ask.q : A.q, opts = A.c.ask ? A.c.ask.opts : A.opts;
      const qLines = F().wrap('"' + q.q + '"', w - 36);
      const h = 58 + qLines.length * 10 + opts.length * 46 + 34;
      const y = Math.round(180 - h / 2 + (1 - ease) * 16);
      R().panel(ctx, x, y, w, h);
      F().draw(ctx, typeName + ' vraagt om advies', x + 14, y + 11, P.bord2, { shadow: P.cream1 });
      UI.btn(app, ctx, 'adv_close', x + w - 22, y + 8, 14, 12, '×', () => app.closeAdvice(), { tone: 'bord', tip: 'Later (de klant wacht nog even)' });
      R().rect(ctx, x + 12, y + 22, w - 24, 1, P.cream1);
      let yy = y + 29;
      qLines.forEach(l => { F().draw(ctx, l, x + 16, yy, P.ink); yy += 10; });
      yy += 2;
      F().draw(ctx, 'Budget: max ' + R().euro(q.max), x + w - 16, yy, P.wood2, { align: 'right' });
      F().draw(ctx, 'Welke fles van je schap raad je aan?', x + 16, yy, P.stone1);
      yy += 14;
      opts.forEach((id, i) => {
        const wn = CC.wineById(id), price = CC.SIM.price(s, id);
        const bx = x + 14, bw = w - 28, bh = 42;
        const hv = UI.hit(app, 'adv_opt_' + i, bx, yy, bw, bh, () => app.answerAdvice(id), `Aanraden (toets ${i + 1})`);
        R().round(ctx, bx, yy, bw, bh, 6, hv ? P.gold : P.wood2);
        R().round(ctx, bx + 1, yy + 1, bw - 2, bh - 2, 5, hv ? '#fffaf0' : P.cream1);
        R().pill(ctx, bx + bw - 22, yy + bh - 14, 14, 11, hv ? P.gold : P.cream3, P.wood2);
        R().bottleMid(ctx, bx + 13, yy + 21, wn);
        F().draw(ctx, `${i + 1}`, bx + bw - 15, yy + bh - 12, P.wood2, { align: 'center' });
        F().draw(ctx, wn.name, bx + 26, yy + 5, P.ink);
        F().draw(ctx, R().euro(price), bx + bw - 8, yy + 5, P.bord2, { align: 'right' });
        F().draw(ctx, `${wn.druif.join(', ')} · ${wn.regio}, ${wn.country}`, bx + 26, yy + 17, P.stone1);
        // wijntaal: soort + stijl. Gerechten staan er bewust niet op (besluit 49).
        const stijl = (wn.stijl || []).filter(st => st !== 'bubbels').map(st => CC.TEXT.stijlAdj[st] || st);
        F().draw(ctx, [CC.TEXT.soortName[CC.roleById(wn.role).kind]].concat(stijl).join(', '), bx + 26, yy + 28, P.wood2);
        yy += bh + 4;
      });
      // "Heb ik niet" als volwaardige vierde keuze, in dezelfde stijl als de flessen
      {
        const bx = x + 14, bw = w - 28, bh = 28;
        const hv = UI.hit(app, 'adv_none', bx, yy, bw, bh, () => app.answerAdvice(null), 'Eerlijk zeggen dat niets past (toets N)');
        R().round(ctx, bx, yy, bw, bh, 6, hv ? P.gold : P.wood2);
        R().round(ctx, bx + 1, yy + 1, bw - 2, bh - 2, 5, hv ? '#fffaf0' : P.cream2);
        // leeg schapje als icoon
        R().rect(ctx, bx + 7, yy + 18, 14, 2, P.wood2); R().rect(ctx, bx + 8, yy + 8, 1, 10, P.wood3); R().rect(ctx, bx + 19, yy + 8, 1, 10, P.wood3);
        F().draw(ctx, '?', bx + 14, yy + 9, P.stone1, { align: 'center' });
        F().draw(ctx, 'Sorry, heb ik niet', bx + 26, yy + 5, P.ink);
        F().draw(ctx, 'Als niets op je schap bij de vraag past', bx + 26, yy + 16, P.stone1);
        R().pill(ctx, bx + bw - 22, yy + bh - 14, 14, 11, hv ? P.gold : P.cream3, P.wood2);
        F().draw(ctx, 'N', bx + bw - 15, yy + bh - 12, P.wood2, { align: 'center' });
      }
      F().draw(ctx, 'Het spel staat stil', x + w - 34, y + 11, P.stone2, { align: 'right' });
      return;
    }
    // Uitkomst
    const r = A.res, good = r.result === 'good' || r.result === 'honest';
    const head = { good: 'Goed advies!', honest: 'Eerlijk is eerlijk.', wrong: 'Mis.', tooExpensive: 'Te duur.', falseNone: 'Hij stond er wel.' }[r.result];
    let why = (r.result === 'wrong' || r.result === 'tooExpensive') ? CC.adviceWhy(r.q, CC.wineById(r.wineId), r.miss, r.price) : null;
    if ((r.result === 'wrong' || r.result === 'falseNone') && r.q.uitleg) why = why ? why + ' ' + r.q.uitleg : r.q.uitleg;
    const goodNames = (r.goodIds || []).map(id => CC.wineById(id).name);
    const weetje = F().wrap(r.q.weetje, w - 52);
    const whyLines = why ? F().wrap(why, w - 36) : [];
    const h = 120 + whyLines.length * 10 + (r.result !== 'good' ? 12 : 0) + weetje.length * 10;
    const y = Math.round(180 - h / 2 + (1 - ease) * 16);
    R().panel(ctx, x, y, w, h);
    HF().draw(ctx, head, x + w / 2, y + 14, good ? P.green2 : P.bord3, { align: 'center' });
    let yy = y + 34;
    F().draw(ctx, `${typeName}: "${r.reply}"`, x + w / 2, yy, P.ink, { align: 'center' }); yy += 13;
    whyLines.forEach(l => { F().draw(ctx, l, x + w / 2, yy, P.wood2, { align: 'center' }); yy += 10; });
    if (r.result !== 'good') {
      F().draw(ctx, goodNames.length ? 'Goed was: ' + goodNames.join(', ') : 'Niets op je schap paste. "Heb ik niet" was goed.', x + w / 2, yy, P.bord2, { align: 'center' });
      yy += 12;
    }
    const sign = n => (n > 0 ? '+' + n : String(n));
    const reward = r.result === 'good' ? `Verkocht · fooi ${R().euro(r.tip)} · reputatie ${sign(r.dr)}`
      : r.result === 'honest' ? `Reputatie ${sign(r.dr)}` : `Geen verkoop · reputatie ${sign(r.dr)}`;
    F().draw(ctx, reward, x + w / 2, yy + 2, good ? P.green2 : P.bord2, { align: 'center' });
    yy += 16;
    // weetje
    const wh = weetje.length * 10 + 18;
    R().round(ctx, x + 16, yy, w - 32, wh, 6, P.gold);
    R().round(ctx, x + 17, yy + 1, w - 34, wh - 2, 5, '#fffaf0');
    R().pill(ctx, x + 24, yy - 5, 52, 11, P.bord2, P.ink);
    F().draw(ctx, 'WEETJE', x + 50, yy - 3, P.cream3, { align: 'center' });
    weetje.forEach((l, i) => F().draw(ctx, l, x + 26, yy + 16 + i * 10, P.ink));
    UI.btn(app, ctx, 'adv_ok', x + w / 2 - 55, y + h - 28, 110, 18, 'Verder ▶', () => app.closeAdvice(), { tone: 'bord', tip: 'Spatie' });
  };

  // Eerste keer: uitleg linksonder tijdens de verkoopdag
  UI.saleHint = function (app, ctx) {
    if (app.advice || !app.day) return;
    const asking = !app.s.flags.advised && app.day.customers.some(c => c.state === 'ask');
    const first = app.s.week === 1 && app.s.day === 0;
    if (!asking && !first) return;
    const text = asking ? 'Een klant met een ! heeft een vraag. Klik op hem: het spel pauzeert en jij raadt een wijn aan.' : CC.TEXT.tutorial.firstSale;
    const ha = UI.hintAlpha(app, text); if (ha <= 0) return;
    const lines = F().wrap(text, 300);
    const h = lines.length * 10 + 6;
    ctx.globalAlpha = ha;
    R().round(ctx, 6, 352 - h, 310, h, 5, 'rgba(31,10,14,0.85)'); R().rect(ctx, 11, 352 - h, 300, 1, P.gold);
    lines.forEach((l, i) => F().draw(ctx, l, 10, 352 - h + 4 + i * 10, P.gold2));
    ctx.globalAlpha = 1;
  };

  // ---------- Weekkaarten (01_ONTWERP §10, besluit 58: echte kaarten) ----------
  const CW = 176, CH = 222;
  const KIND = {
    trend: { col: '#9c2a35', dark: '#6e1a26', txt: 'TREND' },
    event: { col: '#2f5541', dark: '#1f3a2e', txt: 'EVENEMENT' },
    partij: { col: '#7a4a24', dark: '#4a2a17', txt: 'KANS' },
    mishap: { col: '#6b6259', dark: '#4a443e', txt: 'TEGENVALLER' },
  };
  const arr = v => (Array.isArray(v) ? v : [v]);
  const SOORT_LBL = { 'rosé': 'rosé', bubbels: 'mousserend', wit: 'wit', rood: 'rood', dessert: 'dessertwijn' };
  function matchLabel(m) {
    if (m.land) return arr(m.land).map(l => ({ Spanje: 'Spaanse', Frankrijk: 'Franse', 'Italië': 'Italiaanse', Portugal: 'Portugese' }[l] || l)).join(', ') + ' wijn';
    if (m.stijl) return arr(m.stijl).map(st => (CC.TEXT.stijlAdj[st] || st)).join(', ').replace(/^./, c => c.toUpperCase()) + 'e wijn';
    if (m.soort) { const s0 = arr(m.soort).map(k => SOORT_LBL[k] || k).join(' en '); return s0.charAt(0).toUpperCase() + s0.slice(1); }
    return 'Wijn';
  }
  function matchWines(s, m) { return CC.WINES.filter(w => CC.SIM.cardMatch(m, w)); }
  // Effecten als korte regels met een pictogram
  UI.cardFx = function (s, id) {
    const c = CC.cardById(id), out = [];
    if (c.match && c.bonus) {
      const ws = matchWines(s, c.match), w = ws[0];
      // weinig passende wijnen? Noem ze bij naam ("Port LBV ▲▲" zegt meer dan "Zoete wijn ▲▲")
      const named = ws.length === 1 ? ws[0].name : null;
      out.push({ icon: 'wine', wine: w, text: `${named || matchLabel(c.match)} ▲▲` });
    }
    if (c.cust) out.push({ icon: 'people', text: `+${c.cust} ${c.cust === 1 ? 'klant' : 'klanten'} per dag` });
    if (c.custMul && c.custMul !== 1) {
      const when = c.days && c.days.length === 1 ? CC.CONFIG.dayNamesLong[c.days[0]] : 'elke dag';
      out.push({ icon: 'people', text: c.custMul >= 2 ? `${when.charAt(0).toUpperCase() + when.slice(1)}: ${c.custMul}× klanten` : `${when.charAt(0).toUpperCase() + when.slice(1)}: +${Math.round((c.custMul - 1) * 100)}% klanten` });
    }
    if (c.types) for (const k in c.types) out.push({ icon: 'type', type: k, text: `Meer ${CC.TEXT.typeInfo[k].many}` });
    if (c.rep) out.push({ icon: 'star', text: `${c.days && c.days.length === 1 ? CC.CONFIG.dayNamesLong[c.days[0]].replace(/^./, m => m.toUpperCase()) : 'Hele week'}: reputatie ×${String(c.rep).replace('.', ',')}` });
    if (c.box) out.push({ icon: 'box', text: `${c.box} flessen, verrassing` });
    if (c.discount) out.push({ icon: 'box', text: `Inkoop -${Math.round(c.discount * 100)}% deze week` });
    if (c.order) {
      const o = c.order;
      out.push({ icon: 'box', text: `${CC.CONFIG.dayNamesLong[o.day].replace(/^./, m => m.toUpperCase())}: ${o.n} fl. ${matchLabel(o.match).toLowerCase()}` });
      out.push({ icon: 'star', text: `Reputatie +${o.rep} en €${o.bonus} fooi` });
    }
    return out;
  };
  // Past deze kaart bij jouw winkel? (besluit 58)
  UI.cardFit = function (s, id) {
    const c = CC.cardById(id), S = CC.SIM;
    if (c.match) {
      const ws = matchWines(s, c.match), n = ws.reduce((a, w) => a + S.totalBottles(s, w.id), 0);
      if (n > 0) return { ok: true, text: `${n} passende flessen` };
      return { ok: false, text: ws.some(w => CC.roleById(w.role).unlock <= s.level) ? 'Je voert niets dat past' : 'Die wijn heb je nog niet' };
    }
    if (c.types) {
      const listed = S.listed(s).map(l => l.wine);
      if (c.types.koopjes) { const n = listed.filter(w => S.price(s, w.id) <= 9).length; return n ? { ok: true, text: `${n} ${n === 1 ? 'wijn' : 'wijnen'} onder €9` } : { ok: false, text: 'Niets onder €9' }; }
      const n = listed.filter(w => CC.roleById(w.role).prest >= 2).length;
      return n ? { ok: true, text: `${n} ${n === 1 ? 'wijn' : 'wijnen'} voor kenners` } : { ok: false, text: 'Niets voor kenners' };
    }
    if (c.box) return { ok: null, text: 'Elke wijn is mogelijk' };
    if (c.order) {
      const ws = matchWines(s, c.order.match), n = ws.reduce((a, w) => a + S.totalBottles(s, w.id), 0);
      if (!ws.some(w => CC.roleById(w.role).unlock <= s.level)) return { ok: false, text: 'Die wijn heb je nog niet' };
      return { ok: n >= c.order.n ? true : null, text: `Nu ${n} van de ${c.order.n} in huis` };
    }
    return null;
  };
  function icon(ctx, fx, x, y) {
    if (fx.icon === 'wine' && fx.wine) { if (!R().wineSprite(ctx, fx.wine, 'schap', x + 3, y + 9)) R().rect(ctx, x + 2, y, 3, 9, fx.wine.glass); return; }
    if (fx.icon === 'people') { for (const dx of [0, 4]) { R().rect(ctx, x + dx + 1, y + 1, 2, 2, P.wood2); R().rect(ctx, x + dx, y + 4, 4, 4, P.wood2); } return; }
    if (fx.icon === 'type') { R().rect(ctx, x + 1, y + 1, 6, 6, P.ink); R().rect(ctx, x + 2, y + 2, 4, 4, CC.CUSTOMER_TYPES[fx.type].look.body); return; }
    if (fx.icon === 'star') { F().draw(ctx, '★', x, y + 1, P.gold); return; }
    if (fx.icon === 'box') { R().rect(ctx, x, y + 2, 8, 6, P.wood3); R().rect(ctx, x, y + 2, 8, 1, P.wood1); F().draw(ctx, '?', x + 2, y + 1, P.ink); }
  }
  // Illustratie: afbeelding uit assets (tools/build_cards.py) of een getekende placeholder
  function cardArt(ctx, app, id, x, y, w, h) {
    const c = CC.cardById(id), K = KIND[c.kind];
    const im = app.images['card_' + id];
    if (im && im.complete && im.naturalWidth) {
      const sc = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      const dw = Math.round(im.naturalWidth * sc), dh = Math.round(im.naturalHeight * sc);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.drawImage(im, x + Math.round((w - dw) / 2), y + Math.round((h - dh) / 2), dw, dh); ctx.restore();
      return;
    }
    for (let i = 0; i < h; i++) R().rect(ctx, x, y + i, w, 1, i < h * 0.55 ? K.col : K.dark);
    for (let i = 0; i < 10; i++) R().rect(ctx, x + ((i * 37) % (w - 2)) + 1, y + ((i * 23) % (h - 8)) + 2, 1, 1, 'rgba(255,241,168,0.5)');
    const cx = x + w / 2, by = y + h - 6;
    const bottle = wid => { const w0 = CC.wineById(wid); if (w0 && !R().wineSprite(ctx, w0, 'groot', cx, by)) R().rect(ctx, cx - 5, by - 36, 10, 36, w0.glass); };
    if (c.match && c.kind === 'trend') { const ws = matchWines(app.s, c.match); bottle(ws[0].id); return; }
    if (id === 'koningsdag') {
      R().rect(ctx, cx - 18, by - 22, 36, 16, '#e8741e'); R().rect(ctx, cx - 18, by - 8, 36, 4, P.gold);
      for (const dx of [-18, -6, 6]) { R().rect(ctx, cx + dx, by - 32, 12, 10, '#e8741e'); R().rect(ctx, cx + dx + 4, by - 36, 4, 4, P.gold2); }
      R().rect(ctx, cx - 3, by - 18, 6, 6, P.bord3); return;
    }
    if (id === 'braderie') {
      for (let i = 0; i < 8; i++) R().rect(ctx, cx - 32 + i * 8, by - 34, 8, 10, i % 2 ? P.cream3 : P.bord3);
      R().rect(ctx, cx - 30, by - 24, 2, 22, P.wood1); R().rect(ctx, cx + 28, by - 24, 2, 22, P.wood1);
      R().rect(ctx, cx - 30, by - 10, 60, 6, P.wood3); return;
    }
    if (id === 'recensie') {
      R().rect(ctx, cx - 12, by - 44, 24, 42, P.ink); R().rect(ctx, cx - 10, by - 40, 20, 32, '#26324f');
      R().rect(ctx, cx - 5, by - 30, 4, 4, P.bord4); R().rect(ctx, cx + 1, by - 30, 4, 4, P.bord4); R().rect(ctx, cx - 4, by - 26, 8, 3, P.bord4); R().rect(ctx, cx - 2, by - 23, 4, 2, P.bord4);
      F().draw(ctx, '400K', cx, by - 17, P.cream3, { align: 'center' }); return;
    }
    if (id === 'doos') {
      R().rect(ctx, cx - 20, by - 28, 40, 26, P.ink); R().rect(ctx, cx - 19, by - 27, 38, 24, P.wood3); R().rect(ctx, cx - 19, by - 27, 38, 4, P.wood4);
      HF().draw(ctx, '?', cx, by - 20, P.ink, { align: 'center' }); return;
    }
    if (id === 'proeverij') {
      for (const dx of [-18, -2, 14]) { R().rect(ctx, cx + dx, by - 26, 8, 10, P.glass2); R().rect(ctx, cx + dx + 1, by - 21, 6, 5, P.bord3); R().rect(ctx, cx + dx + 3, by - 16, 2, 10, P.glass2); R().rect(ctx, cx + dx, by - 6, 8, 2, P.glass2); }
      return;
    }
    HF().draw(ctx, '!', cx, by - 22, P.cream3, { align: 'center' });
  }
  // Kaart tekenen op (x, y), maat CW × CH — speelkaart met ronde hoeken (besluit 58)
  UI.drawCard = function (ctx, app, id, x, y, opts) {
    opts = opts || {};
    const s = app.s, c = CC.cardById(id), T = CC.TEXT.cards[id], K = KIND[c.kind];
    const w = CW, h = CH, RR = R();
    const face = '#f7ebc8', faceDark = '#ecdcb2';
    // rand: donker, dan de kleur van de soort kaart, dan goudlijn, dan het vlak
    RR.round(ctx, x, y, w, h, 10, P.ink);
    RR.round(ctx, x + 1, y + 1, w - 2, h - 2, 9, opts.hover ? P.gold2 : K.col);
    RR.round(ctx, x + 2, y + 2, w - 4, h - 4, 8, opts.hover ? P.gold : K.dark);
    RR.round(ctx, x + 4, y + 4, w - 8, h - 8, 7, P.gold);
    RR.round(ctx, x + 5, y + 5, w - 10, h - 10, 6, face);
    // sierhoekjes in de goudlijn
    for (const [cx0, cy0] of [[x + 6, y + h - 12], [x + w - 12, y + h - 12]]) { RR.rect(ctx, cx0 + 2, cy0, 2, 6, P.gold); RR.rect(ctx, cx0, cy0 + 2, 6, 2, P.gold); RR.rect(ctx, cx0 + 2, cy0 + 2, 2, 2, P.gold2); }
    // illustratie met ronde hoeken
    const ax = x + 9, ay = y + 9, aw = w - 18, ah = 84;
    RR.round(ctx, ax - 1, ay - 1, aw + 2, ah + 2, 6, P.ink);
    cardArt(ctx, app, id, ax, ay, aw, ah);
    RR.roundCorners(ctx, ax, ay, aw, ah, 5, P.ink);
    RR.rect(ctx, ax, ay, aw, 1, 'rgba(255,241,168,0.25)');
    // soort-lintje linksboven over het plaatje
    const kw = F().width(K.txt) + 12;
    RR.pill(ctx, ax + 3, ay + 3, kw, 11, K.col, P.ink);
    F().draw(ctx, K.txt, ax + 3 + kw / 2, ay + 5, P.cream3, { align: 'center' });
    // munt rechtsboven
    if (c.cost) {
      const cw2 = F().width(R().euro(c.cost)) + 12, mx = ax + aw - cw2 - 3, my = ay + 3;
      RR.pill(ctx, mx, my, cw2, 11, P.gold, P.ink);
      RR.rect(ctx, mx + 3, my + 2, cw2 - 6, 1, P.gold2);
      F().draw(ctx, R().euro(c.cost), mx + cw2 / 2, my + 3, P.ink, { align: 'center' });
    }
    // titelbanner half over de onderkant van het plaatje
    const tw = Math.min(w - 20, F().width(T.title) + 20), tx = x + (w - tw) / 2, ty = ay + ah - 7;
    RR.pill(ctx, tx, ty, tw, 15, P.cream3, P.ink);
    RR.round(ctx, tx + 2, ty + 11, tw - 4, 2, 1, faceDark);
    F().draw(ctx, T.title, x + w / 2, ty + 4, P.bord2, { align: 'center' });
    // verhaaltje
    let yy = ty + 20;
    F().wrap(T.text, w - 22).slice(0, 3).forEach(l => { F().draw(ctx, l, x + w / 2, yy, P.stone1, { align: 'center' }); yy += 10; });
    // effecten als pillen, onderaan boven het past-bij-jou-label
    const fxs = UI.cardFx(s, id).slice(0, 3);
    yy = Math.max(yy + 4, y + h - 28 - fxs.length * 15);
    for (const fx of fxs) {
      const pw = F().width(fx.text) + 24, px = x + (w - pw) / 2;
      RR.pill(ctx, px, yy, pw, 13, '#fffaf0', K.col);
      icon(ctx, fx, px + 5, yy + 2);
      F().draw(ctx, fx.text, px + 17, yy + 3, P.ink);
      yy += 15;
    }
    // past-bij-jou onderaan
    const fit = UI.cardFit(s, id);
    if (fit) {
      const col = fit.ok === true ? P.green2 : fit.ok === false ? P.bord3 : P.wood2;
      const bg = fit.ok === true ? '#e3edd3' : fit.ok === false ? '#f3dcd5' : '#efe2c2';
      const mark = fit.ok === true ? '✔' : fit.ok === false ? '✘' : '?';
      const txt = mark + ' ' + fit.text, fw = Math.min(w - 26, F().width(txt) + 16), fx0 = x + (w - fw) / 2, fy = y + h - 24;
      RR.pill(ctx, fx0, fy, fw, 13, bg, col);
      F().draw(ctx, txt, x + w / 2, fy + 3, col, { align: 'center' });
    }
  };
  UI.drawCardBack = function (ctx, x, y) {
    const w = CW, h = CH, RR = R();
    RR.round(ctx, x, y, w, h, 10, P.ink);
    RR.round(ctx, x + 1, y + 1, w - 2, h - 2, 9, P.bord3);
    RR.round(ctx, x + 2, y + 2, w - 4, h - 4, 8, P.bord1);
    RR.round(ctx, x + 5, y + 5, w - 10, h - 10, 6, P.gold);
    RR.round(ctx, x + 6, y + 6, w - 12, h - 12, 5, P.bord2);
    for (let yy = 12; yy < h - 12; yy += 10) for (let xx = 12 + ((yy / 10) % 2) * 5; xx < w - 12; xx += 10) {
      RR.rect(ctx, x + xx, y + yy - 1, 1, 3, P.bord3); RR.rect(ctx, x + xx - 1, y + yy, 3, 1, P.bord3);
    }
    const mx = x + w / 2, my = y + h / 2;
    RR.round(ctx, mx - 30, my - 20, 60, 40, 8, P.ink); RR.round(ctx, mx - 29, my - 19, 58, 38, 7, P.gold); RR.round(ctx, mx - 27, my - 17, 54, 34, 6, P.bord1);
    HF().draw(ctx, 'CC', mx, my - 5, P.gold2, { align: 'center' });
  };
  // Kaart via een eigen canvas, zodat hij kan omdraaien (breedte) en wegvliegen (schaal)
  const cardCanvas = {};
  function blitCard(ctx, app, id, back, x, y, sx, sc, alpha, hover) {
    let cv = cardCanvas[id + (back ? '_b' : '') + (hover ? '_h' : '')];
    if (!cv) { cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cardCanvas[id + (back ? '_b' : '') + (hover ? '_h' : '')] = cv; }
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, CW, CH);
    if (back) UI.drawCardBack(g, 0, 0); else UI.drawCard(g, app, id, 0, 0, { hover });
    const w = Math.max(1, Math.round(CW * sx * sc)), h = Math.round(CH * sc);
    ctx.globalAlpha = alpha * 0.45;   // schaduw
    R().round(ctx, Math.round(x + (CW * sc - w) / 2) + 3, Math.round(y) + (hover ? 8 : 4), w, h, Math.round(10 * sc), P.ink);
    ctx.globalAlpha = alpha;
    ctx.drawImage(cv, Math.round(x + (CW * sc - w) / 2), Math.round(y), w, h);
    ctx.globalAlpha = 1;
  }
  const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  UI.cardPick = function (app, ctx) {
    const s = app.s, sun = app.sunday, t = app.t - (sun.t0 || 0);
    UI.ornateTitle(ctx, 'ZONDAG', 320, 22, P.gold2, { shadow: P.ink, line: P.gold });
    F().draw(ctx, sun.chosen ? 'Volgende week' : app.canAffordCard() ? 'Kies je kaart voor volgende week' : 'Geen van beide kun je nu betalen', 320, 40, P.cream2, { align: 'center', shadow: P.ink });
    const gap = 24, x0 = 320 - CW - gap / 2, y0 = 54;
    const ct = sun.chosenT != null ? app.t - sun.chosenT : -1;
    sun.cards.forEach((id, i) => {
      const bx = x0 + i * (CW + gap);
      const appear = ease((t - 0.1 - i * 0.12) / 0.3);
      if (appear <= 0) return;
      const fk = Math.max(0, Math.min(1, (t - 0.55 - i * 0.2) / 0.28));
      const sx = Math.abs(Math.cos(fk * Math.PI)), back = fk < 0.5;
      const c = CC.cardById(id), poor = c.cost && s.cash < c.cost;
      const chosen = sun.chosen === id, other = sun.chosen && !chosen;
      let x = bx, y = y0 + Math.round((1 - appear) * 60), sc = 1, alpha = appear;
      let hover = false;
      if (!sun.chosen && fk >= 1) {
        hover = UI.hit(app, 'card_' + id, bx, y0 - 4, CW, CH + 4, poor ? null : () => app.chooseCard(id), poor ? 'Niet genoeg in kas' : null);
        if (hover && !poor) y -= 4;
      }
      if (other) alpha = Math.max(0, 1 - ct / 0.3);
      if (chosen && ct > 0.7) {   // naar het label linksboven vliegen
        const k = ease((ct - 0.7) / 0.45);
        sc = 1 - k * 0.9; x = bx + (6 - bx) * k; y = y0 + (19 - y0) * k;
        alpha = k > 0.95 ? 0 : 1;
      }
      if (alpha <= 0) return;
      if (poor && !back) alpha *= 0.5;
      blitCard(ctx, app, id, back, x, y, back ? sx : Math.max(0.02, sx), sc, alpha, hover && !poor);
      if (chosen && ct >= 0 && ct < 0.8) {   // stempel
        const k = Math.min(1, ct / 0.15), sw = 96, sh = 22, stx = bx + CW / 2 - sw / 2, sty = y0 + 40;
        ctx.globalAlpha = k;
        R().rect(ctx, stx, sty, sw, sh, P.bord3); R().rect(ctx, stx + 2, sty + 2, sw - 4, sh - 4, P.cream3); R().rect(ctx, stx + 3, sty + 3, sw - 6, sh - 6, P.bord3);
        F().draw(ctx, 'GEKOZEN', stx + sw / 2, sty + 7, P.cream3, { align: 'center' });
        ctx.globalAlpha = 1;
      }
    });
    if (!sun.chosen && t > 1.2 && !app.canAffordCard()) {   // geen van beide te betalen: dan zonder kaart verder
      UI.btn(app, ctx, 'newweek', 320 - 80, y0 + CH + 12, 160, 20, `Zonder kaart naar week ${s.week + 1} ▶`, () => app.bankNextWeek(), { tone: 'bord' });
    }
    if (sun.chosen && ct > 1.1) {
      const T = CC.TEXT.cards[sun.chosen];
      HF().draw(ctx, T.title, 320, 152, P.gold2, { align: 'center', shadow: P.ink });
      if (sun.cardMsg) F().draw(ctx, sun.cardMsg, 320, 176, P.cream2, { align: 'center', shadow: P.ink });
      UI.btn(app, ctx, 'newweek', 320 - 65, 200, 130, 20, `Week ${s.week + 1} ▶`, () => app.bankNextWeek(), { tone: 'bord' });
    }
  };
  // Tegenvaller: verschijnt op maandag bij het voorbereiden, met twee keuzes
  UI.mishapPanel = function (app, ctx) {
    const s = app.s, m = CC.cardById(s.mishap.id), T = CC.TEXT.cards[m.id];
    UI.dim(app, ctx, 0.6);
    const cx = 92, cy = 62;
    R().round(ctx, cx + 3, cy + 4, CW, CH, 10, 'rgba(31,10,14,0.45)');
    UI.drawCard(ctx, app, m.id, cx, cy, {});
    const x = cx + CW + 14, y = cy + 30, w = 262, h = 150;
    R().panel(ctx, x, y, w, h);
    HF().draw(ctx, 'Maandagochtend. Wat doe je?', x + 12, y + 10, P.bord2);
    R().rect(ctx, x + 10, y + 23, w - 20, 1, P.cream1);
    if (app.mishapMsg) {
      F().wrap(app.mishapMsg, w - 24).forEach((l, i) => F().draw(ctx, l, x + 12, y + 34 + i * 10, s.mishap.lost ? P.bord3 : P.green2));
      UI.btn(app, ctx, 'mis_ok', x + 12, y + h - 32, 100, 20, 'Verder', () => { app.mishapMsg = null; }, { tone: 'bord' });
      return;
    }
    const a = m.a, poor = a.cost && s.cash < a.cost;
    UI.btn(app, ctx, 'mis_a', x + 12, y + 34, w - 24, 20, T.a, () => app.decideMishap('a'), { tone: 'green', disabled: poor, tip: poor ? 'Niet genoeg in kas' : null });
    F().draw(ctx, poor ? 'Niet genoeg in kas.' : T.fxA, x + 14, y + 58, P.stone1);
    UI.btn(app, ctx, 'mis_b', x + 12, y + 78, w - 24, 20, T.b, () => app.decideMishap('b'), { tone: 'wood' });
    F().draw(ctx, T.fxB, x + 14, y + 102, P.stone1);
    F().draw(ctx, 'Kas: ' + R().euro(s.cash), x + w - 12, y + h - 20, P.wood2, { align: 'right' });
  };
  // Eenmalige uitleg, bv. als er een schaarse wijn vrijkomt
  UI.noticePanel = function (app, ctx) {
    const n = app.notice;
    if (!n.wine) {   // algemene melding (bv. afloop van de bruiloft) of iemand die iets uitlegt (bankier bij de start)
      UI.dim(app, ctx, 0.6);
      const who = n.who, pw = who ? 380 : 300, x = 320 - pw / 2, tx = who ? 104 : 16;
      const lines = []; String(n.text).split('\n').forEach((para, i) => { if (i) lines.push(''); lines.push(...F().wrap(para, pw - tx - 16)); });
      const ph = Math.max(50 + lines.length * 10 + 30, who ? 150 : 0), y = Math.round(180 - ph / 2);
      R().panel(ctx, x, y, pw, ph);
      HF().draw(ctx, n.title, x + 14, y + 10, n.good === false ? P.bord3 : P.bord2);
      R().rect(ctx, x + 12, y + 23, pw - 24, 1, P.cream1);
      if (who) { UI.portrait(app, ctx, who, 'neutral', x + 16, y + 32, 76); F().draw(ctx, who === 'bankier' ? CC.TEXT.bank.name.split(' ')[1] : '', x + 54, y + 112, P.stone1, { align: 'center' }); }
      lines.forEach((l, i) => F().draw(ctx, l, x + tx, y + 32 + i * 10, n.good === false ? P.bord3 : P.ink));
      UI.btn(app, ctx, 'notice_ok', x + pw - 124, y + ph - 30, 110, 20, n.btn || 'Verder', () => app.closeNotice(), { tone: 'bord', tip: 'Spatie' });
      return;
    }
    const T = CC.TEXT.scarceNotice, w = CC.wineById(n.wine), cap = CC.roleById(w.role).scarce;
    UI.dim(app, ctx, 0.6);
    const pw = 320, x = 160, body = F().wrap(T.text.split('{n}').join(cap), pw - 96), tip = F().wrap(T.tip, pw - 96);
    const ph = 58 + (body.length + tip.length) * 10 + 36, y = Math.round(180 - ph / 2);
    R().panel(ctx, x, y, pw, ph);
    HF().draw(ctx, T.title, x + 14, y + 10, P.bord2);
    R().rect(ctx, x + 12, y + 23, pw - 24, 1, P.cream1);
    // grote fles links, twee keer zo groot in hele pixels
    const img = app.images['wine_' + w.id.slice(5) + '_groot'];
    R().round(ctx, x + 16, y + 32, 52, 100, 6, P.cream3);
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, Math.round(x + 42 - img.naturalWidth), y + 38, img.naturalWidth * 2, img.naturalHeight * 2);
    else R().bottleMid(ctx, x + 42, y + 80, w);
    F().draw(ctx, w.name, x + 80, y + 32, P.ink);
    F().draw(ctx, `Maximaal ${cap} flessen per week`, x + 80, y + 43, P.bord3);
    let yy = y + 58;
    body.forEach(l => { F().draw(ctx, l, x + 80, yy, P.ink); yy += 10; });
    yy += 4;
    tip.forEach(l => { F().draw(ctx, l, x + 80, yy, P.wood2); yy += 10; });
    UI.btn(app, ctx, 'notice_ok', x + pw - 124, y + ph - 30, 110, 20, 'Begrepen', () => app.closeNotice(), { tone: 'bord', tip: 'Spatie' });
  };
  // Label linksonder in de HUD-balk: wat geldt er deze week?
  UI.weekChips = function (app, ctx) {
    const s = app.s, chips = [], C = CC.CONFIG;
    // Geldt een effect maar op bepaalde dagen? Dan vooraf "Za: Koningsdag", op de dag zelf vol, daarna weg.
    const when = days => {
      if (!days) return { on: true, pre: '' };
      if (days.includes(s.day)) return { on: true, pre: '' };
      const next = days.filter(d => d > s.day);
      if (!next.length) return null;
      const a = Math.min(...days), b = Math.max(...days);
      return { on: false, pre: (a === b ? C.dayNames[a] : C.dayNames[a] + '–' + C.dayNames[b].toLowerCase()) + ': ' };
    };
    if (s.card && s.card.week === s.week) {
      const T = CC.TEXT.cards[s.card.id], c = CC.cardById(s.card.id), w = when(c.days);
      if (w) chips.push({ id: 'chip_card', txt: '♦ ' + w.pre + T.title, tip: T.fx, col: w.on ? P.gold : P.stone2 });
    }
    // Tegenvaller: alleen zolang er echt iets speelt (betaald of gegokt = afgehandeld, geen label meer)
    if (s.mishap && s.mishap.choice) {
      const T = CC.TEXT.cards[s.mishap.id], e = CC.cardById(s.mishap.id)[s.mishap.choice] || {};
      const lasting = e.block || e.cust || e.custMul || e.types || e.noDelivery || e.closed;
      const w = lasting && when(e.days);
      if (w) chips.push({ id: 'chip_mis', txt: '! ' + w.pre + T.title, tip: s.mishap.choice === 'a' ? T.fxA : T.fxB, col: w.on ? P.bord4 : P.stone2 });
    }
    let x = 6;
    for (const c of chips) {
      const w = F().width(c.txt) + 8;
      R().rect(ctx, x, 19, w, 12, 'rgba(31,10,14,0.8)');
      F().draw(ctx, c.txt, x + 4, 21, c.col);
      UI.hit(app, c.id, x, 19, w, 12, null, c.tip);
      x += w + 4;
    }
  };

  // ---------- Einde: failliet of schuldenvrij ----------
  UI.endPanel = function (app, ctx, won) {
    const s = app.s, t = app.phaseT;
    if (!won) {
      // rolluik zakt naar beneden
      const drop = Math.min(1, t / 1.2), hgt = Math.round(343 * (1 - Math.pow(1 - drop, 3)));
      for (let yy = 17; yy < 17 + hgt; yy += 6) { R().rect(ctx, 0, yy, 640, 5, '#6b6259'); R().rect(ctx, 0, yy, 640, 1, '#8a8176'); R().rect(ctx, 0, yy + 5, 640, 1, '#3a342f'); }
      if (drop < 1) return;
      UI.hit(app, 'end_block', 0, 17, 640, 343, () => {}, null);
      // failliet-scherm met "wat ging er mis" (besluit 77)
      const W = 380, H = 236, X = 130, Y = 62;
      R().panel(ctx, X, Y, W, H, 'dark');
      UI.ornateTitle(ctx, 'FAILLIET', 320, Y + 16, P.bord4, { shadow: P.ink, line: P.bord3 });
      F().draw(ctx, CC.TEXT.gameOver, 320, Y + 36, P.cream2, { align: 'center' });
      // de bankier
      UI.portrait(app, ctx, 'bankier', 'grim', X + 16, Y + 52, 40);
      const quote = app.bankQuote || (app.bankQuote = CC.pickText(CC.TEXT.bank.bankrupt));
      F().wrap('"' + quote + '"', W - 88).slice(0, 3).forEach((l, i) => F().draw(ctx, l, X + 66, Y + 56 + i * 10, P.cream2));
      F().draw(ctx, '- ' + CC.TEXT.bank.name, X + 66, Y + 88, P.stone2);
      // wat ging er mis
      const pm = CC.SIM.postmortem(s), PT = CC.TEXT.postmortem, eu = v => R().euro(Math.round(v));
      const fill = (str, o) => Object.keys(o).reduce((a2, k2) => a2.split('{' + k2 + '}').join(o[k2]), str);
      let yy = Y + 108;
      R().rect(ctx, X + 16, yy - 4, W - 32, 1, P.bord3);
      F().draw(ctx, fill(PT.title, { week: pm.week }), X + 16, yy + 2, P.gold); yy += 15;
      F().draw(ctx, fill(PT.short, { short: eu(pm.short), due: eu(pm.due) }), X + 16, yy, P.bord4); yy += 13;
      for (const ln of pm.lines) {
        const txt = fill(PT[ln.key], { n: ln.n, value: eu(ln.value || 0), perDay: eu(ln.perDay || 0), need: eu(ln.need || 0), wine: ln.wine ? fill(PT.wineOut, { wine: ln.wine }) : '' });
        F().wrap('· ' + txt, W - 40).slice(0, 2).forEach(l => { F().draw(ctx, l, X + 16, yy, P.cream3); yy += 10; });
        yy += 3;
      }
      F().draw(ctx, `Week ${s.week} · niveau ${s.level} · ${s.totals.bottles} flessen verkocht · afgelost ${R().euro(s.debtPaid)}`, 320, Y + H - 44, P.stone2, { align: 'center' });
      UI.btn(app, ctx, 'restart', 320 - 70, Y + H - 30, 140, 22, 'Opnieuw beginnen', () => app.restart(), { tone: 'bord' });
    } else {
      UI.dim(app, ctx, 0.5);
      for (let i = 0; i < 60; i++) { const px = (i * 97 + Math.floor(t * 40) * (i % 3 + 1)) % 640, py = (i * 53 + Math.floor(t * 60 * (1 + (i % 4) * 0.3))) % 343 + 17; R().rect(ctx, px, py, 3, 2, [P.gold, P.bord4, P.green4, P.cream3][i % 4]); }
      R().panel(ctx, 170, 80, 300, 190);
      UI.ornateTitle(ctx, 'SCHULDENVRIJ!', 320, 98, P.bord2, { shadow: P.gold });
      const wl = F().wrap(CC.TEXT.bank.won, 260);
      wl.forEach((l, i) => F().draw(ctx, l, 320, 118 + i * 10, P.ink, { align: 'center' }));
      let yy = 124 + wl.length * 10 + 8;
      const row = (l, r) => { F().draw(ctx, l, 200, yy, P.ink); F().draw(ctx, r, 440, yy, P.ink, { align: 'right' }); yy += 12; };
      row('Kas', R().euro(s.cash)); row('Niveau', String(s.level)); row('Flessen verkocht', String(s.totals.bottles)); row('Totale omzet', R().euro(s.totals.revenue));
      UI.btn(app, ctx, 'endless', 250, 238, 140, 22, 'Verder spelen ▶', () => app.bankNextWeek(), { tone: 'bord' });
    }
  };

  // ---------- Titelscherm: sfeer ----------
  // Alles in hele pixels en rustig: twinkelende sterren, glinsterend grachtwater, af en toe een blaadje uit de boom,
  // en elke paar seconden een lichtschittering over het logo.
  const TA = UI._titleAnim = { stars: null, leaves: [], nextLeaf: 1.5, sparks: [] };
  function hash(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
  UI.titleAmbience = function (app, ctx) {
    const t = app.t, dt = Math.min(0.1, t - (TA.last || t)); TA.last = t;
    // sterren (alleen in de lucht linksboven en tussen de gebouwen)
    if (!TA.stars) { TA.stars = []; for (let i = 0; i < 16; i++) TA.stars.push({ x: 70 + Math.floor(hash(i) * 150), y: 4 + Math.floor(hash(i + 50) * 80), p: hash(i + 99) * 6.28, sp: 0.8 + hash(i + 7) * 1.6 }); }
    for (const s of TA.stars) {
      const k = (Math.sin(t * s.sp + s.p) + 1) / 2;
      if (k < 0.35) continue;
      ctx.globalAlpha = (k - 0.35) / 0.65;
      R().rect(ctx, s.x, s.y, 1, 1, P.cream3);
      if (k > 0.92) { R().rect(ctx, s.x - 1, s.y, 3, 1, 'rgba(253,246,227,0.5)'); R().rect(ctx, s.x, s.y - 1, 1, 3, 'rgba(253,246,227,0.5)'); }
    }
    ctx.globalAlpha = 1;
    // glinsteringen op het water: korte gouden streepjes die op- en weggloeien
    while (TA.sparks.length < 14) TA.sparks.push({ x: Math.floor(Math.random() * 620) + 10, y: 332 + Math.floor(Math.random() * 26), w: 2 + Math.floor(Math.random() * 4), life: 0, max: 0.6 + Math.random() * 1.2 });
    for (const s of TA.sparks) {
      s.life += dt;
      const a = Math.sin(Math.min(1, s.life / s.max) * Math.PI);
      ctx.globalAlpha = a * 0.8;
      R().rect(ctx, s.x, s.y, s.w, 1, P.gold2);
    }
    ctx.globalAlpha = 1;
    TA.sparks = TA.sparks.filter(s => s.life < s.max);
    // blaadjes uit de boom linksboven
    TA.nextLeaf -= dt;
    if (TA.nextLeaf <= 0) { TA.nextLeaf = 1.2 + Math.random() * 2.5; TA.leaves.push({ x: 10 + Math.random() * 90, y: 20 + Math.random() * 60, vy: 9 + Math.random() * 6, ph: Math.random() * 6, col: Math.random() < 0.5 ? P.gold : P.wood3 }); }
    for (const l of TA.leaves) {
      l.y += l.vy * dt; l.ph += dt * 2.2;
      const x = Math.round(l.x + Math.sin(l.ph) * 6 + l.y * 0.25), y = Math.round(l.y);
      R().rect(ctx, x, y, 2, 1, l.col); if (Math.sin(l.ph) > 0) R().rect(ctx, x + 1, y + 1, 1, 1, l.col);
    }
    TA.leaves = TA.leaves.filter(l => l.y < 290);
  };
  // Blinkjes: om de 2–3,5 s flitst er op één plek van het logo een klein sterretje op (+ vorm, 0,5 s).
  // Rustig en in hele pixels; soms twee kort na elkaar, als glinsterend goud.
  UI.logoGlint = function (app, ctx, logo, x, y) {
    ctx.drawImage(logo, x, y);
    const pts = (CC.TITLE && CC.TITLE.sparkles) || [];
    if (!pts.length) return;
    const t = app.t;
    if (!TA.blinks) { TA.blinks = []; TA.nextBlink = 1.2; }
    if (t >= TA.nextBlink) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      TA.blinks.push({ x: p[0], y: p[1], t0: t });
      if (Math.random() < 0.3) { const q = pts[Math.floor(Math.random() * pts.length)]; TA.blinks.push({ x: q[0], y: q[1], t0: t + 0.25 }); }
      TA.nextBlink = t + 2 + Math.random() * 1.5;
    }
    const DUR = 0.5;
    for (const b of TA.blinks) {
      const k = (t - b.t0) / DUR;
      if (k < 0 || k > 1) continue;
      const arm = k < 0.2 ? 1 : k < 0.35 ? 2 : k < 0.65 ? 3 : k < 0.8 ? 2 : 1;   // groeit, piek, krimpt
      const cx = x + b.x, cy = y + b.y;
      for (let i = 1; i <= arm; i++) {
        const col = i === 1 ? '#ffffff' : (i === 2 ? P.gold2 : 'rgba(255,241,168,0.55)');
        R().rect(ctx, cx - i, cy, 1, 1, col); R().rect(ctx, cx + i, cy, 1, 1, col);
        R().rect(ctx, cx, cy - i, 1, 1, col); R().rect(ctx, cx, cy + i, 1, 1, col);
      }
      R().rect(ctx, cx, cy, 1, 1, '#ffffff');
    }
    TA.blinks = TA.blinks.filter(b => t - b.t0 <= DUR);
  };

  // ---------- Titelscherm ----------
  // Met assets/title_bg.png (tools/build_title.py): de gevel 's nachts, logo als uithangbord boven de etalage.
  UI.title = function (app, ctx) {
    const bg = app.images.title, logo = app.images.logo;
    const hasBg = bg && bg.complete && bg.naturalWidth;
    const b = 0;   // logo staat stil: zweven in hele pixels oogt schokkerig (HJ)
    if (hasBg) {
      ctx.drawImage(bg, 0, 0);
      UI.titleAmbience(app, ctx);
      if (logo && logo.complete && logo.naturalWidth) UI.logoGlint(app, ctx, logo, Math.round(CC.TITLE.logoX - logo.naturalWidth / 2), CC.TITLE.logoY + b);
      else HF().draw(ctx, 'CHÂTEAU CASHFLOW', CC.TITLE.logoX, 70, P.gold2, { align: 'center', shadow: P.ink });
      R().rect(ctx, 0, 286, 640, 74, 'rgba(31,10,14,0.72)');
      R().rect(ctx, 0, 286, 640, 1, P.wood2);
      F().draw(ctx, CC.TEXT.tagline, 320, 294, P.cream2, { align: 'center', shadow: P.ink });
      if (app.hasSave) {
        UI.btn(app, ctx, 'cont', 176, 312, 136, 22, 'Doorgaan', () => app.continueGame(), { tone: 'bord' });
        UI.btn(app, ctx, 'new', 328, 312, 136, 22, 'Nieuw spel', () => app.askNewGame(), { tone: 'wood' });
      } else UI.btn(app, ctx, 'new', 252, 312, 136, 22, 'Nieuw spel', () => app.askNewGame(), { tone: 'bord' });
      UI.titleFooter(app, ctx, 344);
      UI.fsButton(app, ctx, 634, 6, true);
      UI.fbButton(app, ctx, 6, 6, true);
      UI.confirmNewPanel(app, ctx);
      return;
    }
    R().rect(ctx, 0, 0, 640, 360, 'rgba(31,10,14,0.62)');
    if (logo && logo.complete && logo.naturalWidth) ctx.drawImage(logo, Math.round(320 - logo.naturalWidth / 2), 40 + b);
    else HF().draw(ctx, 'CHÂTEAU CASHFLOW', 320, 90, P.gold2, { align: 'center', shadow: P.ink });
    F().draw(ctx, CC.TEXT.tagline, 320, 172, P.cream2, { align: 'center' });
    let y = 200;
    if (app.hasSave) { UI.btn(app, ctx, 'cont', 250, y, 140, 22, 'Doorgaan', () => app.continueGame(), { tone: 'bord' }); y += 28; }
    UI.btn(app, ctx, 'new', 250, y, 140, 22, 'Nieuw spel', () => app.askNewGame(), { tone: app.hasSave ? 'wood' : 'bord' });
    UI.titleFooter(app, ctx, 342);
    UI.fsButton(app, ctx, 634, 6, true);
    UI.confirmNewPanel(app, ctx);
  };

  // Onderste regel van het titelscherm: versie links, spelcode en reservekopie rechts (klein, rustig).
  UI.titleFooter = function (app, ctx, y) {
    if (CC.DBG && CC.DBG.allowed) F().draw(ctx, 'Versie ' + CC.VERSION + ' · F1 = debug', 10, y + 3, P.stone1);   // alleen met ?debug (besluit 93)
    let bx = 634;
    const small = (id, label, fn, tip) => { const w = F().width(label) + 14; bx -= w; UI.btn(app, ctx, id, bx, y, w, 13, label, fn, { tone: 'wood', tip }); bx -= 4; };
    small('code_in', 'Code laden', () => app.openCode('import'), 'Een spel inladen vanaf een spelcode');
    if (app.hasSave) small('code_out', 'Spelcode', () => app.openCode('export'), 'Je spel als tekstcode bewaren of meenemen');
    if (app.hasBackup) { const b = CC.backupInfo(); small('backup', 'Reservekopie terugzetten', () => app.restoreBackup(), b ? `Het vorige spel (week ${b.week}, niveau ${b.level}) terugzetten; het huidige wordt dan de reservekopie` : null); }
    if (CC.INTRO && app.playIntro) { const T = CC.TEXT.intro; small('intro', T.menuBtn, () => app.playIntro(), T.menuTip); }
  };

  // ---------- Venster met tekstinvoer: feedback en spelcode (besluit 92) ----------
  // Getekend in de canvas; de tekst komt uit het onzichtbare tekstvak (app.textInput) dat over het tekstvak ligt.
  UI.textDialog = function (app, ctx) {
    const d = app.dialog, tin = app.textInput; if (!d || !tin) return;
    const k = Math.min(1, (app.t - d.t0) / 0.14), ease = 1 - Math.pow(1 - k, 3);
    R().rect(ctx, 0, 0, 640, 360, `rgba(31,10,14,${0.55 * ease})`);
    UI.hit(app, 'dlg_dim', 0, 0, 640, 360, () => { if (!d.busy) app.closeDialog(); }, null);
    const w = 372, x = 134;
    const info = d.info ? F().wrap(d.info, w - 40) : [];
    const boxH = 8 * 10 + 8, h = 46 + info.length * 10 + boxH + 44;
    const y = Math.round(180 - h / 2 + (1 - ease) * 14);
    if (d.done) {   // bedankt (feedback verstuurd): klein venster
      const dw = 240, dh = 64, dx = 320 - dw / 2, dy = 180 - dh / 2;
      R().panel(ctx, dx, dy, dw, dh);
      HF().draw(ctx, d.doneTitle || 'Dank je wel!', 320, dy + 17, P.bord2, { align: 'center' });
      F().draw(ctx, d.doneText || '', 320, dy + 35, P.ink, { align: 'center' });
      app.placeTextInput({ x: 0, y: 0, w: 0, h: 0 });
      return;
    }
    UI.hit(app, 'dlg_block', x, y, w, h, () => tin.focus(), null);
    R().panel(ctx, x, y, w, h);
    HF().draw(ctx, d.title || '', x + 16, y + 12, P.bord2);
    UI.btn(app, ctx, 'dlg_x', x + w - 30, y + 11, 15, 13, '×', () => app.closeDialog(), { tone: 'bord', tip: 'Sluiten (Esc)' });
    R().rect(ctx, x + 14, y + 25, w - 28, 1, P.cream1);
    info.forEach((l, i) => F().draw(ctx, l, x + 16, y + 32 + i * 10, P.wood2));
    // tekstvak
    const bx = x + 16, by = y + 34 + info.length * 10 + 4, bw = w - 32;
    const focused = document.activeElement === tin;
    R().round(ctx, bx, by, bw, boxH, 4, focused ? P.wood2 : P.cream1);
    R().round(ctx, bx + 1, by + 1, bw - 2, boxH - 2, 3, P.cream3);
    app.placeTextInput({ x: bx, y: by, w: bw, h: boxH });
    const val = tin.value, tw = bw - 12, lines = F().wrapIdx(val, tw), maxL = 8;
    const caret = tin.selectionEnd == null ? val.length : tin.selectionEnd;
    let cl = 0; lines.forEach((l, i) => { if (l.s <= caret) cl = i; });
    const first = d.readOnly ? 0 : Math.max(0, Math.min(cl - maxL + 1, lines.length - maxL));
    if (!val && d.placeholder) F().draw(ctx, d.placeholder, bx + 6, by + 5, P.stone2);
    lines.slice(first, first + maxL).forEach((l, i) => F().draw(ctx, val.slice(l.s, l.e).replace(/\n/g, ''), bx + 6, by + 5 + i * 10, P.ink));
    if (d.readOnly && lines.length > maxL) {   // lange spelcode: laatste regel wordt een samenvatting
      R().rect(ctx, bx + 2, by + 5 + (maxL - 1) * 10 - 1, bw - 4, 10, P.cream3);
      F().draw(ctx, `... (${val.length} tekens; Kopiëren neemt alles mee)`, bx + 6, by + 5 + (maxL - 1) * 10, P.stone1);
    }
    if (focused && !d.readOnly && (Math.floor((app.t - d.t0) * 2.2) % 2 === 0) && cl >= first && cl < first + maxL) {
      const L = lines[cl], cx = bx + 6 + F().width(val.slice(L.s, caret).replace(/\n/g, '')) + (caret > L.s ? 1 : 0);
      R().rect(ctx, cx, by + 4 + (cl - first) * 10, 1, 9, P.bord2);
    }
    // voet: melding en knoppen
    const fy = by + boxH + 10;
    if (d.msg) F().draw(ctx, d.msg, x + 16, fy + 4, d.err ? P.red : P.green2);
    else if (d.count && d.max) F().draw(ctx, `${val.length} / ${d.max}`, x + 16, fy + 4, P.stone2);
    const aw = F().width(d.actionLabel || '') + 26;
    const disabled = d.busy || (!d.readOnly && !val.trim());
    UI.btn(app, ctx, 'dlg_go', x + w - 16 - aw, fy, aw, 18, d.busy ? (d.busyLabel || '...') : d.actionLabel, () => app.dialogAction(), { tone: 'bord', disabled, tip: d.readOnly ? null : 'Ctrl+Enter' });
    UI.btn(app, ctx, 'dlg_close', x + w - 24 - aw - 80, fy, 80, 18, 'Sluiten', () => app.closeDialog(), { tone: 'wood', tip: 'Esc' });
  };

  // "Nieuw spel" terwijl er een lopend spel is: eerst vragen.
  UI.confirmNewPanel = function (app, ctx) {
    if (!app.confirmNew) return;
    const o = app.confirmOld || {};
    R().rect(ctx, 0, 0, 640, 360, 'rgba(31,10,14,0.6)');
    UI.hit(app, 'confirm_block', 0, 0, 640, 360, () => {}, null);
    const w = 280, h = 112, x = 180, y = 118;
    R().panel(ctx, x, y, w, h);
    HF().draw(ctx, 'Nieuw spel beginnen?', x + w / 2, y + 16, P.bord2, { align: 'center' });
    const lines = F().wrap(`Je spel in week ${o.week || 1} (niveau ${o.level || 1}, kas ${R().euro(o.cash || 0)}) wordt vervangen. Het blijft bewaard als reservekopie; die kun je hier later terugzetten.`, w - 40);
    lines.forEach((l, i) => F().draw(ctx, l, x + w / 2, y + 40 + i * 10, P.ink, { align: 'center' }));
    UI.btn(app, ctx, 'confirm_no', x + 24, y + h - 32, 104, 20, 'Terug', () => { app.confirmNew = false; }, { tone: 'wood' });
    UI.btn(app, ctx, 'confirm_yes', x + w - 128, y + h - 32, 104, 20, 'Ja, nieuw spel', () => app.newGame(), { tone: 'bord' });
  };

  // ---------- Middenvenster "Bestellen · Prijzen" (besluit 66/69) ----------
  // Telefoon, kassa en kasten openen dit venster. Ronnie zet elke ochtend een voorstel klaar; pas bij "Bestellen" gaat er geld af.
  const AX = 96, AY = 20, AW = 448, AH = 336;
  UI.assortPanel = function (app, ctx) {
    const s = app.s, SIM = CC.SIM;
    const slide = Math.min(1, app.panelT / 0.16), ease = 1 - Math.pow(1 - slide, 3);
    const x = AX, y = Math.round(360 + (AY - 360) * ease);
    R().rect(ctx, 0, 17, 640, 343, `rgba(31,10,14,${0.35 * ease})`);
    UI.hit(app, 'assort_dim', 0, 17, 640, 343, () => { if (app.shelfPick) app.shelfPick = null; else app.closePanel(); }, null);
    UI.hit(app, 'assort_block', x, y, AW, AH, () => { app.shelfPick = null; }, null);
    R().panel(ctx, x, y, AW, AH);
    // tabs
    const tab = app.assortTab === 'prices' ? 'prices' : 'order';
    const tabs = [['order', 'Bestellen'], ['prices', 'Prijzen']];
    let tx = x + 12;
    for (const [id, label] of tabs) {
      const on = tab === id, w = F().width(label) + 22;
      const hv = UI.hit(app, 'atab_' + id, tx, y + 7, w, 15, () => { app.assortTab = id; app.shelfPick = null; }, on ? null : 'Tab wisselt');
      R().round(ctx, tx, y + 7, w, 15, 6, P.ink);
      R().round(ctx, tx + 1, y + 8, w - 2, 13, 5, on ? P.bord2 : (hv ? P.wood3 : P.wood2));
      if (on) R().rect(ctx, tx + 6, y + 10, w - 12, 1, P.bord3);
      F().draw(ctx, label, tx + w / 2, y + 11, on ? P.cream3 : P.cream2, { align: 'center' });
      tx += w + 4;
    }
    F().draw(ctx, '(Tab wisselt)', tx + 4, y + 11, P.stone2);
    F().draw(ctx, 'Kas ' + R().euro(s.cash), x + AW - 32, y + 11, P.wood2, { align: 'right' });
    UI.btn(app, ctx, 'close', x + AW - 25, y + 8, 15, 13, '×', () => app.closePanel(), { tone: 'bord' });
    R().rect(ctx, x + 10, y + 25, AW - 20, 1, P.cream1);
    if (tab === 'prices') UI.pricesTab(app, ctx, x, y); else UI.orderTab(app, ctx, x, y);
  };

  // Een wijn even laten oplichten (na een klik op het avondinzicht): 0 = uit, anders de sterkte van de gouden gloed
  UI.focusOn = function (app, id) {
    const f = app.assortFocus; if (!f || f.wine !== id) return 0;
    const dt = app.t - f.t0; if (dt > 3) return 0;
    return (0.25 + 0.3 * (0.5 + 0.5 * Math.sin(dt * 8))) * Math.min(1, (3 - dt) / 0.5);
  };
  function smallBtn(app, ctx, id, x, y, w, label, onClick, opts) { return UI.btn(app, ctx, id, x, y, w, 13, label, onClick, Object.assign({ tone: 'wood' }, opts || {})); }

  UI.orderTab = function (app, ctx, x, y) {
    const s = app.s, SIM = CC.SIM, T = CC.TEXT.assort, C = CC.CONFIG;
    const order = app.order = app.order || {};
    const blocked = SIM.deliveryBlocked(s);
    const vakMode = app.assortVak && s.vakken[app.assortVak] ? app.assortVak : null;
    // Ronnie
    UI.portrait(app, ctx, 'leverancier', 'neutral', x + 14, y + 32, 40);
    const total = Object.values(order).reduce((a, b) => a + (b || 0), 0);
    let say = blocked ? T.blocked : vakMode ? T.forVak.split('{n}').join(CC.vakNumber(vakMode)) : app.orderMsg ? app.orderMsg : total > 0 ? T.proposal : T.empty;
    const bw = AW - 86, name = 'Ronnie:', lines = F().wrap(name + ' ' + say, bw - 16).slice(0, 3);
    R().round(ctx, x + 62, y + 32, bw, 12 + lines.length * 10, 5, P.ink);
    R().round(ctx, x + 63, y + 33, bw - 2, 10 + lines.length * 10, 4, '#fffaf0');
    R().rect(ctx, x + 59, y + 40, 4, 1, P.ink); R().rect(ctx, x + 60, y + 41, 3, 1, '#fffaf0'); R().rect(ctx, x + 60, y + 39, 3, 1, P.ink);
    lines.forEach((l, i) => {
      if (i === 0 && l.startsWith(name)) { F().draw(ctx, name, x + 70, y + 37, P.bord2); F().draw(ctx, l.slice(name.length), x + 70 + F().width(name), y + 37, P.ink); }
      else F().draw(ctx, l, x + 70, y + 37 + i * 10, P.ink);
    });
    // kolomkoppen
    const top = y + 80;
    const head = [['Wijn', 30, 'left'], ['Nu', 172, 'right'], ['Tot', 204, 'right'], ['Bestellen', 262, 'center'], ['Kosten', 348, 'right'], ['Schap', 393, 'center']];
    head.forEach(([t, cx, al]) => F().draw(ctx, t, x + cx, top, P.bord2, { align: al }));
    R().rect(ctx, x + 10, top + 9, AW - 20, 1, P.cream1);
    const wines = SIM.unlockedWines(s);
    // besluit 91: rijhoogte groeit mee met de ruimte. Rijk (≥ 44): grote fles, soort en stijl, blurb.
    // Midden (≥ 24): kleine fles en één regel soort en stijl. Anders compact zoals voorheen.
    const avail = (y + AH - 44 - 8) - (top + 12);
    const fitH = Math.floor(avail / Math.max(1, wines.length));
    const rowH = fitH >= 44 ? Math.min(48, fitH) : fitH >= 24 ? Math.min(34, fitH) : Math.max(15, Math.min(20, fitH));
    const rich = rowH >= 44, mid = !rich && rowH >= 24;
    let ry = top + 12;
    wines.forEach((w, i) => {
      const id = w.id, n = order[id] || 0, have = SIM.totalBottles(s, id), vak = SIM.vakOfWine(s, id);
      const left = SIM.scarceLeft(s, id), scarce = left !== Infinity;
      const here = vakMode && s.vakken[vakMode].wine === id;
      if (UI.focusOn(app, id)) R().round(ctx, x + 8, ry - 1, AW - 16, rowH, 4, `rgba(232,181,58,${UI.focusOn(app, id)})`);
      else if (here) R().round(ctx, x + 8, ry - 1, AW - 16, rowH, 4, 'rgba(232,181,58,0.35)');
      else if (i % 2 === 0) R().round(ctx, x + 8, ry - 1, AW - 16, rowH, 4, P.cream3);
      const NX = rich ? 36 : mid ? 30 : 30;   // begin van de naam
      if (rich) { if (!R().wineSprite(ctx, w, 'groot', x + 21, ry + rowH - 4)) R().bottleMid(ctx, x + 21, ry + Math.floor(rowH / 2), w, 'schap'); }
      else if (mid) { if (!R().wineSprite(ctx, w, 'icoon', x + 19, ry + rowH - 1)) R().bottleMid(ctx, x + 19, ry + Math.floor(rowH / 2) - 1, w, 'schap'); }
      else R().bottleMid(ctx, x + 19, ry + Math.floor(rowH / 2) - 1, w, 'schap');
      F().draw(ctx, w.name, x + NX, ry + 3, vak || have ? P.ink : P.stone1);
      if (rich || mid) {   // soort en stijl, en bij rijke rijen de blurb over de volle breedte
        const stijl = (w.stijl || []).filter(st => st !== 'bubbels').map(st => CC.TEXT.stijlAdj[st] || st);
        const kind = [CC.TEXT.soortName[CC.roleById(w.role).kind]].concat(stijl).join(', ');
        const desc = `${kind} · ${w.druif.join(', ')} · ${w.regio}, ${w.country}`;
        const l2 = rich ? 16 : 13, l3 = rich ? 27 : 23;
        F().draw(ctx, desc, x + NX, ry + l2, P.wood2);
        const nb = Math.floor((rowH - l3 - 1) / 10);   // zoveel blurbregels passen er nog in de rij
        if (w.blurb && nb > 0) F().wrap(w.blurb, AW - NX - 24).slice(0, nb).forEach((l, j) => F().draw(ctx, l, x + NX, ry + l3 + j * 10, P.stone1));
      }
      if (scarce) {
        const tag = left > 0 ? `nog ${left}` : 'op';
        F().draw(ctx, tag, x + NX + 4 + F().width(w.name), ry + 3, left > 0 ? P.wood2 : P.red);
        UI.hit(app, 'sc_' + id, x + NX, ry, F().width(w.name) + F().width(tag) + 6, 13, null, `Schaars: Ronnie heeft er ${CC.roleById(w.role).scarce} per week. Maandag weer nieuwe.`);
      }
      F().draw(ctx, String(have), x + 172, ry + 3, have ? P.ink : P.stone2, { align: 'right' });
      // "Tot": na deze bestelling heb je er zoveel, en tot hier vult Ronnie morgen weer aan
      const upto = have + n, tgt = SIM.target(s, id);
      F().draw(ctx, upto ? String(upto) : '-', x + 204, ry + 3, n ? P.bord2 : (upto ? P.wood2 : P.stone2), { align: 'right' });
      UI.hit(app, 'upto_' + id, x + 178, ry, 30, 13, null, upto ? `Na deze bestelling heb je ${upto} flessen ${w.name}. Morgen vult Ronnie weer aan tot ${upto}.` + (tgt && tgt !== upto ? ` (nu staat je lijst op ${tgt})` : '') : 'Niet op je lijst: Ronnie levert niets');
      // −6 · aantal · +6 · +12
      const cap = Math.min(left, C.targetMax);
      const set = v => { order[id] = Math.max(0, Math.min(cap, v)); if (!order[id]) delete order[id]; app.orderMsg = null; };
      const bx = x + 212;
      smallBtn(app, ctx, 'om_' + id, bx, ry, 20, '−6', () => set(n - 6), { disabled: n <= 0 || blocked });
      R().round(ctx, bx + 22, ry, 32, 13, 4, n ? P.gold : P.cream1);
      F().draw(ctx, String(n), bx + 38, ry + 3, n ? P.ink : P.stone2, { align: 'center' });
      smallBtn(app, ctx, 'op_' + id, bx + 56, ry, 20, '+6', () => set(n + 6), { disabled: n + 6 > cap || blocked, tone: 'green' });
      smallBtn(app, ctx, 'oq_' + id, bx + 78, ry, 24, '+12', () => set(n + 12), { disabled: n + 12 > cap || blocked, tone: 'green' });
      F().draw(ctx, n ? R().euro(n * SIM.buyPrice(s, w)) : '-', x + 348, ry + 3, n ? P.ink : P.stone2, { align: 'right' });
      // schap
      const sx = x + 354, sw = 78;
      if (vakMode) {
        if (here) { R().pill(ctx, sx, ry, sw, 13, P.green3, P.ink); F().draw(ctx, 'Staat hier ✔', sx + sw / 2, ry + 3, P.cream3, { align: 'center' }); }
        else smallBtn(app, ctx, 'here_' + id, sx, ry, sw, 'Hier zetten', () => { app.assign(vakMode, id); app.orderMsg = T.done; }, { tip: `In schap ${CC.vakNumber(vakMode)} zetten` + (s.vakken[vakMode].wine ? ` (in plaats van ${CC.wineById(s.vakken[vakMode].wine).name})` : '') });
      } else {
        const lbl = vak ? `Schap ${CC.vakNumber(vak)} ▾` : 'Geen schap ▾';
        smallBtn(app, ctx, 'shelf_' + id, sx, ry, sw, lbl, () => { app.shelfPick = app.shelfPick === id ? null : id; }, { active: app.shelfPick === id, tone: vak ? 'wood' : 'bord' });
      }
      ry += rowH;
    });
    // voet: totaal, kas daarna, wat er deze week nog moet
    const cost = SIM.orderCost(s, order), after = s.cash - cost;
    const fixed = SIM.costsLeft(s), due = SIM.weekDue(s);
    const fy = y + AH - 44;
    R().rect(ctx, x + 10, fy - 4, AW - 20, 1, P.cream1);
    F().draw(ctx, `Totaal ${R().euro(cost)}`, x + 16, fy + 1, P.ink);
    F().draw(ctx, `· kas daarna ${R().euro(after)}`, x + 22 + F().width(`Totaal ${R().euro(cost)}`), fy + 1, after < 0 ? P.red : P.ink);
    const needTxt = `Deze week nog: huur${SIM.wages(s) ? ' en loon' : ''} ${R().euro(fixed)}` + (due > 0 ? ` · zondag ${R().euro(due)}` : '');
    const tight = after < fixed + due;
    F().draw(ctx, needTxt, x + 16, fy + 12, tight ? P.red : P.stone1);
    UI.hit(app, 'need_tip', x + 14, fy + 10, F().width(needTxt) + 4, 11, null, tight ? 'Met wat je nu in kas hebt, kun je dit nog niet betalen: je moet eerst verkopen. Verkoop je minder, dan wordt het krap op zondag.' : 'Huur en loon gaan elke verkoopdag van de kas; de aflossing op zondag.');
    const can = cost > 0 && cost <= s.cash + 1e-9 && !blocked;
    UI.btn(app, ctx, 'place_order', x + AW - 128, fy - 1, 112, 22, 'Bestellen ▶', () => { app.placeOrder(); app.orderMsg = T.done; app.shelfPick = null; },
      { tone: 'bord', disabled: !can, tip: blocked ? T.blocked : cost <= 0 ? 'Nog niets om te bestellen' : cost > s.cash ? `Te weinig kas: nog ${R().euro(cost - s.cash)} tekort` : null });
    // keuzelijst voor een schap (bovenop alles)
    if (app.shelfPick && !vakMode) UI.shelfMenu(app, ctx, x, y, top, rowH, wines);
  };

  UI.shelfMenu = function (app, ctx, x, y, top, rowH, wines) {
    const s = app.s, SIM = CC.SIM, id = app.shelfPick, w = CC.wineById(id);
    const i = wines.findIndex(v => v.id === id); if (i < 0) { app.shelfPick = null; return; }
    const vaks = SIM.activeVakIds(s), cur = SIM.vakOfWine(s, id);
    const opts = vaks.map(v => ({ id: v, label: `Schap ${CC.vakNumber(v)}: ` + (s.vakken[v].wine === id ? 'staat hier ✔' : s.vakken[v].wine ? `in plaats van ${CC.wineById(s.vakken[v].wine).name}` : 'leeg'), here: s.vakken[v].wine === id }));
    if (cur) opts.push({ id: null, label: 'Van het schap halen' });
    const mw = Math.max(...opts.map(o => F().width(o.label))) + 18, mh = opts.length * 13 + 8;
    const mx = x + AW - 12 - mw;
    let my = top + 12 + i * rowH + 15;   // direct onder de knop (rijen kunnen hoger zijn dan de knop)
    if (my + mh > y + AH - 8) my = top + 12 + i * rowH - mh - 2;
    UI.hit(app, 'shelf_menu', mx, my, mw, mh, () => {}, null);
    R().round(ctx, mx + 2, my + 3, mw, mh, 5, 'rgba(31,10,14,0.35)');
    R().round(ctx, mx, my, mw, mh, 5, P.ink);
    R().round(ctx, mx + 1, my + 1, mw - 2, mh - 2, 4, '#fffaf0');
    opts.forEach((o, k) => {
      const oy = my + 4 + k * 13;
      const hv = UI.hit(app, 'shelf_opt_' + k, mx + 3, oy, mw - 6, 12, () => {
        if (o.here) { app.shelfPick = null; return; }
        if (o.id) app.assign(o.id, id); else app.assign(null, null, id);
        app.shelfPick = null;
      }, null);
      if (hv && !o.here) R().round(ctx, mx + 3, oy, mw - 6, 12, 3, 'rgba(232,181,58,0.35)');
      F().draw(ctx, o.label, mx + 8, oy + 3, o.here ? P.green2 : (o.id ? P.ink : P.bord3));
    });
  };

  UI.pricesTab = function (app, ctx, x, y) {
    const s = app.s, SIM = CC.SIM, T = CC.TEXT.assort, C = CC.CONFIG;
    s.flags.pricesSeen = true;
    T.pricesIntro.forEach((l, i) => F().draw(ctx, l, x + 16, y + 32 + i * 10, P.stone1));
    // klanten van vandaag (dezelfde als "Vandaag verwacht"): budgetten per type
    const plan = SIM.planDay(s, SIM.dayRng(s));
    const types = Object.keys(CC.CUSTOMER_TYPES).sort((a, b) => CC.CUSTOMER_TYPES[a].budget[1] - CC.CUSTOMER_TYPES[b].budget[1]).filter(k => plan.some(p => p.type === k));   // van krap naar ruim budget
    const top = y + 58;
    F().draw(ctx, 'Wijn', x + 16, top, P.bord2);
    C.priceStands.forEach((st, k) => F().draw(ctx, st.name, x + 150 + k * 50 + 23, top, P.bord2, { align: 'center' }));
    // koppen van de budgetbalkjes: gekleurde stip per klanttype
    const bx0 = x + 356, bstep = types.length ? Math.min(22, Math.floor(80 / types.length)) : 20;
    types.forEach((k, j) => {
      const ct = CC.CUSTOMER_TYPES[k], cx = bx0 + j * bstep;
      R().round(ctx, cx + 3, top - 1, 9, 9, 4, P.ink); R().round(ctx, cx + 4, top, 7, 7, 3, ct.look.body);
      UI.hit(app, 'bh_' + k, cx, top - 2, bstep, 11, null, `${CC.TEXT.typeInfo[k].many} (${plan.filter(p => p.type === k).length} vandaag)`);
    });
    if (types.length) UI.hit(app, 'bh_all', bx0 - 2, top - 2, 2, 11, null, T.budgetHelp);
    R().rect(ctx, x + 10, top + 9, AW - 20, 1, P.cream1);
    const listed = SIM.listed(s).map(l => l.wine).filter((w, i, a) => a.indexOf(w) === i);
    let ry = top + 13;
    const rowH = listed.length > 7 ? 26 : 28;
    if (!listed.length) F().draw(ctx, 'Er staat nog niets op je schappen. Bestel eerst iets bij Ronnie.', x + 16, ry + 4, P.stone1);
    listed.forEach((w, i) => {
      if (UI.focusOn(app, w.id)) R().round(ctx, x + 8, ry - 2, AW - 16, rowH - 2, 4, `rgba(232,181,58,${UI.focusOn(app, w.id)})`);
      else if (i % 2 === 0) R().round(ctx, x + 8, ry - 2, AW - 16, rowH - 2, 4, P.cream3);
      R().bottleMid(ctx, x + 20, ry + 10, w);
      F().draw(ctx, w.name, x + 30, ry + 2, P.ink);
      const cur = s.prices[w.id], price = SIM.price(s, w.id), cost = CC.wineCost(w);
      F().draw(ctx, `inkoop ${R().euro(cost)} · marge ${R().euro(price - cost)}`, x + 30, ry + 12, P.stone1);
      C.priceStands.forEach((st, k) => {
        const p = CC.priceFor(w, st.id), on = cur === st.id;
        UI.btn(app, ctx, `pr_${w.id}_${st.id}`, x + 150 + k * 50, ry + 2, 46, 16, R().euro(p), () => app.setPrice(w.id, st.id),
          { active: on, tone: st.id === 'woeker' ? 'bord' : st.id === 'scherp' ? 'green' : 'wood', tip: st.id === 'woeker' ? T.woekerTip : `${st.name}: ${R().euro(p)} (marge ${R().euro(p - cost)} per fles)` });
      });
      types.forEach((k, j) => {
        const cs = plan.filter(p => p.type === k), ok = cs.filter(p => SIM.budgetOf(s, p) >= price).length, f = cs.length ? ok / cs.length : 0;
        const cx = bx0 + j * bstep + 2, bh = 16;
        R().rect(ctx, cx + 2, ry + 2, 7, bh, P.ink);
        R().rect(ctx, cx + 3, ry + 3, 5, bh - 2, P.cream1);
        const fh = Math.round((bh - 2) * f);
        R().rect(ctx, cx + 3, ry + 3 + (bh - 2 - fh), 5, fh, f >= 0.66 ? P.green3 : f >= 0.33 ? P.gold : P.red);
        UI.hit(app, `bb_${w.id}_${k}`, cx, ry, bstep, bh + 4, null, `${CC.TEXT.typeInfo[k].many}: ${ok} van de ${cs.length} kunnen ${R().euro(price)} betalen`);
      });
      ry += rowH;
    });
    F().wrap(T.pricesFoot, AW - 32).slice(0, 2).forEach((l, i) => F().draw(ctx, l, x + 16, y + AH - 40 + i * 10, P.stone1));
    // legenda van de balkjes: welk bolletje is welk klanttype
    let lx = x + 16; const ly = y + AH - 18;
    F().draw(ctx, 'Balkjes:', lx, ly, P.bord2); lx += F().width('Balkjes:') + 6;
    types.forEach(k => { const ct = CC.CUSTOMER_TYPES[k]; R().round(ctx, lx, ly - 1, 9, 9, 4, P.ink); R().round(ctx, lx + 1, ly, 7, 7, 3, ct.look.body); lx += 12; const nm = CC.TEXT.typeInfo[k].many; F().draw(ctx, nm, lx, ly, P.ink); lx += F().width(nm) + 10; });
  };

  CC.UI = UI;
})(typeof window !== 'undefined' ? window : globalThis);
