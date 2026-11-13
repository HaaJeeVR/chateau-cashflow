# Château Cashflow — Bouwplan

> **Status:** source of truth voor techniek en werkwijze.
> Hoofdregel: **eerst een speelbare grijze versie, dan pas mooi.** Elke mijlpaal eindigt met iets dat HJ kan spelen.

---

## 1. Techniek

| Keuze | Waarde | Waarom |
|---|---|---|
| Platform | Browser, desktop, landscape | Direct speelbaar, makkelijk te delen |
| Taal | Vanilla JavaScript + HTML5 Canvas | Geen engine of build-stap nodig |
| Opstarten | `index.html` dubbelklikken (werkt offline, geen server) | Laagste drempel |
| Opslaan | Autosave in `localStorage`, inclusief open kassabon en zondag (besluit 65); reservekopie bij Nieuw spel; spelcode exporteren/laden | Herladen doet nooit iets dubbel |
| Randomness | Seeded RNG; seed staat in de save | Bugs zijn reproduceerbaar |
| Geluid | WebAudio, korte samples (later) | — |

### Mappenstructuur

```
Chateau Cashflow/
├─ index.html
├─ src/
│  ├─ config.js        ← ALLE getallen: wijnen, klanten, prijzen, aflossing, unlocks
│  ├─ texts.js         ← alle teksten: ballonnen, adviesvragen, bankier, weekkaarten
│  ├─ font.js          ← eigen pixelfont (5×7, met accenten en €)
│  ├─ state.js         ← spelstatus (pure data, serialiseerbaar)
│  ├─ sim.js           ← spelregels zonder beeld (klantkeuze, verkoop, dag, week)
│  ├─ world.js         ← verkoopdag: klanten lopen, kiezen, pakken, rekenen af (vaste tijdstap)
│  ├─ render.js        ← tekenen van wereld en UI
│  ├─ ui.js            ← klikken, panelen, HUD
│  ├─ main.js          ← loop, fases, opslaan
│  └─ debug.js         ← debugpaneel (F1)
├─ assets/             ← pixel-assets (na pipeline), namen = asset-ID's uit 02_ART
├─ assets_src/         ← ruwe AI-beelden (nooit direct in het spel)
├─ tools/
│  ├─ test_m1.js       ← acceptatietests M1 (node tools/test_m1.js)
│  ├─ test_m4.js       ← acceptatietests M4: advies (node tools/test_m4.js)
│  ├─ test_m5.js       ← acceptatietests M5: personeel
│  ├─ test_m6.js       ← acceptatietests M6: weekkaarten
│  ├─ test_advies.js   ← elke adviesvraag oplosbaar? (--md schrijft 06_ADVIESVRAGEN.md)
│  ├─ test_fase0.js    ← regressie audit: bank/uitstel/kaarten eenmalig, elke klant een uitkomst (ook 4×), levering
│  ├─ test_hervatten.js ← herladen op bon/zondag in een echte browser (optioneel, vraagt Playwright)
│  ├─ test_fase3.js    ← avondinzicht, niveaus, klussen, failliet-analyse
│  ├─ test_intro.js    ← intro en feedbackknop in een echte browser (Playwright)
│  ├─ test_fietser.js  ← fietser: hooguit eens per 30–60 s, nooit op een stoep met voetgangers, puur beeld
│  ├─ test_pakketA.js  ← pakket A na review 2 in een echte browser (Playwright): bedient het spel met muisklikken en tikken op de klikvlakken
│  ├─ test_pakketB.js  ← pakket B (weekklus, …) in een echte browser; VIEW=844x390 voor een andere schermmaat
│  ├─ balance.js       ← headless simulatie (node), gebruikt src/sim.js  [M2]
│  ├─ build_bg.py      ← achtergrond + lagen uit art_bronnen/ (ook vitrine en winkelfases)
│  ├─ measure_planks.py ← plankposities in de kasten meten
│  ├─ import_bladen.py ← figuren uit bladen van 2 × 3 (art_bronnen/personages/bladen_2026-11-12): staand + walk2/walk3, voor en achter, + sprites.js
│  ├─ import_fietser.py ← fietser uit een blad van 2 × 2 (art_bronnen/personages/fietser.png) → assets/fietser_*.png + fietser.js (wielen)
│  ├─ build_sprites.py ← alleen nog --manifest (sprites.js uit assets/chr_*); oude route <type>_<voor|achter>.png
│  ├─ build_tiles.py   ← tegels + iconen voor kast, koeling, vitrine, uithangbord uit art_bronnen/tegels/tegels_bron.png; schrijft alleen als de pixels veranderen
│  ├─ build_figuurtegels.py ← tegels met figuren (niveauscherm, personeelsvenster) uit de staande sprites; draait mee met build_tiles.py
│  ├─ build_voorgrond.py ← lantaarnpaal en paaltjes uit de achtergrond → assets/fg_straat.png
│  ├─ build_critters.py ← kat en muis uit art_bronnen/dieren/
│  ├─ build_portraits.py ← portretten uit art_bronnen/portretten/ (<wie>_<neutraal|blij|boos>.png)
│  ├─ build_share.py   ← favicon (png + ico) en deelbeeld assets/og_image.jpg uit logo en titelscherm
│  └─ pixelize.py      ← pixelpipeline voor sprites (02_ART §3)  [M8]
└─ 01–04 .md          ← docs staan in de hoofdmap
```

**Regels:**
- Spelregels (`sim.js`) weten niets van beeld. Zo kan de balanssimulatie exact dezelfde regels draaien als het spel.
- Getallen staan alleen in `config.js`, teksten alleen in `texts.js`. Tunen = één bestand aanpassen.
- Stabiele ID's overal; bestandsnamen van assets = ID. Wijnen hebben een rol-ID (`role_01` t/m `role_12`, draagt de spelwaarden) en een wijn-ID (`wine_chablis`, draagt type, druif, regio, stijl, fles). Een wijn wisselen = alleen de wijn-ID aanpassen.

---

## 2. Debugpaneel (F1)

Alleen actief met `?debug` in de adresbalk (ook bij dubbelklikken: `index.html?debug`), zodat de openbare versie geen +€500 geeft (besluit 93). Met `?debug` staat ook de versie weer linksonder op het titelscherm.

Vanaf M0 aanwezig, want het maakt testen tien keer sneller:
- +€500 / −€500, +50 reputatie, naar level X;
- dag overslaan, naar zondag, naar week X;
- +50 reputatie, naar week 8 (om winnen te testen);
- seed tonen/instellen;
- klantbeslissingen loggen (waarom kocht/liep iemand weg?);
- alle unlocks aan.

---

## 3. Balanssimulatie

`tools/balance.js` speelt runs van 8 weken met vaste botstrategieën en rapporteert winkans, eindkas, gemiddeld niveau en in welke week men failliet gaat.

**Hoe de bots spelen (besluit 70):** net als de speler. Elke ochtend zet Ronnie een voorstel klaar (`SIM.orderProposal`); de bot schuift per wijn met −6/+6/+12 tot hij bij zijn wens zit, snoeit met −6 als het niet past en drukt op Bestellen (`SIM.placeOrder`). De bruiloft wordt op vrijdagochtend afgehandeld zoals in het spel (`SIM.settleOrder`). Kaarten en tegenvallers waardeert de bot in euro's, alleen met wat de speler ook weet (bonnen van deze week, assortiment, kas): extra klanten × marge per klant, trends op wat er op het schap staat, reputatie in euro's (vroeg in de run meer waard), korting × wat je per week inkoopt, bruiloft alleen als de flessen op tijd te betalen zijn. Bij een tegenvaller betaalt hij als het ongemak meer kost dan de rekening. Huur en loon tellen mee in de reserve voor zondag (`SIM.costsLeft`). De slimme bots kiezen hun assortiment met de klanten van vandaag uit de prognose (dezelfde info als "Vandaag verwacht") en bestellen bij op wat er verkocht is plus wie er naast greep ("uitverkocht" op de bon).

| Bot | Wat hij doet | Doel | Stand 2026-09-27 (150 runs, besluit 76) |
|---|---|---|---|
| `alles` | slim + advies 80% + investeert + Fatima en Sem | **75–80%** ("goede speler die investeert en personeel neemt") | 79% |
| `invest` | slim + advies 80% + investeert als het zich terugverdient | ± 75% | 79% |
| `team` / `sem` / `fatima` | advies + personeel, investeert niet | ± 70% | 72% / 70% / 65% |
| `advies` | slim + advies 80% goed, geen investeringen of personeel | ± 60% | 63% |
| `perfect` | als advies, 100% goed | ≈ `alles` | 81% |
| `dubois` | slim + Dubois, zelf geen advies | boven slim | 48% |
| `slim` | planner-assortiment, geen advies | 35–45% | 43% |
| `gokker` | slim + 40% goed advies | < slim | 27% |
| `koopgraag` | koopt elke upgrade zodra er een buffer is | < invest | 63% |
| `mix` | vaste lijst van 12 per wijn, duurste wijnen eerst, past nooit iets aan | laag | 8% |
| `goedkoop` / `duur` / `lui` | alleen ≤ €6 / alleen ≥ €8 / nietsdoen | 0% | 0% / 0% / 0% |

Slimme bots zijn ook **klus-bewust** (klus-wijn op het schap, bij "verschillende wijnen" alle schappen vol). Niveau op dag (mediaan, `alles`): 2:4 · 3:7 · 4:11 · 5:14 · 6:19 · 7:23 · 8:26. Klus gehaald: 1–3 altijd, 4 (zes wijnen op één dag) 81% (vraagt de derde kast), 5 (Fatima) alleen als je haar aanneemt, 6–8 ± 90–98%.

Investeren is ± 16 punten waard, personeel ± 9 (bovenop alleen advies). Samen stapelen ze minder dan opgeteld, omdat het vroege loon en de investering allebei uit dezelfde krappe kas komen.

Week 1 knelt: wie vier schappen met 12 flessen vult, houdt €110 over na de eerste bestelling (mediaan `mix`); de planner-bots kopen voorzichtiger en houden ± €300 over. Failliet gaan gebeurt nu vooral in week 8 (de steile laatste termijn) en minder in week 5.

Draaien: `node tools/balance.js 150` (alle bots samen ± 10 min; één bot < 1 min). Alleen bepaalde bots: `BOTS=advies,invest node tools/balance.js 150`; met `STATS=1` erbij zie je marge en loon per dag, op welke dag elk niveau valt en hoe vaak elke klus gehaald wordt, uitverkocht, laagste kas in week 1, uitstel, bruiloft gehaald, welke kaarten gekozen worden, XP per dag per medewerker (met wat ze opbrengen) en wat de extra klanten van je investeringen per dag opleveren. Vergelijken: `NOCARDS=1` (zonder kaarten), `CARDS=oud` (oude kaartwaardering), `REPAY=90,140,...` (andere aflossing), `UPC='{"kast3":120}'` (andere prijs), of een tweede argument met config, bv. `'{"startCash":500}'`.

De bots rekenen met 80% goed advies. Met de moeilijkere vragen (besluit 49) ligt dat voor echte spelers waarschijnlijk lager: na HJ's testronde nameten.

**Draaien na elke wijziging aan economie of `config.js`.** Uitslag en conclusie komen kort in `04_BESLUITEN.md` bij grote tuningstappen.

---

## 4. Mijlpalen

Elke mijlpaal: bouwen → zelf testen (sim + klikken) → HJ speelt → feedback → volgende.

### M0 — Skelet (grijs)  ✔ klaar 2026-09-23
- Canvas 640×360 met integer-schaling, balken, pixelfont.
- Fasemachine: titel → voorbereiden → verkoop → resultaat → zondag.
- Isometrische kamer als grijze vloer + muren, klikbare objecten als blokken.
- Debugpaneel, opslaan/laden.

**Klaar als:** je kunt een lege dag starten en afsluiten, herladen en verdergaan.

### M1 — Verticale slice  ✔ klaar 2026-09-23
- 4 startwijnen, inkopen via telefoon, schappen vullen, prijsstanden.
- Klanten (buurtbewoner + koopjesjager) lopen binnen, kiezen via de formule, kopen of tonen een ballon, lopen weg.
- Dagresultaat op het bonnetje.

**Klaar als:**
- Given €800 en een leeg schap, When ik 12× de huiswijn rood (rol 1) koop en in vak 1 zet, Then daalt de kas met €36 en staan er 12 flessen zichtbaar in het vak.
- Given een verkoopdag, When een klant koopt, Then verdwijnt de fles zichtbaar, zweeft +€ boven de kassa en telt de omzet op.
- Given een wijn is op, When een klant die wil, Then verschijnt de "uitverkocht"-ballon en telt hij als gemiste verkoop.

### M2 — Economie en druk  ✔ gebouwd 2026-09-24 (nog door HJ te testen)
- Huur, aflossing, zondagsscherm met bankier, uitstel, game over, "Schuldenvrij!".
- Meegenomen uit M3: reputatie, 8 niveaus, niveau-scherm, unlocks van wijnen/kasten/klanttypes (besluit 30).
- Aflossingsbalk in de HUD.
- `tools/balance.js` werkt en haalt de doelen uit §3.

**Klaar als:** een run van 8 weken kan worden gewonnen én verloren, en de simulatie het doelpatroon laat zien.

### M3 — Progressie  (deels klaar, zie M2)
- ✔ Reputatie en 8 levels, alle 12 wijnen, liefhebbers en statuszoekers, extra schappen.
- ✔ Vitrine: houten trapje op de proeftafel met de gekozen wijn (besluit 62).
- ✔ Winkelfases: decor op niveau 3 (planten, stoepbord) en 6 (lichtsnoer, terras) (besluit 63).

**Klaar als:** de eerste unlock gebeurt vóór dag 4 en er tot week 7 ± elke 3–6 dagen iets nieuws komt.

### M4 — Advies en humor  ✔ gebouwd 2026-09-24 (nog door HJ te testen)
- ✔ Adviesmomenten: klant met **!** (geduld 8 s, echte tijd), klik → pauze → kaartje met 3 wijnen van je schap + "heb ik niet" → uitkomst met reactie, uitleg bij fout, "goed was" en weetje. Toetsen 1–3 / N, Esc = later.
- ✔ Beloning in de simulatie, fooi en adviesscore op de kassabon, `tools/test_m4.js`, balans opnieuw afgesteld (besluit 48).
- ✔ Ballonteksten en adviesreacties 4–8 per situatie; nooit twee keer dezelfde direct na elkaar.
- ✔ Bankierteksten uitgebreid (besluit 77).

**Klaar als:** 1–2 vragen per dag, altijd oplosbaar met de info op het kaartje; geen tekst komt 2× achter elkaar voor.

### M5 — Personeel  ✔ gebouwd 2026-09-25 (nog door HJ te testen)
- ✔ Sem (vakkenvuller + folders), Fatima (tweede kans), meneer Dubois (dure flessen + liggengebleven vragen). Max 2, loon per verkoopdag, XP per gewerkte dag, level 1–5, level-up-pop-up.
- ✔ Venster "Personeel" (toets P), figuurtjes in de winkel, loon op de kassabon, nieuwe kracht op het niveau-scherm, `tools/test_m5.js`, eindtuning aflossing (besluit 50).

**Klaar als:** aannemen is in de sim een zichtbare maar niet dominante verbetering. ✔

### M6 — Weekkaarten  ✔ gebouwd 2026-09-25 (nog door HJ te testen)
- ✔ 12 kaarten: 9 kansen (zondag 1 van 2, geldt de volgende week) en 3 tegenvallers (maandag, 25% kans vanaf week 2, eigen keuze). Label in de HUD met uitleg bij hover. `tools/test_m6.js`. Besluit 54.
- Trends kunnen op soort, land en stijl; op druif of regio kan ook (zelfde `match`), zodra er een kaart voor is.

### D — Investeren  ✔ gebouwd 2026-09-25 (nog door HJ te testen)
- ✔ Vijf upgrades (vitrine, derde en vierde kast, koeling, verlicht uithangbord) worden op een niveau te koop en moeten daarna gekocht worden. Venster "Investeren" (toets I) met getekende iconen, status (niveau X / prijs / gekocht) en de vitrinekeuze. Gouden stip en hint bij iets nieuws; niveauscherm toont "nu te koop · €X". Uithangbord krijgt een lamp en gloeit. Kassabon: regel "Investering". `tools/test_invest.js`. Besluit 60.
- ✔ Kat en muis als sprites van HJ (`tools/build_critters.py`). Besluit 61.
- ✔ Vitrine als trapje op de tafel (uit `bg_vitrine_bron.png`) en nieuw tegelblad 4 × 3 met iconen voor Investeren. Besluit 62.

### Pakket A na de tweede review  ✔ gebouwd 2026-11-12 (besluit 106–110)
- Schaarse wijn bestelbaar, failliet-analyse met de echte oorzaak, bruiloft telt bij opening, Ronnies voorstel, beeldfoutjes, weetje bij de gekozen wijn, opnieuw spelen en beste score, opnieuw beginnen na uitstel, touch en delen.
- Test: `tools/test_pakketA.js` (browser). Pakket B wacht per onderdeel op HJ (`claude/10_HANDOFF_NA_REVIEW2.md` §4).

### Fase 0–3 na audit en speelronde  ✔ gebouwd 2026-09-27 (besluit 65–77)
- Fase 0 betrouwbaarheid · fase 1 leesbaarheid · middenvenster Bestellen/Prijzen · fase 2 afstellen (bots als speler, startkas €400) · investeren en personeel zichtbaar en sterker · dagrapport · avondinzicht · niveaus met twee nieuwe dingen en klussen · failliet-scherm met "wat ging er mis".
- Tests: `node tools/test_fase3.js` (plus de eerdere); balans: §3.

### M7 — Juice en tutorial
- Alles uit ontwerp §12 (zonder geluid), eerste 5 minuten uit ontwerp §11.
- **M7a eerste 5 minuten ✔ 2026-09-27** (besluit 78). **M7b levendigheid ✔** (besluit 79; fietser ✔ besluit 98: `assets/fietser_<voor|achter>_<1|2>.png`, zie 02_ART §11). **Geen geluid** (besluit 80).

**Klaar als:** een nieuwe speler zonder uitleg de eerste week doorkomt (test: iemand die het spel nog niet kent; niets zeggen, meekijken).

### M8a — Geschilderde achtergrond  ✔ klaar 2026-09-24
- `tools/build_bg.py`: bronbeelden → `assets/bg_start.png` + lagen (`layer_shelf_3/4`, `layer_table`) + `layers.js`.
- `tools/measure_planks.py`: vindt de planken in de geschilderde kasten; waarden staan in `config.js` → `CC.BG.planks`.
- Nieuwe achtergrond? Vervang de bronnen in `art_bronnen/`, draai beide scripts, controleer de plankwaarden.

### M8 — Art
- Stand 2026-11-12: figuren, loopbeelden, fietser, straatvoorgrond en de haken voor de eindbeelden staan in 02_ART §11.
- `tools/pixelize.py`, masterpalet, assets wisselen per ID.
- Art kan al eerder, zodra HJ assets aanlevert: grijze blokken worden vanzelf vervangen zodra een asset met het juiste ID in `assets/` staat.

---

## 5. Werkwijze met Claude

- **Eén mijlpaal per sessie** (grote mijlpalen mogen twee).
- Begin van de sessie: Claude leest 01–04, niet de hele geschiedenis.
- **Tuning** (getallen, teksten) doet Claude zelf, gecontroleerd met de sim.
- **Ontwerpwijzigingen** (nieuwe mechaniek, andere loop, extra stat) eerst voorstellen en pas bouwen na akkoord van HJ → daarna in `04_BESLUITEN.md`.
- Na elke mijlpaal: korte lijst "wat is er nieuw, wat moet je testen, wat weet ik nog niet".

### Feedbackformat voor HJ na het spelen (mag kort)

```
Leuk:
Saai / irritant:
Onduidelijk:
Te makkelijk / te moeilijk:
Zou ik willen:
```

---

## 6. Definition of done (per mijlpaal)

- De "klaar als"-criteria kloppen.
- Er is niets kapotgegaan in eerdere mijlpalen (korte klikronde + sim).
- Getallen staan in `config.js`, teksten in `texts.js`.
- Placeholders zijn herkenbaar als placeholder.
- Docs kloppen nog met het spel; zo niet: docs bijwerken of besluit loggen.

---

## 7. Wensenlijst (later oppakken)

Geen afspraak om nu te bouwen; wel vastgelegd zodat we erop terugkomen.

### Personages
- ✔ **Varianten per klanttype** (besluit 64, 97): nu buurt 7, koopjes 3, liefhebber 5, snob 3, allemaal met loopbeelden. Meer kan: een blad van 2 × 3 in `art_bronnen/personages/bladen_2026-11-12/` en `tools/import_bladen.py` draaien (02_ART §11). ~~Meer kan: `<type><n>.png` als blad (voor links, achter rechts) in `art_bronnen/personages/`, daarna `build_sprites.py` draaien.~~ ~~Varianten per klanttype~~ Ideeën: buurtbewoner als man met boodschappentas en als jonge moeder; tweede koopjesjager; oudere liefhebber. Bestandsnamen: `art_bronnen/personages/<type><n>_<voor|achter>.png` (bv. `buurt2_voor.png`). Code kiest dan per klant willekeurig een variant.
- ✔ (besluit 64) **Liefhebber → verkoopster.** De huidige liefhebber (groen schort, fles + glas) wordt het personeel "verkoper" in M5. Nieuwe liefhebber genereren **zonder schort**, bv. met notitieboekje en leesbril.
- ✔ (gecontroleerd 2026-09-28: geen van de 10 klantsprites heeft nog een glas) **Geen wijnglas in de hand** bij klanten (buurtbewoner en liefhebber lopen nu met een glas). Bij de volgende ronde meevragen: "no wine glass".
- Personeel (M5) en bankier-portret (M2) in dezelfde stijl, met de achtergrond als stijlreferentie.

### Winkel en beeld
- ✔ (is al een avondbeeld) **Titelscherm 's avonds:** bewerking van de achtergrond ("same image, at night, warm lamp light inside").
- ✔ **Deurmatje** (besluit 84): drempel geprobeerd en afgewezen (te veel); in plaats daarvan het chique matje (bordeaux, gouden rand, lelie) uit `art_bronnen/bg_matje_bron.png`, door `build_bg.py` op het oude matje gelegd.
- ✔ **"+€"-bedrag bij de kassa** beter leesbaar (besluit 85).
- **Winkelfases** (kroonluchter, proeftafel) als lagen of bewerkingen van de goedgekeurde achtergrond, nooit opnieuw vanaf nul. Les van de vitrine: de bewerking tekent vaak meer om dan gevraagd; alleen het nieuwe object uitknippen en op de goedgekeurde versie plakken werkt het best.
