# Château Cashflow — Decisions Log

> **Status:** Source of truth voor belangrijke projectbeslissingen  
> **Doel:** Vastleggen welke keuzes bewust zijn gemaakt, waarom ze gelden en welke eerdere richtingen daarmee zijn vervangen.

---

## Gebruik van dit bestand

Voeg hier alleen beslissingen toe die de identiteit, gameplay, art direction, scope of werkwijze merkbaar beïnvloeden.

Per beslissing:

- datum;
- onderwerp;
- besluit;
- reden;
- status;
- eventuele vervanging van een eerdere richting.

Gebruik statussen:

- **Definitief**
- **Werkhypothese**
- **Achterhaald**

---

## 2026-09-18 — Inspiratiehiërarchie

**Besluit:**  
De inspiratiehiërarchie is:

1. Game Dev Story
2. Winkeltje: The Little Shop
3. Theme Hospital
4. Big Ambitions

**Reden:**  
Game Dev Story bepaalt vooral tempo, progression, korte cycli en het “nog één ronde”-gevoel. Winkeltje bepaalt vooral de fysieke winkelervaring. Theme Hospital dient als referentie voor charme en levendigheid. Big Ambitions is alleen inspiratie voor latere schaal.

**Status:** Definitief

---

## 2026-09-18 — Core loop

**Besluit:**  
De kerncyclus is:

`voorbereiden → winkel openen → verkoop observeren → resultaten → nieuwe keuzes → volgende dag`

**Reden:**  
Dit ondersteunt korte cycli en directe feedback zonder overmatige micromanagement.

**Status:** Definitief

---

## 2026-09-18 — Verkoopdag en tijdcontrole

**Besluit:**  
Tijdens de verkoopfase observeert de speler vooral het resultaat van eerdere keuzes.

Beschikbare tijdcontrole:

- normaal;
- 2×;
- overslaan.

**Reden:**  
De game moet weinig knoppen hebben en een vlot managementritme behouden.

**Status:** Definitief

---

## 2026-09-18 — De fysieke winkel staat centraal

**Besluit:**  
De fysieke winkel is het belangrijkste scherm en moet zichtbaar reageren op keuzes van de speler.

**Reden:**  
Château Cashflow moet geen spreadsheetgame of verzameling losse dashboards worden.

**Status:** Definitief

---

## 2026-09-18 — Economische kern

**Besluit:**  
De speler begint met beperkte cash. Voorraad legt geld vast en vormt daarmee een echte economische afweging.

**Reden:**  
De belangrijkste vroege spanning moet ontstaan uit keuzes rond cash, voorraad, vraag, prestige en risico.

**Status:** Definitief

---

## 2026-09-18 — Wijnstats

**Besluit:**  
De kernstats per wijn zijn:

- Kwaliteit
- Prestige
- Vraag
- Schaarste
- Potentie

Marge is geen aparte stat en volgt uit inkoopprijs versus verkoopprijs.

**Reden:**  
Dit geeft voldoende variatie zonder de game te veranderen in een complexe wijnsimulator.

**Status:** Definitief

---

## 2026-09-18 — Platformrichting

**Besluit:**  
Château Cashflow is **desktop-first in landscape**.

**Reden:**  
De winkel moet visueel ruimte krijgen en de game wordt primair als managementgame ontworpen.

**Status:** Definitief

---

## 2026-09-18 — Art direction

**Besluit:**  
De spelwereld gebruikt **premium, relatief grove management-pixelart**.

**Reden:**  
Deze richting geeft de game een herkenbare charme, past bij de managementgame-referenties en ondersteunt een duidelijke visuele identiteit.

**Status:** Definitief

---

## 2026-09-20 — Volledig flat 2D niet als hoofdartstyle gebruiken

**Besluit:**  
Een latere flat-2D-richting wordt niet gebruikt als vervanging van de gekozen pixelartwereld.

**Reden:**  
Die latere richting ontstond vooral in UI/graphics-discussies en was geen expliciete vervanging van de eerder gekozen art direction.

**Status:** Definitief

**Vervangt / corrigeert:**  
Volledig flat 2D als hoofdartstyle is **Achterhaald**.

---

## 2026-09-23 — Pixelartwereld + strakke 2D-UI

**Besluit:**  
De spelwereld blijft pixelart; de UI wordt bewust cleaner en vlakker voor leesbaarheid.

**Reden:**  
Dit behoudt karakter en bestaande assets, terwijl cijfers, panelen en bediening rustig en duidelijk blijven.

**Status:** Definitief

---

## 2026-09-23 — Lichte fysieke winkelmechaniek

**Besluit:**  
De winkel krijgt echte schappen, zichtbare capaciteit en betekenisvolle plaatsing, maar geen complexe vrije interieur- of logistieksimulatie.

**Reden:**  
De fysieke winkel moet gameplaywaarde hebben zonder dat Château Cashflow verandert in een bouw- of logistiekgame.

**Status:** Definitief

---

## 2026-09-23 — Progression via reputatie / winkelniveau

**Besluit:**  
De primaire progression loopt via **reputatie / winkelniveau**.

**Reden:**  
Dit sluit goed aan op Game Dev Story: frequente unlocks en duidelijke vooruitgang zonder onnodige complexiteit.

**Status:** Definitief

---

## 2026-09-23 — Regio's zijn geen kwaliteitsladder

**Besluit:**  
Wijnregio's worden niet gebruikt als lineaire progression waarbij de ene regio objectief “beter” is dan de andere.

**Reden:**  
Regio's zijn inhoudelijk verschillend, niet simpelweg hogere of lagere kwaliteit.

**Status:** Definitief

### Mogelijk later

Regio's kunnen later wel betekenis krijgen via bijvoorbeeld:

- leveranciers;
- klantvoorkeuren;
- events;
- assortimentsthema's;
- import;
- tijdelijke focus.

**Status van deze toepassingen:** Idee

---

## 2026-09-23 — MVP bevat circa 12 wijnen

**Besluit:**  
De eerste serieuze MVP richt zich op ongeveer **12 wijnen**.

**Reden:**  
Dit is voldoende voor echte assortiment- en voorraadkeuzes, maar klein genoeg om goed te balanceren en visueel te produceren.

**Status:** Definitief

---

## 2026-09-23 — Bestaande assets eerst beoordelen

**Besluit:**  
Bestaande goede assets worden niet automatisch vervangen. Ze kunnen worden aangewezen als canon-assets en als stijlankers dienen.

**Reden:**  
Er zijn al veel assets gemaakt. Hergebruik voorkomt verspilling en helpt een natuurlijke visuele familie te behouden.

**Status:** Werkhypothese

---

## 2026-09-23 — Geen exacte pixelpipeline vastleggen vóór audit

**Besluit:**  
Waarden zoals `480×270`, `16×16`, exacte pixels-per-unit of camera scale worden nog niet als canon vastgelegd.

**Reden:**  
De huidige game, assets en engine-instellingen moeten eerst worden onderzocht om een niet-destructieve standaard te kiezen.

**Status:** Definitief procesbesluit

---

## 2026-09-23 — Source-of-truth-structuur

**Besluit:**  
Het project gebruikt deze documentstructuur:

- `00_PROJECT.md`
- `01_GAME_DESIGN.md`
- `02_ART_BIBLE.md`
- `03_BUILD_GUIDE.md`
- `04_DECISIONS.md`
- `05_BACKLOG.md`

**Reden:**  
Dit scheidt projectoverzicht, gameplay, art, bouwproces, beslissingen en open werk duidelijk van elkaar.

**Status:** Definitief

**Vervangt:**  
Eerdere compactere documentstructuren.

---

## 2026-09-23 — Statuslabels in documentatie

**Besluit:**  
Gebruik:

- Definitief
- Werkhypothese
- Idee
- Technisch openstaand
- Achterhaald

**Reden:**  
Voorkomt dat brainstormideeën later per ongeluk als goedgekeurde features worden behandeld.

**Status:** Definitief

---

## 2026-09-23 — AI-agents mogen niet stilzwijgend ontwerpen

**Besluit:**  
ChatGPT, Work en coding agents mogen tuning en gewone implementatiekeuzes zelfstandig uitvoeren binnen bestaande kaders, maar geen fundamentele ontwerpkeuzes invoeren zonder expliciete beslissing.

**Reden:**  
Het project moet inhoudelijk consistent blijven en ontwerpbeslissingen moeten herleidbaar zijn.

**Status:** Definitief

---

## 2026-09-23 — Eerst auditen, dan grote wijzigingen

**Besluit:**  
Voor grote opschoning, pixelnormalisatie, brede refactors of synchronisatie tussen docs en implementatie geldt:

**eerst rapporteren, daarna wijzigen.**

**Reden:**  
Er bestaat al een game en er zijn al assets. Grote bulkchanges zonder audit kunnen goed werk vernietigen of verkeerde aannames vastleggen.

**Status:** Definitief

---

## Open beslissingen

De volgende onderwerpen zijn nog bewust niet definitief beslist:

- exacte prijsmechaniek;
- precieze rol van Potentie;
- diepte van klanttypen;
- medewerkersrollen;
- effect van schapplaatsing;
- regionale gameplaymechanieken;
- events;
- exacte unlockstructuur;
- late-game-systemen;
- technische pixelpipeline na audit.

Deze punten horen pas als nieuwe entries in dit bestand wanneer er daadwerkelijk een besluit wordt genomen.
