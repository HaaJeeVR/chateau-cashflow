// Château Cashflow — state.js
// Spelstatus: pure, serialiseerbare data + seeded RNG + opslaan/laden.
(function (root) {
  const CC = root.CC = root.CC || {};
  const SAVE_KEY = 'chateau-cashflow-save-v1';

  // mulberry32 — state zit in een object zodat hij mee kan in de save.
  CC.makeRng = function (holder) {
    return function () {
      let t = (holder.rng = (holder.rng + 0x6D2B79F5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  CC.newState = function (seed) {
    if (seed == null) seed = (Math.random() * 1e9) >>> 0;
    const vakken = {};
    for (const f of CC.FURNITURE) if (f.vakken) for (const v of f.vakken) vakken[v] = { wine: null, n: 0 };
    const prices = {};
    for (const w of CC.WINES) prices[w.id] = CC.CONFIG.defaultStand;
    return {
      v: 1,
      seed, rng: seed >>> 0,
      cash: CC.CONFIG.startCash,
      week: 1, day: 0,          // day 0..5 = ma..za
      level: 1,                 // reputatieniveau (M3)
      stock: {},                // magazijn: wineId -> flessen
      vakken,                   // vakId -> {wine, n}
      prices,                   // wineId -> standId
      weekBought: {},           // wineId -> flessen ingekocht deze week (schaarste)
      dayBuy: 0,                // euro ingekocht sinds de vorige verkoopdag (kasstroom op de bon)
      rep: 0,                   // reputatiepunten
      carry: 0,                 // doorgeschoven aflossing (na uitstel)
      postponed: false,         // uitstel al gebruikt?
      debtPaid: 0,
      status: 'playing',        // playing | won | bankrupt | endless
      adviceRecent: [],         // laatst gestelde adviesvragen (niet herhalen)
      staff: {},                // in dienst: id -> { xp, level }
      upgrades: {},             // gekochte investeringen: id -> true (besluit 60)
      vitrine: null,            // wijn in de vitrine
      targets: {},              // vaste bestelling: wineId -> gewenst aantal flessen (besluit 57)
      card: null,               // weekkaart van deze week: { id, box? }
      mishap: null,             // tegenvaller van deze week: { id, choice: null|'a'|'b', lost? }
      cardSeen: [],             // eerder aangeboden kaarten (niet steeds dezelfde)
      cardsTaken: [],           // gekozen kaarten: komen niet meer terug
      bankDoneWeek: 0,          // week waarvan de zondag al is afgehandeld (betaald/uitgesteld)
      sun: null,                // zondagscherm (bank + kaartkeuze), bewaard zodat herladen niets overdoet
      resultOpen: false,        // de kassabon van de laatste dag staat nog open
      flags: {},                // tutorial-vlaggen
      totals: { revenue: 0, bottles: 0, days: 0 },
      history: [],              // dagresultaten
      klussen: [{ lvl: 1, n: 0 }],   // open klussen (besluit 76): blijven staan tot je ze haalt
    };
  };

  CC.save = function (state) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  };
  CC.load = function () {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      if (!s) return null;
      const st = JSON.parse(s);
      if (!st || st.v !== 1) return null;
      // oudere saves aanvullen
      const d = { dayBuy: 0, rep: 0, carry: 0, postponed: false, debtPaid: 0, status: 'playing', level: 1, weekBought: {}, adviceRecent: [], staff: {}, card: null, mishap: null, cardSeen: [], cardsTaken: [], targets: {}, bankDoneWeek: 0, sun: null, resultOpen: false, upgrades: { kast3: true, kast4: true, vitrine: !!st.vitrine }, vitrine: null };   // saves van vóór besluit 60 houden wat ze hadden
      for (const k in d) if (st[k] == null) st[k] = d[k];
      for (const f of CC.FURNITURE) if (f.vakken) for (const v of f.vakken) if (!st.vakken[v]) st.vakken[v] = { wine: null, n: 0 };
      // oude wijn-ID's (merken) omzetten naar types
      const M = CC.WINE_ID_MIGRATE || {}, mv = id => M[id] || id;
      const remap = o => { const r = {}; for (const k in o) r[mv(k)] = (r[mv(k)] || 0) + o[k]; return r; };
      st.stock = remap(st.stock || {});
      const pr = {}; for (const k in (st.prices || {})) pr[mv(k)] = st.prices[k]; st.prices = pr;
      for (const w of CC.WINES) if (!st.prices[w.id]) st.prices[w.id] = CC.CONFIG.defaultStand;
      for (const v in st.vakken) if (st.vakken[v].wine) st.vakken[v].wine = mv(st.vakken[v].wine);
      if (st.vitrine) st.vitrine = mv(st.vitrine);
      return st;
    } catch (e) { return null; }
  };
  CC.hasSave = function () { return !!CC.load(); };
  // Reservekopie: bij "Nieuw spel" gaat het lopende spel hierheen, terug te zetten vanaf het titelscherm.
  const BACKUP_KEY = SAVE_KEY + '-reserve';
  CC.backupSave = function () { try { const cur = localStorage.getItem(SAVE_KEY); if (cur) localStorage.setItem(BACKUP_KEY, cur); return true; } catch (e) { return false; } };
  CC.hasBackup = function () { try { return !!localStorage.getItem(BACKUP_KEY); } catch (e) { return false; } };
  CC.backupInfo = function () { try { const st = JSON.parse(localStorage.getItem(BACKUP_KEY)); return st ? { week: st.week, level: st.level } : null; } catch (e) { return null; } };
  CC.restoreBackup = function () {
    try {
      const bak = localStorage.getItem(BACKUP_KEY); if (!bak) return false;
      const cur = localStorage.getItem(SAVE_KEY);
      localStorage.setItem(SAVE_KEY, bak);
      if (cur) localStorage.setItem(BACKUP_KEY, cur); else localStorage.removeItem(BACKUP_KEY);   // wisselen: niets gaat verloren
      return true;
    } catch (e) { return false; }
  };
  // Export/import als tekstcode (03_BOUWPLAN §1)
  CC.exportCode = function (state) { return 'CC1:' + btoa(unescape(encodeURIComponent(JSON.stringify(state)))); };
  CC.importCode = function (code) {
    try {
      const raw = String(code || '').trim().replace(/^CC1:/, '');
      const json = decodeURIComponent(escape(atob(raw)));
      const st = JSON.parse(json);
      if (!st || st.v !== 1 || !st.vakken || typeof st.cash !== 'number') return null;
      const cur = localStorage.getItem(SAVE_KEY);
      if (cur) localStorage.setItem(BACKUP_KEY, cur);   // huidige spel eerst naar de reserve
      localStorage.setItem(SAVE_KEY, json);
      return CC.load();
    } catch (e) { return null; }
  };
  CC.clearSave = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* */ } };

  // Instellingen die los staan van het spel (besluit 86): blijven staan bij "Nieuw spel", "Opnieuw beginnen" en spelcodes.
  // Nu alleen: introSeen (de intro is al eens gezien of overgeslagen).
  const SETTINGS_KEY = 'chateau-cashflow-instellingen';
  const memSettings = {};   // als localStorage geblokkeerd is: onthouden zolang de pagina open is
  CC.getSetting = function (k) {
    try { const o = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); return k in o ? o[k] : memSettings[k]; } catch (e) { return memSettings[k]; }
  };
  CC.setSetting = function (k, v) {
    memSettings[k] = v;
    try { const o = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); o[k] = v; localStorage.setItem(SETTINGS_KEY, JSON.stringify(o)); return true; } catch (e) { return false; }
  };

  if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
