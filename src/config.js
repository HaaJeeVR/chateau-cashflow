// Château Cashflow — config.js
// ALLE balanswaarden staan hier. Tunen = dit bestand aanpassen.
(function (root) {
  const CC = root.CC = root.CC || {};

  CC.VERSION = 'M6';

  CC.PAL = {
    ink: '#1f0a0e',
    bord1: '#45101a', bord2: '#6e1a26', bord3: '#9c2a35', bord4: '#c9484f',
    wood1: '#4a2a17', wood2: '#7a4a24', wood3: '#b0733a', wood4: '#d9a25c', honey: '#f0c77a',
    cream1: '#e3d3ad', cream2: '#f7ebc8', cream3: '#fdf6e3',
    green1: '#1f3a2e', green2: '#2f5541', green3: '#5e8a5f', green4: '#9dbb86',
    stone1: '#6b6259', stone2: '#a39a8c', stone3: '#d4cbbb',
    glass1: '#7fa9b8', glass2: '#c4e0e3',
    gold: '#e8b53a', gold2: '#fff1a8',
    skin1: '#f1c7a0', skin2: '#c98b62', skin3: '#8a5433',
    red: '#d9412b', ok: '#4fa04a',
  };

  CC.CONFIG = {
    startCash: 400,                                         // besluit 70: week 1 knelt al (was 800)
    daysPerWeek: 6,
    dayNames: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'],
    dayNamesLong: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],

    // Verkoopdag
    dayLength: 30,          // seconden op 1×
    spawnWindow: 20,        // klanten komen binnen in de eerste N seconden
    customersBase: 14,      // + customersPerLevel × (level-1) vanaf M3
    customersPerLevel: 3,
    customersJitter: 2,
    walkSpeed: 1.5,         // tegels (≈ meters) per seconde

    // Schappen
    vakCapacity: 12,

    // Prijsstanden (factor × inkoop). Prijs wordt afgerond op €0,50.
    priceStands: [
      { id: 'scherp', name: 'Scherp', factor: 1.3 },
      { id: 'normaal', name: 'Normaal', factor: 1.6 },
      { id: 'stevig', name: 'Stevig', factor: 2.0 },
      { id: 'woeker', name: 'Woeker', factor: 2.6 },
    ],
    defaultStand: 'normaal',

    // Klantbeslissing (zie 01_ONTWERP §6)
    buyThreshold: 3.5,
    noise: 1.5,             // ± uniform
    pricePenaltyMul: 3,
    qtyWeights: [[1, 50], [2, 33], [3, 17]],
    secondChoice: 0.5,      // kans dat een klant bij een uitverkochte favoriet zijn tweede keus pakt
    prefBonus: 1.0,         // klantvoorkeur voor een stijl (zie CUSTOMER_TYPES.likes)

    buyAmounts: [6, 12],
    targetStep: 6,          // vaste bestelling: stappen van 6 flessen
    targetMax: 48,

    // Economie (01_ONTWERP §3)
    rent: 20,                                               // vaste lasten per verkoopdag
    repay: [90, 150, 240, 360, 520, 720, 1200, 2200],      // aflossing per zondag (week 1–8); besluit 70/72/76: zacht midden, steil einde (investeren en personeel betalen zich daar uit)
    postponeFine: 100,                                      // uitstel: 1× per run, aflossing schuift door + boete

    // Advies (01_ONTWERP §7, besluit 36)
    advicePerDay: [1, 2],   // min–max adviesvragen per verkoopdag (was 1–3; getuned, besluit 48)
    adviceRepGood: 1,       // goed advies (was 2; getuned, besluit 48)
    adviceRepWrong: -1,     // fout advies (klant koopt niets)
    adviceRepHonest: 1,     // eerlijk "heb ik niet" (klopt)
    adviceTip: 0.1,         // fooi = 10% van de verkoopprijs (min €1) bij goed advies
    advicePatience: 8,      // seconden (echte tijd) dat een klant met ! wacht; daarna kiest hij zelf
    adviceSpawnFrac: 0.7,   // adviesklanten komen in de eerste 70% van de dag binnen
    adviceOptions: 3,       // aantal wijnen op het kaartje
    adviceAnswerable: 0.8,  // kans dat de gekozen vraag met je schap te beantwoorden is (anders: 'heb ik niet' is goed)
    adviceNoRepeat: 12,     // zoveel laatst gestelde vragen komen niet terug

    // Personeel (01_ONTWERP §9). Waarden per level 1–5.
    staffMax: 2,                         // max. tegelijk in dienst
    staffWage: { sem: 15, fatima: 10, dubois: 10 },   // loon per verkoopdag
    staffXp: [0, 6, 14, 25, 40],          // XP nodig voor level 1–5 (besluit 72: XP uit eigen werk)
    staffXpPer: { semBottle: 1 / 12, semCustomer: 0.5, fatimaSave: 0.6, duboisAnswer: 1, duboisBottle: 0.1 },
    semSpeed: [1.0, 1.3, 1.6, 1.9, 2.2], // Sem: loop- en werktempo (×)
    semLow: 3,                           // Sem vult een vak bij als er ≤ zoveel flessen staan
    semCustomers: [2, 2, 3, 4, 5],       // Sem: extra klanten per dag (folders, stoep vegen; besluit 50)
    fatimaChance: [0.35, 0.45, 0.55, 0.65, 0.75],  // Fatima: kans op een tweede kans
    duboisSkill: [0.6, 0.7, 0.8, 0.88, 0.95],      // Dubois: kans dat hij het antwoord weet
    duboisBonus: [1, 1.25, 1.5, 1.75, 2],      // Dubois: +score per prestigepunt boven 2, voor liefhebbers en statuszoekers (besluit 50)
    duboisBudget: [1.25, 1.3, 1.4, 1.5, 1.6],  // Dubois: kenners geven bij hem zoveel × hun budget uit (besluit 72)

    // Reputatie en niveaus (01_ONTWERP §8)
    levelRep: [0, 28, 80, 155, 245, 355, 490, 650],      // drempel per niveau 1–8 (besluit 76: iets sneller, want minder per niveau + klussen)
    repPerSale: 1, repPrestigeBonus: 1, repWoeker: -2,
  };

  // Klanttypes. budget in euro, wPop/wPrest = gewichten, sens = prijsgevoel,
  // likes = stijlen waar dit type een lichte voorkeur voor heeft (+prefBonus op de score, besluit 35).
  CC.CUSTOMER_TYPES = {
    buurt: {
      name: 'Buurtbewoner', budget: [5, 14], likes: ['soepel', 'fris'], wPop: 0.8, wPrest: 0.2, sens: 1.0, weight: 5, minLevel: 1,
      look: { body: '#5e8a5f', body2: '#2f5541', legs: '#45566b', hair: '#7a4a24', skin: 'skin1', prop: 'bag' },
    },
    koopjes: {
      name: 'Koopjesjager', budget: [3, 9], likes: [], wPop: 0.6, wPrest: 0.0, sens: 1.8, weight: 3, minLevel: 1,
      look: { body: '#d4cbbb', body2: '#a39a8c', legs: '#6b6259', hair: '#a39a8c', skin: 'skin2', prop: 'cap' },
    },
    liefhebber: {
      name: 'Liefhebber', budget: [10, 40], likes: ['stevig', 'aromatisch', 'mineraal'], wPop: 0.5, wPrest: 0.9, sens: 0.6, weight: 3, minLevel: 3,
      look: { body: '#9c2a35', body2: '#6e1a26', legs: '#2f2a36', hair: '#4a2a17', skin: 'skin1', prop: 'scarf' },
    },
    snob: {
      name: 'Statuszoeker', budget: [25, 90], likes: ['bubbels', 'elegant'], distrustBelow: 15, wPop: 0.1, wPrest: 1.4, sens: 0.2, weight: 2, minLevel: 7,
      look: { body: '#26324f', body2: '#1a2238', legs: '#1a2238', hair: '#4a2a17', skin: 'skin1', prop: 'shades' },
    },
  };

  // Investeringen (besluit 60): op een niveau vrijgespeeld, daarna kopen. Eenmalig, blijven de hele run.
  CC.UPGRADES = [
    { id: 'vitrine', name: 'Vitrine', lvl: 3, cost: 100, bonus: 1.0, desc: 'Eén wijn uitgelicht op de proeftafel: die verkoopt veel beter.' },
    { id: 'kast3', name: 'Derde wijnkast', lvl: 4, cost: 100, cust: 2, desc: 'Twee extra schappen. Meer keus: +2 klanten per dag.' },
    { id: 'koeling', name: 'Wijnkoeling', lvl: 5, cost: 120, bonus: 1.0, match: { soort: ['wit', 'bubbels', 'rosé'] }, desc: 'Koud geserveerd: wit, rosé en bubbels verkopen beter.' },
    { id: 'uithangbord', name: 'Verlicht uithangbord', short: 'Uithangbord', lvl: 6, cost: 120, cust: 4, desc: 'Je naam brandt de hele dag. +4 klanten per dag.' },
    { id: 'kast4', name: 'Vierde wijnkast', lvl: 8, cost: 150, cust: 2, desc: 'Nog twee schappen, en weer +2 klanten per dag.' },
  ];
  CC.upgradeById = id => CC.UPGRADES.find(u => u.id === id);

  // Weekklus (B1, handoff na review 2; lijst, hoogtes en beloningen: claude/12_WEEKKLUSSEN.md).
  // Elke zondag vanaf week 3 één klus voor de komende week, naast de niveauklussen. De lat hangt aan vorige week:
  // grow = factor op wat je vorige week deed, plus = extra, min = ondergrens, round = afronden naar boven op een veelvoud,
  // fixed = vaste lat. Wat je zelf stuurt mag iets vragen; wat vooral van de toeloop afhangt blijft dicht bij vorige week.
  // Beloning: cash (euro), rep (reputatie) of discount (eenmalige korting op je volgende bestelling).
  CC.WEEKKLUS = {
    from: 4,   // eerste week met een weekklus (je krijgt hem op de zondag ervoor); week 1–3 blijven zoals ze zijn
    list: [
      { id: 'wk_flessen', giver: 'bankier', kind: 'bottles', grow: 1.10, min: 40, round: 5, reward: { cash: 100 } },
      { id: 'wk_winst', giver: 'bankier', kind: 'profit', grow: 1.10, min: 150, round: 10, reward: { cash: 120 } },
      { id: 'wk_duur', giver: 'bankier', kind: 'pricey', grow: 1.20, min: 6, price: 20, reward: { cash: 150 } },
      { id: 'wk_type', giver: 'bankier', kind: 'type', grow: 1.10, min: 8, reward: { rep: 25 } },
      { id: 'wk_advies', giver: 'bankier', kind: 'advice', fixed: 6, reward: { rep: 25 } },
      { id: 'wk_fatima', giver: 'bankier', kind: 'fatima', grow: 1.20, min: 8, reward: { rep: 20 } },
      { id: 'wk_variety', giver: 'ronnie', kind: 'variety', plus: 1, min: 5, reward: { discount: 0.15 } },
      // bubbels: min 12 → 8 en op: 4 → 2 dagen (bot "alles" haalde ze 39% en 8%; 12_WEEKKLUSSEN §2: niet onder 40%)
      { id: 'wk_bubbels', giver: 'ronnie', kind: 'wine', wines: ['wine_cremant', 'wine_champagne'], grow: 1.20, min: 8, reward: { discount: 0.15 } },
      { id: 'wk_op', giver: 'ronnie', kind: 'noSoldOut', fixed: 2, reward: { discount: 0.20 } },
    ],
  };

  // Niveaus (besluit 76): per niveau één hoofdprijs en één bijprijs (thema), plus een klus die je die prijs leert gebruiken.
  // main/side verwijzen naar wat er op dat niveau vrijkomt (wijn / type / staff / upgrade); de vrijspeel-niveaus zelf staan
  // bij de wijnen, klanttypes, personeel en investeringen (tools/test_fase3.js controleert dat alles klopt).
  // klus: kind = bottles (alle flessen) | wine (flessen van deze wijnen) | type (flessen aan dit klanttype) | variety (verschillende wijnen op één dag) | fatima (klanten teruggehaald)
  CC.LEVELS = {
    1: { klus: { kind: 'bottles', need: 40, rep: 10 } },
    2: { main: [{ staff: 'sem' }], side: [{ wine: 'wine_cremant' }], klus: { kind: 'wine', wines: ['wine_cremant'], need: 12, rep: 15 } },
    3: { main: [{ type: 'liefhebber' }, { wine: 'wine_gewurz' }], side: [{ upgrade: 'vitrine' }], klus: { kind: 'type', type: 'liefhebber', need: 15, rep: 20 } },
    4: { main: [{ upgrade: 'kast3' }], side: [{ wine: 'wine_chablis' }], klus: { kind: 'variety', need: 6, rep: 25 } },
    5: { main: [{ staff: 'fatima' }], side: [{ upgrade: 'koeling' }], klus: { kind: 'fatima', need: 6, rep: 30 } },
    6: { main: [{ wine: 'wine_bordeaux' }, { wine: 'wine_port' }], side: [{ upgrade: 'uithangbord' }], klus: { kind: 'wine', wines: ['wine_bordeaux', 'wine_port'], need: 15, rep: 35 } },
    7: { main: [{ type: 'snob' }, { wine: 'wine_barolo' }], side: [{ staff: 'dubois' }], klus: { kind: 'type', type: 'snob', need: 8, rep: 40 } },
    8: { main: [{ wine: 'wine_champagne' }, { upgrade: 'kast4' }], side: [{ wine: 'wine_gevrey' }], klus: { kind: 'wine', wines: ['wine_champagne'], need: 6, cash: 150 } },
  };

  // Weekkaarten (01_ONTWERP §10, besluit 54). Teksten staan in texts.js onder CC.TEXT.cards[id].
  // Kansen: zondag kies je 1 van 2. Tegenvallers: komen soms op maandag, met een eigen keuze (a/b).
  // Effecten (gelden de hele week tenzij 'days'): match = welke wijnen (soort/land/stijl), bonus = +score,
  // cust = extra klanten per dag, custMul = klantfactor, types = gewicht per klanttype ×, rep = reputatiefactor,
  // block = deze wijnen zijn niet te koop, cost = direct betalen, box = doos zonder etiket.
  CC.CARD_CFG = { mishapChance: 0.25, mishapFrom: 2 };
  CC.CARDS = [
    // --- trends ---
    { id: 'rose', kind: 'trend', lvl: 1, match: { soort: 'rosé' }, bonus: 1.8, cust: 2 },
    { id: 'tapas', kind: 'trend', lvl: 1, match: { land: 'Spanje' }, bonus: 1.8, cust: 2 },
    { id: 'bubbels', kind: 'trend', lvl: 2, match: { soort: 'bubbels' }, bonus: 1.8, cust: 2 },
    { id: 'zoet', kind: 'trend', lvl: 6, match: { stijl: 'zoet' }, bonus: 2.2, cust: 2 },
    // --- events ---
    { id: 'koningsdag', kind: 'event', lvl: 1, days: [5], custMul: 2, match: { soort: ['bubbels', 'rosé'] }, bonus: 1.2 },
    { id: 'braderie', kind: 'event', lvl: 1, cust: 4, types: { koopjes: 2.5 } },
    { id: 'recensie', kind: 'event', lvl: 3, cust: 3, types: { liefhebber: 2, snob: 2 } },
    // --- partij / proeverij ---
    { id: 'doos', kind: 'partij', lvl: 1, cost: 60, box: 12 },
    { id: 'proeverij', kind: 'partij', lvl: 3, cost: 100, days: [5], custMul: 1.5, types: { liefhebber: 3 }, rep: 2 },
    // --- nieuw (keuze HJ, 2026-09-27) ---
    { id: 'hittegolf', kind: 'trend', lvl: 1, match: { soort: ['wit', 'rosé'] }, bonus: 1.6, cust: 2 },
    { id: 'stamppot', kind: 'trend', lvl: 1, match: { stijl: 'stevig' }, bonus: 1.8, cust: 1 },
    { id: 'oesters', kind: 'trend', lvl: 1, match: { soort: 'wit', stijl: 'fris' }, bonus: 2.0 },
    { id: 'introweek', kind: 'event', lvl: 1, cust: 3, types: { koopjes: 3 } },
    { id: 'kunstroute', kind: 'event', lvl: 3, cust: 2, types: { liefhebber: 2 } },
    { id: 'beursgang', kind: 'event', lvl: 7, cust: 1, types: { snob: 3 }, match: { soort: 'bubbels' }, bonus: 1.2 },
    { id: 'koopavond', kind: 'event', lvl: 1, days: [3], custMul: 1.5 },
    { id: 'partij', kind: 'partij', lvl: 1, discount: 0.2 },
    { id: 'bruiloft', kind: 'partij', lvl: 2, order: { match: { soort: 'bubbels' }, n: 24, day: 4, rep: 3, repFail: -3, bonus: 40 } },
    { id: 'buurtapp', kind: 'event', lvl: 2, cust: 1, rep: 1.5 },
    // --- tegenvallers (a = betalen, b = accepteren) ---
    { id: 'koeling', kind: 'mishap', lvl: 1, needs: 'koeling', a: { cost: 90 }, b: { block: { soort: 'wit' }, days: [0, 1, 2] } },
    { id: 'riool', kind: 'mishap', lvl: 1, a: { cost: 60, custMul: 0.95 }, b: { custMul: 0.8 } },
    { id: 'aanslag', kind: 'mishap', lvl: 1, a: { cost: 100 }, b: { gamble: { chance: 0.5, cost: 175 } } },
    { id: 'kassa', kind: 'mishap', lvl: 1, a: { cost: 70 }, b: { custMul: 0.85, days: [0, 1, 2] } },
    { id: 'parkeren', kind: 'mishap', lvl: 1, a: { cost: 60 }, b: { noDelivery: true, days: [0, 1] } },
    { id: 'stroom', kind: 'mishap', lvl: 1, a: { cost: 90 }, b: { closed: true, days: [1] } },
  ];
  CC.cardById = id => CC.CARDS.find(c => c.id === id);

  // Personeel (01_ONTWERP §9). home = vaste plek in de winkel. minLevel = vanaf welk reputatieniveau je hem kunt aannemen.
  CC.STAFF = {
    sem: { name: 'Sem', role: 'Vakkenvuller', get wage() { return CC.CONFIG.staffWage.sem; }, minLevel: 2, home: { x: 6.1, y: 1.45 },
      desc: 'Stagiair. Deelt folders uit, veegt de stoep en vult overdag lege schappen bij.',
      pct: lv => '+' + CC.CONFIG.semCustomers[lv - 1],
      perk: lv => `${CC.STAFF.sem.pct(lv)} klant${CC.CONFIG.semCustomers[lv - 1] === 1 ? '' : 'en'} per dag, vult bij`,   // enkelvoud alleen bij 1
      look: { body: '#5e8a5f', body2: '#2f5541', legs: '#45566b', hair: '#d9a25c', skin: 'skin1', prop: null } },
    fatima: { name: 'Fatima', role: 'Verkoper', get wage() { return CC.CONFIG.staffWage.fatima; }, minLevel: 5, home: { x: 4.35, y: 5.35 },
      desc: 'Klanten die weglopen, krijgen van haar een tweede kans.',
      pct: lv => Math.round(CC.CONFIG.fatimaChance[lv - 1] * 100) + '%',
      perk: lv => `haalt ${CC.STAFF.fatima.pct(lv)} van de weglopers terug`,
      look: { body: '#9c2a35', body2: '#6e1a26', legs: '#2f2a36', hair: '#1f0a0e', skin: 'skin2', prop: null } },
    dubois: { name: 'Meneer Dubois', role: 'Sommelier', get wage() { return CC.CONFIG.staffWage.dubois; }, minLevel: 7, home: { x: 1.45, y: 5.9 },
      desc: 'Kenners kopen bij hem duurder. Hij neemt ook jouw adviesvragen over.',
      pct: lv => Math.round(CC.CONFIG.duboisSkill[lv - 1] * 100) + '%',
      perk: lv => `kenners +${Math.round((CC.CONFIG.duboisBudget[lv - 1] - 1) * 100)}% budget, weet ${CC.STAFF.dubois.pct(lv)}`,
      look: { body: '#26324f', body2: '#1a2238', legs: '#1a2238', hair: '#a39a8c', skin: 'skin1', prop: null } },
  };

  // 12 rollen (spelwaarden) — 01_ONTWERP §4
  CC.ROLES = [
    { id: 'role_01', name: 'Huiswijn rood', kind: 'rood', cost: 3, pop: 5, prest: 1, unlock: 1 },
    { id: 'role_02', name: 'Frisse witte', kind: 'wit', cost: 4, pop: 4, prest: 1, unlock: 1 },
    { id: 'role_03', name: 'Terrasrosé', kind: 'rosé', cost: 4, pop: 4, prest: 1, unlock: 1 },
    { id: 'role_04', name: 'Zonnige rode', kind: 'rood', cost: 5, pop: 4, prest: 2, unlock: 1 },
    { id: 'role_05', name: 'Feestbubbels', kind: 'bubbels', cost: 6, pop: 4, prest: 1, unlock: 2 },
    { id: 'role_06', name: 'Strak wit', kind: 'wit', cost: 9, pop: 3, prest: 2, unlock: 4 },
    { id: 'role_07', name: 'Aromatisch wit', kind: 'wit', cost: 8, pop: 2, prest: 3, unlock: 3 },
    { id: 'role_08', name: 'Serieuze Fransman', kind: 'rood', cost: 13, pop: 3, prest: 3, unlock: 6 },
    { id: 'role_09', name: 'Zoet / versterkt', kind: 'dessert', cost: 11, pop: 2, prest: 3, unlock: 6 },
    { id: 'role_10', name: 'Italiaans prestige', kind: 'rood', cost: 20, pop: 2, prest: 4, unlock: 7 },
    { id: 'role_11', name: 'Champagne', kind: 'bubbels', cost: 22, pop: 2, prest: 4, unlock: 8, scarce: 8 },
    { id: 'role_12', name: 'Het pronkstuk', kind: 'rood', cost: 40, pop: 1, prest: 5, unlock: 8, scarce: 4 },
  ];

  // Wijnen per rol: TYPE + DRUIF, geen merken (04 besluit 31).
  // name = wat de klant zegt ("een Chablis"), druif = lijst (voor advies: "geen Chardonnay" vangt ook Champagne),
  // regio/land = kaartje + trends, stijl = adviesvragen zonder wijnkennis, bij = gelegenheden/gerechten.
  // sub = druif als tekst (UI). glass = fleskleur, cap = capsule, label = etiket, shape: 'bdx' | 'bourg' | 'flute' | 'sparkle' | 'port'
  CC.WINES = [
    { id: 'wine_merlot', role: 'role_01', name: 'Merlot', druif: ['Merlot'], regio: "Pays d'Oc", country: 'Frankrijk',
      stijl: ['soepel'], bij: ['pasta', 'pizza', 'doordeweeks', 'stamppot'],
      glass: '#1f3a2e', cap: '#9c2a35', label: '#f7ebc8', label2: '#9c2a35', shape: 'bdx',
      blurb: 'Rond, zacht, niemand klaagt. De huiswijn van half Nederland.' },
    { id: 'wine_sauvignon', role: 'role_02', name: 'Sauvignon Blanc', druif: ['Sauvignon Blanc'], regio: 'Touraine', country: 'Frankrijk',
      stijl: ['fris'], bij: ['vis', 'salade', 'geitenkaas', 'terras', 'oesters', 'kip', 'bbq'],
      glass: '#9dbb86', cap: '#2f5541', label: '#fdf6e3', label2: '#2f5541', shape: 'bourg', wine: '#e3d3ad',
      blurb: 'Kruisbes, gras, citroen. Fris zonder gedoe.' },
    { id: 'wine_provence', role: 'role_03', name: 'Provence rosé', druif: ['Grenache', 'Cinsault'], regio: 'Provence', country: 'Frankrijk',
      stijl: ['fris'], bij: ['terras', 'bbq', 'salade'],
      glass: '#c4e0e3', cap: '#d4cbbb', label: '#fdf6e3', label2: '#c9484f', shape: 'bourg', wine: '#f1c7a0',
      blurb: 'Zo bleek als een Hollandse zomer. Verkoopt zichzelf vanaf mei.' },
    { id: 'wine_rioja', role: 'role_04', name: 'Rioja Crianza', druif: ['Tempranillo'], regio: 'Rioja', country: 'Spanje',
      stijl: ['stevig', 'hout'], bij: ['bbq', 'stoofvlees', 'tapas', 'stamppot', 'biefstuk', 'lam'],
      glass: '#1f0a0e', cap: '#e8b53a', label: '#e8b53a', label2: '#9c2a35', shape: 'bdx',
      blurb: 'Vanille en kers. Het eikenhout doet flink zijn best.' },
    { id: 'wine_cremant', role: 'role_05', name: 'Crémant de Loire', druif: ['Chenin Blanc'], regio: 'Loire', country: 'Frankrijk',
      stijl: ['bubbels', 'fris'], bij: ['feest', 'aperitief', 'oesters'],
      glass: '#2f5541', cap: '#f7ebc8', label: '#fdf6e3', label2: '#2f5541', shape: 'sparkle',
      blurb: 'Champagnemethode, een derde van de prijs. Niemand merkt het. Bijna niemand.' },
    { id: 'wine_chablis', role: 'role_06', name: 'Chablis', druif: ['Chardonnay'], regio: 'Bourgogne', country: 'Frankrijk',
      stijl: ['fris', 'mineraal'], bij: ['oesters', 'vis', 'kip'],
      glass: '#9dbb86', cap: '#e8b53a', label: '#fdf6e3', label2: '#1f0a0e', shape: 'bourg', wine: '#f0e6b0',
      blurb: 'Chardonnay, maar dan zonder de boter. Mensen schrikken als je dat zegt.' },
    { id: 'wine_gewurz', role: 'role_07', name: 'Gewurztraminer', druif: ['Gewurztraminer'], regio: 'Elzas', country: 'Frankrijk',
      stijl: ['aromatisch'], bij: ['aziatisch', 'kaas'],
      glass: '#5e8a5f', cap: '#e8b53a', label: '#f7ebc8', label2: '#9c2a35', shape: 'flute',
      blurb: 'Lychee en rozen. Bij de Thai, of je vindt het niks.' },
    { id: 'wine_bordeaux', role: 'role_08', name: 'Bordeaux', druif: ['Cabernet Sauvignon', 'Merlot'], regio: 'Haut-Médoc', country: 'Frankrijk',
      stijl: ['stevig', 'hout'], bij: ['biefstuk', 'stoofvlees', 'kaas', 'lam'],
      glass: '#1f3a2e', cap: '#6e1a26', label: '#f7ebc8', label2: '#1f0a0e', shape: 'bdx',
      blurb: 'Cassis, ceder, tannine. Heeft nog wat jaartjes nodig.' },
    { id: 'wine_port', role: 'role_09', name: 'Port LBV', druif: ['Touriga Nacional'], regio: 'Douro', country: 'Portugal',
      stijl: ['zoet'], bij: ['kaas', 'dessert'],
      glass: '#1f0a0e', cap: '#1f0a0e', label: '#f7ebc8', label2: '#9c2a35', shape: 'port',
      blurb: 'Voor bij de kaas. Of in plaats van de kaas.' },
    { id: 'wine_barolo', role: 'role_10', name: 'Barolo', druif: ['Nebbiolo'], regio: 'Piemonte', country: 'Italië',
      stijl: ['stevig'], bij: ['stoofvlees', 'truffel', 'pasta', 'biefstuk', 'wild'],
      glass: '#1f3a2e', cap: '#9c2a35', label: '#fdf6e3', label2: '#e8b53a', shape: 'bourg',
      blurb: 'Teer en rozen. Geduld wordt beloond.' },
    { id: 'wine_champagne', role: 'role_11', name: 'Champagne brut', druif: ['Chardonnay', 'Pinot Noir', 'Meunier'], regio: 'Champagne', country: 'Frankrijk',
      stijl: ['bubbels'], bij: ['feest', 'aperitief', 'oesters'],
      glass: '#1f3a2e', cap: '#e8b53a', label: '#fdf6e3', label2: '#e8b53a', shape: 'sparkle',
      blurb: 'Het geluid van een feestje dat te duur is.' },
    { id: 'wine_gevrey', role: 'role_12', name: 'Gevrey-Chambertin', druif: ['Pinot Noir'], regio: 'Bourgogne', country: 'Frankrijk',
      stijl: ['elegant'], bij: ['eend', 'wild', 'kaas', 'truffel'],
      glass: '#2f5541', cap: '#45101a', label: '#f7ebc8', label2: '#45101a', shape: 'bourg',
      blurb: 'Pinot Noir voor mensen die over Pinot Noir praten.' },
  ];
  // sub = korte druiftekst voor de UI (max ± 150 px incl. regio); volledige lijst staat in druif
  const SUB = { wine_provence: 'Grenache', wine_bordeaux: 'Cabernet/Merlot', wine_champagne: 'Chardonnay/Pinot' };
  for (const w of CC.WINES) w.sub = SUB[w.id] || w.druif.join('/');

  // Oude wijn-ID's (merken, t/m 2026-09-24) → nieuwe. Gebruikt bij laden van een save.
  CC.WINE_ID_MIGRATE = {
    wine_gato_negro: 'wine_merlot', wine_picpoul: 'wine_sauvignon', wine_gris_blanc: 'wine_provence', wine_mucho_mas: 'wine_rioja',
    wine_freixenet: 'wine_cremant', wine_bread_butter: 'wine_chablis', wine_hugel: 'wine_gewurz', wine_pech_redon: 'wine_bordeaux',
    wine_taylors_lbv: 'wine_port', wine_fontanafredda: 'wine_barolo', wine_moet: 'wine_champagne', wine_daumas_gassac: 'wine_gevrey',
  };

  // Reserve: klaar om een rol te wisselen of later toe te voegen (niet actief in het spel).
  CC.WINES_RESERVE = [
    { role: 'role_02', name: 'Picpoul de Pinet', druif: ['Picpoul'], regio: 'Languedoc', stijl: ['fris'], bij: ['oesters', 'vis'] },
    { role: 'role_02', name: 'Muscadet', druif: ['Melon de Bourgogne'], regio: 'Loire', stijl: ['fris'], bij: ['oesters', 'mosselen'] },
    { role: 'role_04', name: 'Côtes du Rhône', druif: ['Grenache', 'Syrah'], regio: 'Rhône', stijl: ['stevig'], bij: ['bbq', 'stoofvlees'] },
    { role: 'role_05', name: 'Prosecco', druif: ['Glera'], regio: 'Veneto', stijl: ['bubbels'], bij: ['feest', 'aperitief'] },
    { role: 'role_07', name: 'Elzas Riesling', druif: ['Riesling'], regio: 'Elzas', stijl: ['aromatisch', 'fris'], bij: ['vis', 'aziatisch'] },
    { role: 'role_08', name: 'Saint-Chinian', druif: ['Syrah', 'Grenache'], regio: 'Languedoc', stijl: ['stevig'], bij: ['lam', 'bbq'] },
    { role: 'role_09', name: 'Sauternes', druif: ['Sémillon'], regio: 'Bordeaux', stijl: ['zoet'], bij: ['dessert', 'foie gras'] },
    { role: 'role_12', name: 'Châteauneuf-du-Pape', druif: ['Grenache', 'Syrah', 'Mourvèdre'], regio: 'Rhône', stijl: ['stevig'], bij: ['wild', 'stoofvlees'] },
  ];

  // --- Kamerindeling (isometrische tegels; 1 tegel ≈ 1 meter) ---
  // Layout B: vierkante kamer 8×8, schuine achterhoek met toonbank + logo.
  // Beide zijwanden spiegelbeeldig: twee kasten vanaf de toonbank, raam vooraan. Vat en kisten aan de open voorranden.
  CC.ROOM = {
    tw: 27.2, th: 13.6,             // gemeten in de geschilderde achtergrond (1 tegel ≈ 1 m)
    w: 8, d: 8, wallH: 127, chamfer: 2,
    originX: 317, originY: 120,
    door: { x: 8, y: 5.4 },
    outside: { x: 9.5, y: 5.4 },
    counter: { x: 2.3, y: 2.3 },
    // wachtplekken voor de kassa (waaier langs de toonbank, nooit richting de tafel)
    queue: [[2.3, 2.3], [2.85, 1.8], [1.8, 2.85], [3.4, 1.55], [1.55, 3.4], [3.95, 1.45], [1.45, 3.95]],
  };

  // Geschilderde achtergrond (02_ART §10). Alle maten in 640×360-pixels, gemeten met tools/.
  CC.BG = {
    image: 'assets/bg_start.png',
    // altijd het schemerbeeld (besluit 56: dag/nacht geschrapt, de sfeer van de schemer wint)
    layers: { shelf_3: 'assets/layer_shelf_3.png', shelf_4: 'assets/layer_shelf_4.png', table: 'assets/layer_table.png',
      decor_lampjes: 'assets/layer_decor_lampjes.png', decor_olijf: 'assets/layer_decor_olijf.png', decor_monstera: 'assets/layer_decor_monstera.png',
      decor_stoepbord: 'assets/layer_decor_stoepbord.png', decor_terras: 'assets/layer_decor_terras.png' },
    // plankniveaus per kast: y = c + slope * x (tools/measure_planks.py); vak A = rij 0–1, vak B = rij 2–3
    planks: {
      // D1 (nieuwe achtergrond 2026-11-13): opnieuw gemeten; oud: shelf_1 383–410 [-84,-66,-48,-30], shelf_2 229–255 [236,254,272,290],
      // shelf_3 425–452 [-84,-66,-48,-30], shelf_4 188–213 [236,254,272,290]
      shelf_1: { slope: 0.5, x0: 381, x1: 410, rows: [-80, -62, -42, -24] },
      shelf_2: { slope: -0.5, x0: 228, x1: 255, rows: [239, 258, 277, 296] },
      shelf_3: { slope: 0.5, x0: 424, x1: 452, rows: [-82, -64, -44, -24] },
      shelf_4: { slope: -0.5, x0: 186, x1: 213, rows: [237, 256, 275, 294] },
    },
    phone: { x: 284, y: 116, w: 26, h: 22 },
    register: { x: 326, y: 108, w: 30, h: 32 },
    counterOutline: { x: 276, y: 128, w: 90, h: 44 },
    tableTop: { cx: 324, cy: 205 },
    // Vitrine (besluit 62): houten trapje op de tafel, gemeten in bg_start.png. Voetpunten van de flessen per trede.
    vitrine: { top: [[319, 192], [327, 194], [335, 196]], low: [[307, 204], [315, 206], [323, 208]], flame: { x: 348, y: 183 } },   // D1: trapje (-4,+6), kaars (-5,+3) t.o.v. de oude achtergrond
    sign: { x: 285, y: 49 },
  };

  // Titelscherm (assets/title_bg.png): logo hangt als uithangbord boven de etalage.
  CC.TITLE = { image: 'assets/title_bg.png', logoX: 360, logoY: 12,
    // blinkjes op het logo: rechterbovenhoekjes van de letters (licht tegen donker), relatief t.o.v. linksboven van logo_main.png
    sparkles: [[25, 38], [39, 64], [47, 49], [56, 22], [60, 46], [73, 23], [84, 72], [87, 21], [89, 60], [105, 9], [105, 58], [109, 20], [118, 44], [120, 57], [136, 14], [142, 53], [154, 23], [156, 51], [158, 11], [178, 9], [184, 21], [186, 47], [193, 55], [199, 6], [204, 45], [213, 4], [219, 44], [234, 42]] };

  // Maatvoering (zie 04 besluit 27): toonbank eindigt op x/y ≈ 2,75 → kasten beginnen op 2,9.
  CC.FURNITURE = [
    { id: 'shelf_1', kind: 'shelf', o: 'back', x: 2.9, y: 0, w: 1.4, d: 0.75, vakken: ['vak_1', 'vak_2'], level: 1 },
    { id: 'shelf_2', kind: 'shelf', o: 'left', x: 0, y: 2.9, w: 0.75, d: 1.4, vakken: ['vak_3', 'vak_4'], level: 1 },
    { id: 'shelf_3', kind: 'shelf', o: 'back', x: 4.5, y: 0, w: 1.4, d: 0.75, vakken: ['vak_5', 'vak_6'], level: 3, upgrade: 'kast3' },
    { id: 'shelf_4', kind: 'shelf', o: 'left', x: 0, y: 4.5, w: 0.75, d: 1.4, vakken: ['vak_7', 'vak_8'], level: 5, upgrade: 'kast4' },
    { id: 'counter', kind: 'counterFront', x: 1.5, y: 1.5, w: 0.3, d: 0.3, h: 30, front: 3.65, back: 2.75, px: 76, level: 1 },
    { id: 'table', kind: 'table', x: 3.28, y: 3.46, w: 2.14, d: 1.22, h: 29, level: 1, block: true },
    { id: 'barrel', kind: 'barrel', x: 0.15, y: 6.65, w: 0.65, d: 0.65, level: 1, block: true },
    { id: 'crates', kind: 'crates', x: 6.6, y: 0.15, w: 0.65, d: 0.55, level: 1, block: true },
    // Winkelfases (besluit 63): decor uit tools/build_bg.py. Fase 2 = niveau 3, fase 3 = niveau 6. x/y alleen voor de diepte.
    // (tegels op het niveauscherm: assets/tile_aankleding<fase>.png via tools/build_bg.py; teksten in texts.js → decorTile)
    { id: 'decor_lampjes', kind: 'decor', layer: 'decor_lampjes', x: 0, y: 0, w: 0, d: 0, level: 6, twinkle: true },
    { id: 'decor_olijf', kind: 'decor', layer: 'decor_olijf', x: 0.3, y: 7.4, w: 0.4, d: 0.4, level: 3 },
    { id: 'decor_monstera', kind: 'decor', layer: 'decor_monstera', x: 7.4, y: 0.3, w: 0.4, d: 0.4, level: 3 },
    { id: 'decor_stoepbord', kind: 'decor', layer: 'decor_stoepbord', x: 9.4, y: 3.4, w: 0.4, d: 0.4, level: 3 },
    { id: 'decor_terras', kind: 'decor', layer: 'decor_terras', x: 5.6, y: 9.0, w: 0.8, d: 0.8, level: 6 },
  ];
  // Niveau → tegel "Nieuwe aankleding" (fase 2 op niveau 3, fase 3 op niveau 6)
  CC.DECOR_TILES = { 3: 'assets/tile_aankleding2.png', 6: 'assets/tile_aankleding3.png' };
  CC.WALL = {
    windowsBack: [{ x0: 6.25, x1: 7.65 }],
    windowsLeft: [{ y0: 6.25, y1: 7.65 }],
    sign: { wall: 'front', z0: 54 },
    rug: { x: 2.9, y: 3.0, w: 2.9, d: 2.15 },
  };

  // Kijkrichting van de gegenereerde sprites (-1 = links, 1 = rechts); wordt gespiegeld naar de looprichting.
  CC.SPRITE_FACING = {
    // alle figuren uit de bladen van 2026-11-12: vooraanzicht kijkt linksvoor, achteraanzicht loopt naar rechts weg
    buurt: { front: -1, back: 1 }, buurt2: { front: -1, back: 1 }, buurt3: { front: -1, back: 1 }, buurt4: { front: -1, back: 1 },
    buurt5: { front: -1, back: 1 }, buurt6: { front: -1, back: 1 }, buurt7: { front: -1, back: 1 }, koopjes: { front: -1, back: 1 },
    koopjes2: { front: -1, back: 1 }, koopjes3: { front: -1, back: 1 }, liefhebber: { front: -1, back: 1 }, liefhebber2: { front: -1, back: 1 },
    liefhebber3: { front: -1, back: 1 }, liefhebber4: { front: -1, back: 1 }, liefhebber5: { front: -1, back: 1 }, snob: { front: -1, back: 1 },
    snob2: { front: -1, back: 1 }, snob3: { front: -1, back: 1 }, sem: { front: -1, back: 1 }, fatima: { front: -1, back: 1 },
    dubois: { front: -1, back: 1 },
  };

  // Staplek voor klanten per schap (voor het schap)
  CC.shelfSpot = function (f) { return f.o === 'left' ? { x: f.x + f.w + 0.6, y: f.y + f.d / 2 } : { x: f.x + f.w / 2, y: f.y + f.d + 0.6 }; };

  // Schapnummer voor de speler: vak_1 = Schap 1 … vak_8 = Schap 8 (besluit 40).
  CC.vakNumber = function (vakId) { return +String(vakId).replace('vak_', ''); };

  CC.roleById = function (id) { return CC.ROLES.find(r => r.id === id); };
  CC.wineById = function (id) { return CC.WINES.find(w => w.id === id); };
  CC.wineCost = function (w) { return CC.roleById(w.role).cost; };
  CC.standById = function (id) { return CC.CONFIG.priceStands.find(s => s.id === id); };
  CC.priceFor = function (wine, standId) {
    const f = CC.standById(standId).factor;
    return Math.round(CC.wineCost(wine) * f * 2) / 2;
  };

  if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
