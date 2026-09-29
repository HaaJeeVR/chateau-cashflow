# Château Cashflow — Backlog

> **Status:** Levende lijst van ideeën, open vragen, technische taken en verbeteringen  
> **Belangrijk:** Een backlog-item is géén goedgekeurde feature en hoeft niet automatisch te worden gebouwd.

---

## Statussen

Gebruik waar nuttig:

- **Open**
- **Onderzoek**
- **Kandidaat**
- **Geblokkeerd**
- **Later**
- **Afgerond**
- **Afgewezen**

Prioriteit kan worden aangegeven als:

- **P0** — blocker / direct noodzakelijk
- **P1** — belangrijk voor eerstvolgende fase
- **P2** — nuttig, niet urgent
- **P3** — later / experiment

---

# 1. Eerstvolgende projectaudit

## P0 — Audit huidige game versus source of truth

**Status:** Open

Controleer:

- welke core loops al zijn geïmplementeerd;
- welke systemen afwijken van `01_GAME_DESIGN.md`;
- welke oude mechanics nog aanwezig zijn;
- welke features bestaan maar niet gedocumenteerd zijn;
- welke documentatie verouderd is.

**Doel:**  
Voorkomen dat nieuwe documentatie en bestaande game uit elkaar lopen.

---

## P0 — Audit projectstructuur en documenten

**Status:** Open

Inventariseer:

- codefolders;
- docs;
- config;
- assets;
- oude ontwerpbestanden;
- dubbele of conflicterende documentatie.

**Doel:**  
Eén duidelijke projectstructuur maken zonder nuttige informatie weg te gooien.

---

# 2. Art en pixelpipeline

## P0 — Pixelpipeline audit

**Status:** Open

Onderzoek:

- huidige native resoluties;
- pixeldensity per asset;
- achtergronden;
- camera;
- pixels-per-unit;
- scaling;
- filtering;
- importsettings;
- mogelijke pixel-perfect configuratie.

**Uitkomst:**  
Aanbeveling voor één technische standaard.

**Belangrijk:**  
Eerst rapporteren, nog niet massaal aanpassen.

---

## P1 — Canon Asset Register maken

**Status:** Open

Maak overzicht van bestaande assets en label:

- Canon
- Accepted
- Needs normalization
- Placeholder
- Deprecated

---

## P1 — Asset families vastleggen

**Status:** Open

Minimaal beoordelen:

- winkelinterieur;
- schappen;
- flessen;
- klanten;
- personeel;
- meubels;
- decoratie;
- UI;
- iconen;
- achtergronden;
- effecten;
- branding.

---

## P1 — Pixelconsistentie normaliseren

**Status:** Geblokkeerd door pixelpipeline audit

Na goedgekeurde technische standaard:

- inconsistent geschaalde assets aanpassen;
- smoothing verwijderen;
- achtergronden normaliseren;
- assets in game controleren.

---

## P2 — Definitief kleurenpalet afleiden uit canon-assets

**Status:** Onderzoek

De eerder gebruikte richting bevat onder meer:

- bordeaux;
- crème;
- saliegroen;
- warm hout;
- honingkleurige tinten.

Exacte waarden pas bepalen nadat canon-assets zijn gekozen.

---

## P2 — Logo-iteraties beoordelen

**Status:** Open

Bepaal:

- welke bestaande logo's bruikbaar zijn;
- welke versie canon wordt;
- benodigde formaten;
- relatie tussen branding en in-game pixelart.

---

# 3. Core gameplay

## P1 — Complete verticale slice valideren

**Status:** Open

De minimaal speelbare keten:

`inkopen → schap → klant → verkoop → resultaat → progression`

moet volledig werkend en testbaar zijn.

---

## P1 — Voorraadspanning testen

**Status:** Open

Onderzoek of beperkte cash daadwerkelijk leidt tot interessante keuzes tussen:

- bewezen verkopers;
- prestigieuze wijn;
- nieuwe wijn;
- hoeveelheid voorraad;
- cash achterhouden.

---

## P1 — Dagresultatenscherm verfijnen

**Status:** Kandidaat

Mogelijke informatie:

- omzet;
- winst;
- verkochte flessen;
- best verkochte wijn;
- voorraadtekorten;
- reputatie;
- opvallend moment.

Doel: kort en bevredigend, geen spreadsheetdump.

---

## P1 — Exact unlocktempo testen

**Status:** Onderzoek

Niet vooraf theoretisch dichttimmeren.

Test hoe vaak de speler iets nieuws nodig heeft om het “nog één dag”-gevoel te behouden.

---

# 4. Wijnen en assortiment

## P1 — Eerste 12 MVP-wijnen ontwerpen

**Status:** Open

Per wijn minimaal bepalen:

- naam;
- type;
- inkoopprijs;
- mogelijke verkoopprijs;
- Kwaliteit;
- Prestige;
- Vraag;
- Schaarste;
- Potentie;
- visuele asset.

Doel: duidelijke gameplayverschillen zonder onnodige complexiteit.

---

## P1 — Rol van Potentie bepalen

**Status:** Onderzoek

Open vraag:

Wat doet Potentie concreet in de vroege game?

Mogelijkheden:

- toekomstige waarde;
- prestigeontwikkeling;
- eventkans;
- latere verkoopwaarde;
- pas later activeren.

Geen mechanic bouwen voordat dit duidelijk genoeg is.

---

## P2 — Schaarste-systeem definiëren

**Status:** Onderzoek

Vragen:

- statisch per wijn?
- fluctuerend?
- leveranciergebonden?
- tijdelijk?
- gekoppeld aan events?

---

## P2 — Prijsmechaniek verdiepen

**Status:** Onderzoek

Onderzoek welke diepte nodig is:

- vaste adviesprijs;
- vrije prijs;
- prijselasticiteit;
- klantsegmenten;
- prestige-effect.

Eenvoud blijft uitgangspunt.

---

# 5. Klanten

## P1 — Basisklantgedrag valideren

**Status:** Open

Klanten moeten minimaal:

- binnenkomen;
- assortiment bekijken;
- aankoopbeslissing nemen;
- kopen;
- vertrekken.

---

## P2 — Klanttypen onderzoeken

**Status:** Idee

Mogelijke voorkeuren:

- prijsbewust;
- prestigegericht;
- kwaliteitsgericht;
- avontuurlijk;
- regio-voorkeur.

Alleen toevoegen als verschillen echt zichtbaar gameplay opleveren.

---

## P2 — Reacties op lege voorraad

**Status:** Kandidaat

Onderzoek of gemiste verkoop zichtbaar genoeg moet worden gemaakt om voorraadkeuzes begrijpelijk te maken.

---

# 6. Winkel en schappen

## P1 — Lichte schapmechaniek definiëren

**Status:** Open

Bepaal:

- hoeveel schappen vroeg beschikbaar zijn;
- hoe wijn aan schappen wordt toegewezen;
- hoeveel capaciteit telt;
- of plaatsing commerciële invloed heeft.

---

## P2 — Effect van plaatsing onderzoeken

**Status:** Onderzoek

Mogelijke effecten:

- zichtbaarheid;
- premiumpositie;
- impulsverkoop;
- klantroute.

Alleen toevoegen als het direct begrijpelijk blijft.

---

## P2 — Winkeluitbreiding visueel voelbaar maken

**Status:** Kandidaat

Denk aan:

- extra schap;
- grotere vloer;
- decor;
- kassazone;
- nieuwe hoek / ruimte.

Groei moet zichtbaar zijn, niet alleen numeriek.

---

# 7. Personeel

## P1 — Eerste medewerker ontwerpen

**Status:** Open

Bepaal:

- rol;
- kosten;
- zichtbare taak;
- eerste upgrade/leveling;
- waarom de speler hem wil aannemen.

---

## P2 — Medewerkersrollen bepalen

**Status:** Onderzoek

Mogelijke rollen:

- verkoop;
- voorraad;
- advies;
- inkopen;
- specialist.

Niet allemaal nodig voor MVP.

---

## P2 — Levelingsysteem personeel

**Status:** Onderzoek

Doel:

Game Dev Story-achtig gevoel van medewerkers die merkbaar beter worden, zonder een groot RPG-systeem.

---

# 8. Progression

## P1 — Reputatiecurve ontwerpen

**Status:** Open

Bepaal:

- hoe reputatie wordt verdiend;
- wat eerste levels unlocken;
- hoe snel beginprogression voelt;
- welke eerste mijlpalen zichtbaar zijn.

---

## P1 — Eerste unlockreeks maken

**Status:** Open

Mogelijke vroege unlocks:

- nieuwe wijn;
- extra schap;
- eerste medewerker;
- leverancier;
- uitbreiding;
- nieuw klantgedrag.

Volgorde moet spelritme ondersteunen.

---

## P2 — Regio's als inhoudelijk systeem onderzoeken

**Status:** Idee

Regio's zijn geen kwaliteitsladder.

Mogelijke toepassingen:

- leveranciersrelaties;
- thematische weken;
- klantvoorkeuren;
- importkansen;
- tijdelijke trends;
- opdrachten;
- collectiebonus.

---

# 9. Events en dynamiek

## P2 — Tijdelijke vraagtrends onderzoeken

**Status:** Idee

Voorbeeld:

een wijn of stijl wordt tijdelijk populairder.

Doel:

assortimentkeuzes laten bewegen zonder complexe simulatie.

---

## P3 — Winkel-events

**Status:** Idee

Mogelijkheden:

- proeverij;
- criticus;
- feestdag;
- lokaal evenement;
- schaarse levering;
- onverwachte klantengolf.

Alleen later als core loop sterk genoeg is.

---

# 10. UI en UX

## P1 — Kleine UI-kit vastleggen

**Status:** Open

Minimaal:

- panelen;
- knoppen;
- statweergave;
- tooltip;
- kaart/card;
- dagresultaat;
- unlockfeedback.

---

## P1 — Winkel dominant houden

**Status:** Doorlopend

Bij iedere UI-review controleren:

- neemt interface niet te veel scherm over?
- kan informatie compacter?
- kan een panel tijdelijk zijn?
- kan een knop verdwijnen?

---

## P2 — Gameplayfeedback verbeteren

**Status:** Kandidaat

Onderzoek compacte feedback voor:

- verkoop;
- lege voorraad;
- reputatie;
- winst;
- unlock;
- medewerkeractie.

---

# 11. Data en techniek

## P1 — Balanceerbare waarden centraliseren

**Status:** Open

Waar mogelijk centraal configureerbaar maken:

- prijzen;
- vraag;
- reputatie;
- voorraad;
- unlocks;
- timings;
- personeelskosten.

---

## P1 — Stable IDs controleren

**Status:** Open

Zorgen dat wijnen, assets en content stabiele interne IDs hebben zodat visuals later vervangen kunnen worden zonder brede codewijzigingen.

---

## P2 — Save/data-structuur auditen

**Status:** Open

Controleer hoe toekomstige nieuwe content en progression veilig kunnen worden toegevoegd.

---

# 12. AI- en ontwikkelworkflow

## P1 — Vaste featureprompt maken

**Status:** Open

Een standaardopdracht voor Work/coding agents met:

- doel;
- player promise;
- relevante docs;
- acceptance criteria;
- scope;
- teststappen;
- documentatie-update.

---

## P1 — Gameplay-reviewprompt maken

**Status:** Open

Focus op:

- betekenisvolle keuzes;
- tempo;
- dominante strategie;
- feedback;
- eenvoud;
- nog-één-dag-gevoel.

---

## P1 — UI/art-reviewprompt maken

**Status:** Open

Focus op:

- consistency;
- readability;
- pixeldensity;
- family resemblance;
- palette;
- UI-hiërarchie.

---

## P2 — CURRENT_TASK.md testen

**Status:** Idee

Onderzoeken of een klein tijdelijk taakbestand helpt om Work minder context en tokens te laten gebruiken.

---

# 13. Later / buiten eerste MVP

## P3 — Webshop

**Status:** Later

---

## P3 — Import

**Status:** Later

---

## P3 — Meerdere vestigingen

**Status:** Later

---

## P3 — Eigen label

**Status:** Later

---

## P3 — Diepere leveranciersrelaties

**Status:** Later

---

## P3 — Uitgebreide regio-specialisatie

**Status:** Later

---

# 14. Items die bewust niet op de backlog horen

Niet opnieuw toevoegen zonder nieuwe reden:

- mobile-first als hoofdrichting;
- volledig flat-2D voor de spelwereld;
- complexe vrije interieurplaatsing;
- zware magazijnlogistiek;
- regio's als simpele kwaliteitsladder;
- tientallen extra wijnstats;
- late-game-systemen naar voren trekken voordat de core loop werkt.

Deze richtingen zijn eerder afgewezen, achterhaald of strijdig met de huidige canon.

---

# 15. Eerstvolgende aanbevolen volgorde

1. Audit huidige game versus docs.
2. Audit assets en pixelpipeline.
3. Valideer volledige core vertical slice.
4. Ontwerp eerste 12 wijnen.
5. Leg vroege reputatie/unlocks vast.
6. Definieer eerste medewerker.
7. Normaliseer art na goedgekeurde pixelstandaard.
8. Daarna pas bredere systems/backlog oppakken.
