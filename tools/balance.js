// Château Cashflow — balanssimulatie (03_BOUWPLAN §3)
// Speelt complete runs van 8 weken met botstrategieën, met exact de regels van het spel.
// Bots bestellen zoals de speler: Ronnie zet elke ochtend een voorstel klaar (SIM.orderProposal),
// de bot past het aan in stappen van 6 en drukt op Bestellen (SIM.placeOrder). Besluit 70.
// Draaien: node tools/balance.js [runs] ['{"startCash":500}']
//   BOTS=advies,invest   alleen deze bots
//   STATS=1              extra kolommen (marge per dag, uitverkocht, personeel, week-1-krapte, kaarten)
//   NOCARDS=1            zonder weekkaarten en tegenvallers · NOMISHAP=1 · NOPICK=1
//   CARDS=oud            oude, simpele kaartwaardering (vergelijken)
//   REPAY=100,150,...    aflossing overschrijven
const path = require('path');
const src = f => require(path.join(__dirname, '..', 'src', f));
const CC = src('config.js'); src('texts.js'); src('font.js'); src('state.js'); src('sim.js'); src('render.js'); src('world.js');
const S = CC.SIM, DAY = CC.DAY, C = CC.CONFIG;
const RUNS = +process.argv[2] || 150;
const NOCARDS = !!process.env.NOCARDS;
const NOMISHAP = !!process.env.NOMISHAP, NOPICK = !!process.env.NOPICK;
const FREE = !!process.env.FREE;
const OLDCARDS = process.env.CARDS === 'oud';
const WISE = +(process.env.WISE || 0.5);   // investeren alleen met een buffer voor de volgende aflossing
if (process.env.UPC) { const u = JSON.parse(process.env.UPC); for (const k in u) CC.upgradeById(k).cost = u[k]; }
if (process.env.UPB) { const u = JSON.parse(process.env.UPB); for (const k in u) Object.assign(CC.upgradeById(k), u[k]); }
if (process.env.REPAY) C.repay = process.env.REPAY.split(',').map(Number);
if (process.argv[3]) Object.assign(C, JSON.parse(process.argv[3]));   // tunen zonder config te wijzigen

const byScore = ws => ws.sort((a, b) => score(b) - score(a));
// slim assortiment: de beste wijnen plus genoeg betaalbare voor buurtbewoners en koopjesjagers. Hoeveel? Dat leest de bot
// van de bon, zoals de speler: lopen er veel klanten weg met "te duur", dan komt er een goedkope wijn bij; bijna niemand, dan één minder.
function cheapSlots(s, slots) {
  if (!s) return 1;
  let n = s.botCheap || 1;
  const h = s.history[s.history.length - 1];
  if (h && h.customers && s.botCheapDay !== s.totals.days) {
    s.botCheapDay = s.totals.days;
    const f = h.tooExpensive / h.customers;
    if (f > 0.25) n++; else if (f < 0.08) n--;
  }
  return (s.botCheap = Math.max(1, Math.min(n, Math.floor(slots / 2))));
}
const smartPick = (ws, slots, s) => { const top = byScore(ws.slice()); const cheap = ws.filter(w => CC.wineCost(w) <= 5).sort((a, b) => CC.roleById(b.role).pop - CC.roleById(a.role).pop).slice(0, cheapSlots(s, slots)); return cheap.concat(top.filter(w => !cheap.includes(w))); };
// planner (slimme bots): kiest het assortiment met de hoogste verwachte marge voor de klanten van vandaag.
// De speler ziet dezelfde informatie in "Vandaag verwacht" (types en budget). Gulzig: schap voor schap de wijn die het meeste toevoegt.
function expDay(s, wines, plan, stand) {
  const c = C, q = c.qtyWeights.reduce((a, x) => a + x[0] * x[1], 0) / c.qtyWeights.reduce((a, x) => a + x[1], 0);
  let m = 0;
  for (const cu of plan) {
    const t = CC.CUSTOMER_TYPES[cu.type]; let best = null;
    for (const w of wines) {
      if (S.blocked(s, w)) continue;
      const role = CC.roleById(w.role), st = CC.standById(stand(w)), price = CC.priceFor(w, st.id);
      if (price > S.budgetOf(s, cu)) continue;
      const likes = (t.likes || []).some(x => (w.stijl || []).includes(x));
      const sc = role.pop * t.wPop + role.prest * t.wPrest + (likes ? c.prefBonus : 0) + S.duboisPush(s, t, role) + S.cardBonus(s, w) + S.upgradeBonus(s, w)
        - t.sens * (st.factor - 1.6) * c.pricePenaltyMul - (t.distrustBelow && price < t.distrustBelow ? 3 : 0);
      if (!best || sc > best.sc) best = { sc, w, price, role };
    }
    // kans dat hij koopt: ruis ±noise rond de drempel
    if (!best) continue;
    const pBuy = Math.max(0, Math.min(1, (best.sc - c.buyThreshold + c.noise) / (2 * c.noise)));
    m += pBuy * q * (best.price - CC.wineCost(best.w)) + pBuy * (c.repPerSale + (best.role.prest >= 3 ? c.repPrestigeBonus : 0)) * repVal(s);
  }
  return m;
}
const planPick = (ws, slots, s, stand) => {
  if (!s) return byScore(ws);
  const plan = S.planDay(s, S.dayRng(s)), chosen = [];
  // een lege wijn die je niet kunt bijkopen (schaars en op, of geen levering) jaagt klanten weg: niet op het schap
  const avail = w => S.totalBottles(s, w.id) + (S.deliveryBlocked(s) ? 0 : Math.min(24, S.scarceLeft(s, w.id)));
  let pool = ws.filter(w => avail(w) >= 3), cur = 0;
  while (chosen.length < slots && pool.length) {
    let best = null;
    for (const w of pool) { const v = expDay(s, chosen.concat([w]), plan, stand); if (!best || v > best.v) best = { w, v }; }
    if (best.v <= cur + 0.5 && chosen.length) break;   // voegt niets toe: schap leeg laten
    chosen.push(best.w); cur = best.v; pool = pool.filter(w => w !== best.w);
  }
  return chosen;
};
const stevig = w => (CC.roleById(w.role).pop >= 5 ? 'stevig' : 'normaal');
const BOTS = {
  goedkoop: { pick: ws => ws.filter(w => CC.wineCost(w) <= 6).sort((a, b) => CC.wineCost(a) - CC.wineCost(b)), stand: () => 'normaal', restock: 'vast' },
  // duur: alleen wijnen vanaf €8 inkoop zodra er minstens twee zijn; tot dan het duurste wat er is
  duur:     { pick: ws => { const d = ws.filter(w => CC.wineCost(w) >= 8); return (d.length >= 2 ? d : ws).sort((a, b) => CC.wineCost(b) - CC.wineCost(a)); }, stand: () => 'normaal', restock: 'vast' },
  // mix: verstandig assortiment, maar accepteert elke ochtend gewoon Ronnies voorstel (na dag 1: aanvullen tot 12)
  mix:      { pick: byScore, stand: () => 'normaal', restock: 'vast' },
  slim:     { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim' },
  advies:   { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0.8 },
  perfect:  { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 1.0 },
  gokker:   { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0.4 },
  // personeel: neemt aan zodra het kan (max staffMax), naast de advies-bot
  sem:      { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0.8, hire: ['sem'] },
  fatima:   { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0.8, hire: ['fatima'] },
  dubois:   { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0, hire: ['dubois'] },
  team:     { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0.8, hire: ['fatima', 'sem'] },
  // investeren (besluit 60): koopt upgrades als de kas het toelaat. = "goede speler die investeert" (doel 75–80%)
  invest:   { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0.8, invest: true },
  alles:    { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0.8, invest: true, hire: ['fatima', 'sem'] },
  koopgraag: { pick: (ws, n, s) => planPick(ws, n, s, stevig), stand: stevig, restock: 'slim', advice: 0.8, invest: true, investAll: true },
  lui:      { lazy: true },
};
function score(w) { const r = CC.roleById(w.role); return r.pop + r.prest + CC.wineCost(w) / 10; }

// ---------- Wat weet de bot over zijn eigen winkel? (alleen wat de speler ook ziet: de kassabonnen) ----------
function recent(s, n) { return s.history.slice(-n); }
function est(s) {
  const h = recent(s, 6).filter(x => x.customers > 0);
  const avg = f => (h.length ? h.reduce((a, x) => a + f(x), 0) / h.length : null);
  const mpd = avg(x => x.margin + (x.tips || 0)) ?? 60;          // marge per dag
  const cpd = avg(x => x.customers) ?? S.forecast(s).total;       // klanten per dag
  const rpd = avg(x => Math.max(0, x.rep)) ?? 10;                 // reputatie per dag
  const cogs = avg(x => x.cogs) ?? 70;                            // inkoopwaarde verkocht per dag
  const soldBy = {}; for (const x of h) for (const id in x.wines) soldBy[id] = (soldBy[id] || 0) + x.wines[id].sold;
  const sold = Object.values(soldBy).reduce((a, b) => a + b, 0) || 1;
  return { mpd, cpd, mpc: mpd / Math.max(1, cpd), rpd, cogs, soldBy, sold, days: h.length };
}
// Eén reputatiepunt in euro: vroeg in de run veel waard (niveaus = klanten + wijnen), op niveau 8 niets.
const repVal = s => (s.level >= C.levelRep.length ? 0 : s.week <= 3 ? 3 : s.week <= 6 ? 2 : 1);
// Marge per klant per type t.o.v. het gemiddelde (ruwe schatting uit budget en prijsgevoel)
const TYPE_F = { koopjes: 0.6, buurt: 1, liefhebber: 1.6, snob: 2.5 };

// ---------- Ochtend: bestellen zoals de speler ----------
// Ronnie stelt voor; de bot verschuift per wijn met −6/+6/+12 tot hij bij zijn wens zit, en past het aan zijn kas aan.
function botOrder(s, want, reserve) {
  const prop = S.orderProposal(s), order = {};
  for (const id in want) {
    const base = prop[id] || 0, need = want[id] - S.totalBottles(s, id);
    const k = Math.round((need - base) / 6);
    order[id] = Math.max(0, Math.min(base + 6 * k, S.scarceLeft(s, id)));
  }
  for (const id in prop) if (!(id in want)) order[id] = 0;   // wijn van het schap gehaald: niet meer bijbestellen
  // past het niet? dan per stap 6 flessen van de duurste wijn eraf (zoals de speler op −6 drukt).
  // Nooit helemaal stoppen met inkopen: zonder flessen geen omzet (anders raakt de bot in een spiraal die geen speler kiest).
  const full = S.orderCost(s, order);
  const budget = Math.max(s.cash - reserve, Math.min(s.cash - S.dailyCosts(s), full * 0.6));
  const ids = Object.keys(order).sort((a, b) => CC.wineCost(CC.wineById(b)) - CC.wineCost(CC.wineById(a)));
  let guard = 200, trimmed = false;
  while (S.orderCost(s, order) > Math.max(0, budget) && guard--) {
    const id = ids.find(x => order[x] > 0 && CC.wineCost(CC.wineById(x)) > 3.5) || ids.find(x => order[x] > 0);
    if (!id) break;
    order[id] = Math.max(0, order[id] - 6); trimmed = true;
  }
  const total = Object.values(order).reduce((a, b) => a + b, 0);
  if (total > 0) S.placeOrder(s, order);
  return { total, trimmed };
}

// Wat levert een investering per dag op? (schatting zoals een speler die maakt: extra klanten × marge per klant,
// of voor een kast: hoeveel meer marge de beste 2 extra wijnen geven bij de klanten van vandaag)
function investGain(s, id, e, bot) {
  const u = CC.upgradeById(id);
  if (u.cust) return u.cust * e.mpc;
  if (id === 'kast3' || id === 'kast4') {
    const plan = S.planDay(s, S.dayRng(s)), n = S.activeVakIds(s).length, ws = S.unlockedWines(s);
    const now = expDay(s, planPick(ws.slice(), n, s, stevig), plan, stevig);
    const more = expDay(s, planPick(ws.slice(), n + 2, s, stevig), plan, stevig);
    return Math.max(0, more - now);
  }
  return 0.05 * e.mpd;
}
function botDay(s, bot, lastSold, e) {
  if (bot.lazy) {
    if (s.week === 1 && s.day === 0) S.placeOrder(s, { wine_merlot: 12, wine_sauvignon: 12 });
    return;
  }
  const due = S.weekDue(s);
  if (bot.invest || FREE) {
    const order = (process.env.ORDER || (bot.investAll ? 'kast3,vitrine,koeling,uithangbord,kast4' : 'kast3,uithangbord,kast4')).split(',');
    for (const id of order) {
      const u = CC.upgradeById(id);
      if (S.owns(s, id) || !S.upgradeUnlocked(s, id)) continue;
      if (FREE) { s.upgrades[id] = true; continue; }
      if (bot.investAll || process.env.INVEST === 'oud') {   // koopgraag: kopen zodra er een buffer is (oude regel)
        if (s.cash >= u.cost + due + S.costsLeft(s) + 100 + (C.repay[s.week] || 0) * WISE) S.buyUpgrade(s, id);
        continue;
      }
      // slim investeren: terugverdiend vóór het einde van de lening, en er blijft genoeg over voor voorraad en de zondag
      const daysLeft = (C.repay.length - s.week) * C.daysPerWeek + (C.daysPerWeek - s.day);
      const gain = investGain(s, id, e, bot);
      const reserveAfter = Math.max(0, due + S.costsLeft(s) - (C.daysPerWeek - s.day) * e.mpd * 0.75) + e.cogs * 1.5 + (C.repay[s.week] || 0) * 0.3;
      if (gain * daysLeft >= 1.5 * u.cost && s.cash - u.cost >= reserveAfter) S.buyUpgrade(s, id);
    }
    if (S.owns(s, 'vitrine')) { const l = S.listed(s).map(x => x.wine).sort((a, b) => (CC.wineCost(b) * 0.6 * ((lastSold || {})[b.id] || 1)) - (CC.wineCost(a) * 0.6 * ((lastSold || {})[a.id] || 1))); S.setVitrine(s, l[0] ? l[0].id : null); }
  }
  // aannemen zodra het kan én de kas het loon ook na de zondag nog draagt
  for (const id of bot.hire || []) if (!S.hired(s, id) && S.staffUnlocked(s, id) && s.cash > due + S.costsLeft(s) + CC.STAFF[id].wage * 6 + 250) S.hire(s, id);
  const vaks = S.activeVakIds(s);
  const wines = bot.pick(S.unlockedWines(s).slice(), vaks.length, s).slice(0, vaks.length);
  // klus-bewust (zoals een speler die de klus ziet): klus-wijn op het schap, bij 'verschillende wijnen' alle schappen vol
  for (const k of bot.restock === 'slim' ? S.klusOpen(s) : []) {
    const kd = S.klusDef(k.lvl);
    if (kd.kind === 'wine') for (const id of kd.wines) { const w = CC.wineById(id); if (S.unlockedWines(s).includes(w) && !wines.includes(w)) { if (wines.length >= vaks.length) wines.pop(); wines.push(w); } }
    if (kd.kind === 'variety') for (const w of byScore(S.unlockedWines(s).slice())) if (wines.length < vaks.length && !wines.includes(w)) wines.push(w);
  }
  vaks.forEach((v, i) => { const w = wines[i]; if (w && s.vakken[v].wine !== w.id) S.assignVak(s, v, w.id); });
  for (const w of wines) S.setPrice(s, w.id, bot.stand(w));
  // reserve voor de zondag: aflossing + huur en loon tot en met zaterdag, min wat de rest van de week (voorzichtig) oplevert
  const daysLeft = C.daysPerWeek - s.day;
  const reserve = Math.max(0, due + S.costsLeft(s) - daysLeft * e.mpd * 0.75);
  const want = {};
  for (const w of wines) {
    const cap = S.hired(s, 'sem') ? 36 : 24;   // met Sem mag er meer in het magazijn: hij vult overdag bij
    // slim: wat er gisteren verkocht is, plus wie er naast greep ("uitverkocht" op de bon), met wat marge
    const yest = s.history.length ? (s.history[s.history.length - 1].wines[w.id] || {}) : {};
    const demand = (lastSold[w.id] || 4) + (yest.soldOut || 0) * 1.5;
    want[w.id] = bot.restock === 'slim' ? Math.min(cap, Math.ceil(demand * (S.hired(s, 'sem') ? 1.6 : 1.3)) + 4) : 12;
  }
  // bruiloft deze week: vanaf woensdag 24 flessen mousserend extra in huis. Het bruidspaar haalt ze op als de winkel
  // vrijdag opengaat (A3), dus op vrijdagochtend bestelt de bot de opdracht bovenop de gewone verkoop van die dag.
  const card = s.card && s.card.week === s.week ? CC.cardById(s.card.id) : null;
  if (card && card.order && !s.card.orderDone && s.day >= card.order.day - 2 && s.day <= card.order.day) {
    const bub = S.unlockedWines(s).filter(w => S.cardMatch(card.order.match, w)).sort((a, b) => CC.wineCost(a) - CC.wineCost(b))[0];
    if (bub) want[bub.id] = s.day === card.order.day ? (want[bub.id] || 0) + card.order.n
      : Math.max(want[bub.id] || 0, card.order.n + (lastSold[bub.id] || 0) + (s.day === card.order.day - 1 ? 2 : 6));
  }
  const r = botOrder(s, want, reserve);
  if (s.week === 1) STAT.w1Short += r.trimmed ? 1 : 0;
}

// Adviesmomenten (M4) via de echte flow in world.js: met kans p het goede antwoord, anders een fout antwoord.
// Bots zonder advice negeren de vragen (klant kiest dan zelf, zoals in het spel).
function adviceBot(p) {
  return (ask, s, rng) => {
    const good = S.adviceGood(s, ask.q);
    const right = ask.opts.find(id => good.includes(id));
    if (rng() < p) return right || null;
    const wrong = ask.opts.find(id => !good.includes(id));
    return good.length ? (wrong || null) : (ask.opts[0] || null);
  };
}

// ---------- Zondag: een kaart kiezen ----------
// Slimme waardering in euro's (besluit 70): wat levert de kaart deze winkel volgende week op?
// Gebruikt alleen wat de speler ook weet: de bonnen van deze week, het assortiment, de kas.
function cardValue(s, id, e) {
  const c = CC.cardById(id);
  const listed = S.listed(s).map(l => l.wine);
  const days = c.days ? c.days.length : C.daysPerWeek;
  const rv = repVal(s);
  const unlockedT = Object.keys(CC.CUSTOMER_TYPES).filter(k => CC.CUSTOMER_TYPES[k].minLevel <= s.level + (s.rep >= (C.levelRep[s.level] || 1e9) ? 1 : 0));
  if (c.cost && s.cash - c.cost < 120) return -999;   // niet genoeg lucht
  let v = 0;
  // extra klanten; wie er komt, telt mee (koopjesjagers leveren minder op)
  let tf = 1;
  if (c.types) { const ks = Object.keys(c.types).filter(k => unlockedT.includes(k)); if (ks.length) tf = ks.reduce((a, k) => a + TYPE_F[k], 0) / ks.length; }
  v += (c.cust || 0) * days * e.mpc * tf;
  if (c.custMul) v += (c.custMul - 1) * e.cpd * days * e.mpc * tf;
  // andere klantmix zonder extra klanten
  if (c.types && !c.cust && !c.custMul) for (const k in c.types) if (unlockedT.includes(k)) v += (c.types[k] - 1) * 0.12 * e.cpd * days * e.mpc * (TYPE_F[k] - 1);
  // trend: passende wijnen op je schap verkopen beter
  if (c.match && c.bonus) {
    const n = listed.filter(w => S.cardMatch(c.match, w)).length;
    v += c.bonus * e.cpd * days * e.mpc * 0.06 * Math.min(n, 2);
  }
  if (c.rep) v += (c.rep - 1) * e.rpd * days * rv;
  if (c.discount) v += c.discount * e.cogs * C.daysPerWeek * 1.1;
  if (c.box) {   // doos: verwachte waarde van 12 flessen van een willekeurige wijn (gewogen naar goedkoop)
    const ws = S.unlockedWines(s), wts = ws.map(w => 1 / Math.sqrt(CC.wineCost(w))), tot = wts.reduce((a, b) => a + b, 0);
    v += ws.reduce((a, w, i) => a + wts[i] / tot * c.box * CC.wineCost(w) * (listed.includes(w) ? 1.5 : 0.7), 0);
  }
  if (c.order) {   // bruiloft: kan ik die flessen op tijd in huis hebben?
    const bub = S.unlockedWines(s).filter(w => S.cardMatch(c.order.match, w)).sort((a, b) => CC.wineCost(a) - CC.wineCost(b))[0];
    if (!bub) v += c.order.repFail * rv * 3;
    else {
      const need = c.order.n * CC.wineCost(bub), room = s.cash + e.mpd * 3 - (C.repay[s.week] || 0) * 0.5 - need;
      v += room < 0 ? c.order.repFail * rv * 3 : c.order.n * (CC.priceFor(bub, 'normaal') - CC.wineCost(bub)) + (c.order.bonus || 0) + c.order.rep * rv;
    }
  }
  return v - (c.cost || 0);
}
function botCardOld(s, ids) {
  const listed = S.listed(s).map(l => l.wine);
  const val = id => {
    const c = CC.cardById(id);
    if (c.cost && s.cash < c.cost + S.weekDue(s) + 50) return -1;
    let v = (c.cust || 0) * 6 * (c.days ? c.days.length : 6) / 6;
    if (c.custMul) v += (c.custMul - 1) * 25;
    if (c.match) v += listed.filter(w => S.cardMatch(c.match, w)).length * 8;
    if (c.box) v += 10;
    if (c.rep) v += 12;
    return v - (c.cost || 0) * 0.1;
  };
  return ids.slice().sort((a, b) => val(b) - val(a))[0];
}
function botCard(s, ids, rng, e) {
  const best = OLDCARDS ? botCardOld(s, ids) : ids.slice().sort((a, b) => cardValue(s, b, e) - cardValue(s, a, e))[0];
  STAT.cards[best] = (STAT.cards[best] || 0) + 1;
  S.chooseCard(s, best, rng);
}

// ---------- Maandag: tegenvaller ----------
// Betalen als het ongemak (in euro's) meer kost dan de rekening en er lucht is; gokken als dat gemiddeld goedkoper is.
function mishapLoss(s, eff, e, lastSold) {
  if (!eff) return 0;
  const d = eff.days ? eff.days.length : C.daysPerWeek;
  let loss = 0;
  if (eff.custMul) loss += (1 - eff.custMul) * e.mpd * d;
  if (eff.closed) loss += e.mpd * d + e.rpd * d * repVal(s);
  if (eff.block) { const share = Object.keys(e.soldBy).filter(id => S.cardMatch(eff.block, CC.wineById(id))).reduce((a, id) => a + e.soldBy[id], 0) / e.sold; loss += share * e.mpd * d * 0.7; }
  if (eff.noDelivery) {
    const perDay = Object.values(lastSold || {}).reduce((a, b) => a + b, 0) || e.sold / Math.max(1, e.days);
    const have = S.listed(s).reduce((a, l) => a + S.totalBottles(s, l.wine.id), 0);
    loss += have >= perDay * (d + 0.5) ? e.mpd * 0.1 : e.mpd * 0.7 * d;
  }
  if (eff.gamble) loss += eff.gamble.chance * eff.gamble.cost;
  return loss;
}
function botMishap(s, rng, e, lastSold) {
  if (!s.mishap || s.mishap.choice) return;
  const m = CC.cardById(s.mishap.id);
  const lossB = mishapLoss(s, m.b, e, lastSold);
  const costA = (m.a.cost || 0) + mishapLoss(s, Object.assign({}, m.a, { cost: 0 }), e, lastSold);
  // betalen is alleen onverstandig als je de rekening vandaag niet kunt dragen: het ongemak kost je immers méér
  const room = s.cash - (m.a.cost || 0) - S.dailyCosts(s) * 2;
  const choice = costA < lossB && room >= 0 ? 'a' : 'b';
  S.decideMishap(s, choice, rng);
}

let KOERS = {}; let STAT;
function run(botName, seed) {
  const s = CC.newState(seed); const bot = BOTS[botName];
  let lastSold = {}, w1min = Infinity;
  while (s.status === 'playing') {
    const e = est(s);
    if (!NOCARDS && !bot.lazy) botMishap(s, CC.makeRng(s), e, lastSold);
    else if (s.mishap && !s.mishap.choice) S.decideMishap(s, 'b', CC.makeRng(s));
    for (s.day = 0; s.day < C.daysPerWeek; s.day++) {
      S.refill(s);
      botDay(s, bot, lastSold, est(s));
      const ord = S.settleOrder(s);   // bruiloft: zoals in het spel, als de winkel opengaat (na het bestellen, A3)
      if (ord) { STAT.orders++; if (ord.ok) STAT.ordersOk++; }
      if (s.week === 1) w1min = Math.min(w1min, s.cash);
      const d = DAY.start(s);
      if (bot.advice) d.autoAdvice = adviceBot(bot.advice);   // advice 0/leeg = negeren (Dubois neemt het over als hij er is)
      DAY.finish(d, s);
      STAT.days++; STAT.profit = (STAT.profit || 0) + (d.log.revenue - d.log.cogs); STAT.soldOut += d.log.soldOut; STAT.sem += d.log.semRefill || 0; STAT.fatima += d.log.fatima || 0; STAT.dubois += (d.log.advice && d.log.advice.dubois) || 0;
      const lv0 = s.level;
      const sm = S.endDay(s, d.log);
      if (s.level > lv0) for (let L = lv0 + 1; L <= s.level; L++) (STAT.lvDay[L] = STAT.lvDay[L] || []).push((s.week - 1) * C.daysPerWeek + s.day + 1);
      for (const k of sm.klusDone || []) { if (k.wk) { STAT.wkDone++; STAT.wkDoneBy[k.wk] = (STAT.wkDoneBy[k.wk] || 0) + 1; } else STAT.klus[k.lvl] = (STAT.klus[k.lvl] || 0) + 1; }
      for (const id in sm.work || {}) { STAT.xp[id] = (STAT.xp[id] || 0) + sm.work[id].xp; STAT.xpd[id] = (STAT.xpd[id] || 0) + 1; STAT.gain[id] = (STAT.gain[id] || 0) + (sm.work[id].margin || 0); }
      STAT.upg += ((sm.src || {}).upg || {}).margin || 0;
      STAT.wages += S.wages(s);
      lastSold = d.log.perWine;
    }
    const r = S.payWeek(s);
    if (!r.ok) { if (!S.postpone(s).ok) { S.bankrupt(s); return { win: false, week: s.week, level: s.level, cash: s.cash, w1min }; } STAT.postponed++; }
    if (S.onCourse) { const oc = S.onCourse(s); if (oc && s.week >= 3 && s.week <= 7) (KOERS[s.week] = KOERS[s.week] || []).push([oc.state, s]); }
    if (r.won) return { win: true, week: 8, level: s.level, cash: s.cash, w1min, rep8: s.level >= C.levelRep.length ? s.rep - C.levelRep[C.levelRep.length - 1] : null };
    if (!NOCARDS && !NOPICK && !bot.lazy) botCard(s, S.offerCards(s, CC.makeRng(s)), CC.makeRng(s), est(s));
    S.startWeek(s); if (s.weekKlus) { STAT.wkOffered++; STAT.wkBy[s.weekKlus.id] = (STAT.wkBy[s.weekKlus.id] || 0) + 1; if (!S.weekKlusOk || !S.weekKlusOk(s, s.weekKlus)) STAT.wkBad++; }
    if (NOCARDS || NOMISHAP) s.mishap = null;
  }
}

console.log(`Balans: ${RUNS} runs per bot · start €${C.startCash} · aflossing ${C.repay.join('/')} · huur €${C.rent}/dag${OLDCARDS ? ' · oude kaartkeuze' : ''}\n`);
console.log('bot        winst%  eindkas(med)  niveau(med)  failliet in week (verdeling)');
const ONLY = process.env.BOTS ? process.env.BOTS.split(',') : Object.keys(BOTS);
for (const name of ONLY) {
  STAT = { days: 0, soldOut: 0, sem: 0, fatima: 0, dubois: 0, wages: 0, w1Short: 0, orders: 0, ordersOk: 0, postponed: 0, wkDone: 0, wkOffered: 0, wkBy: {}, wkDoneBy: {}, wkBad: 0, cards: {}, xp: {}, xpd: {}, gain: {}, upg: 0, lvDay: {}, klus: {} };
  KOERS = {};
  const res = []; for (let i = 0; i < RUNS; i++) res.push(run(name, 1000 + i));
  if (process.env.KOERS) {   // B3: wat zei de meter op zondag van week 3–7, tegenover hoe het afliep
    const line = [];
    for (const w in KOERS) {
      const t = {}; for (const [st, ss] of KOERS[w]) { const k = st + (ss.status === 'won' ? '+' : '-'); t[k] = (t[k] || 0) + 1; }
      line.push(`wk${w} ` + ['ruim', 'krap', 'weinig'].map(st => `${st} ${t[st + '+'] || 0}w/${t[st + '-'] || 0}v`).join(' '));
    }
    console.log(`  koers ${name}: ` + line.join(' | '));
  }
  const wins = res.filter(r => r.win);
  const med = a => { if (!a.length) return '-'; a = a.slice().sort((x, y) => x - y); return Math.round(a[a.length >> 1]); };
  const fails = {}; res.filter(r => !r.win).forEach(r => fails[r.week] = (fails[r.week] || 0) + 1);
  const topCards = Object.entries(STAT.cards).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k} ${n}`).join(', ');
  console.log(`${name.padEnd(10)} ${String(Math.round(100 * wins.length / RUNS)).padStart(5)}%  ${String(med(wins.map(r => r.cash))).padStart(12)}  ${String(med(res.map(r => r.level))).padStart(11)}  ${JSON.stringify(fails)}` + (process.env.STATS ? `  · marge/dag €${Math.round(STAT.profit / STAT.days)} · loon/dag €${Math.round(STAT.wages / STAT.days)} · uitverkocht ${(STAT.soldOut / STAT.days).toFixed(1)}/dag · laagste kas wk1 (med) €${med(res.map(r => r.w1min))} · wk1 ingekort ${(STAT.w1Short / RUNS).toFixed(1)} dag · uitstel ${Math.round(100 * STAT.postponed / RUNS)}% · bruiloft ${STAT.ordersOk}/${STAT.orders} · kaarten: ${topCards}` + (Object.keys(STAT.xp).length ? ' · XP/dag ' + Object.keys(STAT.xp).map(k => `${k} ${(STAT.xp[k] / STAT.xpd[k]).toFixed(1)} (+€${Math.round(STAT.gain[k] / STAT.xpd[k])})`).join(', ') : '') + ` · extra klanten investeringen +€${Math.round(STAT.upg / STAT.days)}/dag` + ` · rep boven niv. 8 bij winst (med) ${med(wins.filter(r => r.rep8 != null).map(r => r.rep8))}` + ' · niveau op dag (med) ' + [2, 3, 4, 5, 6, 7, 8].map(L => `${L}:${STAT.lvDay[L] ? med(STAT.lvDay[L]) : '-'}`).join(' ') + ' · klus gehaald ' + [1, 2, 3, 4, 5, 6, 7, 8].map(L => `${L}:${Math.round(100 * (STAT.klus[L] || 0) / RUNS)}%`).join(' ') + ` · weekklus ${STAT.wkDone}/${STAT.wkOffered} (` + Object.keys(STAT.wkBy).sort().map(k => `${k.slice(3)} ${STAT.wkDoneBy[k] || 0}/${STAT.wkBy[k]}`).join(', ') + `; voorwaarde geschonden ${STAT.wkBad})` : ''));
}
