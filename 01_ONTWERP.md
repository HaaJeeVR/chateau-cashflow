# Château Cashflow — Ontwerp

> **Status:** source of truth voor gameplay. Getallen zijn **startwaarden** (tuning), structuur is **besluit**.
> Bij twijfel: *maakt dit de volgende dag interessanter om te spelen?* Zo niet → niet bouwen.

---

## 1. Pitch

Je hebt net met een banklening een kleine wijnhandel overgenomen in een Nederlandse binnenstad. Elke zondag belt de bank voor de aflossing. Koop slim in, zet de juiste flessen op het schap, geef klanten goed advies en bouw reputatie op — zodat je over 8 weken schuldenvrij bent en je winkel is uitgegroeid tot dé wijnzaak van de stad.

**Eén run:** 8 weken, ± 45–60 minuten. Daarna vrij doorspelen (endless) met een eindscore.
**Taal:** Nederlands. **Wijnen:** herkenbare wijntypes en druiven (Chablis, Bordeaux, Crémant), geen merken. **Toon:** droog en herkenbaar, Hollandse knipoog — geen slapstick.

### Referenties (in volgorde)

1. **Game Dev Story** — tempo, korte cycli, personeel dat beter wordt, frequente unlocks, isometrische ruimte als hoofdscherm.
2. **Recettear** — winkelloop onder schuld-druk met wekelijkse deadlines. Lees: *waarom voelt geld verdienen urgent?*
3. **Winkeltje** — fysieke winkel, schappen, zichtbaar kopende klanten.
4. **Theme Hospital** — charme en humor via klantgedachtes en tekst.

Recettear-valkuil die we vermijden: klantwensen voelen willekeurig en mechanieken worden slecht uitgelegd. Bij ons is elke klantreactie leesbaar (§6) en elke stat heeft één zin uitleg.

---

## 2. Spelstructuur

```
TITEL → [WEEK: 6 × (VOORBEREIDEN → VERKOOPDAG → DAGRESULTAAT)] → ZONDAG (bank + weekkeuze) → volgende week
```

| Fase | Duur | Wat de speler doet |
|---|---|---|
| **Voorbereiden** | zo lang als je wilt | inkopen, schappen vullen, prijzen zetten, personeel, upgrades |
| **Verkoopdag** (ma–za) | ± 30 sec op 1× | kijken; af en toe een adviesvraag beantwoorden; 1× / 2× / 4× / overslaan |
| **Dagresultaat** | ± 5 sec lezen | kassabon: flessen per wijn, winst, kasstroom, gemiste verkoop, reputatie (besluit 43). Detail per wijn en klanttype via "Gisteren" (besluit 44) |
| **Zondag** | 1 scherm | telefoontje van de bank, aflossing, weekoverzicht, keuze uit 2 weekkaarten (§10) |

**Win:** week 8 afgelost → *"Schuldenvrij!"*-scherm met score, daarna endless.
**Verlies:** aflossing niet te betalen → één keer per run **uitstel** mogelijk (aflossing schuift door + €100 boete, bankier wordt zichtbaar chagrijnig). Tweede keer → failliet, game over met score en "wat ging er mis"-samenvatting.

---

## 3. Economie

### Startwaarden

| Parameter | Waarde |
|---|---|
| Startkas | €400 (besluit 70: week 1 knelt al) |
| Vaste lasten (huur + energie) | €20 per verkoopdag |
| Aflossing per week (zondag) | lening normaal: 90 · 150 · 240 · 360 · 520 · 720 · 1.200 · 2.200 (totaal €5.480; besluit 70, 72, 76). Bij een nieuw spel kies je ook ruim (×0,9, €4.940) of krap (×1,12, €6.130), besluit 123 |
| Uitstel | 1× per run, +€100 |

### Waarom dit werkt

- Cash is schaars: elke fles op voorraad is geld dat je zondag niet hebt.
- De aflossing stijgt sneller dan je vanzelf groeit → je moet investeren in reputatie, assortiment en personeel, maar niet té veel tegelijk.
- **Balansdoel** (te controleren met de simulatie, zie `03_BOUWPLAN.md`):
  - "alleen goedkope wijn" haalt week 8 bijna nooit;
  - een verstandige mix zonder advies/personeel ± 70%;
  - goed spel (advies, vitrine, personeel) ± 95% met ruimte over.

Een eerste ruwe simulatie met deze waarden gaf precies dit patroon (goedkoop 6%, mix 69%).

### Prijzen

Geen vrij prijsveld. Per wijn kies je één van drie **prijsstanden** ten opzichte van de inkoopprijs (besluit 122, `claude/14_PRIJZEN.md`):

| Stand | Factor | Effect |
|---|---|---|
| Aanbieding | ×1,3 | één wijn tegelijk; trekt die dag extra klanten (vooral koopjesjagers en buurtbewoners), die ook naar je andere flessen kijken |
| Normaal | ×1,6 | het uitgangspunt |
| Stevig | ×2,0 | meer marge bij liefhebbers en statuszoekers; buurtbewoners en koopjesjagers haken af |

"Woeker" bestaat niet meer. Het prijsvenster toont per stand per klanttype of hij de wijn nog wil (koopt · twijfelt · haakt af), en het avondinzicht rekent na wat één andere stand had opgeleverd.

---

## 4. Wijnen

### Drie stats + één eigenschap

| Stat | Eén zin |
|---|---|
| **Prijsklasse** | Inkoopprijs; bepaalt welke klanten hem kunnen betalen. |
| **Prestige** (1–5) | Hoe graag liefhebbers en snobs hem willen; verkoop levert extra reputatie op. |
| **Populariteit** (1–5) | Hoe graag de gewone klant hem pakt. |

| Eigenschap | Eén zin |
|---|---|
| **Schaars** | Maximaal N flessen per week in te kopen. Op = op. |

Daarnaast heeft elke wijn **kaartjesinfo** die de adviesvragen en weektrends voedt (geen kwaliteitsladder, geen balans):

| Veld | Voorbeeld (Chablis) | Gebruikt voor |
|---|---|---|
| **Soort** | wit | "iets wits" |
| **Druif** (lijst) | Chardonnay | "géén Chardonnay", "iets met Pinot Noir", trends |
| **Regio / land** | Bourgogne · Frankrijk | "iets Frans", trends |
| **Stijl** | fris, mineraal | "iets fris", "niet te zwaar", "geen hout" |
| **Bij** | oesters, vis, kip | "iets bij de vis" |

Alles staat zichtbaar op het wijnkaartje, dus goed advies vraagt geen wijnkennis. Wie wél weet dat Chablis Chardonnay is, heeft een klein voordeel.

### De 12 wijnen: rollen met types en druiven

Het spel werkt met **12 vaste rollen**. De spelwaarden (inkoop, populariteit, prestige, eigenschap, unlock) horen bij de **rol**. Per rol staat een **wijntype met druif** in het spel (Chablis, Bordeaux, Crémant), géén merk of wijnhuis (besluit 32). Een type wisselen verandert de balans dus niet.

| # | Rol | Soort | Inkoop | Pop | Prest | Eigenschap | Unlock |
|---|---|---|---|---|---|---|---|
| 1 | Huiswijn rood | rood | €3 | 5 | 1 | — | start |
| 2 | Frisse witte | wit | €4 | 4 | 1 | — | start |
| 3 | Terrasrosé | rosé | €4 | 4 | 1 | — | start |
| 4 | Zonnige rode | rood | €5 | 4 | 2 | — | start |
| 5 | Feestbubbels | bubbels | €6 | 4 | 1 | — | Rep 2 |
| 6 | Strak wit | wit | €8 | 3 | 2 | — | Rep 2 |
| 7 | Aromatisch wit | wit | €9 | 2 | 3 | — | Rep 3 |
| 8 | Serieuze Fransman | rood | €13 | 3 | 3 | — | Rep 4 |
| 9 | Zoet / versterkt | dessert | €11 | 2 | 3 | — | Rep 4 |
| 10 | Italiaans prestige | rood | €20 | 2 | 4 | — | Rep 5 |
| 11 | Champagne | bubbels | €22 | 2 | 4 | schaars (8/wk) | Rep 6 |
| 12 | Het pronkstuk | rood | €40 | 1 | 5 | schaars (4/wk) | Rep 7 |

#### Wijn per rol

| # | Rol | Wijn | Druif | Regio | Stijl | Bij | Reserve |
|---|---|---|---|---|---|---|---|
| 1 | Huiswijn rood | **Merlot** | Merlot | Pays d'Oc | soepel | pasta, pizza, stamppot | — |
| 2 | Frisse witte | **Sauvignon Blanc** | Sauvignon Blanc | Touraine | fris | vis, salade, geitenkaas, terras | Picpoul de Pinet, Muscadet |
| 3 | Terrasrosé | **Provence rosé** | Grenache, Cinsault | Provence | fris | terras, bbq, salade | — |
| 4 | Zonnige rode | **Rioja Crianza** | Tempranillo | Rioja | stevig, hout | bbq, stoofvlees, tapas | Côtes du Rhône |
| 5 | Feestbubbels | **Crémant de Loire** | Chenin Blanc | Loire | bubbels, fris | feest, aperitief, oesters | Prosecco |
| 6 | Strak wit | **Chablis** | Chardonnay | Bourgogne | fris, mineraal | oesters, vis, kip | — |
| 7 | Aromatisch wit | **Gewurztraminer** | Gewurztraminer | Elzas | aromatisch | aziatisch, kaas | Elzas Riesling |
| 8 | Serieuze Fransman | **Bordeaux** | Cabernet Sauvignon, Merlot | Haut-Médoc | stevig, hout | biefstuk, stoofvlees, kaas | Saint-Chinian |
| 9 | Zoet / versterkt | **Port LBV** | Touriga Nacional | Douro | zoet | kaas, dessert | Sauternes |
| 10 | Italiaans prestige | **Barolo** | Nebbiolo | Piemonte | stevig | stoofvlees, truffel, pasta | — |
| 11 | Champagne | **Champagne brut** | Chardonnay, Pinot Noir, Meunier | Champagne | bubbels | feest, aperitief, oesters | — |
| 12 | Het pronkstuk | **Gevrey-Chambertin** | Pinot Noir | Bourgogne | elegant | eend, wild, kaas | Châteauneuf-du-Pape |

Reserves staan als `CC.WINES_RESERVE` in `config.js`: wisselen = de regel in `CC.WINES` vervangen.

**Bewuste druif-overlap (voor advies):** Chardonnay zit in Chablis én Champagne; Merlot in de huiswijn én Bordeaux. Een klant die "geen Chardonnay" wil, kan dus in twee valkuilen trappen.

**Spelprijzen zijn afgerond op de rol.** Ze liggen in de buurt van de echte schapprijs, maar zijn niet exact. Dat is bewust: de balans gaat voor.

**Later meer wijnen:** een nieuwe wijn = één regel in `config.js` (type, druif, regio, stijl, bij), met een bestaande rol als sjabloon. Wil je een wijn met een afwijkend profiel, dan is dat een nieuwe rol. Dat is een ontwerpkeuze, dus eerst testen met de sim.

Elke wijn krijgt één regel smaakomschrijving in droge wijnkaarttaal. Kort en herkenbaar ("Chardonnay, maar dan zonder de boter.").

---

## 5. De winkel

### Vaste isometrische ruimte

Eén kamer, vast camerastandpunt, zoals in Game Dev Story en het prototype. Geen vrij plaatsen van meubels; meubels staan op **vaste plekken** die bij unlocks gevuld worden.

### Schappen = breedte van je assortiment

- Een **schapvak** bevat één wijn, maximaal 12 flessen.
- Start: 2 schappen × 2 vakken = **4 wijnen**.
- Extra flessen staan in het **magazijn** en worden 's nachts automatisch bijgevuld. Overdag alleen met een vakkenvuller (§9).
- Uitbreiding: een derde kast (+2 vakken) wordt op Rep 3 **te koop** (€150), een vierde op Rep 5 (€200); max 8 wijnen tegelijk in de MVP. Zie §5a.

De betekenisvolle keuze: je hebt meer wijnen beschikbaar dan vakken. **Breed** (veel soorten, weinig per soort) of **diep** (bewezen verkopers)?

### Vitrine (plaatsing die ertoe doet)

Eén **vitrineplek**: de proeftafel midden in de winkel (te koop vanaf Rep 2, €100). De wijn in de vitrine krijgt extra score bij iedere klant, zolang hij op het schap staat. Je kiest hem in het venster "Investeren". Dat is het volledige plaatsingssysteem: simpel, zichtbaar, en elke dag een keuze.

### 5a. Investeren (besluit 60)

Groei gaat niet meer vanzelf: een niveau maakt een upgrade **te koop**, daarna beslis jij wanneer je hem koopt. Venster "Investeren" (knop onderaan, toets I).

| Upgrade | Te koop vanaf | Prijs | Effect |
|---|---|---|---|
| Vitrine | niveau 3 | €100 | Eén gekozen wijn verkoopt veel beter (+1 score) |
| Derde wijnkast | niveau 4 | €100 | +2 schapvakken en +2 klanten per dag (meer keus) |
| Wijnkoeling | niveau 5 | €120 | Wit, rosé en bubbels +1 score |
| Verlicht uithangbord | niveau 6 | €120 | +4 klanten per dag; het bord krijgt een lamp en gloeit |
| Vierde wijnkast | niveau 8 | €150 | +2 schapvakken en +2 klanten per dag |

De afweging: geld in voorraad of in de winkel steken, en dat vóór de volgende aflossing. Wat een investering oplevert zie je elke dag (besluit 72): op de kassabon "Uithangbord/kasten: n kl. +€x" en "Vitrine n fl. · koeling n fl.", in het venster Investeren "Gisteren: n extra klanten, €x marge". De kassabon toont een investering apart ("Investering"); het is geen kostenpost van de dag (winst), wel kasstroom.

### Zichtbare groei

Drie visuele fases van de ruimte, gekoppeld aan reputatie: **Fase 1** leeg en kaal (start) → **Fase 2** (Rep 3) extra schap, planten, vitrine → **Fase 3** (Rep 6) proeftafel, kroonluchter, vol en chic.

---

## 6. Klanten

### Vier types

| Type | Budget | Wil | Lichte voorkeur (stijl) | Prijsgevoelig | Verschijnt |
|---|---|---|---|---|---|
| **Buurtbewoner** | €5–14 | populair | soepel, fris | ja | start |
| **Koopjesjager** | €3–9 | goedkoop, prima alles | — (alleen de prijs telt) | extreem | start |
| **Liefhebber** | €10–40 | prestige + populair | stevig, aromatisch, mineraal | matig | Rep 3 |
| **Statuszoeker** | €25–90 | prestige; wantrouwt goedkoop (<€15) | bubbels, elegant | nauwelijks | Rep 5 |

**Voorkeur** = +1 op de score als de wijn die stijl heeft (besluit 35). Klein genoeg dat prijs en prestige blijven winnen, groot genoeg dat het assortiment per klantmix loont. De speler leert het via ballonnen ("Heeft u niet iets stevigers?") en het niveau-scherm dat een nieuw type introduceert.

Elk type is visueel direct herkenbaar (silhouet + kleur, zie art).

### Aankoopbeslissing (formule)

Per klant, voor iedere wijn op het schap:

```
als prijs > budget: overslaan
score = pop × w_pop + prestige × w_prest + 1 als stijl past bij voorkeur
        − prijsgevoel × (factor − 1,6) × 3 + ruis(−1,5..1,5)
       + 1,5 als wijn in vitrine
       + 1,0 als wijn past bij weektrend
       − 3 als statuszoeker en prijs < €15
koop de wijn met hoogste score als score > 3,5
is die uitverkocht: 50% kans dat hij de beste andere wijn neemt (als die > 3,5), anders weg met 'uitverkocht'
```

Aantal flessen: 1 (50%), 2 (33%), 3 (17%).

Gewichten (startwaarden in `config.js`): buurtbewoner w_pop 0,8 · w_prest 0,2 · prijsgevoel 2,2 — koopjesjager 0,6 · 0 · 3,0 — liefhebber 0,5 · 0,9 · 0,6 — statuszoeker 0,1 · 1,4 · 0,2 (prijsgevoel van buurtbewoner en koopjesjager omhoog in besluit 122). Onder normaal telt de prijs maar voor 30% mee (`offerAppeal`).

Gemeten met 4 startwijnen (alle op dezelfde stand; meting van vóór besluit 122, ter illustratie):

| Stand | Buurtbewoner koopt | Koopjesjager koopt |
|---|---|---|
| Scherp | 100% | 84% |
| Normaal | 98% | 45% |
| Stevig | 61% | 0% |

Geen stand is overal het beste: stevig loont op de wijnen voor liefhebbers en statuszoekers, de aanbieding op een populaire wijn die niet je bestseller is, en normaal blijft voor de rest het goede antwoord (meting: `node tools/prijzen.js`).

### Leesbare reacties (gedachteballonnetjes)

Iedere klant die níet koopt laat zien waarom. Dit is de belangrijkste feedback van het spel.

| Situatie | Ballon | Voorbeeldtekst |
|---|---|---|
| gekocht | 💶 + bedrag zweeft op | — |
| te duur | rood € | "Voor dat geld ga ik naar de Appie." |
| niets naar wens | grijs ? | "Hebben jullie ook iets met een dier op het etiket?" |
| uitverkocht | lege fles | "Stond hier gisteren niet een Tinto?" |
| te goedkoop (snob) | neus omhoog | "Ik zie hier geen enkele Grand Cru." |

Per situatie 5–10 varianten, zodat het niet repetitief wordt. De klantaantallen per dag: 14 + 3 per reputatieniveau (± 2 willekeurig).

---

## 7. Adviesmomenten (de actieve laag)

1–2 keer per verkoopdag stopt een klant met een **!** boven het hoofd (besluit 48). Klik → spel pauzeert → kaartje:

> *"Ik zoek iets bij de stamppot van schoonmoeder. Niet boven de vijftien euro, ze merkt het toch niet."*
> [Merlot €5] [Rioja Crianza €8] [Bordeaux €21] [Sorry, heb ik niet]

- Een vraag = **1–2 wensen + maximumprijs**. Wensen komen uit de kaartjesinfo (§4):
  - *soort:* "iets wits", "iets met bubbels";
  - *bij (gerecht/gelegenheid):* "bij de vis", "voor op het terras", "bij de stamppot";
  - *stijl:* "iets fris", "niet te zwaar", "geen hout, daar krijg ik hoofdpijn van";
  - *land/regio:* "iets Frans", "iets uit Italië";
  - *druif, gewenst:* "iets met Pinot Noir";
  - *druif, uitgesloten:* "alles behalve Chardonnay". **De valkuil:** Chablis en Champagne vallen hier ook onder.
- Moeilijkheid loopt op: tot Rep 3 alleen soort / bij / stijl; daarna ook land en druif; uitsluitingen ("geen Chardonnay") vanaf Rep 4.
- Het kaartje toont het budget van de klant en bij elke optie naam, prijs, soort, druif, regio, land en stijl. **Geen gerechten**: welke wijn bij zeetong past, is de wijnkennis (besluit 49).
- **Klantentaal:** de klant zegt nooit letterlijk het wenswoord ("iets met prik", niet "bubbels"). Twee wensen + krap budget; precies één goed antwoord op het kaartje. Goed antwoord = voldoet aan álle wensen én past binnen de maximumprijs.
- De drie opties komen van je eigen schap (minstens één goed antwoord, als dat er is).
- **Goed:** verkoop + fooi (10% van de prijs, min. €1) + reputatie +1 + blije tekst + **weetje**.
- **Fout:** klant koopt niets, reputatie −1. De klant zegt wat er mis was ("Chablis ís Chardonnay") + **weetje**. Zo leer je van fouten.
- **"Heb ik niet"** als dat klopt: reputatie +1 (eerlijk). Klopt het niet: reputatie −1 ("Hij staat gewoon daar!").
- Negeren: na 8 echte seconden (spel loopt, ook op 2×/4×) zoekt de klant zelf iets uit, als een gewone klant. Geen straf.
- **Weetjes:** elke vraag heeft één korte, kloppende wijnfeit-zin. Het educatieve deel van het spel; kort en droog, nooit een les.
- De 40 vragen staan in `texts.js` en ter review in `06_ADVIESVRAGEN.md`. `node tools/test_advies.js` controleert dat elke vraag op zijn niveau een goed antwoord heeft.

Tot niveau 3 is bijna alles met gezond verstand en het kaartje op te lossen; daarna mag het wijnkennis vragen (besluit 49). Fout gaan is niet erg: het weetje legt uit waarom. Een sommelier (§9) kan deze vragen later automatisch afhandelen.

Pool: ± 40 vragen in de MVP, geschreven in de toon van §1.

---

## 8. Reputatie, niveaus en klussen (besluit 76)

Reputatie (Rep) is de ruggengraat. Verdienen: +1 per verkoop, +1 extra bij prestige ≥3, +1 bij goed advies, bonus voor een gehaalde klus. Verliezen: fout advies (de woekerstraf is weg met de stand zelf, besluit 122). Je ziet het gebeuren: "+1 ★" boven een klant die afrekent, en in het dagrapport de uitsplitsing ("verkoop +25 · prestige +9 · advies +1 · klus +15").

Elk niveau geeft **twee nieuwe dingen** onder één thema (even groot getoond, geen rangorde: de speler ziet zelf wat het zwaarst weegt), +3 klanten per dag, en **een klus** die je leert gebruiken wat je net kreeg.

| Niveau | Drempel | Thema | Nieuw | Nieuw | Klus (beloning) |
|---|---|---|---|---|---|
| 1 | 0 | — | 4 startwijnen, 4 schappen | — | Verkoop 40 flessen (+10) |
| 2 | 28 | Een stagiair | Sem kan komen werken | Crémant de Loire | 12 flessen Crémant (+15) |
| 3 | 80 | De kenners | Liefhebbers + Gewurztraminer | Vitrine te koop | 15 flessen aan liefhebbers (+20) |
| 4 | 155 | Meer ruimte | Derde kast te koop | Chablis | Op één dag 6 verschillende wijnen (+25) |
| 5 | 300 | Verkooptalent | Fatima kan komen werken | Wijnkoeling te koop | Fatima haalt 6 klanten terug (+30) |
| 6 | 470 | De kelder | Bordeaux + Port | Uithangbord te koop | 15 flessen Bordeaux of Port (+35) |
| 7 | 690 | Status | Statuszoekers + Barolo | Meneer Dubois | 8 flessen aan statuszoekers (+40) |
| 8 | 950 | Topklasse | Champagne + vierde kast te koop | Gevrey-Chambertin | 6 flessen Champagne (€150) |

Winkelfases blijven op niveau 3 en 6 (decor). **Klussen** blijven open tot je ze haalt; er kunnen er meer tegelijk lopen. Ze staan linksboven onder "Vandaag verwacht" met een voortgangsbalk; een gehaalde klus staat met een vinkje in het dagrapport. Niveau 5–8 zijn trager sinds B2 (besluit 119): de "alles"-bot bereikt niveau 8 rond dag 33 (week 6), een gemiddelde speler rond dag 40.

---

## 9. Personeel

Maximaal 2 medewerkers tegelijk in de MVP, uit 3 rollen. Ze werken automatisch en zijn **zichtbaar** in de winkel.

| Rol | Vanaf niveau | Loon/dag | Doet | Beter per level |
|---|---|---|---|---|
| **Vakkenvuller** (Sem, stagiair) | 2 | €15 | deelt folders uit (+klanten per dag) en vult overdag lege vakken bij uit het magazijn | +2 → +5 klanten |
| **Verkoper** (Fatima) | 5 | €10 | klanten die zouden weggaan krijgen een 2e kans (en kopen dan 1–3 flessen) | 35% → 75% |
| **Sommelier** (meneer Dubois) | 7 | €10 | liefhebbers en statuszoekers geven bij hem meer uit (+25% → +60% budget) en kopen duurder; neemt vragen over die jij laat liggen (weet hij het niet, dan zwijgt hij) | weet 60% → 95%, meer budget |

Getallen staan in `config.js` (besluit 50, 72).

**Levelen (Game Dev Story-gevoel, besluit 72):** medewerkers krijgen XP uit hun eigen werk: Sem voor bijgevulde flessen en folderklanten die kopen, Fatima per klant die ze terughaalt, Dubois per beantwoorde vraag en per dure fles. Wie niets te doen heeft, groeit niet. Level 1 → 5 bij 6 · 14 · 25 · 40 XP. Wat ze vandaag deden en hoeveel XP dat gaf staat op de kassabon; in het venster Personeel zie je de XP-balk en "gisteren +x XP". Elke level-up: pop-up met portret.

Een medewerker aannemen is een echte keuze: loon is een vaste last die zondag meetelt.

---

## 10. Weekritme en events

Elke **zondag**:

1. **Bankier belt** (Balthazar Montenegro van J.P. Morgenstond & Co., droog). Aflossing wordt afgeschreven. Toon hangt af van hoe krap je zit.
2. **Weekoverzicht**: omzet, winst, beste wijn, reputatiegroei.
3. **Kies 1 van 2 weekkaarten** (kansen; de kaart geldt de volgende week):
   - *Trends:* Rosé-zomer, Tapas-hype, Iedereen wil bubbels (niv. 2), Zoet is terug (niv. 4): die wijnen verkopen veel beter, +2 klanten per dag.
   - *Evenementen:* Koningsdag (zaterdag dubbele klanten, bubbels en rosé in trek), Braderie (+4 klanten, veel koopjesjagers), TikTok-hit (niv. 3; een wijnvlogger filmt in je winkel, +3 klanten, meer liefhebbers en statuszoekers).
   - *Kansen:* Doos zonder etiket (12 flessen van een willekeurige wijn voor €60; je ziet pas na het kopen wat het is), Proeverij (niv. 3; €100, zaterdag +50% klanten, veel liefhebbers, reputatie ×2).

**Tegenvallers** zitten niet in de keuze. Vanaf week 2 komt er met 25% kans op maandag een, met een eigen afweging:
- De koeling is stuk: spoedmonteur €90, of ma–wo geen witte wijn.
- Rioolwerkzaamheden: bordjes €60 (−5% klanten), of afwachten (−20%).
- Aanslag reclamebelasting: €100 betalen, of bezwaar (50% kans op €0, anders €175).

Getallen in `config.js` (`CC.CARDS`), teksten in `texts.js` (besluit 54).

---

## 11. De eerste 5 minuten (tutorial in het spel zelf)

| Moment | Wat gebeurt er | Uitleg via |
|---|---|---|
| Titel | Logo, "Nieuw spel" | — |
| Intro | Montenegro: gefeliciteerd, eerste termijn zondag (€90), laatste €2.200. Eén venster, drie korte alinea's. | bankier (portret) |
| Dag 1 voorbereiden | Lijstje "Je eerste dag" rechts: prognose → bestellen → prijzen → open. Volgend punt pulseert, klaar = ✔, tooltip per punt. Niets verborgen. | checklist |
| Dag 1 verkoop | Hint bij de eerste verkoop. | 1 zin |
| Dag 1 resultaat | Dagrapport met een vakje: wat reputatie doet en waarom het telt. | vakje in rapport |
| Dag 2 e.v. | Avondinzicht wijst elke avond één ding aan. | inzicht |
| Niveau 2 | Eerste twee nieuwe dingen + klus → feestmoment. | niveauscherm |
| Zondag 1 | Eerste aflossing + eerste weekkaart; extra regel bij de groei. | bankier |

Regel: nooit meer dan één nieuw concept per dag in week 1.

---

## 12. Feedback en "juice"

Klein, snel en consistent. Dit maakt het verschil tussen "werkt" en "leuk":

- ✔ zwevende **+€** (met reputatie) boven de kassa bij elke verkoop (besluit 85; geen geluid);
- fles verdwijnt zichtbaar van het schap; leeg vak krijgt een rood randje;
- ✔ kas in de HUD telt op en af (besluit 85);
- **aflossingsbalk** altijd zichtbaar: vult zich tijdens de week richting het zondagbedrag;
- reputatiebalk met *pling* en glinstering bij level-up;
- unlock: scherm dimt licht, nieuw item wordt met een stofwolkje geplaatst, korte fanfare;
- ✔ dagresultaat: getallen tellen op, beste wijn krijgt een sterretje (besluit 85);
- ✔ bankier: telefoon rinkelt en trilt (besluit 85);
- faillissement: winkelrolluik dat dichtgaat.

Geen screenshake, geen neon. Warm en beheerst.

---

## 13. Bewust niet in de MVP

Kelder en rijping (geschrapt, besluit 34) · webshop · meerdere vestigingen · eigen label · import · vrije interieurplaatsing · magazijnlogistiek · afdingen · leveranciersrelaties · extra wijnstats · meer dan 12 wijnen.

Staat iets hiervan later op tafel: eerst bewijzen dat het de dag leuker maakt.

---

## 14. Nog open (bewust later)

- Geluid: bron van samples/muziek.
