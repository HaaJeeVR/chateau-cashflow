// Château Cashflow — sim.js
// Spelregels zonder beeld. Wordt ook door tools/balance.js (node) gebruikt.
(function (root) {
  const CC = root.CC = root.CC || {};
  const C = () => CC.CONFIG;

  const SIM = {};

  // ---------- Beschikbaarheid ----------
  SIM.activeFurniture = function (s) { return CC.FURNITURE.filter(f => f.level <= s.level && (!f.upgrade || SIM.owns(s, f.upgrade))); };
  SIM.owns = function (s, id) { return !!(s.upgrades && s.upgrades[id]); };
  SIM.activeVakIds = function (s) {
    const ids = [];
    for (const f of SIM.activeFurniture(s)) if (f.vakken) ids.push(...f.vakken);
    return ids;
  };
  SIM.unlockedWines = function (s) {
    return CC.WINES.filter(w => CC.roleById(w.role).unlock <= s.level);
  };
  SIM.vakOfWine = function (s, wineId) {
    return SIM.activeVakIds(s).find(v => s.vakken[v].wine === wineId) || null;
  };
  // Wijnen die op een schap staan (ook als het vak leeg is: dan is hij 'uitverkocht')
  SIM.listed = function (s) {
    const out = [];
    for (const v of SIM.activeVakIds(s)) {
      const vk = s.vakken[v];
      if (vk.wine) out.push({ vak: v, wine: CC.wineById(vk.wine), n: vk.n });
    }
    return out;
  };
  SIM.onShelf = function (s, wineId) {
    let n = 0;
    for (const v of SIM.activeVakIds(s)) if (s.vakken[v].wine === wineId) n += s.vakken[v].n;
    return n;
  };
  SIM.price = function (s, wineId) { return CC.priceFor(CC.wineById(wineId), s.prices[wineId]); };

  // ---------- Voorbereiden ----------
  // Inkoopprijs vandaag (kaart "Ronnie heeft een partij over": korting)
  SIM.buyPrice = function (s, w) {
    let d = s.orderDiscount || 0;   // B1: korting uit een weekklus, eenmalig (de grootste korting telt)
    for (const e of SIM.effects(s)) d = Math.max(d, e.discount || 0);
    return Math.round(CC.wineCost(w) * (1 - d) * 100) / 100;
  };
  // Levert Ronnie vandaag? (tegenvaller "parkeerhandhaving")
  SIM.deliveryBlocked = function (s) { return SIM.effects(s).some(e => e.noDelivery); };
  SIM.buy = function (s, wineId, n) {
    const w = CC.wineById(wineId);
    const cost = SIM.buyPrice(s, w) * n;
    if (n <= 0) return { ok: false, reason: 'n' };
    if (SIM.deliveryBlocked(s)) return { ok: false, reason: 'blocked' };
    if (cost > s.cash + 1e-9) return { ok: false, reason: 'cash' };
    if (n > SIM.scarceLeft(s, wineId)) return { ok: false, reason: 'scarce' };
    s.weekBought = s.weekBought || {};
    s.weekBought[wineId] = (s.weekBought[wineId] || 0) + n;
    s.cash -= cost;
    s.dayBuy = (s.dayBuy || 0) + cost;
    s.stock[wineId] = (s.stock[wineId] || 0) + n;
    SIM.refill(s);
    return { ok: true, cost };
  };

  // Schaars: max N flessen per week inkopen (rol.scarce). Oneindig als de rol niet schaars is.
  SIM.scarceLeft = function (s, wineId) {
    const r = CC.roleById(CC.wineById(wineId).role);
    if (!r.scarce) return Infinity;
    return Math.max(0, r.scarce - ((s.weekBought || {})[wineId] || 0));
  };

  // Vak aan een wijn toewijzen (of leegmaken met null). Flessen gaan terug naar het magazijn.
  SIM.assignVak = function (s, vakId, wineId) {
    const vk = s.vakken[vakId];
    if (vk.wine && vk.n) s.stock[vk.wine] = (s.stock[vk.wine] || 0) + vk.n;
    vk.wine = wineId || null; vk.n = 0;
    SIM.refill(s);
  };

  // Vakken aanvullen uit het magazijn (buiten de verkoopdag altijd automatisch).
  SIM.refill = function (s) {
    for (const v of SIM.activeVakIds(s)) {
      const vk = s.vakken[v];
      if (!vk.wine) continue;
      const room = C().vakCapacity - vk.n;
      const avail = s.stock[vk.wine] || 0;
      const take = Math.min(room, avail);
      if (take > 0) { vk.n += take; s.stock[vk.wine] = avail - take; }
    }
  };

  SIM.setPrice = function (s, wineId, standId) { s.prices[wineId] = standId; };

  SIM.totalBottles = function (s, wineId) { return (s.stock[wineId] || 0) + SIM.onShelf(s, wineId); };

  // ---------- Verkoopdag ----------
  SIM.customerCount = function (s, rng) { return SIM.customerParts(s, rng).n; };
  // Aantal klanten, met hoeveel er dankzij Sem (folders) en je investeringen (uithangbord, kasten) komen.
  // Die extra klanten worden in planDay gemarkeerd, zodat de bon kan laten zien wat ze opleverden (besluit 72).
  SIM.customerParts = function (s, rng) {
    const c = C();
    const j = Math.round((rng() * 2 - 1) * c.customersJitter);
    const semLv = SIM.staffLevel ? SIM.staffLevel(s, 'sem') : 0;
    const sem = semLv ? c.semCustomers[semLv - 1] : 0, upg = SIM.upgradeCustomers(s);
    const raw = Math.max(1, c.customersBase + c.customersPerLevel * (s.level - 1) + j + sem + upg);
    const n = SIM.cardCustomers(s, raw), k = raw ? n / raw : 0;
    return { n, sem: Math.round(sem * k), upg: Math.round(upg * k) };
  };

  SIM.pickType = function (s, rng) {
    const types = Object.keys(CC.CUSTOMER_TYPES).filter(k => CC.CUSTOMER_TYPES[k].minLevel <= s.level);
    const wt = k => CC.CUSTOMER_TYPES[k].weight * SIM.typeMul(s, k);
    const total = types.reduce((a, k) => a + wt(k), 0);
    let r = rng() * total;
    for (const k of types) { r -= wt(k); if (r <= 0) return k; }
    return types[types.length - 1];
  };

  // Eigen RNG per dag (seed + week + dag): de klanten van vandaag liggen vast zodra de dag begint,
  // zodat de prognose tijdens het voorbereiden precies klopt (besluit 57).
  SIM.dayRng = function (s) { return CC.makeRng({ rng: ((s.seed >>> 0) * 31 + s.week * 1009 + s.day * 97 + 7) >>> 0 }); };
  SIM.forecast = function (s) {
    const plan = SIM.planDay(s, SIM.dayRng(s));
    const counts = {};
    for (const p of plan) counts[p.type] = (counts[p.type] || 0) + 1;
    return { total: plan.length, counts };
  };

  SIM.planDay = function (s, rng) {
    const parts = SIM.customerParts(s, rng), n = parts.n;
    // extra klanten (Sem, investeringen) gelijkmatig over de dag verdelen
    const src = {}, extra = Math.min(n, parts.sem + parts.upg);
    for (let e = 0; e < extra; e++) src[Math.min(n - 1, Math.floor((e + 0.5) * n / extra))] = e < parts.sem ? 'sem' : 'upg';
    const list = [];
    for (let i = 0; i < n; i++) {
      const type = SIM.pickType(s, rng);
      const t = CC.CUSTOMER_TYPES[type];
      const budget = t.budget[0] + rng() * (t.budget[1] - t.budget[0]);
      const at = (i + rng() * 0.8) * (C().spawnWindow / n);
      list.push({ id: i, type, budget: Math.round(budget * 2) / 2, at, src: src[i] || null });
    }
    list.sort((a, b) => a.at - b.at);
    return list;
  };

  // Klantbeslissing (01_ONTWERP §6). Geeft ook de afweging terug voor het debuglog.
  SIM.decide = function (s, cust, rng) {
    const c = C();
    const t = CC.CUSTOMER_TYPES[cust.type];
    const listed = SIM.listed(s);
    const scored = [];
    for (const L of listed) {
      const w = L.wine; const role = CC.roleById(w.role);
      if (SIM.blocked(s, w)) continue;   // tegenvaller: bv. koeling stuk
      const stand = CC.standById(s.prices[w.id]);
      const price = CC.priceFor(w, stand.id);
      const likes = (t.likes || []).some(st => (w.stijl || []).includes(st));
      const base = role.pop * t.wPop + role.prest * t.wPrest + (likes ? c.prefBonus : 0) + (rng() * 2 - 1) * c.noise + SIM.duboisPush(s, t, role) + SIM.cardBonus(s, w) + SIM.upgradeBonus(s, w);
      const penalty = t.sens * (stand.factor - 1.6) * c.pricePenaltyMul + (t.distrustBelow && price < t.distrustBelow ? 3 : 0);
      scored.push({ wine: w, price, base, score: base - penalty, affordable: price <= SIM.budgetOf(s, cust), n: SIM.onShelf(s, w.id) });
    }
    const log = scored.map(x => `${x.wine.name} €${x.price} s=${x.score.toFixed(1)}${x.affordable ? '' : ' (budget)'}`);
    if (!scored.length) return { action: 'leave', reason: 'nothing', log };
    const affordable = scored.filter(x => x.affordable);
    if (!affordable.length) return { action: 'leave', reason: 'tooExpensive', log };
    affordable.sort((a, b) => b.score - a.score);
    const best = affordable[0];
    if (best.score < c.buyThreshold) {
      // Zou hij zonder prijsopslag wél kopen? Dan is het de prijs.
      // wineId = de wijn die hij zonder prijsopslag had gekocht (voor de statistiek per wijn)
      const byBase = affordable.reduce((a, b) => (b.base > a.base ? b : a));
      return byBase.base >= c.buyThreshold ? { action: 'leave', reason: 'tooExpensive', wineId: byBase.wine.id, log } : { action: 'leave', reason: 'nothing', log };
    }
    let pick = best, missed = null;
    if (best.n <= 0) {
      // Favoriet uitverkocht: met kans secondChoice pakt hij de beste andere die nog staat (en nog boven de drempel zit).
      const alt = affordable.find(x => x.n > 0 && x.score >= c.buyThreshold);
      if (!alt || rng() >= c.secondChoice) return { action: 'leave', reason: 'soldOut', wineId: best.wine.id, log };
      pick = alt; missed = best.wine.id;
    }
    // aantal flessen
    let r = rng() * c.qtyWeights.reduce((a, q) => a + q[1], 0); let qty = 1;
    for (const [q, wt] of c.qtyWeights) { r -= wt; if (r <= 0) { qty = q; break; } }
    return { action: 'buy', wineId: pick.wine.id, qty, price: pick.price, missed, log };
  };

  // Flessen uit het schap pakken (kan minder zijn als iemand anders net was).
  SIM.take = function (s, wineId, qty) {
    let got = 0;
    for (const v of SIM.activeVakIds(s)) {
      const vk = s.vakken[v];
      if (vk.wine !== wineId || got >= qty) continue;
      const t = Math.min(vk.n, qty - got);
      vk.n -= t; got += t;
    }
    return got;
  };

  SIM.newDayLog = function () {
    return { revenue: 0, cogs: 0, bottles: 0, customers: 0, buyers: 0, soldOut: 0, tooExpensive: 0, nothing: 0, adviceLeft: 0, perWine: {}, wines: {}, types: {}, src: {}, vitrine: 0, koeling: 0, duboisPush: 0 };
  };
  // Statistiek per wijn en per klanttype (voor de kassabon en het 'Gisteren'-overzicht)
  const wStat = (log, id) => (log.wines[id] = log.wines[id] || { sold: 0, rev: 0, margin: 0, tooExpensive: 0, soldOut: 0 });
  const tStat = (log, t) => (log.types[t] = log.types[t] || { n: 0, buyers: 0, bottles: 0, tooExpensive: 0, soldOut: 0, nothing: 0, adviceLeft: 0 });
  // Wat leverde een bron op? src = 'sem' | 'upg' (extra klanten) | 'fatima' (tweede kans) | 'dubois' (advies van Dubois)
  const sStat = (log, k) => ((log.src = log.src || {})[k] = log.src[k] || { n: 0, buyers: 0, bottles: 0, margin: 0 });
  SIM.recordVisit = function (log, type, src) { log.customers++; if (type) tStat(log, type).n++; if (src) sStat(log, src).n++; };

  SIM.paySale = function (s, log, wineId, qty, price, type, src) {
    const w = CC.wineById(wineId);
    const rev = qty * price;
    const mg = rev - qty * CC.wineCost(w);
    if (src) { const x = sStat(log, src); x.buyers++; x.bottles += qty; x.margin += mg; }
    // investeringen en Dubois zichtbaar maken op de bon
    if (SIM.owns(s, 'vitrine') && s.vitrine === wineId) log.vitrine = (log.vitrine || 0) + qty;
    if (SIM.owns(s, 'koeling') && SIM.cardMatch(CC.upgradeById('koeling').match, w)) log.koeling = (log.koeling || 0) + qty;
    const t = type && CC.CUSTOMER_TYPES[type];
    if (t && SIM.duboisPush(s, t, CC.roleById(w.role)) > 0) { log.duboisPush = (log.duboisPush || 0) + qty; log.duboisMargin = (log.duboisMargin || 0) + mg; }
    s.cash += rev;
    // reputatie: per verkoop, bonus voor prestige, straf voor woeker
    const pSale = C().repPerSale, pPrest = CC.roleById(w.role).prest >= 3 ? C().repPrestigeBonus : 0, pWoeker = s.prices[wineId] === 'woeker' ? C().repWoeker : 0;
    let dr = pSale + pPrest + pWoeker;
    const mul = dr > 0 ? SIM.repMul(s) : 1;   // proeverij, buurtapp
    dr *= mul;
    s.rep = Math.max(0, s.rep + dr); log.rep = (log.rep || 0) + dr;
    // uitsplitsing voor het dagrapport (besluit 76): waar komt je reputatie vandaan?
    const rp = log.repParts = log.repParts || {};
    rp.sale = (rp.sale || 0) + pSale * mul; if (pPrest) rp.prestige = (rp.prestige || 0) + pPrest * mul; if (pWoeker) rp.woeker = (rp.woeker || 0) + pWoeker * mul;
    log.lastRep = dr;
    if (log.types && type) tStat(log, type).bottles += qty;
    log.revenue += rev; log.cogs += qty * CC.wineCost(w); log.bottles += qty; log.buyers++;
    log.perWine[wineId] = (log.perWine[wineId] || 0) + qty;
    if (log.wines) { const ws = wStat(log, wineId); ws.sold += qty; ws.rev += rev; ws.margin += rev - qty * CC.wineCost(w); }
    if (log.types && type) tStat(log, type).buyers++;
    s.totals.revenue += rev; s.totals.bottles += qty;
    return rev;
  };

  SIM.recordLeave = function (log, reason, wineId, type) {
    if (reason in log) log[reason]++;
    if (log.wines && wineId && (reason === 'tooExpensive' || reason === 'soldOut')) wStat(log, wineId)[reason]++;
    if (log.types && type) tStat(log, type)[reason]++;
  };

  // ---------- Advies (01_ONTWERP §7; UI volgt in M4) ----------
  // Past deze wijn bij de wensen van de vraag? price = schapprijs; shelf = wijnen op het schap (voor 'top').
  // Geeft { ok, miss: [welke wensen niet kloppen] } zodat de klant kan uitleggen wat er mis was.
  SIM.adviceCheck = function (q, wine, price, shelf) {
    const W = q.want, miss = [], role = CC.roleById(wine.role);
    const arr = v => Array.isArray(v) ? v : [v];
    if (W.soort && role.kind !== W.soort) miss.push('soort');
    if (W.bij && !(wine.bij || []).includes(W.bij)) miss.push('bij');
    if (W.stijl && !(wine.stijl || []).includes(W.stijl)) miss.push('stijl');
    if (W.land && wine.country !== W.land) miss.push('land');
    if (W.regio && wine.regio !== W.regio) miss.push('regio');
    if (W.druif && !wine.druif.includes(W.druif)) miss.push('druif');
    if (W.niet_druif && arr(W.niet_druif).some(d => wine.druif.includes(d))) miss.push('niet_druif');
    if (W.niet_stijl && arr(W.niet_stijl).some(st => (wine.stijl || []).includes(st))) miss.push('niet_stijl');
    if (W.niet_land && arr(W.niet_land).includes(wine.country)) miss.push('niet_land');
    if (W.top && shelf && shelf.some(o => CC.roleById(o.role).prest > role.prest)) miss.push('top');
    if (price > q.max) miss.push('prijs');
    return { ok: miss.length === 0, miss };
  };
  // Vragen die op dit niveau gesteld kunnen worden
  SIM.adviceQuestions = function (s) { return (CC.TEXT && CC.TEXT.advice || []).filter(q => q.lvl <= s.level); };

  // Wijnen die nu echt te koop zijn (op een schap én niet leeg)
  SIM.adviceShelf = function (s) { return SIM.listed(s).filter(l => l.n > 0 && !SIM.blocked(s, l.wine)).map(l => l.wine); };
  // Welke wijnen op het schap zijn een goed antwoord?
  SIM.adviceGood = function (s, q, shelf) {
    shelf = shelf || SIM.adviceShelf(s);
    return shelf.filter(w => SIM.adviceCheck(q, w, SIM.price(s, w.id), shelf).ok).map(w => w.id);
  };

  // Een adviesmoment klaarzetten: vraag + opties van je eigen schap (01_ONTWERP §7).
  // Meestal (adviceAnswerable) een vraag die je schap kan beantwoorden; anders is "heb ik niet" goed.
  // Geeft null als er niets op het schap staat.
  SIM.pickAdvice = function (s, rng) {
    const c = C(), shelf = SIM.adviceShelf(s);
    if (!shelf.length) return null;
    const recent = s.adviceRecent || [];
    let pool = SIM.adviceQuestions(s).filter(q => !recent.includes(q.id));
    if (!pool.length) pool = SIM.adviceQuestions(s);
    if (!pool.length) return null;
    const withGood = pool.map(q => ({ q, good: SIM.adviceGood(s, q, shelf) }));
    const yes = withGood.filter(x => x.good.length), no = withGood.filter(x => !x.good.length);
    const from = (yes.length && (!no.length || rng() < c.adviceAnswerable)) ? yes : no;
    const pick = from[Math.floor(rng() * from.length)];
    const q = pick.q, good = pick.good;
    // opties: één goed antwoord (als dat er is), dan valkuilen (valt op één wens af), dan de rest
    const n = Math.min(c.adviceOptions, shelf.length);
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const opts = [];
    if (good.length) opts.push(good[Math.floor(rng() * good.length)]);
    // precies één goed antwoord op het kaartje; de rest zijn bijna-goed (valkuilen) of gewoon fout
    const rest = shuffle(shelf.map(w => w.id).filter(id => !good.includes(id)));
    const misses = id => SIM.adviceCheck(q, CC.wineById(id), SIM.price(s, id), shelf).miss.length;
    rest.sort((a, b) => misses(a) - misses(b));   // stabiel genoeg: valkuilen (1 misser) eerst
    while (opts.length < n && rest.length) opts.push(rest.shift());
    s.adviceRecent = recent.concat(q.id).slice(-c.adviceNoRepeat);
    return { q, opts: shuffle(opts), good };
  };

  // Antwoord verwerken. wineId = gekozen wijn, of null voor "Sorry, heb ik niet".
  // Past reputatie en fooi toe; de verkoop zelf loopt via de klant naar de kassa (world.js).
  // result: good | wrong | tooExpensive | honest | falseNone
  SIM.answerAdvice = function (s, log, ask, wineId) {
    const c = C(), shelf = SIM.adviceShelf(s), q = ask.q;
    const good = SIM.adviceGood(s, q, shelf);
    let out;
    if (wineId == null) {
      out = good.length ? { result: 'falseNone', dr: c.adviceRepWrong, goodIds: good } : { result: 'honest', dr: c.adviceRepHonest, goodIds: [] };
    } else {
      const w = CC.wineById(wineId), price = SIM.price(s, wineId);
      const chk = SIM.adviceCheck(q, w, price, shelf);
      if (chk.ok) {
        const tip = Math.max(1, Math.round(price * c.adviceTip));
        s.cash += tip;
        out = { result: 'good', dr: c.adviceRepGood, tip, wineId, price, goodIds: good };
      } else {
        const onlyPrice = chk.miss.length === 1 && chk.miss[0] === 'prijs';
        out = { result: onlyPrice ? 'tooExpensive' : 'wrong', dr: c.adviceRepWrong, wineId, price, miss: chk.miss, goodIds: good };
      }
    }
    s.rep = Math.max(0, s.rep + out.dr);
    if (log) {
      log.rep = (log.rep || 0) + out.dr;
      const rp = log.repParts = log.repParts || {}; rp.advice = (rp.advice || 0) + out.dr;
      const a = log.advice = log.advice || { asked: 0, good: 0, wrong: 0, honest: 0, ignored: 0, tips: 0 };
      a.asked++;
      if (out.result === 'good') { a.good++; a.tips += out.tip; }
      else if (out.result === 'honest') a.honest++;
      else a.wrong++;
    }
    return out;
  };
  SIM.ignoreAdvice = function (log) {
    const a = log.advice = log.advice || { asked: 0, good: 0, wrong: 0, honest: 0, ignored: 0, tips: 0 };
    a.asked++; a.ignored++;
  };

  // ---------- Personeel (01_ONTWERP §9) ----------
  SIM.staffUnlocked = function (s, id) { return CC.STAFF[id].minLevel <= s.level; };
  SIM.hired = function (s, id) { return !!(s.staff && s.staff[id]); };
  SIM.staffLevel = function (s, id) { return SIM.hired(s, id) ? s.staff[id].level : 0; };
  SIM.staffCount = function (s) { return Object.keys(s.staff || {}).length; };
  SIM.hire = function (s, id) {
    if (SIM.hired(s, id)) return { ok: false, reason: 'already' };
    if (!SIM.staffUnlocked(s, id)) return { ok: false, reason: 'locked' };
    if (SIM.staffCount(s) >= C().staffMax) return { ok: false, reason: 'full' };
    s.staff[id] = { xp: 0, level: 1 };
    return { ok: true };
  };
  SIM.fire = function (s, id) { if (!SIM.hired(s, id)) return false; delete s.staff[id]; return true; };
  SIM.wages = function (s) { let w = 0; for (const id in s.staff || {}) w += CC.STAFF[id].wage; return w; };
  // Vaste lasten per verkoopdag (huur + loon) en wat er deze week nog aan komt, vandaag meegeteld.
  // Voor het bestelvenster ("kas na vaste lasten") en voor de bots in tools/balance.js.
  SIM.dailyCosts = function (s) { return C().rent + SIM.wages(s); };
  SIM.costsLeft = function (s) { return Math.max(0, C().daysPerWeek - s.day) * SIM.dailyCosts(s); };
  SIM.staffLevelFor = function (xp) { const L = C().staffXp; let lv = 1; for (let i = 0; i < L.length; i++) if (xp >= L[i]) lv = i + 1; return lv; };
  // XP uit eigen werk (besluit 72, 4A): Sem voor bijvullen en folderklanten die kopen, Fatima voor wie ze terughaalt,
  // Dubois voor beantwoorde vragen en dure flessen. Wie niets te doen heeft, groeit niet.
  SIM.staffWork = function (s, log) {
    const X = C().staffXpPer, src = (log && log.src) || {}, out = {};
    const b = k => (src[k] || {}).buyers || 0;
    if (SIM.hired(s, 'sem')) { const fl = (log && log.semRefill) || 0, fk = b('sem'); out.sem = { xp: fl * X.semBottle + fk * X.semCustomer, refill: fl, folder: fk, margin: (src.sem || {}).margin || 0 }; }
    if (SIM.hired(s, 'fatima')) { const k = b('fatima'); out.fatima = { xp: k * X.fatimaSave, saved: k, margin: (src.fatima || {}).margin || 0 }; }
    if (SIM.hired(s, 'dubois')) { const q = ((log && log.advice) || {}).dubois || 0, fl = (log && log.duboisPush) || 0; out.dubois = { xp: q * X.duboisAnswer + fl * X.duboisBottle, answered: q, bottles: fl, margin: ((src.dubois || {}).margin || 0) }; }
    return out;
  };
  // Einde dag: XP bijschrijven; geeft de level-ups terug (en zet de verdiende XP per kracht in work)
  SIM.staffWorkDay = function (s, log, work) {
    const ups = [];
    work = work || SIM.staffWork(s, log);
    for (const id in s.staff || {}) {
      const st = s.staff[id]; st.xp = Math.round((st.xp + ((work[id] || {}).xp || 0)) * 10) / 10;
      const lv = SIM.staffLevelFor(st.xp);
      if (lv > st.level) { ups.push({ id, from: st.level, to: lv }); st.level = lv; }
    }
    return ups;
  };
  // Volgende level: hoeveel XP nog?
  SIM.staffNext = function (s, id) { const st = s.staff[id], L = C().staffXp; return st.level >= L.length ? null : L[st.level]; };

  // Fatima: klant die zou weglopen, krijgt een tweede kans. Hij pakt de best scorende wijn die hij kan betalen en die er nog staat.
  SIM.secondChance = function (s, cust, rng) {
    const lv = SIM.staffLevel(s, 'fatima');
    if (!lv || rng() >= C().fatimaChance[lv - 1]) return null;
    const t = CC.CUSTOMER_TYPES[cust.type];
    let best = null;
    for (const L of SIM.listed(s)) {
      if (L.n <= 0 || SIM.blocked(s, L.wine)) continue;
      const w = L.wine, role = CC.roleById(w.role), price = SIM.price(s, w.id);
      if (price > SIM.budgetOf(s, cust)) continue;
      const likes = (t.likes || []).some(st => (w.stijl || []).includes(st));
      const sc = role.pop * t.wPop + role.prest * t.wPrest + (likes ? C().prefBonus : 0) - t.sens * (CC.standById(s.prices[w.id]).factor - 1.6) * C().pricePenaltyMul;
      if (!best || sc > best.sc) best = { w, price, sc };
    }
    if (!best) return null;
    // Fatima verkoopt een gewone aankoop (1–3 flessen), geen troostfles (besluit 72)
    let r = rng() * C().qtyWeights.reduce((a, q) => a + q[1], 0), qty = 1;
    for (const [q, wt] of C().qtyWeights) { r -= wt; if (r <= 0) { qty = q; break; } }
    return { action: 'buy', wineId: best.w.id, qty, price: best.price, fatima: true };
  };
  // Dubois: antwoord op een adviesvraag (goed met kans duboisSkill, anders een fout antwoord van het kaartje)
  // Dubois verkoopt dure flessen aan wie daar gevoelig voor is (liefhebber, statuszoeker)
  SIM.duboisPush = function (s, t, role) {
    const lv = SIM.staffLevel(s, 'dubois');
    if (!lv || t.wPrest < 0.9) return 0;
    return C().duboisBonus[lv - 1] * Math.max(0, role.prest - 2);
  };
  // Dubois praat kenners (liefhebber, statuszoeker) over hun budget heen: zij geven bij hem meer uit (besluit 72)
  SIM.budgetOf = function (s, cust) {
    const lv = SIM.staffLevel(s, 'dubois'), t = CC.CUSTOMER_TYPES[cust.type];
    return lv && t && t.wPrest >= 0.9 ? cust.budget * C().duboisBudget[lv - 1] : cust.budget;
  };
  // Weet hij het (kans duboisSkill), dan geeft hij het goede antwoord. Weet hij het niet, dan zegt hij niets
  // (undefined) en kiest de klant zelf, zoals bij negeren. Dubois kan dus alleen iets toevoegen (besluit 50).
  SIM.duboisAnswer = function (s, ask, rng) {
    const lv = SIM.staffLevel(s, 'dubois');
    if (rng() >= C().duboisSkill[lv - 1]) return undefined;
    const good = SIM.adviceGood(s, ask.q);
    return ask.opts.find(id => good.includes(id)) || null;
  };
  // Sem: welk vak heeft aanvulling nodig? (weinig flessen en voorraad in het magazijn)
  SIM.vakToRefill = function (s, busy) {
    let best = null;
    for (const v of SIM.activeVakIds(s)) {
      const vk = s.vakken[v];
      if (!vk.wine || (busy && busy.includes(v))) continue;
      if (vk.n > C().semLow || !(s.stock[vk.wine] > 0)) continue;
      if (!best || vk.n < s.vakken[best].n) best = v;
    }
    return best;
  };
  SIM.refillVak = function (s, v) {
    const vk = s.vakken[v]; if (!vk.wine) return 0;
    const take = Math.min(C().vakCapacity - vk.n, s.stock[vk.wine] || 0);
    if (take > 0) { vk.n += take; s.stock[vk.wine] -= take; }
    return take;
  };

  // ---------- Investeringen (besluit 60) ----------
  SIM.upgradeUnlocked = function (s, id) { return CC.upgradeById(id).lvl <= s.level; };
  SIM.buyUpgrade = function (s, id) {
    const u = CC.upgradeById(id);
    if (SIM.owns(s, id)) return { ok: false, reason: 'owned' };
    if (!SIM.upgradeUnlocked(s, id)) return { ok: false, reason: 'locked' };
    if (s.cash < u.cost) return { ok: false, reason: 'cash' };
    s.cash -= u.cost; s.upgrades = s.upgrades || {}; s.upgrades[id] = true;
    s.dayInvest = (s.dayInvest || 0) + u.cost;
    if (id === 'vitrine' && !s.vitrine) { const l = SIM.listed(s).filter(x => x.n > 0).sort((a, b) => CC.wineCost(b.wine) - CC.wineCost(a.wine))[0]; if (l) s.vitrine = l.wine.id; }
    return { ok: true };
  };
  SIM.setVitrine = function (s, wineId) { if (SIM.owns(s, 'vitrine')) s.vitrine = wineId || null; };
  // Extra score voor een wijn door investeringen
  SIM.upgradeBonus = function (s, w) {
    let b = 0;
    if (SIM.owns(s, 'vitrine') && s.vitrine === w.id && SIM.onShelf(s, w.id) > 0) b += CC.upgradeById('vitrine').bonus;   // lege vitrine trekt niemand
    const k = CC.upgradeById('koeling'); if (SIM.owns(s, 'koeling') && SIM.cardMatch(k.match, w)) b += k.bonus;
    return b;
  };
  SIM.upgradeCustomers = function (s) { let n = 0; for (const u of CC.UPGRADES) if (u.cust && SIM.owns(s, u.id)) n += u.cust; return n; };

  // ---------- Vaste bestelling bij Ronnie (besluit 57) ----------
  // targets[wineId] = gewenst aantal flessen (schap + magazijn). Elke ochtend vult Ronnie aan tot dat aantal.
  SIM.target = function (s, id) { return (s.targets || {})[id] || 0; };
  SIM.topUp = function (s, id) {
    const want = SIM.target(s, id) - SIM.totalBottles(s, id);
    if (want <= 0) return 0;
    if (SIM.deliveryBlocked(s)) return 0;
    const n = Math.min(want, Math.floor(s.cash / SIM.buyPrice(s, CC.wineById(id))), SIM.scarceLeft(s, id));
    if (n > 0) SIM.buy(s, id, n);
    return Math.max(0, n);
  };
  // Staat de wijn nog nergens? Dan in het eerste lege schapvak.
  SIM.ensureShelved = function (s, id) {
    if (SIM.vakOfWine(s, id)) return;
    const free = SIM.activeVakIds(s).find(v => !s.vakken[v].wine);
    if (free) SIM.assignVak(s, free, id);
  };
  SIM.setTarget = function (s, id, n) {
    s.targets = s.targets || {};
    s.targets[id] = Math.max(0, n);
    if (n > 0) SIM.ensureShelved(s, id);
    return SIM.topUp(s, id);
  };
  // Ochtendlevering: goedkoopste wijnen eerst (zo blijft de basis op voorraad als het geld krap is)
  // ---------- Ochtendbestelling ter goedkeuring (besluit 66, 1B) ----------
  // Ronnie stelt voor: per wijn aanvullen tot de lijst van de vorige bestelling (target). De speler past aan en bestelt.
  // A4: wijnen zonder schap stelt hij niet voor (die zou je anders elke ochtend op 0 moeten zetten).
  SIM.orderProposal = function (s) {
    const out = {};
    for (const w of SIM.unlockedWines(s)) {
      const t = SIM.target(s, w.id); if (!t || !SIM.vakOfWine(s, w.id)) continue;
      const n = Math.min(Math.max(0, t - SIM.totalBottles(s, w.id)), SIM.scarceLeft(s, w.id));
      if (n > 0) out[w.id] = n;
    }
    return out;
  };
  SIM.orderCost = function (s, order) {
    let c = 0; for (const id in order) c += (order[id] || 0) * SIM.buyPrice(s, CC.wineById(id));
    return Math.round(c * 100) / 100;
  };
  // Bestelling plaatsen: goedkoopste eerst, zoveel als kan. De nieuwe lijst = wat je nu hebt (voor morgen).
  SIM.placeOrder = function (s, order) {
    const out = [], short = [];
    if (SIM.deliveryBlocked(s)) return { deliveries: out, short, cost: 0, blocked: true };
    const ids = Object.keys(order).filter(id => order[id] > 0).sort((a, b) => CC.wineCost(CC.wineById(a)) - CC.wineCost(CC.wineById(b)));
    for (const id of ids) {
      const w = CC.wineById(id);
      const n = Math.min(order[id], Math.floor((s.cash + 1e-9) / SIM.buyPrice(s, w)), SIM.scarceLeft(s, id));
      if (n > 0 && SIM.buy(s, id, n).ok) { out.push({ id, n, cost: n * SIM.buyPrice(s, w) }); SIM.ensureShelved(s, id); }
      if (n < order[id]) short.push(id);
    }
    s.targets = s.targets || {};
    for (const id in order) s.targets[id] = SIM.totalBottles(s, id);   // morgen stelt Ronnie voor aan te vullen tot hier
    if (out.length && s.orderDiscount) s.orderDiscount = 0;   // B1: korting is gebruikt
    return { deliveries: out, short, cost: out.reduce((a, d) => a + d.cost, 0) };
  };

  // Tekort per wijn met reden: 'scarce' = Ronnie heeft er deze week geen meer, 'cash' = te weinig geld.
  SIM.autoOrder = function (s) {
    const out = [], short = [], scarce = [];
    const ids = CC.WINES.filter(w => SIM.target(s, w.id) > 0 && CC.roleById(w.role).unlock <= s.level)
      .sort((a, b) => CC.wineCost(a) - CC.wineCost(b)).map(w => w.id);
    for (const id of ids) {
      const want = SIM.target(s, id) - SIM.totalBottles(s, id);
      const left = SIM.scarceLeft(s, id);
      const got = SIM.topUp(s, id);
      if (got > 0) out.push({ id, n: got, cost: got * SIM.buyPrice(s, CC.wineById(id)) });
      if (got < want) (got >= left ? scarce : short).push(id);
    }
    return { deliveries: out, short, scarce, cost: out.reduce((a, d) => a + d.cost, 0), blocked: SIM.deliveryBlocked(s) };
  };

  // ---------- Weekkaarten (01_ONTWERP §10) ----------
  const arr = v => (Array.isArray(v) ? v : [v]);
  SIM.cardMatch = function (m, w) {
    if (!m) return false;
    const r = CC.roleById(w.role);
    if (m.soort && !arr(m.soort).includes(r.kind)) return false;
    if (m.land && !arr(m.land).includes(w.country)) return false;
    if (m.stijl && !arr(m.stijl).some(st => (w.stijl || []).includes(st))) return false;
    return true;
  };
  // Alle effecten die vandaag gelden (kaart + gekozen tegenvaller)
  SIM.effects = function (s) {
    const out = [];
    const on = e => !e.days || e.days.includes(s.day);
    if (s.card && s.card.week === s.week) { const c = CC.cardById(s.card.id); if (c && on(c)) out.push(c); }
    if (s.mishap && s.mishap.choice) {
      const m = CC.cardById(s.mishap.id), e = m && m[s.mishap.choice];
      if (e && on(e)) out.push(e);
    }
    return out;
  };
  SIM.cardBonus = function (s, w) { let b = 0; for (const e of SIM.effects(s)) if (e.bonus && SIM.cardMatch(e.match, w)) b += e.bonus; return b; };
  SIM.blocked = function (s, w) { return SIM.effects(s).some(e => e.block && SIM.cardMatch(e.block, w)); };
  SIM.cardCustomers = function (s, n) {
    if (SIM.effects(s).some(e => e.closed)) return 0;   // stroomstoring: vandaag dicht
    let add = 0, mul = 1;
    for (const e of SIM.effects(s)) { add += e.cust || 0; mul *= e.custMul || 1; }
    return Math.max(1, Math.round((n + add) * mul));
  };
  SIM.typeMul = function (s, k) { let m = 1; for (const e of SIM.effects(s)) if (e.types && e.types[k]) m *= e.types[k]; return m; };
  SIM.repMul = function (s) { let m = 1; for (const e of SIM.effects(s)) m *= e.rep || 1; return m; };

  // Lopende opdracht van deze week (bruiloft): { day, need, have } of null. Voor de herinnering op de dag ervoor (A3).
  SIM.pendingOrder = function (s) {
    if (!s.card || s.card.week !== s.week || s.card.orderDone) return null;
    const c = CC.cardById(s.card.id); if (!c || !c.order) return null;
    const ws = CC.WINES.filter(w => SIM.cardMatch(c.order.match, w));
    return { day: c.order.day, need: c.order.n, have: ws.reduce((a, w) => a + SIM.totalBottles(s, w.id), 0) };
  };
  // Opdracht (kaart "bruiloft"): op de afgesproken dag n flessen die passen uit voorraad halen.
  // A3: het spel telt pas als de winkel opengaat (na de ochtendbestelling), niet bij het begin van de ochtend.
  // Geeft null als er vandaag niets af te handelen is, anders { ok, n, paid, rep }.
  SIM.settleOrder = function (s) {
    if (!s.card || s.card.week !== s.week || s.card.orderDone) return null;
    const c = CC.cardById(s.card.id); if (!c || !c.order || c.order.day !== s.day) return null;
    const o = c.order;
    s.card.orderDone = true;
    const ws = CC.WINES.filter(w => SIM.cardMatch(o.match, w)).sort((a, b) => CC.wineCost(a) - CC.wineCost(b));
    const have = ws.reduce((a, w) => a + SIM.totalBottles(s, w.id), 0);
    if (have < o.n) { s.rep = Math.max(0, s.rep + o.repFail); return { ok: false, have, need: o.n, rep: o.repFail }; }
    let left = o.n, paid = 0;
    for (const w of ws) {   // eerst uit het magazijn, dan van het schap
      const take = Math.min(left, SIM.totalBottles(s, w.id)); if (!take) continue;
      let t = take; const st = Math.min(t, s.stock[w.id] || 0); s.stock[w.id] = (s.stock[w.id] || 0) - st; t -= st;
      for (const v in s.vakken) { const vk = s.vakken[v]; if (t > 0 && vk.wine === w.id) { const k = Math.min(t, vk.n); vk.n -= k; t -= k; } }
      paid += take * CC.priceFor(w, 'normaal'); left -= take;
      if (!left) break;
    }
    paid += o.bonus || 0;   // fooi van het bruidspaar
    s.cash += paid; s.rep += o.rep; s.totals.revenue += paid; s.totals.bottles += o.n;
    SIM.refill(s);
    return { ok: true, n: o.n, paid, rep: o.rep };
  };

  // Zondag: twee kansen aanbieden (niet dezelfde soort als het kan, niet vorige week)
  SIM.offerCards = function (s, rng) {
    // een gekozen kaart komt niet meer terug (HJ); alleen als de stapel op is, mag het weer
    const all = CC.CARDS.filter(c => c.kind !== 'mishap' && c.lvl <= s.level && !(s.card && s.card.id === c.id));
    const unused = all.filter(c => !(s.cardsTaken || []).includes(c.id));
    const pool = unused.length >= 2 ? unused : all;
    const fresh = pool.filter(c => !(s.cardSeen || []).slice(-4).includes(c.id));
    const from = fresh.length >= 2 ? fresh : pool;
    const a = from[Math.floor(rng() * from.length)];
    const rest = from.filter(c => c.id !== a.id), other = rest.filter(c => c.kind !== a.kind);
    const pick2 = (other.length ? other : rest);
    const b = pick2[Math.floor(rng() * pick2.length)];
    s.cardSeen = (s.cardSeen || []).concat([a.id, b.id]).slice(-8);
    return [a.id, b.id];
  };
  // Kaart kiezen voor de komende week. Geeft terug wat er gebeurde (voor de doos: welke wijn).
  SIM.chooseCard = function (s, id, rng) {
    const c = CC.cardById(id);
    if (s.card && s.card.week === s.week + 1) return { ok: false, reason: 'chosen' };   // deze zondag al gekozen
    if (c.cost && s.cash < c.cost) return { ok: false, reason: 'cash' };
    s.cash -= c.cost || 0;
    s.card = { id, week: s.week + 1 };   // geldt voor de komende week
    s.cardsTaken = (s.cardsTaken || []).concat([id]);
    if (c.box) {
      // doos zonder etiket: meestal gewone wijn, soms een topper (gewogen naar goedkoop)
      const ws = SIM.unlockedWines(s);
      const wts = ws.map(w => 1 / Math.sqrt(CC.wineCost(w)));
      let r = rng() * wts.reduce((a2, b2) => a2 + b2, 0), w = ws[0];
      for (let i = 0; i < ws.length; i++) { r -= wts[i]; if (r <= 0) { w = ws[i]; break; } }
      s.stock[w.id] = (s.stock[w.id] || 0) + c.box;
      s.card.box = w.id;
      SIM.refill(s);
      return { ok: true, box: w.id, worth: CC.wineCost(w) * c.box };
    }
    return { ok: true };
  };
  // Maandag: soms een tegenvaller
  SIM.rollMishap = function (s, rng) {
    s.mishap = null;
    if (s.week < CC.CARD_CFG.mishapFrom || rng() >= CC.CARD_CFG.mishapChance) return null;
    const pool = CC.CARDS.filter(c => c.kind === 'mishap' && c.lvl <= s.level && (!c.needs || SIM.owns(s, c.needs)));
    if (!pool.length) return null;
    const m = pool[Math.floor(rng() * pool.length)];
    s.mishap = { id: m.id, choice: null };
    return s.mishap;
  };
  SIM.decideMishap = function (s, choice, rng) {
    const m = CC.cardById(s.mishap.id), e = m[choice];
    if (choice === 'a' && e.cost && s.cash < e.cost) return { ok: false, reason: 'cash' };
    s.mishap.choice = choice;
    let paid = e.cost || 0;
    if (e.gamble) { const lost = rng() < e.gamble.chance; s.mishap.lost = lost; paid = lost ? e.gamble.cost : 0; }
    s.cash -= paid;
    return { ok: true, paid, lost: s.mishap.lost };
  };

  // ---------- Reputatie en niveaus ----------
  SIM.levelFor = function (rep) {
    const L = C().levelRep; let lv = 1;
    for (let i = 0; i < L.length; i++) if (rep >= L[i]) lv = i + 1;
    return lv;
  };
  SIM.unlocksFor = function (level) {
    return {
      wines: CC.WINES.filter(w => CC.roleById(w.role).unlock === level),
      shelves: [],
      upgrades: CC.UPGRADES.filter(u => u.lvl === level),
      customers: Object.keys(CC.CUSTOMER_TYPES).filter(k => CC.CUSTOMER_TYPES[k].minLevel === level).map(k => CC.CUSTOMER_TYPES[k].name),
      staff: Object.keys(CC.STAFF || {}).filter(k => CC.STAFF[k].minLevel === level),
      moreCustomers: C().customersPerLevel,
    };
  };
  SIM.repProgress = function (s) {
    const L = C().levelRep, lv = s.level;
    if (lv >= L.length) return { lv, frac: 1, next: null };
    const a = L[lv - 1], b = L[lv];
    return { lv, frac: Math.max(0, Math.min(1, (s.rep - a) / (b - a))), next: b };
  };

  // ---------- Avondinzicht (fase 3c, besluit 75) ----------
  // Eén feitelijke zin over de dag: de gebeurtenis die (in euro's) het meest zegt. Geeft { key, wine, n, tab, loss, ... }
  // key: soldOut (wijn was op) | tooExpensive (te duur bij deze stand) | nothing (niets naar hun smaak) | idle (stond er, verkocht niets) | best (topper van de dag)
  SIM.insight = function (s, sm) {
    if (!sm || !sm.customers) return null;
    const W = sm.wines || {}, stands = sm.stands || {}, c = C();
    const q = c.qtyWeights.reduce((a, x) => a + x[0] * x[1], 0) / c.qtyWeights.reduce((a, x) => a + x[1], 0);
    const cands = [];
    for (const id in W) {
      const w = CC.wineById(id); if (!w) continue;
      const unit = CC.priceFor(w, stands[id] || 'normaal') - CC.wineCost(w);
      if (W[id].soldOut >= 2) cands.push({ key: 'soldOut', wine: id, n: W[id].soldOut, tab: 'order', loss: W[id].soldOut * q * unit * 0.5 });   // de helft pakt een tweede keus
      if (W[id].tooExpensive >= 2) cands.push({ key: 'tooExpensive', wine: id, n: W[id].tooExpensive, tab: 'prices', stand: stands[id] || 'normaal', price: CC.priceFor(w, stands[id] || 'normaal'), loss: W[id].tooExpensive * q * CC.wineCost(w) * 0.6 * 0.6 });
    }
    const bought = Object.keys(W).filter(id => W[id].sold > 0);
    for (const id in stands) if (bought.length >= 2 && !(W[id] && W[id].sold) && !(W[id] && (W[id].soldOut || W[id].tooExpensive))) cands.push({ key: 'idle', wine: id, tab: 'order', loss: 6 });
    const T = sm.types || {};
    let worst = null;
    for (const k in T) if (T[k].nothing >= 3 && (!worst || T[k].nothing > T[worst].nothing)) worst = k;
    if (worst && T[worst].nothing / Math.max(1, sm.customers) >= 0.15) cands.push({ key: 'nothing', type: worst, n: T[worst].nothing, tab: 'order', loss: T[worst].nothing * 4 });
    cands.sort((a, b) => b.loss - a.loss);
    if (cands.length && cands[0].loss >= 5) return cands[0];
    // niets misgegaan: noem de topper
    const top = bought.sort((a, b) => W[b].margin - W[a].margin)[0];
    return top ? { key: 'best', wine: top, n: W[top].sold, margin: W[top].margin, tab: 'prices', loss: 0 } : null;
  };

  // ---------- Klussen per niveau (besluit 76) ----------
  // Elk niveau geeft een klus. Klussen blijven open tot je ze haalt; er kunnen er meer tegelijk open staan.
  SIM.klusOpen = function (s) {
    if (!s.klussen) { s.klussen = []; for (let L = 1; L <= s.level; L++) if (CC.LEVELS[L] && CC.LEVELS[L].klus) s.klussen.push({ lvl: L, n: 0 }); }   // oude saves
    return s.klussen;
  };
  SIM.klusDef = function (lvl) { return (CC.LEVELS[lvl] || {}).klus || null; };
  // Hoeveel telt deze dag mee? (variety: het maximum op één dag, de rest telt op)
  SIM.klusCount = function (def, log, work) {
    const W = log.perWine || {};
    if (def.kind === 'bottles') return log.bottles || 0;
    if (def.kind === 'wine') return def.wines.reduce((a, id) => a + (W[id] || 0), 0);
    if (def.kind === 'type') return ((log.types || {})[def.type] || {}).bottles || 0;
    if (def.kind === 'variety') return Object.keys(W).filter(id => W[id] > 0).length;
    if (def.kind === 'fatima') return ((work || {}).fatima || {}).saved || 0;
    return 0;
  };
  // Einde dag: alle open klussen bijwerken. Geeft per klus { lvl, n, need, gained, now } terug; gehaalde klussen gaan van de lijst.
  SIM.klusDay = function (s, log, work) {
    const out = [];
    for (const k of SIM.klusOpen(s)) {
      const def = SIM.klusDef(k.lvl); if (!def) continue;
      const c = SIM.klusCount(def, log, work);
      k.n = Math.min(def.need, def.kind === 'variety' ? Math.max(k.n, c) : k.n + c);
      const now = k.n >= def.need;
      if (now) {
        if (def.rep) { s.rep += def.rep; log.rep = (log.rep || 0) + def.rep; const rp = log.repParts = log.repParts || {}; rp.klus = (rp.klus || 0) + def.rep; }
        if (def.cash) s.cash += def.cash;
      }
      out.push({ lvl: k.lvl, n: k.n, need: def.need, gained: c, now, rep: now ? def.rep || 0 : 0, cash: now ? def.cash || 0 : 0 });
    }
    s.klussen = s.klussen.filter(k => k.n < SIM.klusDef(k.lvl).need);
    // B1: weekklus
    const wk = SIM.weekKlusOpen(s);
    if (wk) {
      const def = SIM.weekKlusDef(wk.id), c = SIM.klusCount({ kind: def.kind, type: wk.type }, log, work);
      wk.n = Math.min(wk.need, def.kind === 'variety' ? Math.max(wk.n, c) : wk.n + c);
      const now = wk.n >= wk.need;
      let r = {};
      if (now) { wk.done = true; r = SIM.weekKlusReward(s, wk, log); }
      out.push({ wk: wk.id, n: wk.n, need: wk.need, gained: c, now, rep: now ? r.rep || 0 : 0, cash: now ? r.cash || 0 : 0, discount: now ? r.discount || 0 : 0 });
    }
    return out;
  };
  // ---------- Weekklus (B1) ----------
  // Elke week vanaf CC.WEEKKLUS.from één klus, gekozen op de zondag ervoor. De lat hangt aan wat je vorige week deed,
  // zodat hij op elk niveau iets vraagt. Deterministisch per seed en week: zondag (planning) en startWeek kiezen hetzelfde.
  SIM.weekKlusDef = function (id) { return CC.WEEKKLUS.list.find(d => d.id === id) || null; };
  SIM.planWeekKlus = function (s, week) {
    const W = CC.WEEKKLUS;
    if (week < W.from || week > C().repay.length || (s.status !== 'playing' && s.status !== 'won')) return null;
    const last = s.history.filter(h => h.week === week - 1);
    const rng = CC.makeRng({ rng: ((s.seed || 1) * 7919 + week * 104729) >>> 0 });
    const types = Object.keys(CC.CUSTOMER_TYPES).filter(k => CC.CUSTOMER_TYPES[k].minLevel <= s.level && k !== 'buurt');
    const vaks = SIM.activeVakIds(s).length;
    const prevId = s.weekKlus && s.weekKlus.week === week - 1 ? s.weekKlus.id : null;
    const ok = W.list.filter(d => d.id !== prevId && (d.kind !== 'type' || types.length) && (d.kind !== 'variety' || vaks >= d.min));
    if (!ok.length) return null;
    const d = ok[Math.floor(rng() * ok.length)], k = { id: d.id, week, n: 0, done: false };
    const up5 = x => Math.ceil(x / 5) * 5;
    if (d.kind === 'bottles') k.need = Math.max(d.min, up5(last.reduce((a, h) => a + (h.bottles || 0), 0) * d.grow));
    if (d.kind === 'type') {
      k.type = types[Math.floor(rng() * types.length)];
      k.need = Math.max(d.min, Math.ceil(last.reduce((a, h) => a + (((h.types || {})[k.type] || {}).bottles || 0), 0) * d.grow));
    }
    if (d.kind === 'variety') k.need = Math.min(vaks, Math.max(d.min, Math.max(0, ...last.map(h => Object.keys(h.wines || {}).filter(id => h.wines[id].sold > 0).length)) + (d.plus || 0)));
    return k;
  };
  // Zondag: de klus voor volgende week vastleggen (staat in de save, zodat herladen hetzelfde laat zien)
  SIM.offerWeekKlus = function (s) {
    if (!s.nextWeekKlus || s.nextWeekKlus.week !== s.week + 1) s.nextWeekKlus = SIM.planWeekKlus(s, s.week + 1);
    return s.nextWeekKlus;
  };
  SIM.weekKlusOpen = function (s) { const k = s.weekKlus; return k && k.week === s.week && !k.done ? k : null; };
  SIM.weekKlusReward = function (s, k, log) {
    const r = SIM.weekKlusDef(k.id).reward;
    if (r.cash) s.cash += r.cash;
    if (r.rep) { s.rep += r.rep; if (log) { log.rep = (log.rep || 0) + r.rep; const rp = log.repParts = log.repParts || {}; rp.klus = (rp.klus || 0) + r.rep; } }
    if (r.discount) s.orderDiscount = Math.max(s.orderDiscount || 0, r.discount);
    s.weekKlusDone = (s.weekKlusDone || 0) + 1;
    return r;
  };
  SIM.klusAdd = function (s, from, to) { SIM.klusOpen(s); for (let L = from; L <= to; L++) if (SIM.klusDef(L)) s.klussen.push({ lvl: L, n: 0 }); };

  // ---------- Dag afsluiten ----------
  SIM.endDay = function (s, log) {
    let best = null, bestN = 0;
    for (const id in log.perWine) if (log.perWine[id] > bestN) { best = id; bestN = log.perWine[id]; }
    const rent = C().rent;
    const adv = log.advice || { asked: 0, good: 0, wrong: 0, honest: 0, ignored: 0, tips: 0 };
    const wages = SIM.wages(s);
    s.cash -= rent + wages;
    const work = SIM.staffWork(s, log);
    const staffUp = SIM.staffWorkDay(s, log, work);
    // klus van dit niveau bijwerken; gehaald = bonusreputatie (of geld op het hoogste niveau)
    const klus = SIM.klusDay(s, log, work);
    const oldLevel = s.level;
    s.level = Math.max(s.level, SIM.levelFor(s.rep));
    if (s.level > oldLevel) SIM.klusAdd(s, oldLevel + 1, s.level);   // nieuw niveau: nieuwe klus erbij
    const summary = {
      week: s.week, day: s.day,
      revenue: log.revenue, cogs: log.cogs, margin: log.revenue - log.cogs, rent, wages, staffUp, fatima: log.fatima || 0, tips: adv.tips, advice: adv, profit: log.revenue - log.cogs + adv.tips - rent - wages,
      bottles: log.bottles, customers: log.customers, buyers: log.buyers,
      soldOut: log.soldOut, tooExpensive: log.tooExpensive, nothing: log.nothing, adviceLeft: log.adviceLeft || 0,
      rep: log.rep || 0, best, bestN, cash: s.cash,
      bought: s.dayBuy || 0, invest: s.dayInvest || 0, cashflow: log.revenue + adv.tips - (s.dayBuy || 0) - (s.dayInvest || 0) - rent - wages,
      wines: log.wines || {}, types: log.types || {},
      repParts: log.repParts || {}, klus, klusDone: klus.filter(k => k.now),
      src: log.src || {}, vitrine: log.vitrine || 0, koeling: log.koeling || 0, duboisPush: log.duboisPush || 0, work,
      stands: Object.fromEntries(SIM.listed(s).map(l => [l.wine.id, s.prices[l.wine.id]])),
      levelUp: s.level > oldLevel ? { from: oldLevel, to: s.level } : null,
      card: s.card ? s.card.id : null,
    };
    s.dayBuy = 0; s.dayInvest = 0;
    s.history.push(summary);
    if (s.history.length > 80) s.history.shift();
    s.totals.days++;
    SIM.refill(s);
    return summary;
  };

  // Na de kassabon: volgende dag, of zondag na zaterdag (de week telt pas door na zondag)
  SIM.advanceDay = function (s) {
    s.day++;
    if (s.day >= C().daysPerWeek) { s.day = C().daysPerWeek; return 'sunday'; }
    return 'prep';
  };

  // ---------- Zondag: de bank ----------
  SIM.inLoan = function (s) { return s.week <= C().repay.length && s.status === 'playing'; };
  // bankDoneWeek: deze zondag is al afgehandeld (betaald of uitgesteld). Dan staat er niets meer open,
  // ook niet na herladen; een uitgesteld bedrag (carry) telt pas vanaf volgende week.
  SIM.bankDone = function (s) { return s.bankDoneWeek === s.week; };
  SIM.weekDue = function (s) { return SIM.inLoan(s) && !SIM.bankDone(s) ? C().repay[s.week - 1] + s.carry : 0; };
  SIM.debtLeft = function (s) {
    const R = C().repay; let left = s.carry;
    for (let i = s.week - 1 + (SIM.bankDone(s) ? 1 : 0); i < R.length; i++) left += R[i];
    return s.status === 'playing' ? left : 0;
  };
  SIM.payWeek = function (s) {
    if (SIM.bankDone(s)) return { ok: false, reason: 'done' };   // nooit twee keer dezelfde week
    const due = SIM.weekDue(s);
    if (s.cash < due) return { ok: false, short: due - s.cash };
    s.cash -= due; s.debtPaid += due; s.carry = 0; s.bankDoneWeek = s.week;
    if (s.week >= C().repay.length) s.status = 'won';
    return { ok: true, paid: due, won: s.status === 'won' };
  };
  SIM.postpone = function (s) {
    if (s.postponed || SIM.bankDone(s) || s.week >= C().repay.length) return { ok: false };
    s.carry = SIM.weekDue(s) + C().postponeFine; s.postponed = true; s.bankDoneWeek = s.week;
    return { ok: true, next: C().repay[s.week] + s.carry };
  };
  SIM.bankrupt = function (s) { s.bust = { week: s.week, due: SIM.weekDue(s), cash: s.cash }; s.status = 'bankrupt'; };
  // Failliet: wat ging er mis? (fase 3d, besluit 77) Twee feitelijke regels over de laatste week, de zwaarste (in euro's) eerst.
  // A2 (handoff na review 2): verloren klanten tellen tegen de marge per koper, "te duur" weegt even zwaar als "op",
  // en "op" op een dag dat er geen geld was om bij te bestellen heet "lege kas" in plaats van een wijn te noemen.
  // "Te weinig marge per dag" is een gevolg, geen oorzaak: die regel komt pas als er niets concreters is.
  SIM.postmortem = function (s) {
    const b = s.bust || { week: s.week, due: 0, cash: s.cash };
    let wk = s.history.filter(h => h.week === b.week);
    if (!wk.length) wk = s.history.slice(-C().daysPerWeek);
    const sum = f => wk.reduce((a, h) => a + (f(h) || 0), 0);
    const days = Math.max(1, wk.length);
    const bottles = sum(h => h.bottles), margin = sum(h => h.margin), buyers = sum(h => h.buyers);
    const perBuyer = buyers ? margin / buyers : (bottles ? margin / bottles : 4);
    const out = [];
    // lege kas: 's ochtends te weinig geld om de wijnen die op raakten bij te bestellen (6 flessen elk), en dat ook niet gedaan
    const broke = h => {
      if (!h.soldOut) return false;
      const morning = h.cash + (h.rent || 0) + (h.wages || 0) + (h.bought || 0) + (h.invest || 0) - (h.revenue || 0) - (h.tips || 0);
      let need = 0; for (const id in h.wines || {}) if (h.wines[id].soldOut) need += 6 * CC.wineCost(CC.wineById(id));
      return need > 0 && morning < need && (h.bought || 0) < need;
    };
    const cashOut = sum(h => (broke(h) ? h.soldOut : 0));
    const soldOut = sum(h => (broke(h) ? 0 : h.soldOut)), tooExp = sum(h => h.tooExpensive), nothing = sum(h => h.nothing);
    // welke wijn was het vaakst op / te duur? (alleen dagen die meetellen)
    const byWine = (k, keep) => { const m = {}; for (const h of wk) if (!keep || keep(h)) for (const id in h.wines || {}) m[id] = (m[id] || 0) + (h.wines[id][k] || 0); const top = Object.keys(m).sort((x, y) => m[y] - m[x])[0]; return top && m[top] ? CC.wineById(top).name : null; };
    if (cashOut) out.push({ key: 'cashOut', n: cashOut, loss: cashOut * perBuyer * 0.8 });
    if (soldOut) out.push({ key: 'soldOut', n: soldOut, wine: byWine('soldOut', h => !broke(h)), loss: soldOut * perBuyer * 0.8 });
    if (tooExp) out.push({ key: 'tooExpensive', n: tooExp, wine: byWine('tooExpensive'), loss: tooExp * perBuyer * 0.8 });
    if (nothing >= 5) out.push({ key: 'nothing', n: nothing, loss: nothing * perBuyer * 0.4 });
    const stockVal = CC.WINES.reduce((a, w) => a + SIM.totalBottles(s, w.id) * CC.wineCost(w), 0);
    if (stockVal > 60) out.push({ key: 'stock', value: stockVal, loss: stockVal * 0.5 });
    const inv = sum(h => h.invest); if (inv > 0) out.push({ key: 'invest', value: inv, loss: inv });
    const wages = sum(h => h.wages); if (wages > 0) out.push({ key: 'wages', value: wages, loss: wages * 0.7 });
    out.sort((x, y) => y.loss - x.loss);
    const lines = out.filter(l => l.loss >= 1).slice(0, 2);
    if (lines.length < 2 && wk.length) lines.push({ key: 'margin', perDay: margin / days, need: b.due / 6, loss: 0 });
    return { short: Math.max(0, b.due - b.cash), due: b.due, week: b.week, lines: lines.slice(0, 2) };
  };
  SIM.startWeek = function (s) {
    s.week++; s.day = 0; s.weekBought = {}; s.sun = null;
    // B1: weekklus van deze week (zoals zondag aangekondigd; anders nu kiezen)
    const nk = s.nextWeekKlus && s.nextWeekKlus.week === s.week ? s.nextWeekKlus : SIM.planWeekKlus(s, s.week);
    s.weekKlus = nk; s.nextWeekKlus = null;
    SIM.rollMishap(s, CC.makeRng(s));
    // A7: naar vrij spelen: de weekkaart van week 8 is voorbij en mag niet als oude kaart blijven hangen
    if (s.status === 'won') { s.status = 'endless'; if (s.card && s.card.week < s.week) s.card = null; }
  };

  CC.SIM = SIM;
  if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
