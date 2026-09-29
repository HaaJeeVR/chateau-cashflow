# Château Cashflow — Build Guide

> **Status:** Source of truth voor werkwijze  
> **Doel:** Beschrijft hoe ChatGPT, Work, coding agents en toekomstige bijdragers aan Château Cashflow moeten werken.

---

## 1. Hoofdregel

### Definitief

**Château Cashflow is een bestaand project, geen blanco startpunt.**

Voordat code, assets, UI of documentatie worden gewijzigd:

1. lees de relevante source-of-truth-documenten;
2. inspecteer bestaande implementatie;
3. bepaal wat al bestaat;
4. controleer of voorgestelde wijziging een ontwerpbeslissing vereist;
5. wijzig alleen wat nodig is.

---

## 2. Source of truth

### Definitief

Gebruik deze documenten:

- `00_PROJECT.md`
- `01_GAME_DESIGN.md`
- `02_ART_BIBLE.md`
- `03_BUILD_GUIDE.md`
- `04_DECISIONS.md`
- `05_BACKLOG.md`

### Prioriteit bij conflict

1. Meest recente expliciete beslissing in `04_DECISIONS.md`
2. Definitieve regels in source-of-truth-documenten
3. Huidige goedgekeurde implementatie
4. Werkhypotheses
5. Backlog / losse ideeën
6. Oude chats / brainstorms

Een los idee uit een oude chat mag nooit automatisch een recente definitieve keuze overschrijven.

---

## 3. Statuslabels

### Definitief

Gebruik:

- **Definitief**
- **Werkhypothese**
- **Idee**
- **Technisch openstaand**
- **Achterhaald**

Coding agents mogen een **Idee** niet behandelen als opdracht tot implementatie.

---

## 4. Ontwerpbeslissing versus tuning

### Definitief

Niet iedere open variabele hoeft terug naar de gebruiker.

### Tuning

Voorbeelden:

- dagduur;
- snelheid;
- prijswaarden;
- marges;
- reputatiepunten;
- klantfrequentie;
- unlocktempo;
- personeelskosten.

Deze mogen via testen worden aangepast zolang het fundamentele systeem gelijk blijft.

### Ontwerpbeslissing

Voorbeelden:

- nieuw kernsysteem;
- nieuwe wijnstat;
- andere core loop;
- ander progressionmodel;
- andere art direction;
- mobile-first in plaats van desktop-first;
- vrije interieurplaatsing;
- regio's als lineaire kwaliteitsprogressie.

Deze mogen niet stilzwijgend worden ingevoerd.

---

## 5. Featureworkflow

### Definitief proces

Gebruik voor betekenisvolle features:

**Define → Plan → Assets → Execute → Validate → Review**

### 5.1 Define

Beschrijf:

- wat de speler merkt;
- welk probleem wordt opgelost;
- waarom dit de game beter maakt;
- of het Definitief, Werkhypothese of Idee is.

### 5.2 Plan

Bepaal:

- welke bestaande systemen worden geraakt;
- welke bestanden relevant zijn;
- welke data/config verandert;
- welke assets nodig zijn;
- hoe de feature getest wordt.

### 5.3 Assets

Controleer eerst bestaande assets.

Nieuwe assets alleen maken als:

- hergebruik niet logisch is;
- bestaande asset niet te normaliseren is;
- nieuwe gameplayfunctie dat vereist.

### 5.4 Execute

Bouw in kleine, controleerbare stappen.

### 5.5 Validate

Test:

- functioneel gedrag;
- regressies;
- gameplayfeedback;
- UI;
- art consistency;
- save/data-impact waar relevant.

### 5.6 Review

Controleer:

- voldoet het aan acceptance criteria?
- is het simpeler te maken?
- komt implementatie overeen met documentatie?
- moet `04_DECISIONS.md` of een andere bron worden bijgewerkt?

---

## 6. Player promise

### Werkhypothese

Voor iedere belangrijke feature moet in één zin kunnen worden gezegd:

> **Wat wordt hierdoor voor de speler leuker, duidelijker of interessanter?**

Als dat niet helder is, is de feature waarschijnlijk onvoldoende gedefinieerd.

---

## 7. Acceptance criteria

### Definitief procesprincipe

Betekenisvolle taken krijgen vooraf duidelijke acceptance criteria.

Waar nuttig in:

**Given / When / Then**

Voorbeeld:

```md
Given de speler heeft €500 en geen voorraad van wijn X
When de speler 6 flessen van wijn X inkoopt
Then wordt de kas direct verlaagd
And wordt de voorraad met 6 verhoogd
And kan die voorraad tijdens een verkoopdag worden verkocht
```

Doel:

- minder interpretatie;
- minder scope creep;
- eenvoudiger testen;
- minder herstelwerk.

---

## 8. Kleine verticale slices

### Definitief procesprincipe

Voorkeur voor een **volledige kleine speelbare keten** boven meerdere half-afgebouwde systemen.

Bijvoorbeeld liever:

`inkopen → schap → klant → verkoop → resultaat`

volledig werkend,

dan tegelijkertijd:

- personeel half;
- regio's half;
- events half;
- webshop half.

---

## 9. Placeholder-first

### Werkhypothese

Mechanics mogen eerst met placeholders worden gebouwd wanneer perfecte art de validatie zou vertragen.

Maar:

- placeholders moeten duidelijk gemarkeerd zijn;
- tijdelijke assets mogen niet onbedoeld canon worden;
- na bewezen gameplay volgt art-normalisatie.

---

## 10. Bestaande code eerst

### Definitief

Voordat nieuwe code wordt toegevoegd:

- zoek bestaande implementatie;
- controleer of vergelijkbare functionaliteit al bestaat;
- vermijd duplicatie;
- hergebruik bestaande abstractions waar dat begrijpelijk blijft;
- refactor niet groter dan nodig.

### Niet doen

- een tweede inventorysysteem maken omdat het eerste niet direct werd gevonden;
- dezelfde config op meerdere plekken hardcoden;
- nieuwe architectuur introduceren zonder noodzaak;
- brede cleanup uitvoeren tijdens een kleine featuretaak.

---

## 11. Scope discipline

### Definitief

Werk aan de gevraagde taak.

Wanneer tijdens implementatie andere verbeteringen worden ontdekt:

- noteer ze in backlog;
- los alleen blockers direct op;
- verbreed scope niet automatisch.

Dit is extra belangrijk bij AI-agents, omdat zij anders gemakkelijk een kleine taak veranderen in een grote refactor.

---

## 12. Configuratie en balans

### Werkhypothese

Balanceerbare waarden moeten waar mogelijk buiten kernlogica blijven.

Denk aan:

- prijzen;
- vraag;
- voorraadgroottes;
- reputatie;
- unlocklevels;
- snelheid;
- personeelskosten.

Doel:

- makkelijk tunen;
- minder codewijzigingen;
- eenvoudiger testen.

### Niet doen

Belangrijke tuningwaarden willekeurig verspreid hardcoden als een centrale configuratie logischer is.

---

## 13. Stable IDs

### Werkhypothese

Gebruik stabiele interne IDs voor content en assets.

Voorbeeld:

- `wine_bourgogne_001`
- `shelf_basic_01`
- `customer_value_01`

Bestandsnamen of visuele assets mogen later veranderen zonder dat hele systemen herschreven hoeven te worden.

---

## 14. Canon versus experiment

### Definitief procesprincipe

Experimentele varianten moeten herkenbaar gescheiden blijven van productieversies.

Bijvoorbeeld:

- canon;
- prototype;
- experiment;
- placeholder;
- deprecated.

Een experiment mag pas canon worden na expliciete beoordeling.

---

## 15. Art-implementatie

### Definitief

Bij nieuwe of gewijzigde art:

1. lees `02_ART_BIBLE.md`;
2. identificeer relevante asset family;
3. controleer canon-assets;
4. respecteer pixeldensity en scaling;
5. test in game;
6. beoordeel op speelschaal;
7. documenteer afwijkingen.

AI-generated art is bronmateriaal totdat het de review heeft doorstaan.

---

## 16. UI-implementatie

### Definitief

UI ondersteunt de winkel, niet andersom.

### Richtlijnen

- vermijd onnodige modals;
- beperk gelijktijdige informatie;
- gebruik consistente componenten;
- behoud ruimte voor de spelwereld;
- toon alleen informatie die op dat moment relevant is;
- voeg geen knop toe zonder duidelijke actie;
- voorkom dashboards die de core loop vervangen.

---

## 17. Testing

### Definitief procesprincipe

Iedere betekenisvolle wijziging wordt getest op het niveau dat relevant is.

### Minimaal controleren

- werkt de feature?
- breekt bestaande gameplay?
- verandert save/data?
- zijn foutstates afgehandeld?
- klopt UI-feedback?
- klopt economie?
- klopt art scaling?
- blijft performance acceptabel?

### Bij economische features

Controleer minimaal:

- te weinig cash;
- precies genoeg cash;
- overvloedige cash;
- lege voorraad;
- volle voorraad;
- verkoop met lage vraag;
- verkoop met hoge vraag.

---

## 18. Gameplay review

### Definitief procesprincipe

Na grotere gameplaywijzigingen:

- is de keuze begrijpelijk?
- zijn er echte trade-offs?
- krijgt de speler snel feedback?
- ontstaat een dominante triviale keuze?
- is het te complex?
- is het te traag?
- nodigt het uit tot nog één dag?

---

## 19. UI / art review

### Definitief procesprincipe

Controleer:

- visuele hiërarchie;
- leesbaarheid;
- pixeldensity;
- scaling;
- palette;
- perspectief;
- family resemblance;
- hoeveelheid visuele ruis.

Zie ook `02_ART_BIBLE.md`.

---

## 20. Game ↔ docs audit

### Definitief procesprincipe

Periodiek wordt gecontroleerd of:

- documentatie beschrijft wat daadwerkelijk in de game zit;
- de game geen belangrijke niet-gedocumenteerde systemen bevat;
- backlog-items niet per ongeluk canon zijn geworden;
- oude documenten geen conflicterende instructies geven.

### Uitkomst

Per afwijking:

- docs bijwerken;
- game aanpassen;
- als bewuste uitzondering documenteren;
- als achterhaald markeren.

---

## 21. Evidence → Experiment → Decision

### Werkhypothese

Bij twijfel over grotere wijzigingen:

1. **Evidence** — wat zien we daadwerkelijk?
2. **Experiment** — wat is de kleinste test?
3. **Decision** — pas daarna canon wijzigen.

Voorbeeld:

Niet:

> "De winkel voelt leeg, dus we bouwen direct een complex decoratiesysteem."

Wel:

> "De winkel voelt leeg. Test eerst enkele visuele props of klantdichtheid en kijk welk probleem werkelijk speelt."

---

## 22. Simplify pass

### Definitief procesprincipe

Na implementatie expliciet vragen:

- kan er code weg?
- kan een stap verdwijnen?
- kan een knop weg?
- kan een stat weg?
- kan een UI-panel simpeler?
- kan dezelfde feedback directer?
- is een systeem complexer geworden dan de gameplaywinst rechtvaardigt?

---

## 23. Token- en contextdiscipline voor AI-agents

### Definitief procesprincipe

Voor efficiënte AI-ontwikkeling:

- geef een afgebakende taak;
- laat alleen relevante bestanden openen;
- verwijs naar source-of-truth;
- voorkom telkens volledige projectanalyse;
- gebruik korte audits voor kleine wijzigingen;
- vraag concrete output;
- stop na taakvalidatie.

### Niet doen

Voor iedere kleine aanpassing opnieuw:

- hele repo lezen;
- alle assets analyseren;
- volledige GDD herschrijven;
- brede architectuuraudit uitvoeren.

---

## 24. CURRENT_TASK.md

### Idee / optioneel

Een tijdelijk bestand `CURRENT_TASK.md` kan nuttig zijn voor Work of coding agents.

Mogelijke inhoud:

- doel;
- huidige taak;
- relevante bestanden;
- acceptance criteria;
- bekende risico's;
- wat expliciet buiten scope valt.

Dit is een tijdelijk uitvoeringsdocument en geen source of truth.

---

## 25. Besluiten vastleggen

### Definitief

Wanneer tijdens bouwen een echte ontwerpbeslissing wordt genomen:

- update relevante source-of-truth;
- voeg belangrijke beslissing toe aan `04_DECISIONS.md`;
- markeer vervallen keuzes als achterhaald waar nodig.

Niet wachten tot weken later.

---

## 26. Backlog discipline

### Definitief

Interessante ontdekkingen die niet binnen huidige scope vallen gaan naar `05_BACKLOG.md`.

Een backlog-item bevat waar mogelijk:

- korte titel;
- probleem / kans;
- waarom interessant;
- status;
- eventuele afhankelijkheid.

Backlog betekent **niet automatisch bouwen**.

---

## 27. Wanneer menselijk akkoord nodig is

### Definitief

Vraag expliciet akkoord bij wijzigingen die de identiteit of kernstructuur beïnvloeden, bijvoorbeeld:

- core loop;
- progressionmodel;
- grote nieuwe systemen;
- wijnstats;
- winkelinteractie;
- art direction;
- platformrichting;
- MVP-scope;
- fundamentele economie;
- verwijdering van een bestaand kernsysteem.

### Geen akkoord nodig voor ieder detail

Tuning en gewone implementatiekeuzes mogen binnen bestaande kaders zelfstandig worden uitgevoerd en getest.

---

## 28. Wanneer Work eerst moet auditen

Gebruik eerst een audit bij taken zoals:

- pixelpipeline normaliseren;
- projectstructuur opschonen;
- veel assets vervangen;
- dubbele systemen verwijderen;
- grote refactor;
- documentatie synchroniseren;
- onderzoeken wat al gebouwd is.

### Auditregel

**Eerst rapporteren, dan wijzigen.**

Bij grote of moeilijk terug te draaien veranderingen nooit audit en bulk-edit stilzwijgend combineren.

---

## 29. Eerste grote Work-audit

### Aanbevolen opdracht

Work moet later:

1. `00_PROJECT.md` t/m `05_BACKLOG.md` lezen.
2. Repo/projectstructuur inventariseren.
3. Bepalen welke gameplayloops daadwerkelijk bestaan.
4. Huidige assets en pixelpipeline analyseren.
5. Documentatie ↔ implementatie vergelijken.
6. Dubbele/verouderde docs signaleren.
7. Technische risico's benoemen.
8. Geen grote wijzigingen uitvoeren.
9. Een geprioriteerd auditrapport opleveren.

Daarna worden wijzigingen per onderwerp goedgekeurd en uitgevoerd.

---

## 30. Definition of Done

### Werkhypothese

Een feature is pas afgerond wanneer:

- gedrag werkt;
- acceptance criteria gehaald zijn;
- relevante tests slagen;
- regressies gecontroleerd zijn;
- UI leesbaar is;
- art consistent is;
- documentatie klopt;
- eventuele nieuwe design decision is vastgelegd;
- placeholders duidelijk gemarkeerd zijn;
- losse ontdekkingen naar backlog zijn verplaatst.

---

## 31. Eindregel

Bij twijfel:

> **Bouw de kleinste versie die de gameplayvraag eerlijk kan beantwoorden.**

Niet de grootste versie die technisch mogelijk is.
