// Château Cashflow — texts.js
// Alle teksten. Toon: droog en herkenbaar Hollands.
(function (root) {
  const CC = root.CC = root.CC || {};

  CC.TEXT = {
    bubble: {
      bought: [
        'Doe maar twee.', 'Die had mijn zwager ook.', 'Prima, prima.', 'Voor vanavond. En morgen.',
        'Pinnen graag.', 'Mooi. Tasje hoeft niet.', 'Deze is goed, toch?', 'Zo. Gezellig.',
      ],
      tooExpensive: [
        'Voor dat geld ga ik naar de Appie.', 'Zoveel? Voor druivensap?', 'Ik kijk even verder.',
        'Pfoe. Nee.', 'Is dat de prijs per doos?', 'Mijn budget zegt nee.', 'Ik wacht de aanbieding af.',
      ],
      nothing: [
        'Hebben jullie iets met een dier op het etiket?', 'Niks voor mij vandaag.', 'Ik kom later terug. Misschien.',
        'Ik zoek iets... anders.', 'Hmm. Nee.', 'Ik weet niet wat ik zoek, maar dit is het niet.',
      ],
      soldOut: [
        'Stond hier gisteren niet een {wine}?', 'Geen {wine} meer? Serieus?', 'Hè, {wine} op.',
        'Ik kwam speciaal voor de {wine}.', 'Leeg? Dan ga ik wel naar de Gall.',
      ],
      browsing: ['...', 'Hmm...', 'Eens kijken...', 'Rood of wit...'],
    },
    result: {
      title: 'Kassabon',
      goodDay: ['Nette dag.', 'De kassa zingt.', 'Daar kun je mee thuiskomen.'],
      badDay: ['Het kan altijd erger.', 'Morgen beter.', 'De buurman had ook geen klanten. Denk ik.'],
    },
    // De eerste 5 minuten (M7, besluit 78): intro van de bankier, checklist "Je eerste dag", uitleg op de juiste momenten
    // buiten op straat (M7b): voorbijgangers en grapjes als de winkel dicht is
    street: {
      lookOpen: ['Hé, een wijnwinkel.', 'Mooie etalage.', 'Straks misschien.', 'Is die Bordeaux lekker?'],
      lookClosed: ['Morgen maar eens.', 'Wanneer gaan ze open?', 'Mooie etalage.'],
      late: ['Dicht?!', 'Nee hè. Dicht.', 'Hallo? Iemand?'],
      lateBye: ['Morgen dan maar.', 'Zucht.', 'Ik kom terug!', 'Dan maar water.'],
      nap: 'Zzz',
      bell: 'Tring!',   // fietser (besluit 98)
    },
    tutorial: {
      introTitle: 'Gefeliciteerd met uw winkel',
      intro: [
        'Balthazar Montenegro, J.P. Morgenstond & Co. U heeft bij ons geleend om deze wijnhandel over te nemen.',
        'Elke zondag bel ik voor de aflossing. De eerste is {first}; daarna wordt het elke week meer, tot {last} in week 8. Haalt u dat, dan bent u schuldenvrij.',
        'Uw winkel moet dus sneller groeien dan mijn termijnen. Eén keer uitstel kan, daarna houdt het op. Succes.',
      ],
      introBtn: 'Aan de slag',
      listTitle: 'Je eerste dag',
      items: {
        forecast: { text: 'Kijk wie er vandaag komt', tip: 'Linksboven: hoeveel klanten van elk type er komen, met hun budget. Beweeg erover voor wat ze willen.' },
        order: { text: 'Bestel wijn bij Ronnie', tip: 'Klik op de telefoon. Elke klant kiest één soort wijn en neemt er 1 tot 3 flessen van. Een paar soorten die bij je klanten passen is genoeg.' },
        prices: { text: 'Kijk naar je prijzen', tip: 'Klik op de kassa. De balkjes laten zien welk deel van de klanten van vandaag een prijs kan betalen.' },
        open: { text: 'Open de winkel', tip: 'Rechtsonder. Na de dag zie je op de kassabon wat het opleverde.' },
      },
      firstReport: 'Reputatie verdien je met elke verkoop, dure wijn telt dubbel en goed advies telt mee. Genoeg reputatie is een nieuw niveau: meer klanten en nieuwe wijnen.',
      firstSale: 'Elke klant zoekt één soort wijn die bij hem past en binnen zijn budget valt. Is hij op of te duur, dan loopt hij weg.',
    },
    tagline: 'Eén wijnhandel. Eén lening. Acht weken.',
    // Intro bij de eerste start (besluit 86, src/intro.js). Droog, geen uitroeptekens.
    intro: {
      place: 'Utrecht, maandag, 07:12',
      board: 'TE KOOP',
      boardSub: 'ook geschikt als kantoor',
      bankFirst: 'De bank was er eerder.',
      lastLine: 'Nu alleen nog klanten.',
      click: 'klik',
      skip: 'Klik om over te slaan',
      start: 'Klik om te beginnen',
      menuBtn: 'Intro',
      menuTip: 'De intro opnieuw afspelen',
      letter: {
        bank: 'J.P. MORGENSTOND & CO.',
        since: 'Bankiers sinds 1891',
        place: 'Utrecht, maandag',
        re: 'Betreft: uw financieringsverzoek',
        salute: 'Geachte heer, mevrouw,',
        verdict: 'Financieringsverzoek gehonoreerd.',
        term: 'Looptijd', termVal: '{n} weken',
        when: 'Aflossing', whenVal: 'elke zondag',
        first: 'Eerste termijn', last: 'Laatste termijn',
        wish: '',   // leeg: de succeswens staat in de kleine lettertjes
        greet: 'Met vriendelijke groet,',
        name: 'B. Montenegro', role: 'accountmanager',
        stamp: 'GEHONOREERD',
        // kleine lettertjes onderaan de brief (keuze HJ): één regel per punt, lange regels lopen vanzelf door
        small: [
          'Let op: geld lenen kost geld. Wijn ook.',
          'Wij wensen u veel succes. Wij hebben ook een afdeling Bijzonder Beheer.',
        ],
      },
    },
    hint: {
      emptyShop: 'Je schappen zijn leeg. Bel eerst de leverancier (telefoon) en zet wijn in een schapvak.',
      firstDay: 'Klik op de telefoon om wijn te bestellen.',
      emptyOpen: 'Je schappen zijn leeg: er komt niemand iets kopen, maar de huur betaal je wel. Klik nog een keer op "Winkel openen" om toch open te gaan.',
    },
    bank: {
      name: 'Balthazar Montenegro',
      role: 'accountmanager, J.P. Morgenstond & Co.',
      bank: 'J.P. Morgenstond & Co.',
      ok: [
        'Goedemiddag. De aflossing van {due} staat klaar, zie ik. Keurig.',
        'Montenegro hier, J.P. Morgenstond. {due} deze week. Ik neem aan dat dat lukt?',
        'Ah, de wijnhandel. Uw aflossing van {due}. Mag ik?',
        'Zondag, dus u weet waarom ik bel. {due}. Uw saldo ziet er gezond uit.',
        'Ik stoor u niet lang. {due}, zoals afgesproken. Dat past ruim.',
        'Mijn collega\'s vragen wel eens hoe het met de wijnzaak gaat. Ik zeg dan: prima. {due} deze week.',
        'Montenegro. Ik heb een glas van uw rosé geproefd, bij mijn schoonmoeder. Enfin: {due}.',
      ],
      tight: [
        'Het wordt krap, hè? {due} deze week. Het lukt nét.',
        'Ik zie dat het spannend is. {due}, en dan houdt u {left} over.',
        'Eh. {due}. U houdt er {left} aan over. Ik zou maandag niet te gek inkopen.',
        'Het past, maar ik hoorde u net uitademen. {due}, rest {left}.',
        'Montenegro. {due}. Na betaling staat er {left}. Ik noteer: krap maar keurig.',
        'Knap gedaan, op het randje. {due}, en {left} blijft er staan.',
      ],
      short: [
        'Ik zie {cash} op uw rekening en u moet {due} aflossen. Dat is {short} te weinig.',
        'Montenegro. Ik heb slecht nieuws, of eigenlijk u: {cash} op de rekening, {due} verschuldigd. {short} tekort.',
        'Ik ga het niet mooier maken dan het is. {due} aflossen, {cash} in kas. Er ontbreekt {short}.',
        'Ik heb het drie keer nagerekend. {short} tekort op een termijn van {due}.',
      ],
      postponeOffer: [
        'Eén keer kan ik uitstel geven. Dan schuift het door naar volgende week, plus {fine} administratiekosten.',
        'Ik kan één keer een oogje dichtknijpen. Volgende week alles, plus {fine} voor de moeite.',
        'Er is één uitweg: uitstel. Eenmalig, {fine} kosten, en volgende week betaalt u beide termijnen.',
      ],
      postponed: [
        'Genoteerd. Volgende week verwacht ik {next}. Ik reken op u.',
        'Goed. {next} volgende week. Ik zet het in mijn agenda, met rood.',
        'Afgesproken. Volgende week {next}. Ik zou maar een goede week draaien.',
      ],
      noMore: [
        'Uitstel heeft u al gehad. Het spijt me, maar hier houdt het op.',
        'Een tweede keer uitstel kan ik niet verantwoorden. Mijn directeur leest mee.',
      ],
      paid: ['Dank u. Tot volgende week.', 'Genoteerd. Fijn weekend nog.', 'Keurig. U hoort van mij.', 'Ontvangen. Ik drink er vanavond een glaasje op. Niet van u, helaas.', 'Prima. Dan tot volgende zondag, zelfde tijd.', 'Afgeschreven. U maakt mijn week makkelijk.'],
      firstWeek: 'Eerste zondag, eerste termijn: {due}. Volgende week is het {next}, en zo loopt het op tot {last}. Uw winkel moet sneller groeien dan mijn termijnen.',
      lastWeek: 'Dit is hem dan, de laatste: {due}. Daarna bent u van mij af.',
      bankrupt: [
        'Het spijt me oprecht. Ik moet de lening opeisen. Ik heb uw Merlot altijd gewaardeerd.',
        'Dit is het gedeelte van mijn werk dat ik niet leuk vind. De bank neemt het over.',
        'Ik sluit het dossier. Mocht u ooit opnieuw beginnen: u weet mijn nummer.',
      ],
      won: 'Dit was de laatste termijn. U bent schuldenvrij. Gefeliciteerd, echt waar.',
      endless: 'Geen aflossing meer. Ik bel alleen nog voor de gezelligheid.',
    },
    supplier: {
      name: 'Ronnie Vermeulen',
      company: 'Vermeulen Dranken, Barendrecht',
      greet: 'Ja, zeg het maar.',
    },
    // Klantprognose (besluit 57): wat wil elk type? Budget komt uit config.js.
    typeInfo: {
      buurt: { many: 'buurtbewoners', one: 'buurtbewoner', want: 'houdt van soepel en fris, let een beetje op de prijs' },
      koopjes: { many: 'koopjesjagers', one: 'koopjesjager', want: 'kijkt vooral naar de prijs; scherp geprijsd trekt' },
      liefhebber: { many: 'liefhebbers', one: 'liefhebber', want: 'wil kwaliteit: stevig, aromatisch, mineraal' },
      snob: { many: 'statuszoekers', one: 'statuszoeker', want: 'wil indruk maken: bubbels, elegant; wantrouwt alles onder €15' },
    },
    forecast: { title: 'Vandaag verwacht', total: '{n} klanten' },
    orderNotice: {
      title: 'Vrijdag: de bruiloft',
      ok: 'Het bruidspaar haalt 24 flessen op. {paid} in de kassa (met fooi) en reputatie +{rep}. De bruid huilde een beetje.',
      fail: 'Je had maar {have} flessen mousserend in huis. Het bruidspaar is naar de supermarkt gegaan. Reputatie {rep}.',
      remind: 'Morgen bij opening haalt het bruidspaar {need} flessen mousserend op. Nu in huis: {have}. Bestel morgenochtend bij.',
    },
    assort: {
      proposal: 'Ik heb aangevuld tot je lijst van gisteren. Kijk even, en zeg het maar.',
      empty: 'Wat mag het zijn? Per zes of per twaalf, ik lever direct.',
      first: 'Je eerste bestelling. Per zes of per twaalf, ik lever direct. Morgen stel ik voor aan te vullen tot wat je nu neemt.',
      done: 'Komt eraan. Nog iets?',
      blocked: 'Mijn busje staat bij de wegsleepdienst. Woensdag ben ik er weer.',
      forVak: 'Wat moet er in schap {n}? Kies een wijn, of bestel er eentje bij.',
      pricesIntro: ['Scherp: meer kopers, minder marge. Stevig: meer marge, koopjesjagers haken af.', 'Woeker: bijna niemand koopt, en elke verkoop kost reputatie.'],
      pricesFoot: 'De balkjes zijn een schatting: wie van de verwachte klanten deze prijs kan betalen. Of ze kopen, hangt ook af van smaak en je andere flessen.',
      budgetHelp: 'Per klanttype van vandaag: welk deel heeft genoeg budget voor deze prijs. Groen = de meesten, rood = bijna niemand.',
      woekerTip: 'Woeker: elke verkoop kost 2 reputatie',
    },
    scarceNotice: {
      title: 'Nieuw en schaars',
      text: 'Op is op: pas maandag heeft Ronnie weer nieuwe. Je vaste bestelling vult aan zolang hij ze heeft.',
      tip: 'Tip: schaarse flessen kun je stevig prijzen. Liefhebbers en statuszoekers betalen het wel.',
    },
    invest: {
      intro: 'Eenmalig betalen, elke dag plezier van.',
      buyTip: 'Kopen: direct in gebruik',
      vitrinePick: 'In de vitrine:',
      vitrineEmpty: 'zet eerst wijn op je schap',
      newHint: 'Nieuw te koop: {name} ({cost}). Kijk bij "Investeren" (toets I).',
    },
    order: {
      delivered: 'Ronnie heeft geleverd: {list} ({cost})',
      short: 'Te weinig kas voor de hele bestelling: {list}',
      scarce: 'Op bij Ronnie voor deze week: {list}. Maandag heeft hij weer nieuwe.',
      pending: 'Ronnie heeft je bestelling klaarstaan: {n} flessen, {cost}. Klik op de telefoon om te bestellen (of aan te passen).',
      blocked: 'Ronnie staat bij de wegsleepdienst. Vandaag geen levering; woensdag is hij er weer.',
      nothing: 'Geen levering nodig: alles is op peil.',
    },
    staff: {
      sem: ['Bijgevuld!', 'Staat weer vol.', 'Waar moet deze?', 'Is dit rood of rosé?', 'Stagiair van de maand.'],
      fatima: ['Heeft u deze al geproefd?', 'Mag ik iets aanraden?', 'Wacht, ik weet er een.', 'Neem deze, die is lekker.'],
      dubois: ['Laat mij maar.', 'Ah. Ik weet precies wat u zoekt.', 'Permettez-moi.', 'Een klassieker, mevrouw.'],
      // tussendoor, als er niets te doen is (M7b)
      idle: {
        sem: ['Ik tel de flessen. Weer.', 'Zo ruikt eikenhout dus.', 'Is Merlot een druif of een dorp?', 'Wie heeft hier gestofzuigd? Ik.', 'Deze kurk zit scheef.'],
        fatima: ['Die moet meer naar voren.', 'Vandaag verkoop ik er tien.', 'Het etiket hangt scheef.', 'Ik hoor mevrouw Jansen al.'],
        dubois: ['Tannines. Prachtig.', 'In Bourgogne doen ze dit anders.', 'Wijn zonder verhaal is druivensap.', 'Deze fles verdient een beter schap.'],
      },
      hired: ['{name} begint morgen.', '{name} is aangenomen.'],
      levelUp: {
        sem: '{name} haalt nu {pct} klanten per dag binnen!',
        fatima: '{name} haalt nu {pct} van de weglopers terug!',
        dubois: '{name} weet nu {pct} van de antwoorden en verkoopt dure flessen nog makkelijker!',
      },
      // XP uit eigen werk (besluit 72): hoe verdien je het, en wat deden ze vandaag (kassabon)
      xpHow: {
        sem: 'XP: 1 per 12 flessen die hij bijvult, 0,5 per folderklant die iets koopt.',
        fatima: 'XP: 1 per klant die ze terughaalt.',
        dubois: 'XP: 1 per vraag die hij beantwoordt, 1 per 10 dure flessen die hij verkoopt.',
      },
      bon: {
        sem: 'Sem: {refill} bijgevuld, {folder} via folder',
        fatima: 'Fatima: {saved} klant{s} teruggehaald',
        dubois: 'Dubois: {answered} vr., {bottles} dure fl.',
      },
      yesterday: 'gisteren +{xp} XP',
    },
    // Niveaus (besluit 76): thema, hoofdprijs en bijprijs zoals het niveauscherm ze noemt
    levels: {
      2: { theme: 'Een stagiair', main: 'Sem kan komen werken', mainSub: 'folders, bijvullen', side: 'Crémant de Loire', sideSub: 'bubbels' },
      3: { theme: 'De kenners', main: 'Liefhebbers + Gewurztraminer', mainSub: 'nieuwe klanten, aromatisch wit', side: 'Vitrine', sideSub: 'nu te koop' },
      4: { theme: 'Meer ruimte', main: 'Derde wijnkast', mainSub: 'nu te koop · +2 klanten', side: 'Chablis', sideSub: 'strak wit' },
      5: { theme: 'Verkooptalent', main: 'Fatima kan komen werken', mainSub: 'tweede kans voor weglopers', side: 'Wijnkoeling', sideSub: 'nu te koop' },
      6: { theme: 'De kelder', main: 'Bordeaux + Port', mainSub: 'serieus rood en zoet', side: 'Uithangbord', sideSub: 'nu te koop · +4 klanten' },
      7: { theme: 'Status', main: 'Statuszoekers + Barolo', mainSub: 'nieuwe klanten, Italiaans prestige', side: 'Meneer Dubois', sideSub: 'sommelier' },
      8: { theme: 'Topklasse', main: 'Champagne + vierde kast', mainSub: 'schaars · kast nu te koop', side: 'Gevrey-Chambertin', sideSub: 'het pronkstuk' },
    },
    // Klus per niveau: oefen wat je net kreeg (besluit 76). {need} = aantal.
    klus: {
      1: 'Verkoop {need} flessen',
      2: 'Verkoop {need} flessen Crémant',
      3: 'Verkoop {need} flessen aan liefhebbers',
      4: 'Verkoop op één dag {need} verschillende wijnen',
      5: 'Laat Fatima {need} klanten terughalen',
      6: 'Verkoop {need} flessen Bordeaux of Port',
      7: 'Verkoop {need} flessen aan statuszoekers',
      8: 'Verkoop {need} flessen Champagne',
    },
    klusUi: { title: 'Klus', reward: 'beloning {r}', done: 'Klus gehaald! {r}', newKlus: 'Nieuwe klus', repR: '+{n} reputatie', cashR: '+{n} (de wijnclub trakteert)' },
    // Avondinzicht (besluit 75): één feitelijke zin over de dag, met een klik naar die wijn
    insight: {
      title: 'Opgevallen vandaag',
      soldOut: '{n} klanten wilden {wine}, maar die was op.',
      tooExpensive: '{n} klanten vonden {wine} te duur ({stand}, {price}).',
      idle: '{wine} stond op het schap, maar niemand nam hem mee.',
      nothing: '{n} {type} vonden niets naar hun smaak.',
      best: '{wine} deed het best: {n} flessen, {margin} marge.',
      titleYesterday: 'Opgevallen gisteren',
      tip: {
        soldOut: 'Bestel er meer van, of vul je lijst verder aan.',
        tooExpensive: 'Een stand lager kost marge, maar levert kopers op.',
        idle: 'Haal hem van het schap en zet er iets anders neer.',
        nothing: '{type}: {want}.',
        best: 'Houd hem op voorraad. Misschien kan hij een stand hoger.',
      },
      goOrder: 'Bekijk ▶',
      goPrices: 'Bekijk ▶',
      tipOrder: 'Open bestellen op deze wijn',
      tipPrices: 'Open prijzen op deze wijn',
      goTip: 'Morgenochtend opent het venster op deze wijn.',
    },
    // Wat je investeringen opleverden (kassabon en venster Investeren, besluit 72)
    work: {
      upg: 'Uithangbord/kasten: {n} kl.',
      shop: 'Vitrine {v} fl. · koeling {k} fl.',
      vitrine: 'Vitrine: {v} fl. {wine}',
      koeling: 'Koeling: {k} fl. koud verkocht',
      investYesterday: 'Gisteren: {n} extra klanten, {margin} marge.',
    },
    // Weekkaarten (01_ONTWERP §10). title, text = uitleg, fx = kort effect voor de HUD. Tegenvallers: a/b = knoppen.
    cards: {
      rose: { title: 'Rosé-zomer', text: 'Een influencer drinkt rosé uit een ijsemmer. Heel Nederland volgt.', fx: 'Rosé (Provence rosé) verkoopt veel beter, +2 klanten per dag' },
      tapas: { title: 'Tapas-hype', text: 'Er is een tapasbar geopend op de hoek. Iedereen wil nu iets Spaans.', fx: 'Spaanse wijn (Rioja Crianza) verkoopt veel beter, +2 klanten per dag' },
      bubbels: { title: 'Iedereen wil bubbels', text: 'Het is examenweek. Er valt elke dag wel iemand te feliciteren.', fx: 'Mousserend (Crémant, Champagne) verkoopt veel beter, +2 klanten per dag' },
      zoet: { title: 'Zoet is terug', text: 'Een kookprogramma serveerde port bij kaas. Uitverkocht bij de Appie.', fx: 'Zoete wijn (Port LBV) verkoopt veel beter, +2 klanten per dag' },
      koningsdag: { title: 'Koningsdag', text: 'Zaterdag is het Koningsdag. De hele stad is oranje en dorstig.', fx: 'Alleen zaterdag: dubbel zoveel klanten; mousserend en rosé extra in trek' },
      braderie: { title: 'Braderie', text: 'Deze week staat de straat vol kramen. Veel volk, weinig budget.', fx: '+4 klanten per dag, veel koopjesjagers' },
      recensie: { title: 'TikTok-hit', text: 'Een wijnvlogger filmde een review in je winkel. 400.000 views. "Hidden gem!!"', fx: '+3 klanten per dag, meer liefhebbers en statuszoekers' },
      doos: { title: 'Doos zonder etiket', text: 'Ronnie vond een doos achter in zijn magazijn. "Zou zomaar goed spul kunnen zijn."', fx: '12 flessen voor €60; welke wijn het is, zie je na het kopen' },
      proeverij: { title: 'Proeverij', text: 'Zaterdag een proeverij in de winkel. Kost wat, maar het spreekt zich rond.', fx: '€100; zaterdag +50% klanten, veel liefhebbers, reputatie ×2' },
      hittegolf: { title: 'Hittegolf', text: 'KNMI: code oranje voor dorst. De ventilatoren zijn uitverkocht, de wijn nog niet.', fx: 'Wit en rosé verkopen veel beter, +2 klanten per dag' },
      stamppot: { title: 'Stamppotseizoen', text: 'Het regent al drie dagen. Heel Nederland wil iets stevigs bij de boerenkool.', fx: 'Stevige rode (Rioja, Bordeaux, Barolo) verkoopt veel beter, +1 klant per dag' },
      oesters: { title: 'Oesterseizoen', text: 'De visboer om de hoek heeft Zeeuwse oesters. En geen wijn.', fx: 'Frisse witte (Sauvignon Blanc, Chablis) verkoopt veel beter' },
      introweek: { title: 'Introweek', text: 'Drieduizend eerstejaars ontdekken dat wijn bestaat. En dat het goedkoop kan.', fx: '+3 klanten per dag, drie keer zoveel koopjesjagers' },
      kunstroute: { title: 'Kunstroute', text: 'Open ateliers in de hele straat. Veel sjaals, veel smaak.', fx: '+2 klanten per dag, twee keer zoveel liefhebbers' },
      beursgang: { title: 'Beursgang om de hoek', text: 'Een start-up is naar de beurs. Er moet geproost worden, en het mag wat kosten.', fx: 'Drie keer zoveel statuszoekers; mousserend extra in trek' },
      koopavond: { title: 'Koopavond', text: 'Donderdag is de hele straat tot negen uur open.', fx: 'Donderdag anderhalf keer zoveel klanten' },
      partij: { title: 'Ronnie heeft een partij over', text: '"Ik moet van die dozen af. Zeg het maar."', fx: 'Deze week alle inkoop 20% goedkoper' },
      bruiloft: { title: 'Bruiloft in de straat', text: 'Het bruidspaar wil vrijdag 24 flessen bubbels. Bezorgd, gekoeld, en graag geen gedoe.', fx: 'Vrijdagochtend 24 flessen mousserend in huis: normale prijs + €40 fooi, reputatie +3. Anders reputatie -3.' },
      buurtapp: { title: 'Lof in de buurtapp', text: '"Beste wijnwinkel van de wijk!!" 47 duimpjes. Eén boze reactie over parkeren.', fx: 'Deze week reputatie ×1,5 en +1 klant per dag' },
      koeling: { title: 'De koeling is stuk', text: 'De koelkast bromt niet meer. De witte wijn wordt lauw. De monteur kan pas donderdag.', a: 'Spoedmonteur (€90)', b: 'Wachten: tot en met woensdag geen witte wijn', fxA: 'Vandaag gemaakt, geen gedoe.', fxB: 'Ma t/m wo geen witte wijn te koop.' },
      riool: { title: 'Rioolwerkzaamheden', text: 'De gemeente ligt voor je deur met een graafmachine. De straat is half afgesloten.', a: 'Bordjes "Wij zijn open!" (€60)', b: 'Afwachten', fxA: 'Nog maar 5% minder klanten.', fxB: '20% minder klanten deze week.' },
      aanslag: { title: 'Aanslag reclamebelasting', text: 'De gemeente vindt je uithangbord reclame. Aanslag: €100.', a: 'Betalen (€100)', b: 'Bezwaar maken (50% kans op €0, anders €175)', fxA: 'Klaar. Niemand blij, wel rust.', fxB: 'Kop: €0. Munt: €175.' },
      kassa: { title: 'De kassa hapert', text: 'De bon komt eruit als confetti. De rij wordt lang, de klanten ongeduldig.', a: 'Monteur (€70)', b: 'Doormodderen tot en met woensdag', fxA: 'Vandaag gemaakt.', fxB: 'Ma t/m wo 15% minder klanten.' },
      parkeren: { title: 'Parkeerhandhaving', text: 'Ronnies busje stond "heel even" op de stoep. Nu staat het bij de wegsleepdienst.', a: 'Boete voor hem betalen (€60)', b: 'Hij komt wel woensdag', fxA: 'Ronnie levert gewoon.', fxB: 'Ma en di geen leveringen, ook niet als je belt.' },
      stroom: { title: 'Stroomstoring', text: 'De hele straat zit in het donker. Behalve het café, dat heeft een aggregaat.', a: 'Aggregaat huren (€90)', b: 'Dinsdag dicht', fxA: 'Het licht blijft aan.', fxB: 'Dinsdag geen klanten. De huur betaal je wel.' },
    },
    cardUi: {
      pick: 'Kies de kaart voor volgende week',
      boxResult: 'In de doos: 12 flessen {wine}. Inkoopwaarde {worth}.',
      gambleWin: 'Bezwaar toegekend. U hoeft niets te betalen.',
      gambleLose: 'Bezwaar afgewezen. Het wordt €175.',
    },
    // tegel op het niveauscherm als de winkel nieuwe aankleding krijgt (besluit 63)
    decorTile: { 3: { a: 'Nieuwe aankleding', b: 'groen + stoepbord' }, 6: { a: 'Nieuwe aankleding', b: 'lampjes + terras' } },
    levelUp: ['De buurt begint over je te praten.', 'Je naam valt op verjaardagen.', 'Iemand noemde je "die leuke wijnzaak".', 'De concurrentie kijkt mee.'],
    gameOver: 'Het rolluik gaat naar beneden. Voorgoed.',
    // Failliet: wat ging er mis? (besluit 77) Twee feitelijke regels, de zwaarste eerst.
    postmortem: {
      title: 'Wat ging er mis in week {week}',
      short: 'Je kwam {short} tekort voor de termijn van {due}.',
      cashOut: '{n} klanten stonden voor een leeg schap: er was geen geld om bij te bestellen.',
      soldOut: '{n} klanten wilden een wijn die op was{wine}.',
      tooExpensive: '{n} klanten vonden het te duur{wine}.',
      nothing: '{n} klanten vonden niets naar hun smaak.',
      stock: 'Er stond voor {value} aan wijn in je magazijn: geld dat vastzat.',
      invest: 'Je investeerde {value} vlak voor de aflossing.',
      wages: 'Personeel kostte {value} deze week.',
      margin: 'Je maakte {perDay} marge per dag; de termijn vroeg {need} per dag.',
      wineOut: ' (vooral {wine})',
    },
  };

  // ---------- Adviesvragen (01_ONTWERP §7, besluit 49) ----------
  // want = wensen (allemaal waar = goed antwoord), max = maximumprijs (schapprijs), lvl = vanaf reputatieniveau.
  // Wensen: soort, bij, stijl, land, regio, druif (moet erin zitten), niet_druif, niet_stijl, niet_land, top (hoogste prestige op je schap).
  // Regel: de klant praat klantentaal, het kaartje wijntaal. Het wenswoord staat nooit letterlijk in de vraag
  // (tools/test_advies.js controleert dat). Gerechten (bij) staan niet op het kaartje: dat is de wijnkennis.
  // weetje = verschijnt na het antwoord (goed én fout). val = uitleg als iemand in de valkuil trapt.
  CC.TEXT.advice = [
    // --- Niveau 1 ---
    { id: 'q01', lvl: 1, max: 7, want: { soort: 'rood', bij: 'stamppot' }, q: 'Hutspot bij schoonmoeder vanavond. Ze proeft het verschil toch niet, dus niet boven de zeven euro.',
      weetje: 'Winterkost met jus vraagt om rood met wat body. Het zuur en de tannine snijden door het vet.' },
    { id: 'q02', lvl: 1, max: 8, want: { bij: 'bbq', stijl: 'fris' }, q: 'We gaan barbecueën, maar het wordt dertig graden. Iets wat je ijskoud kunt schenken.',
      weetje: 'Rosé komt van blauwe druiven. Het sap ligt maar kort op de schillen: daar komt die kleur vandaan.' },
    { id: 'q03', lvl: 1, max: 8, want: { soort: 'wit', bij: 'vis' }, q: 'Mijn man bakt zeetong. Hij kookt, dus liever niet te duur. Dan valt het minder op.',
      weetje: 'Sauvignon Blanc ruikt vaak naar gras en groene paprika. Dat is dezelfde geurstof als in de paprika zelf.' },
    { id: 'q04', lvl: 1, max: 8, want: { soort: 'rosé' }, q: 'Het zonnetje schijnt. Dan drink ik iets met zo’n zalmkleurtje, dat is gewoon een regel.',
      weetje: 'Negen van de tien flessen uit de Provence zijn rosé. Rood en wit zijn daar bijzaak.' },
    { id: 'q05', lvl: 1, max: 6, want: { soort: 'rood', bij: 'pizza' }, q: 'Een margherita uit de doos vanavond. Iets simpels erbij, zes euro is het maximum.',
      weetje: 'Merlot is na Cabernet Sauvignon de meest aangeplante blauwe druif ter wereld.' },
    { id: 'q06', lvl: 1, max: 8, want: { soort: 'wit', stijl: 'fris' }, q: 'Ik heb vandaag al genoeg zwaar gedaan. Iets lichts, koud uit de koelkast. Geen roze en geen prik, daar heb ik mijn buik van vol.',
      uitleg: 'Met "iets lichts, koud" bedoelde hij een frisse witte.',
      weetje: 'Frisheid in wijn betekent: veel zuren. Hoe koeler de streek, hoe frisser de wijn.' },
    { id: 'q07', lvl: 1, max: 8, want: { soort: 'rood', stijl: 'soepel' }, q: 'Iets donkers. Maar mijn vrouw kan niet tegen die wijn die je mond droogtrekt.',
      weetje: 'Dat droogtrekkende gevoel is tannine: looistof uit schil en pit. Merlot heeft er weinig van.' },
    { id: 'q08', lvl: 1, max: 8, want: { soort: 'wit', bij: 'geitenkaas' }, q: 'Salade met warme chèvre en honing. Wat schenk ik daarbij?',
      weetje: 'Sauvignon Blanc en geitenkaas komen allebei uit de Loire. Wat samen groeit, gaat samen.' },
    { id: 'q09', lvl: 1, max: 10, want: { soort: 'rood', stijl: 'hout' }, q: 'Ik wil proeven dat hij in een vat heeft gelegen. Vanille, kokos, dat werk.',
      weetje: 'Crianza betekent: minstens twee jaar gerijpt, waarvan één jaar op eikenhout. De vanille komt uit dat vat.' },
    { id: 'q10', lvl: 1, max: 6, want: { soort: 'rood', bij: 'pasta' }, q: 'Spaghetti bolognese. Het is dinsdag, het hoeft geen feest te worden.',
      weetje: 'Tomatensaus is zuur. Een zachte rode past prima; een dure fles is hier zonde van het geld.' },

    // --- Niveau 2 ---
    { id: 'q11', lvl: 2, max: 11, want: { soort: 'bubbels' }, q: 'Mijn dochter is geslaagd! Er moet iets knallen, maar het is geen bruiloft.',
      weetje: 'Crémant wordt precies zo gemaakt als Champagne: tweede gisting in de fles. Alleen de naam mag niet.' },
    { id: 'q12', lvl: 2, max: 15, want: { soort: 'wit', bij: 'oesters' }, q: 'Ik heb een dozijn Zeeuwse creuses gekocht. De visboer zei: iets erbij, maar niks met prik.',
      weetje: 'De bodem van Chablis zit vol fossiele oesterschelpjes. Oesters bij Chablis is dus bijna familie.' },
    { id: 'q13', lvl: 4, max: 15, want: { soort: 'wit', stijl: 'mineraal' }, q: 'Mijn wijnclub zegt dat ik iets met ‘natte steen en krijt’ moet proberen. Geen idee wat dat is, maar doe maar.',
      weetje: 'Mineraal is een vaag wijnwoord: denk aan natte steen of krijt. Iedereen gebruikt het, niemand kan het precies uitleggen.' },
    { id: 'q14', lvl: 2, max: 15, want: { soort: 'wit', bij: 'kip' }, q: 'Haantje uit de oven met citroen en tijm. Het mag wat chiquer dan normaal.',
      weetje: 'Chablis is 100% Chardonnay. Dat staat bijna nooit op het etiket: in Frankrijk noem je de plek, niet de druif.' },
    { id: 'q15', lvl: 2, max: 11, want: { soort: 'bubbels', bij: 'aperitief' }, q: 'De buren komen borrelen voor het eten. Iets dat ‘plop’ zegt.',
      weetje: 'Een fles met prik staat onder zo’n 6 bar druk. Dat is twee à drie keer een autoband.' },
    { id: 'q16', lvl: 2, max: 9, want: { soort: 'wit', stijl: 'fris' }, q: 'Iets strak en zuur, als een groene appel. Geen prik, geen roze, en onder de negen euro.',
      weetje: 'Sancerre en Pouilly-Fumé zijn ook Sauvignon Blanc uit de Loire. Zelfde druif, duurdere naam.' },

    // --- Niveau 3 ---
    { id: 'q17', lvl: 3, max: 16, want: { bij: 'aziatisch' }, q: 'Ik ga Thais halen. Pittig. Wat drink je daar in hemelsnaam bij?',
      weetje: 'Gewürz is Duits voor kruiden. Lychee en rozen zijn typisch, en een vleugje zoet tempert het pittige eten.' },
    { id: 'q18', lvl: 3, max: 10, want: { soort: 'rood', land: 'Spanje' }, q: 'Tapasavond. Het moet uit het land van de flamenco komen, anders klopt het niet.',
      weetje: 'Tempranillo komt van ‘temprano’: vroeg. De druif rijpt eerder dan andere Spaanse rassen.' },
    { id: 'q19', lvl: 3, max: 11, want: { soort: 'bubbels', land: 'Frankrijk' }, q: 'Mijn Franse schoonzus komt logeren. Iets met prik uit haar eigen land, maar het échte werk is te gek.',
      weetje: 'Alleen mousserende wijn uit de Champagne mag zo heten. Elders in Frankrijk heet dezelfde methode crémant.' },
    { id: 'q20', lvl: 3, max: 10, want: { druif: 'Sauvignon Blanc' }, q: 'Mijn zwager drinkt alleen Sancerre. Te duur voor mij, maar heeft u iets van dezelfde druif?',
      weetje: 'Sancerre is een dorp aan de Loire. Wat daar groeit is Sauvignon Blanc, alleen met een duurdere naam.' },
    { id: 'q21', lvl: 4, max: 16, want: { druif: 'Chardonnay', stijl: 'fris' }, q: 'Iets van dezelfde druif als die dikke, botterige Californiërs. Maar dan strak, zonder die boter.',
      weetje: 'Chardonnay is een kameleon: in Chablis strak en fris, in Californië vaak vol en boterig. Zelfde druif, ander klimaat.' },
    { id: 'q22', lvl: 3, max: 16, want: { stijl: 'aromatisch' }, q: 'Iets wat je al ruikt voordat je het proeft. Lychee, rozen, dat soort werk.',
      weetje: 'Gewurztraminer is een van de weinige wijnen die echt naar lychee ruikt. Die raad je blind.' },
    { id: 'q23', lvl: 3, max: 10, want: { soort: 'rood', niet_land: 'Frankrijk' }, q: 'Iets donkers, maar niet van de Fransen. Mijn schoonzoon woont daar en praat er al genoeg over.',
      weetje: 'Spanje heeft de meeste wijngaarden ter wereld, maar niet de meeste wijn: de stokken staan wijd uit elkaar vanwege de droogte.' },
    { id: 'q24', lvl: 3, max: 16, want: { soort: 'wit', bij: 'kaas' }, q: 'Een kaasplankje met oude Gouda. Mijn buurman zegt dat rood daarmee vecht. Iets bijzonders dan.',
      weetje: 'Wit bij kaas werkt vaak beter dan rood: tannine en kaas vechten, zuur en aroma niet.' },

    // --- Niveau 4 ---
    { id: 'q25', lvl: 4, max: 16, want: { stijl: 'fris', bij: 'vis', niet_druif: 'Chardonnay' }, q: 'Kabeljauw vanavond. Iets strak erbij, maar niet van de druif van die botterige Californiërs. Daar krijgt mijn man hoofdpijn van.',
      weetje: 'Hoofdpijn komt meestal van de alcohol, niet van de druif. Maar goed, de klant is koning.',
      val: 'Chablis ís Chardonnay. Het staat alleen niet op het etiket.' },
    { id: 'q26', lvl: 4, max: 25, want: { soort: 'rood', bij: 'biefstuk' }, q: 'Een echte côte de boeuf van de slager. Wat kan daartegenop?',
      uitleg: 'Een groot stuk rood vlees vraagt om een stevige rode: Bordeaux, Rioja of Barolo.',
      weetje: 'Tannine hecht zich aan eiwit en vet. Daarom smaakt een stevige rode zachter naast een stuk vlees.' },
    { id: 'q27', lvl: 6, max: 20, want: { stijl: 'zoet', bij: 'kaas' }, q: 'Na het eten, bij de blauwe kaas. En het mag plakken.',
      weetje: 'Port is versterkt: halverwege de gisting gaat er druivenalcohol bij. De gist stopt, de suiker blijft. Zoet én 20%.' },
    { id: 'q28', lvl: 6, max: 25, want: { soort: 'rood', land: 'Frankrijk', stijl: 'stevig' }, q: 'Voor mijn baas. Uit het land van de kaas en de stakingen, donker en met flinke tanden. Onder de vijfentwintig.',
      weetje: 'Bordeaux is bijna altijd een blend. Links van de Gironde voert Cabernet de boventoon, rechts Merlot.' },
    { id: 'q29', lvl: 4, max: 25, want: { soort: 'rood', niet_druif: 'Merlot' }, q: 'Iets donkers, maar niet de druif uit die film over twee mannen op wijnreis. Mijn schoonvader is er nooit overheen gekomen.',
      weetje: 'Die film is Sideways (2004). De Merlot-verkoop in Amerika zakte daarna echt in.',
      val: 'In Bordeaux zit ook Merlot. Vaak zelfs meer dan de helft.' },
    { id: 'q30', lvl: 4, max: 12, want: { bij: 'stoofvlees', stijl: 'hout' }, q: 'Draadjesvlees, drie uur gesudderd. Niet te duur: er gaat ook een flinke scheut in de pan.',
      weetje: 'Oude koksregel: kook met dezelfde wijn als je erbij drinkt. Maar de goedkoopste fles gaat in de pan.' },
    { id: 'q31', lvl: 6, max: 25, want: { druif: 'Cabernet Sauvignon' }, q: 'Iets van de druif van de grote kastelen in de Médoc. Geen Chileen, het is een cadeau.',
      uitleg: 'De Médoc, links van de Gironde, is Cabernet Sauvignon-land.',
      weetje: 'Cabernet Sauvignon is een kruising van Cabernet Franc en Sauvignon Blanc. Een blauwe druif met een witte moeder.' },

    // --- Niveau 5 ---
    { id: 'q32', lvl: 7, max: 40, want: { bij: 'truffel' }, q: 'Risotto met truffel uit Alba. Er zit een fortuin in, de wijn moet meedoen.',
      weetje: 'Barolo en witte truffel komen uit dezelfde streek: Piemonte, rond Alba. Die combinatie is daar bedacht.' },
    { id: 'q33', lvl: 7, max: 40, want: { soort: 'rood', land: 'Italië' }, q: 'Mijn vriend is net terug uit Toscane en doet heel moeilijk. Iets donkers uit dat land, dan praten we verder.',
      weetje: 'Barolo komt niet uit Toscane maar uit Piemonte, in het noorden. Mag u tegen hem zeggen.' },
    { id: 'q34', lvl: 7, max: 40, want: { stijl: 'stevig', niet_land: ['Frankrijk', 'Spanje'] }, q: 'Iets met flinke tanden. Maar niet van de Fransen of de Spanjaarden, die heb ik al.',
      weetje: 'Nebbiolo is licht van kleur maar zit vol tannine. Bleke wijn, stevige klap: ga niet op de kleur af.' },

    // --- Niveau 6 ---
    { id: 'q35', lvl: 8, max: 40, want: { regio: 'Champagne' }, q: 'Wij zijn 25 jaar getrouwd. Het moet het échte werk zijn, geen namaak met een andere naam.',
      weetje: 'Alleen mousserende wijn uit de Champagne mag zo heten. De rest is crémant, cava, prosecco of sekt.' },
    { id: 'q36', lvl: 6, max: 40, want: { soort: 'bubbels', niet_druif: 'Chardonnay' }, q: 'Iets met prik, maar niets van de druif van Chablis. Ik ben allergisch voor snobisme.',
      weetje: 'Crémant de Loire is meestal Chenin Blanc. Dezelfde methode, andere druif.',
      val: 'In Champagne zit bijna altijd Chardonnay.' },
    { id: 'q37', lvl: 6, max: 25, want: { stijl: 'zoet', bij: 'dessert' }, q: 'Chocoladetaart als toetje. Wat schenk je daarbij?',
      weetje: 'Vuistregel: de wijn moet minstens zo zoet zijn als het toetje. Anders smaakt hij zuur.' },

    // --- Niveau 7 ---
    { id: 'q38', lvl: 8, max: 80, want: { soort: 'rood', druif: 'Pinot Noir' }, q: 'Eend met kersensaus. Ik las dat daar de dunhuidige, kieskeurige druif uit de Bourgogne bij hoort.',
      weetje: 'Pinot Noir is dunhuidig en kieskeurig. In de Bourgogne heeft elke wijngaard een eigen naam, soms voor een paar rijen druiven.' },
    { id: 'q39', lvl: 7, max: 100, want: { top: true }, q: 'Het beste wat u heeft. Prijs maakt niet uit. Nou ja, onder de honderd.',
      weetje: 'Gevrey-Chambertin zou de lievelingswijn van Napoleon zijn geweest. Zeggen ze in Gevrey.' },
    { id: 'q40', lvl: 8, max: 80, want: { soort: 'rood', regio: 'Bourgogne' }, q: 'Wild zwijn voor de jachtclub. Het moet uit dezelfde streek komen als Chablis, maar dan donker.',
      weetje: 'De Bourgogne heeft twee hoofddruiven: Pinot Noir voor rood, Chardonnay voor wit. Chablis hoort er ook bij.',
      val: 'Chablis is wél Bourgogne, maar wit.', valOn: 'soort' },
  ];

  // Reacties op het advies (sleutel = uitkomst uit SIM.answerAdvice)
  // A6: over welke wijn(en) gaat het weetje? Het weetje staat alleen in beeld als de speler een van deze wijnen koos.
  // Niet in de lijst = algemeen weetje (eten, techniek, de vraag zelf): altijd tonen.
  CC.TEXT.weetjeOver = {
    q02: ['wine_provence'], q03: ['wine_sauvignon'], q04: ['wine_provence'], q05: ['wine_merlot'], q07: ['wine_merlot'],
    q08: ['wine_sauvignon'], q09: ['wine_rioja'], q11: ['wine_cremant', 'wine_champagne'], q12: ['wine_chablis'], q14: ['wine_chablis'],
    q15: ['wine_cremant', 'wine_champagne'], q16: ['wine_sauvignon'], q17: ['wine_gewurz'], q18: ['wine_rioja'], q19: ['wine_cremant', 'wine_champagne'],
    q20: ['wine_sauvignon'], q21: ['wine_chablis', 'wine_champagne'], q22: ['wine_gewurz'], q23: ['wine_rioja'], q27: ['wine_port'],
    q28: ['wine_bordeaux'], q31: ['wine_bordeaux'], q32: ['wine_barolo'], q33: ['wine_barolo'], q34: ['wine_barolo'],
    q35: ['wine_champagne', 'wine_cremant'], q36: ['wine_cremant'], q38: ['wine_gevrey', 'wine_champagne'], q39: ['wine_gevrey'], q40: ['wine_gevrey', 'wine_chablis'],
  };
  CC.TEXT.adviceReply = {
    good: ['Perfect, die neem ik.', 'Zie je wel, daar kom ik voor.', 'U bent goed. Echt.', 'Ik kom terug. Met mijn zus.', 'Die schrijf ik op.', 'Kijk. Daar heb je wat aan.'],
    wrong: ['Daar vroeg ik niet om.', 'Hm. Had u wel geluisterd?', 'Ik zoek het zelf wel uit.', 'Dat is juist wat ik niet wilde.', 'Nee hoor. Laat maar.'],
    tooExpensive: ['Ik zei toch een maximum?', 'Dat is over mijn grens.', 'Mijn portemonnee zegt nee.', 'Voor dat geld? Nee.'],
    honest: ['Eerlijk. Dat waardeer ik.', 'Jammer. Maar fijn dat u het zegt.', 'Dan kom ik volgende week terug.', 'Liever dat dan een verkeerde fles.'],
    falseNone: ['De {wine} staat gewoon daar!', 'En die {wine} dan?', 'Nou, en wat is die {wine} dan?'],
    ignored: ['Laat maar, ik kijk zelf wel.', 'Druk hier, hè?', 'Ik red me wel.', 'Dan zoek ik zelf.'],
  };
  CC.TEXT.adviceReply.honestNone = CC.TEXT.adviceReply.honest;   // oude naam

  // Waarom was het fout? Eén korte zin in de vertellerstem (de klant heeft zijn reactie al gegeven).
  CC.TEXT.adviceWhy = {
    soort: 'Gezocht: {want}. Deze is {is}.',
    bij: 'Bij {want} past deze minder goed.',
    stijl: 'Gezocht: iets {want}. Deze is dat niet.',
    land: 'Gezocht: iets uit {want}. Deze komt uit {is}.',
    regio: 'Gezocht: {want}. Deze komt uit {is}.',
    druif: 'Gezocht: {want}. Die zit hier niet in.',
    niet_druif: 'Juist géén {want}, en die zit hier wel in.',
    niet_stijl: 'Juist niet {want}, en deze is dat wel.',
    niet_land: 'Juist niet uit {want}, en daar komt deze vandaan.',
    top: 'Je had betere flessen staan.',
    prijs: 'Deze kost {is}; het budget was {want}.',
  };
  const SOORT_WANT = { rood: 'een rode', wit: 'een witte', 'rosé': 'een rosé', bubbels: 'iets met bubbels', dessert: 'iets zoets' };
  const SOORT_IS = { rood: 'rood', wit: 'wit', 'rosé': 'rosé', bubbels: 'mousserend', dessert: 'een dessertwijn' };
  const STIJL_ADJ = { fris: 'fris', soepel: 'soepel', stevig: 'stevig', hout: 'op hout gerijpt', bubbels: 'mousserend', mineraal: 'mineraal', aromatisch: 'aromatisch', zoet: 'zoet', elegant: 'elegant' };
  const BIJ_TXT = { bbq: 'de barbecue', aziatisch: 'Aziatisch eten', aperitief: 'een aperitief', terras: 'het terras', feest: 'een feestje', dessert: 'het toetje', doordeweeks: 'een doordeweekse dag' };
  CC.TEXT.stijlAdj = STIJL_ADJ;
  CC.TEXT.soortName = { rood: 'rood', wit: 'wit', 'rosé': 'rosé', bubbels: 'mousserend', dessert: 'dessertwijn' };
  // Stijl en gerecht leesbaar op het kaartje
  CC.bijText = b => BIJ_TXT[b] || b;
  const BIJ_TAG = { bbq: 'barbecue', aziatisch: 'Aziatisch' };
  CC.bijTag = b => BIJ_TAG[b] || b;

  // Zin die uitlegt wat er mis was met deze wijn voor deze vraag (voor het kaartje na een fout antwoord).
  CC.adviceWhy = function (q, wine, miss, price) {
    const W = q.want, T = CC.TEXT.adviceWhy, euro = n => (CC.R ? CC.R.euro(n) : '€' + n);
    const arr = v => (Array.isArray(v) ? v : [v]);
    // valkuil-uitleg, behalve als het zo in de naam staat (Merlot bij "alles behalve Merlot")
    const obvious = miss[0] === 'niet_druif' && arr(W.niet_druif).some(d => wine.name.includes(d));
    // de valkuil-zin alleen als je echt in díe valkuil trapte (niet bij elke andere enkele misser)
    const valKeys = q.valOn ? [q.valOn] : ['niet_druif', 'niet_land', 'niet_stijl', 'druif', 'regio'];
    if (q.val && miss.length === 1 && valKeys.includes(miss[0]) && !obvious) return q.val;
    const m = miss.find(k => k !== 'prijs') || miss[0];
    const role = CC.roleById(wine.role);
    const v = {
      soort: [SOORT_WANT[W.soort] || W.soort, SOORT_IS[role.kind] || role.kind],
      bij: [CC.bijText(W.bij), ''],
      stijl: [STIJL_ADJ[W.stijl] || W.stijl, ''],
      land: [W.land, wine.country],
      regio: [W.regio, wine.regio],
      druif: [W.druif, ''],
      niet_druif: [arr(W.niet_druif).find(d => wine.druif.includes(d)), ''],
      niet_stijl: [STIJL_ADJ[arr(W.niet_stijl).find(st => (wine.stijl || []).includes(st))] || '', ''],
      niet_land: [wine.country, ''],
      top: ['', ''],
      prijs: [euro(q.max), euro(price)],
    }[m] || ['', ''];
    return (T[m] || '').split('{want}').join(v[0]).split('{is}').join(v[1]);
  };

  // Kiest een willekeurige tekst, nooit twee keer achter elkaar dezelfde uit dezelfde lijst.
  const lastPick = new Map();
  CC.pickText = function (arr, rng, vars) {
    let i = Math.floor((rng ? rng() : Math.random()) * arr.length);
    if (arr.length > 1 && lastPick.get(arr) === i) i = (i + 1) % arr.length;
    lastPick.set(arr, i);
    let s = arr[i];
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  };

  if (typeof module !== 'undefined') module.exports = CC;
})(typeof window !== 'undefined' ? window : globalThis);
