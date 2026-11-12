# Château Cashflow — Art & UI

> **Status:** source of truth voor alles wat je ziet. Technische standaard is **besluit**; het palet is een **concept** tot de eerste assets erdoor zijn gegaan.

---

## 1. Lessen uit het ChatGPT-prototype

**Wat goed was (houden):**
- De **isometrische kamer** als hoofdscherm: sfeervol, leesbaar, Game Dev Story-gevoel.
- Warme houttinten, crème muren, flesgroen en bordeaux.
- Het **logo**: wordt canon voor titelscherm en branding.

**Wat niet werkte (oplossen):**

| Probleem | Oorzaak | Oplossing |
|---|---|---|
| Assets verschillen in scherpte | Elk AI-beeld heeft zijn eigen "pixelgrootte" en is apart geschaald | Alles gaat door één **pixelpipeline** naar één vaste pixelgrootte en één palet (§3) |
| Bord "CHÂTEAU CASHFLOW" is gladde tekst in een pixelwereld | Tekst gerenderd als vector | Tekst in de wereld alleen met pixelfont of als pixel-asset |
| Voelt als een webpagina | Beige paginaachtergrond, kamer zweeft in lege ruimte, HTML-kaartjes met schreeffont, logo linksboven als site-header, sidebar-lijst | Volledig spelscherm, geen pagina: zie §6 |
| Fles in het detailpaneel is semi-realistisch | Andere stijl dan de wereld | Flesiconen zijn ook pixelart, zelfde pipeline |

---

## 2. Technische standaard (besluit)

| Onderdeel | Waarde |
|---|---|
| Interne resolutie | **640 × 360** (16:9) |
| Schaal | Integer: ×2 (1280×720), ×3 (1920×1080), ×4 (2560×1440). Rest = balken in de randkleur. |
| Filtering | Nearest-neighbour, nooit smoothing. `imageSmoothingEnabled = false`. |
| Perspectief | Isometrisch **2:1**; vloertegel 32 × 16 px |
| Kamer | 12 × 10 tegels (± 352 × 270 px incl. muren) |
| Lichtbron | Linksboven, voor alle assets gelijk |
| Omlijning | 1 px, donkerste paletkleur (`#1f0a0e`), bij sprites; niet bij vloer en muurvlakken |
| Schaduw | Eén contactschaduw per object (ovaal, 50% donker), geen slagschaduwen |
| UI | Tekent in **dezelfde 640×360-pixelgrid** als de wereld. Eén pixeldichtheid voor het hele spel. |

**Waarom 640×360 en niet 480×270:** een isometrische kamer met schappen, klanten en HUD heeft meer pixels nodig. 640×360 schaalt precies naar 1080p (×3) en 1440p (×4).

---

## 3. Pixelpipeline (de oplossing voor "verschillende scherpte")

Beeldmodellen maken geen echte pixelart; ze maken plaatjes die er zo uitzien, elk met een eigen blokgrootte. Daarom is **generatieve output altijd bronmateriaal**. De pipeline (`tools/pixelize.py`, wordt gebouwd in M8):

1. **Achtergrond weg:** transparant, of effen `#FF00FF` → wordt transparant.
2. **Bijsnijden** tot het object.
3. **Verkleinen** naar de *native grootte uit de assetlijst* (§8).
4. **Palet-quantize** naar het masterpalet (§4), zonder dithering.
5. **Alpha hard maken:** pixel is helemaal zichtbaar of helemaal weg.
6. **Omlijning** van 1 px toevoegen waar nodig.
7. **Preview** naast bestaande assets op ware grootte ×3 → pas dan in het spel.

Resultaat: elke asset heeft exact dezelfde pixelgrootte en kleuren, ongeacht welk model hem maakte.

---

## 4. Masterpalet (concept, 30 kleuren)

Afgeleid van het logo en het prototype. Wordt definitief na de eerste 5 assets.

| Groep | Kleuren |
|---|---|
| Outline / donker | `#1f0a0e` |
| Bordeaux | `#45101a` `#6e1a26` `#9c2a35` `#c9484f` |
| Hout / honing | `#4a2a17` `#7a4a24` `#b0733a` `#d9a25c` `#f0c77a` |
| Crème / muur | `#e3d3ad` `#f7ebc8` `#fdf6e3` |
| Flesgroen / salie | `#1f3a2e` `#2f5541` `#5e8a5f` `#9dbb86` |
| Steen / grijs | `#6b6259` `#a39a8c` `#d4cbbb` |
| Glas / lucht | `#7fa9b8` `#c4e0e3` |
| Goud (geld, unlocks) | `#e8b53a` `#fff1a8` |
| Huid | `#f1c7a0` `#c98b62` `#8a5433` |
| Feedback | rood `#d9412b` · groen `#4fa04a` |

Regel: feedbackkleuren (rood/groen) worden **alleen** voor spelfeedback gebruikt, niet als decoratie.

---

## 5. Wat de code tekent (geen assets nodig)

Dit scheelt veel beeldgeneratie en houdt alles consistent:

- **Flessen op het schap:** kleine 3×7-px flessen in de kleur van de wijn (fles + capsule), getekend door de code. Eén schap-sprite volstaat voor alle 12 wijnen.
- **Beweging:** ~~één stilstaande sprite + 1 px wiebelen~~ (achterhaald). Elke figuur heeft per aanzicht een staand beeld en twee stapbeelden (`walk2`, `walk3`); lopen = walk2 · staand · walk3 · staand, aan de afgelegde weg gekoppeld, plus spiegelen voor de richting (besluit 96, 97). Zie §11.
- **Ballonnetjes, zwevende getallen, glinsters, stofwolkjes:** code.
- **Balken** (reputatie, aflossing), knoppen en panelen: 9-slice van één paneel-asset + code.
- **Tijd van de dag:** licht door het raam kleurt licht mee (overlay).
- **De kamer zelf** (vanaf M1-visuals): behang, lambrisering, kroonlijst, boogramen met gordijnen, wandlampjes met gloed, uithangbord met logo, tapijt, lichtval op de vloer, wijnkasten, toonbank met koperen kassa, vat. Techniek: objecten worden **plat van voren** ontworpen en daarna kolom voor kolom op de 2:1-helling gezet (`R.shearBlit`). Daardoor blijft alles op het pixelgrid en kan er veel detail in.

**Gevolg voor de assetlijst (§8):** `bg_room_*`, `obj_shelf`, `obj_counter` en `obj_sign` hoeven niet meer gegenereerd te worden, tenzij een gegenereerde versie duidelijk mooier is. Beeldgeneratie richt zich op wat code slecht kan: **personages, portretten en losse decorstukken** (planten, vitrine, proeftafel, kroonluchter).

---

## 6. UI: een spel, geen website

### Principes

1. **Het scherm ís de game.** Geen paginaachtergrond, geen marges: de 640×360-canvas vult het venster (met balken in de randkleur).
2. **De kamer vult het beeld** (± 70%) met context eromheen: straat door het raam, deur naar het magazijn, geen lege beige vlakken.
3. **Klik op de wereld** in plaats van menu's:
   - schap → assortiment en vullen;
   - kassa → prijsstanden;
   - telefoon aan de muur → leveranciers en inkoop;
   - luik → kelder;
   - deur achterin → personeel;
   - bordje op de deur → "Winkel openen".
4. **HUD is klein en vast:**
   - bovenbalk (16 px hoog): *Week 2 · Di* · kas · **aflossingsbalk** ("€180 / €250 zo") · reputatiebalk + level;
   - rechtsonder tijdens verkoop: 1× / 2× / ⏭.
5. **Panelen schuiven in beeld** als houten/perkamenten pixelkaders (9-slice), over de kamer heen, en verdwijnen weer. Nooit meer dan één paneel tegelijk.
6. **Eén pixelfont** voor alles (voorstel: *m5x7* voor tekst en getallen, *m6x11* voor koppen; gratis, goed leesbaar). Geen schreeffonts, geen webfonts.
7. **Logo** alleen groot op het titelscherm; in-game hoogstens klein op het bord boven de deur (als pixel-asset).

### Schermen

| Scherm | Vorm |
|---|---|
| Titel | Logo op nachtelijke gevel van de winkel, deur licht op, "Nieuw spel / Doorgaan" |
| Voorbereiden | Kamer + HUD, klikbare objecten gloeien zacht op bij hover |
| Verkoop | Kamer vol klanten, HUD, snelheidsknoppen; adviesvraag = kaartje in beeld |
| Dagresultaat | Bonnetje/kassarol die uit de kassa rolt met de getallen |
| Zondag | Telefoongesprek met bankier (portret + tekstballon), daarna 2 weekkaarten als speelkaarten |
| Game over | Rolluik zakt over de winkel, venster "Failliet" erboven (haak `rolluik.png`, §11) |
| Schuldenvrij | Stralenkrans, vuurwerk, blije bankier en score; achtergrond = winkel of het feestbeeld (haak `schuldenvrij.png`, §11) |

---

## 7. Stijl in één blok (voor elke beeldprompt)

Plak dit bovenaan iedere prompt:

```
Pixel art game asset for a cozy isometric shop management game (like Game Dev Story).
Chunky low-resolution pixel art, clearly visible square pixels, 1-pixel dark burgundy outline,
flat cel shading with max 3 tones per material, NO anti-aliasing, NO gradients, NO blur, NO text.
Isometric 2:1 perspective, light from top-left.
Warm palette: honey wood, cream plaster, bottle green, burgundy, muted brass.
Single object, centered, full object visible with padding, plain solid magenta (#FF00FF) background.
```

Negatief (als het model dat ondersteunt): `realistic, 3D render, smooth shading, gradient, photo, text, watermark, multiple objects, drop shadow on background`.

**Tip:** genereer groot (1024 px). De pipeline verkleint naar de native grootte; hoe "blokkeriger" de bron, hoe beter het resultaat.

---

## 8. Assetlijst MVP

Native grootte = grootte in de 640×360-wereld. Status: **P** = placeholder door code, **G** = te genereren.

### Wereld

| ID | Asset | Native (px) | Prompt (na het stijlblok) |
|---|---|---|---|
| `bg_room_1` | Lege kamer fase 1: houten vloer, 2 muren (crème, groene lambrisering), 2 ramen links, deur rechtsachter | 400 × 300 | `Empty isometric room of a small old Dutch city wine shop, wooden plank floor, two walls: cream plaster above dark bottle-green wainscoting, two tall windows on left wall, a wooden back door on right wall, no furniture, view from front-right corner, walls cut away on the viewer side` |
| `bg_room_2` | Idem fase 2: nettere vloer, schilderij, lampen | 400 × 300 | zelfde + `polished floor, framed vineyard painting, two brass wall lamps` |
| `bg_room_3` | Idem fase 3: visgraatvloer, kroonluchter, lambrisering in bordeaux | 400 × 300 | zelfde + `herringbone parquet, small crystal chandelier, burgundy wainscoting, elegant` |
| `obj_shelf` | Houten wijnrek, 2 vakken, leeg | 40 × 56 | `Tall wooden wine rack with two empty compartments, honey-colored wood, carved green crown on top, empty shelves` |
| `obj_counter` | Toonbank met kassa | 56 × 40 | `Wooden shop counter with dark green front panels and an old brass cash register on top` |
| `obj_vitrine` | Glazen vitrinekastje op pootjes | 24 × 32 | `Small glass display cabinet on wooden legs, brass trim, empty, softly glowing` |
| `obj_hatch` | Kelderluik in de vloer (dicht) | 32 × 16 | `Wooden cellar trapdoor set into a plank floor, iron ring handle, closed` |
| `obj_phone` | Ouderwetse wandtelefoon | 12 × 16 | `Old-fashioned cream wall telephone with brass bell` |
| `obj_crates` | Stapel wijnkisten | 28 × 24 | `Stack of three wooden wine crates with stenciled marks` |
| `obj_plant_a/b` | Twee potplanten | 14 × 20 | `Potted plant in terracotta pot, lush green leaves` / variant: `small olive tree in pot` |
| `obj_tasting` | Proeftafel met glazen (fase 3) | 40 × 28 | `Round wooden tasting table with three wine glasses and a decanter` |
| `obj_sign` | Bord boven de deur met logo | 64 × 20 | *Niet genereren:* verkleinde versie van het logo via de pipeline |

### Personages (één sprite per stuk, kijkt naar linksvoor, wordt gespiegeld)

> **Achterhaald** (besluit 97): de maten en prompts hieronder zijn van de eerste ronde. Figuren komen nu uit bladen van 2 × 3, zie §11.

| ID | Wie | Native | Prompt |
|---|---|---|---|
| `chr_buurt` | Buurtbewoner | 16 × 30 | `Small full-body character, friendly middle-aged Dutch neighbor in cardigan and jeans, carrying a canvas shopping bag, standing, facing front-left` |
| `chr_koopjes` | Koopjesjager | 16 × 30 | `...thrifty older man in beige windbreaker and cap, holding a folded supermarket flyer...` |
| `chr_liefhebber` | Liefhebber | 16 × 30 | `...enthusiastic woman with round glasses and a scarf, holding a small notebook...` |
| `chr_snob` | Statuszoeker | 16 × 32 | `...tall man in navy blazer, sunglasses pushed up in slicked hair, nose slightly raised, loafers...` |
| `chr_sem` | Vakkenvuller | 16 × 30 | `...young intern with messy hair, green shop apron, carrying a wine crate...` |
| `chr_fatima` | Verkoper | 16 × 30 | `...confident young woman in green shop apron, headscarf in burgundy, welcoming gesture...` |
| `chr_dubois` | Sommelier | 16 × 32 | `...older French sommelier with moustache, black waistcoat, silver tastevin on a chain...` |

Personages hebben **exact dezelfde hoogte-standaard** (30 px, lang = 32). Houd bij genereren de verhoudingen vast: `chibi-light proportions, head about 1/4 of body height`.

### Portretten (dialoog en level-ups)

| ID | Wie | Native | Prompt |
|---|---|---|---|
| `por_bankier` | Bankier Balthazar Montenegro (J.P. Morgenstond & Co.) | 64 × 64 | Zie prompt C (§10). Drie stemmingen: `art_bronnen/portretten/bankier_neutraal.png`, `_blij.png`, `_boos.png` → `python tools/build_portraits.py`. |
| `por_sem`, `por_fatima`, `por_dubois` | Personeel | 48 × 48 | bust van hetzelfde personage als de sprite |

### UI

| ID | Asset | Native | Prompt |
|---|---|---|---|
| `ui_panel` | Paneelkader (9-slice) | 24 × 24 | `Pixel art UI frame, parchment center with dark wood border and small brass corner rivets, flat, seamless edges` |
| `ui_card` | Weekkaart / adviesvraag | 72 × 96 | `Pixel art playing card, cream paper, burgundy border, empty center area for text` |
| `ui_receipt` | Kassabon (dagresultaat) | 96 × 160 | `Long curled paper receipt, slightly torn top edge, empty` |
| `ui_bottle_*` | 12 flesiconen (per gekozen wijn) | 12 × 36 | `Single wine bottle, front view, simplified pixel version of the real [wijnnaam] bottle: [flesvorm], [kleur fles], [kleur capsule], label in [hoofdkleuren etiket]`. Upload een foto van de echte fles als referentie. Op 12 × 36 px blijft alleen de herkenbare kleur en vorm over; dat is genoeg. |
| `ui_icons` | Iconenset: munt, ster, fles, mannetje, klok, kelder, telefoon | 12 × 12 elk | Liever met de hand/code in het palet dan generen |

### Branding

| ID | Asset | Status |
|---|---|---|
| `logo_main` | Logo zoals het nu is | **Canon.** Alleen voor titelscherm; eventueel licht opgeschoond (de munt rechts is afgesneden). |

**Totaal te genereren voor de MVP: ± 30 beelden.** Tot die er zijn, bouwt de code alles als grijze vormen met dezelfde afmetingen, zodat assets later 1-op-1 kunnen worden gewisseld.

---

## 9. Reviewcheck per asset

1. Ware grootte ×3 naast andere assets: zelfde pixelgrootte? Zelfde outline?
2. Licht van linksboven?
3. Alleen paletkleuren?
4. Herkenbaar op ware grootte (niet alleen ingezoomd)?
5. Past perspectief bij de vloertegels?

Nee op één punt → opnieuw door de pipeline of opnieuw genereren.

---

## 10. Methode vanaf nu: geschilderde achtergrond + lagen (besluit 2026-09-23)

Code-getekende kamers blijven "programmeursart". Het gewenste detailniveau (referentie: HJ's afbeelding met warme lichtval, texturen en omgeving) komt van **één geschilderde achtergrond** met lagen erbovenop, zoals Theme Hospital en Game Dev Story ook werken.

### Taakverdeling

| Laag | Bron |
|---|---|
| Achtergrond: kamer, muren, ramen, kasten (lege planken), toonbank, vat, tapijt, straat eromheen | **Gegenereerd** op basis van `layout_blockout_1920.png` |
| Voorgrondlaag (toonbank e.d.) zodat klanten erachter kunnen lopen | Uitgeknipt uit de achtergrond (Claude) |
| Flessen op de planken (voorraad per vak) | Code, op vaste plankposities gemeten in de achtergrond |
| Logo op het uithangbord | Code/pixel-logo er bovenop (tekst blijft scherp) |
| Klanten, personeel, bankier | **Gegenereerde** sprites |
| Ballonnen, bedragen, hover-randjes, UI, lichtflikkering | Code |
| Groei van de winkel (extra kast, kroonluchter, …) | Bewerking van dezelfde achtergrond ("voeg hier een kast toe") of losse sprites in dezelfde stijl |

### Werkwijze

1. HJ genereert de achtergrond met `layout_blockout_eindfase_1920.png` (alle vier kasten) + stijlreferentie (prompt A). Vroegere fases maakt HJ daarna als **bewerking** ("same image, but remove the two rightmost wine cabinets; plain wall there"). Weghalen gaat beeldmodellen beter af dan consistent toevoegen.
2. Claude haalt hem door de pipeline: 640×360, palet afgeleid van de achtergrond zelf, harde pixels.
3. Claude kalibreert: vloerhoeken → looprooster, plankposities → flesvakken, klikvlakken, voorgrond-uitsnede.
4. Personages (prompt B) met de achtergrond als stijlreferentie → pipeline → in het spel.
5. Kleine afwijkingen van de layout zijn prima (Claude meet op het resultaat); grote afwijkingen → opnieuw genereren.

### Prompt A — achtergrond (layout-afbeelding + stijlreferentie meesturen)

```
Repaint the attached layout sketch as a finished, highly detailed cozy pixel-art game background,
in the style of the attached reference image: warm late-afternoon light, soft light shafts through
the windows, rich textures, hand-crafted details.
Keep the EXACT camera angle, room shape, wall positions, window positions and furniture positions of
the sketch. Only improve the art.
Scene: a small, elegant, square wine shop (about 8 by 8 meters) in an old Dutch city (Utrecht
canal-house style). The back corner of the room is cut off by a short wall that faces the viewer
directly: burgundy damask wallpaper with a large EMPTY framed sign board, and in front of it the
marble-topped wooden shop counter with a brass cash register and a black rotary telephone
(the focal point of the shop).
Both side walls are mirror images: next to the counter, two tall antique carved wooden wine cabinets
side by side with EMPTY shelves; towards the front of each wall, a tall arched window with burgundy
curtains. In the middle of the room, just in front of the counter, on a burgundy rug: a rectangular oak
presentation table with a small wooden wine crate display, two bottles, two glasses and a tiny
chalkboard. In the left corner under the left window an oak wine barrel; in the right corner under
the right window a stack of wooden wine crates with straw.
Cream plaster walls, dark green wood wainscoting, warm narrow wooden floorboards, entrance at the
front right. Furniture is at realistic human scale. No plants, no animals.
Outside the cut-away room: a quiet Dutch street — brick canal houses, cobblestones, a bicycle,
a street lamp — slightly darker and less detailed than the shop, so the shop stands out.
No people. No text or letters anywhere.
16:9, crisp pixel art with clearly visible square pixels, no blur, no anti-aliasing.
```

Daarna, als bewerking van het goedgekeurde resultaat:
- **A2 (titelscherm):** "Same image, identical composition, but at night: warm lamp light inside, dark blue street."
- **Fase 1 (start):** "Same image, identical in every detail, but remove the second wine cabinet on each side wall (the one furthest from the counter); plain wall with wainscoting there."

### Prompt B — personages (achtergrond meesturen als stijlreferentie)

> **Achterhaald** voor nieuwe figuren: lever een blad van 2 × 3 (§11). Prompt B blijft als stijlvoorbeeld.

```
Pixel-art character sprites in exactly the same style, lighting and pixel size as the attached
background. Full body, standing, 3/4 view facing front-left, each character separate on a plain
solid magenta (#FF00FF) background, all at the same scale (about 1/6 of the room's wall height),
clear readable silhouettes, no text:
1. friendly middle-aged Dutch neighbour in a green cardigan with a canvas tote bag
2. thrifty older man in a beige windbreaker and cap, holding a folded supermarket flyer
3. enthusiastic wine lover, woman with round glasses and a mustard scarf
4. status seeker, tall man in a navy blazer, sunglasses pushed up in his hair
```

Optioneel per personage een tweede pose "seen from behind, walking away" voor weglopende klanten.

### Risico's

- Het model houdt de layout niet perfect vast → Claude kalibreert op het resultaat.
- Groei van de winkel vraagt consistente bewerkingen van dezelfde afbeelding → altijd de **bewerkfunctie** op het goedgekeurde beeld gebruiken, nooit opnieuw vanaf nul.
- Drukke achtergrond maakt klanten en flessen minder leesbaar → Claude kan de achtergrond iets dempen en personages een donkere omlijning geven.


### Prompt C — portret bankier (stijlreferentie meesturen)

```
Pixel-art bust portrait for a cozy shop management game, same style and palette as the attached reference.
A suave, slightly too polished American investment banker in his fifties: dark olive skin, silver slicked-back
hair, trimmed grey goatee, navy pinstripe suit, burgundy silk tie with a gold tie bar, pocket square.
He holds an old-fashioned telephone receiver to his ear. Background: plain dark wood panelling, soft warm light
from the left. Head and shoulders, centered, square image, no text.
```

Varianten (zelfde beeld, alleen de gezichtsuitdrukking): **neutraal** (beleefd, zakelijk), **blij** (tevreden glimlach, één wenkbrauw omhoog), **boos** (teleurgesteld, lippen op elkaar, fronsend). Maak eerst neutraal en laat de andere twee als bewerking maken, dan blijft het gezicht gelijk.

**Status 2026-09-24:** ✔ gemaakt en ingebouwd (80 × 80 in het zondagscherm). Het neutrale bankiersportret is vanaf nu de **stijlreferentie voor alle portretten**.

### Prompt D — personeel: sprites (achtergrond meesturen als stijlreferentie)

> **Achterhaald** (besluit 97): Sem, Fatima en Dubois komen nu ook uit bladen van 2 × 3 (§11).

Per persoon twee beelden: vooraanzicht en achteraanzicht. Opslaan als `art_bronnen/personages/<sem|fatima|dubois>_<voor|achter>.png`.

```
Pixel-art character sprite in exactly the same style, lighting and pixel size as the attached
background and the attached customer sprite. Full body, standing, 3/4 view facing front-left,
plain solid magenta (#FF00FF) background, same scale as the customer sprite, clear readable
silhouette, no text. [PERSON]
```
Achteraanzicht: zelfde prompt + `seen from behind, walking away, same character, same outfit`.

| Wie | [PERSON] |
|---|---|
| Sem, vakkenvuller (stagiair) | `A lanky Dutch intern of about 19, messy blond hair, dark green shop apron over a faded band T-shirt, sneakers, carrying a wooden wine crate with both arms, slightly sleepy look.` |
| Fatima, verkoper | `A confident Dutch-Moroccan saleswoman of about 30, burgundy headscarf, dark green shop apron over a cream blouse, open welcoming hand gesture, warm smile.` |
| Meneer Dubois, sommelier | `An older French sommelier of about 60, grey moustache, black waistcoat over a white shirt, burgundy bow tie, silver tastevin cup on a chain around his neck, upright proud posture.` |

### Prompt E — personeel: portretten (bankiersportret + de sprite van die persoon meesturen)

Opslaan als `art_bronnen/portretten/<sem|fatima|dubois>_<neutraal|blij>.png`. *Blij* is voor de level-up-pop-up. Stuur twee beelden mee: het bankiersportret (stijl en kader) en de sprite van de persoon (`assets/chr_<sem|fatima|dubois>_front.png`, uiterlijk). Beschrijvingen bijgewerkt 2026-09-27 naar hoe de sprites er echt uitzien (Fatima heeft geen hoofddoek, maar lang krullend kastanjebruin haar).

```
Pixel-art bust portrait in exactly the same style, framing, lighting and pixel size as the attached
portrait of the banker. The person is the character from the attached sprite: same face, hair,
clothes and colours, now seen up close. Head and shoulders, centered, square image, no text.
Background: [BACKGROUND]. [PERSON]
```

| Wie | [BACKGROUND] | [PERSON] |
|---|---|---|
| Sem | `wooden wine racks full of bottles, a bit out of focus` | `A lanky Dutch intern of about 19: messy blond hair, dark T-shirt under a dark green shop apron, a pencil behind his ear, the edge of a wooden wine crate in his arms at the bottom of the frame. Slightly sleepy, crooked half-smile.` |
| Fatima | `the shop counter with a brass cash register, a bit out of focus` | `A confident saleswoman of about 30: long curly auburn hair, cream blouse with rolled-up sleeves under a dark green shop apron, one open hand raised as if presenting a bottle. Warm smile, eyebrows slightly raised as if she just closed a sale.` |
| Dubois | `a dark cellar wall with wine bottles lying in racks, candle light` | `An older French sommelier of about 60: grey swept-back hair, big grey moustache, white shirt with rolled-up sleeves, black waistcoat. He holds a glass of red wine up to the light, one eyebrow raised, judging.` |

Variant *blij*: bewerking van het neutrale beeld: `Same image, identical in every detail, only the facial expression changes: a big proud grin.`

**Status 2026-09-28:** ✔ alle zes gemaakt en ingebouwd (besluit 83).

### Prompt F — titelscherm (winkelinterieur of achtergrond meesturen als stijlreferentie)

Opslaan als `art_bronnen/titel_bron.png`. De code zet het logo er groot bovenop, en daaronder de knoppen.

```
Cozy pixel-art title screen background in exactly the same style, palette and pixel size as the
attached image. The storefront of a small, elegant wine shop in an old Dutch canal house in Utrecht,
at night, seen straight from the front across a cobblestone street and a canal edge. Ground floor:
a big shop window with warm golden light, wooden wine racks with bottles and a presentation table
visible inside; a green wooden door with a brass handle to the right; a cast-iron street lamp; a
bicycle leaning against the canal railing. Upper floors of the canal house fade into the dark blue
night sky with a few stars.
IMPORTANT: the upper-middle third of the image is calm and empty (dark sky and plain brick, no
signs, no windows there), because a large logo will be placed on top. The empty shop sign board above
the window is blank. No people, no text or letters anywhere.
16:9, crisp pixel art with clearly visible square pixels, no blur, no anti-aliasing.
```

### Prompt G — portret leverancier (bankiersportret meesturen als stijlreferentie)

Voorstel: **Ronnie Vermeulen** van groothandel *Vermeulen Dranken, Barendrecht*: gehaast, altijd in het magazijn, "Ja, zeg het maar." Opslaan als `art_bronnen/portretten/leverancier_neutraal.png` (en eventueel `_blij.png`).

```
Pixel-art bust portrait in exactly the same style, framing, lighting and pixel size as the attached
portrait of the banker, but a completely different man: a busy Dutch wine wholesaler of about 50,
stocky, short cropped grey hair, stubble, reading glasses pushed up on his forehead, a pencil behind
his ear, navy work fleece with a small company patch (no readable text). He holds a chunky warehouse
cordless phone to his ear with his shoulder while writing on a clipboard. Background: a warehouse
with pallets of wine boxes and a forklift, a bit out of focus, cool fluorescent light mixed with warm
light. Head and shoulders, centered, square image, no text.
```

### Prompt H — fietser (achtergrond + een klantsprite meesturen als stijlreferentie)

> **Gebouwd** (besluit 98): de vier beelden staan direct in `assets/` (zie §11, Fietser).

Vier beelden van dezelfde fietser: vooraanzicht en achteraanzicht, elk met twee trapstanden. Opslaan als `art_bronnen/personages/fietser_<voor|achter>_<1|2>.png`. Maak eerst `voor_1`; de andere drie als **bewerking** daarvan, dan blijven persoon en fiets gelijk. Rijdt over de straat langs de winkel (M7b), soms met een "Tring!"-ballonnetje.

```
Pixel-art character sprite in exactly the same style, lighting and pixel size as the attached
background and the attached customer sprite. A Dutch woman of about 35 riding a black
old-fashioned Dutch city bike (omafiets) with a wooden crate on the front rack holding a bunch of
flowers and a baguette; beige trench coat, red scarf blowing slightly backwards, sitting upright.
Isometric 3/4 view: she rides diagonally towards the viewer, facing front-left (same direction as
the customer sprite). The whole bike and rider are visible, both wheels complete. Same scale as
the customer sprite: her head at the same height as a standing customer's head. Plain solid
magenta (#FF00FF) background, clear readable silhouette, no shadow, no text.
```

Bewerkingen van het goedgekeurde beeld:
- `voor_2`: `Same image, identical in every detail, only the pedals and her legs are in the opposite position (the other foot down).`
- `achter_1`: `Same woman on the same bike, seen from behind, riding diagonally away from the viewer towards the back-right. Same style, scale and colours, magenta background.`
- `achter_2`: bewerking van `achter_1`, zelfde zin als bij `voor_2`.

### Prompt J — intro (besluit 86): stijlregels en beelden

De intro gebruikt dezelfde regels als de rest: 640 × 360, alleen hele schaalfactoren, nooit inzoomen (een close-up is een eigen beeld op ware grootte, zoals een kaartillustratie), sprites op ware grootte, UI en tekst in `CC.PAL` en het eigen pixelfont. Ochtend en nacht zijn kleurcorrecties van de bestaande achtergronden, gemaakt door `tools/build_intro.py` (64 kleuren, geen dithering; de lucht krijgt geditherde banden). Overgangen gaan met ordered dither, niet met overvloeien.

Nu door de code of de tool gemaakt, later te vervangen:

| Beeld | Nu | Vervangen door |
|---|---|---|
| Gevel in de ochtend, leeg pand (shot 1) | `title_bg.png` + kalk op de ruiten + kleurcorrectie | Prompt J1 → `art_bronnen/intro_gevel_bron.png` |
| Sleutel in het slot, 160 × 80 (shot 4) | Placeholder in `src/intro.js` | Prompt J2 → `art_bronnen/intro_sleutel_bron.png` + `intro_sleutel_gedraaid_bron.png` |

Na het opslaan van een bron: `python tools/build_intro.py`. Het TE KOOP-bord, de regen en het woordje "klik" tekent de code er altijd overheen.

**Prompt J1 — gevel in de ochtend** (bewerking van `art_bronnen/titel_bron.png`; die meesturen):

```
Same image, identical composition, camera and every detail, but early morning just before sunrise in
light drizzle: cool blue-grey light, wet shiny cobblestones, the street lamps still on. The wine shop is
empty and vacant: every shop window whitewashed from the inside with swirly white chalk paint, a few thin
uneven spots near the edges, no light inside, the three lamps above the shop sign off. The sign board
stays blank. No people, no text or letters anywhere.
```

**Prompt J2 — sleutel** (een kaartillustratie meesturen als stijlreferentie, bijv. `assets/card_kassa.png` vergroot):

```
Pixel-art illustration in exactly the same style, palette and pixel size as the attached card
illustration. Close-up of a brass key in the brass lock plate of a dark green painted wooden shop door of
an old Dutch canal house; on the right a narrow strip of stone door frame and brick wall. Early morning,
cool light, a few raindrops on the paint. Wide 2:1 composition, no hands, no text.
```

Daarna als bewerking: `Same image, identical in every detail, only the key has turned a quarter turn: its bow now stands vertical.` → `intro_sleutel_gedraaid_bron.png`.

---

## 11. Figuren, straat en eindbeelden (stand 2026-11-12, besluit 96–101)

Dit vervangt wat §2, §5, §8 en de prompts B en D zeggen over personages.

### Figuren uit bladen van 2 × 3

- **Bron:** per figuur één blad op effen magenta (rood en blauw > 200, groen < 90), `art_bronnen/personages/bladen_2026-11-12/<naam>.png`. Bovenste rij: vooraanzicht staand, stap, stap. Onderste rij: achteraanzicht staand, stap, stap. `<naam>` = klanttype of personeelslid, eventueel met een nummer: `buurt`…`buurt7`, `koopjes`…`koopjes3`, `liefhebber`…`liefhebber5`, `snob`…`snob3`, `sem`, `fatima`, `dubois`. Bestanden die met `alt_` beginnen zijn alternatieven en worden niet ingelezen.
- **Bouwen:** `python tools/import_bladen.py art_bronnen/personages/bladen_2026-11-12`. Per figuur zes beelden: `assets/chr_<naam>_<front|back>.png` (staand) en `_walk2.png`, `_walk3.png` (stappen). Eén schaal per figuur (het staande vooraanzicht bepaalt die), hoogte per type: buurt 64, koopjes 62, liefhebber 64, snob 68, Sem 64, Fatima 62, Dubois 64 px. Eén voetlijn (onderste rij) en één kader per aanzicht, 27–48 px breed; het bovenlijf staat in het midden van het kader en de stapbeelden worden er zo op gelegd dat het bovenlijf niet verspringt. Eén palet van 28 kleuren voor alle zes, harde alpha. Het script schrijft ook `assets/sprites.js` (manifest + `CC.SPRITE_VARIANTS`).
- **Kijkrichting:** `CC.SPRITE_FACING` in `src/config.js`. Bij de bladen van 2026-11-12 kijkt het vooraanzicht naar links (−1) en loopt het achteraanzicht naar rechts weg (1); de code spiegelt naar de looprichting.
- **Lopen** (besluit 96): reeks walk2 · staand · walk3 · staand zolang een figuur loopt, tempo aan de afgelegde weg (`R.WALK_RATE`). Ontbreekt een stapbeeld of heeft het een andere maat, dan het oude wiebelen.
- **`tools/build_sprites.py`** is alleen nog nodig voor `--manifest` (manifest opnieuw schrijven uit wat er in `assets/` staat; pakt alleen `chr_*`). De oude route met losse `<naam>_<voor|achter>.png` werkt nog, maar herbouwt geen staand beeld waar stapbeelden bij horen (`--forceer` om dat toch te doen).
- **Tegels** van het niveauscherm en het personeelsvenster komen uit dezelfde staande beelden op ware grootte, met een donker randje van 1 px: `tools/build_figuurtegels.py` (draait mee met `build_tiles.py`, dat alleen nog kast, koeling, vitrine en uithangbord uit `tegels_bron.png` maakt).
- **Nieuwe figuur:** blad maken, in de bladenmap zetten, script draaien, kijkrichting in `CC.SPRITE_FACING` zetten. Een nieuwe variant van een bestaand type doet vanzelf mee (klanten en voorbijgangers).

### Straat

- **Voorbijgangers** gebruiken alle klantfiguren. Vanaf niveau 6 lopen ze op de linkerstoep om het terras heen (besluit 99).
- **Voorgrond:** de lantaarnpaal en twee paaltjes links zijn uit de achtergrond geknipt (`assets/fg_straat.png`, `tools/build_voorgrond.py`) en worden over de figuren op straat getekend. Na een nieuwe achtergrond het script opnieuw draaien.
- **Fietser** (prompt H, besluit 98): `assets/fietser_voor_1.png` en `_2` (50 × 64), `assets/fietser_achter_1.png` en `_2` (46 × 63), transparant, op spelgrootte, direct gebruikt (geen bouwscript). Vooraanzicht rijdt naar linksvoor, achteraanzicht naar rechtsachter; de code spiegelt voor de andere richtingen. Nieuwe beelden met andere afmetingen? Dan in `src/fx.js` de punten waar de wielen de grond raken bijwerken (`BIKE_WHEELS`), anders staat de schaduw verkeerd.

### Eindbeelden (haken)

Beide beelden zijn optioneel: ontbreekt het bestand, dan tekent de code het scherm zoals nu.

| Bestand | Maat | Gebruik | Prompt |
|---|---|---|---|
| `assets/rolluik.png` | 640 × 343 | Failliet: zakt in 1,25 s van boven (onder de HUD, y 17) over de winkel en veert even na; venster "Failliet" erboven, dus het midden rustig houden | M1 in `claude/08_ART_PAKKET_B.md` |
| `assets/schuldenvrij.png` | 640 × 360 | Schuldenvrij: vloeit in 0,6 s over de winkel heen als achtergrond; venster met bankier en score erboven, licht gedimd; de HUD blijft bovenaan (bovenste 17 px vallen eronder) | M2 in `claude/08_ART_PAKKET_B.md` |

