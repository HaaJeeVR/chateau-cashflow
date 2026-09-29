# Château Cashflow — Project Overview

> **Status:** Source of truth  
> **Doel:** Centrale ingang tot het project. Lees dit bestand eerst voordat je aan gameplay, art, UI, code of assets werkt.

## 1. Projectvisie

**Château Cashflow** is een toegankelijke, charmante wijnwinkel-tycoon waarin de speler met beperkte middelen een kleine wijnzaak opbouwt tot een steeds succesvollere onderneming.

De kern is niet diepe wijnsimulatie of zware logistiek, maar:

- korte en duidelijke spelcycli;
- betekenisvolle keuzes met directe feedback;
- zichtbaar groeiende winkel;
- overzichtelijke statistieken;
- personeel en systemen die zich ontwikkelen;
- frequente unlocks;
- een sterk **“nog één ronde / nog één dag”**-gevoel.

## 2. Inspiratiehiërarchie

### Definitief

1. **Game Dev Story** — primaire gameplayreferentie  
   Voor progression, korte cycli, duidelijke feedback, personeel dat beter wordt, unlocks en tempo.

2. **Winkeltje: The Little Shop** — primaire winkelreferentie  
   Voor het fysieke gevoel van een winkel, assortiment, voorraad, schappen, klanten en stap voor stap uitbreiden.

3. **Theme Hospital** — referentie voor charme en visuele persoonlijkheid  
   Vooral voor humor, levendigheid en leesbare visuele feedback.

4. **Big Ambitions** — referentie voor latere schaal  
   Alleen als inspiratie voor groei naar een groter bedrijf; niet als voorbeeld voor vroege complexiteit.

## 3. Huidige canon

### Definitief

- Platformrichting: **desktop-first, landscape**.
- Visuele richting: **premium, relatief grove management-pixelart** voor de spelwereld.
- UI-richting: **strakke, goed leesbare 2D-interface** bovenop de pixelartwereld.
- De fysieke winkel is het belangrijkste scherm.
- De speler begint met beperkte kasmiddelen.
- Voorraad legt geld vast en vormt dus een echte economische keuze.
- De verkoopfase moet zichtbaar leven: klanten kopen daadwerkelijk in de winkel.
- Tijdens een verkoopdag observeert de speler vooral het resultaat van eerdere keuzes.
- Tijdcontrole tijdens verkoop: **normaal / 2× / overslaan**.
- De fysieke winkelmechaniek blijft licht: echte schappen en plaatsing zijn betekenisvol, maar dit wordt geen complexe interieur- of logistieksimulator.
- Progression loopt primair via **reputatie / winkelniveau**.
- Wijnregio's vormen géén kwaliteitsladder en zijn niet lineair beter of slechter.
- Regio's kunnen later wel als inhoudelijk systeem worden gebruikt, bijvoorbeeld via leveranciers, klantvoorkeuren, events of assortimentsthema's.
- Eerste serieuze MVP: circa **12 wijnen** in of gedurende de eerste speelperiode.
- Kernstats voor wijn:
  - Kwaliteit
  - Prestige
  - Vraag
  - Schaarste
  - Potentie
- Marge is géén aparte wijnstat en volgt uit inkoopprijs versus verkoopprijs.

## 4. Statuslabels

Gebruik in alle projectdocumentatie waar nodig deze labels:

- **Definitief** — bewust gekozen; niet wijzigen zonder expliciete nieuwe beslissing.
- **Werkhypothese** — voorlopig uitgangspunt; mag na testen worden aangepast.
- **Idee** — interessante mogelijkheid; nog niet automatisch bouwen.
- **Technisch openstaand** — moet worden bepaald op basis van bestaande code, assets of implementatie.
- **Achterhaald** — eerder voorstel dat niet meer als actuele richting geldt.

## 5. Source-of-truth-documenten

De projectdocumentatie bestaat uit:

- `00_PROJECT.md` — dit document; visie, canon en navigatie.
- `01_GAME_DESIGN.md` — gameplay, core loop, economie, winkel, progression en MVP.
- `02_ART_BIBLE.md` — art direction, pixelregels, UI, assets en visuele consistentie.
- `03_BUILD_GUIDE.md` — regels voor hoe ChatGPT, Work of coding agents aan het project werken.
- `04_DECISIONS.md` — belangrijke keuzes met datum, reden en status.
- `05_BACKLOG.md` — ideeën, bugs, verbeteringen en open onderzoeksvragen.

## 6. Werkprincipe

### Definitief

De bestaande game, code en assets zijn het uitgangspunt. Dit project wordt **niet opnieuw vanaf nul ontworpen**.

Bij wijzigingen geldt:

1. Lees eerst de relevante source-of-truth-documenten.
2. Inspecteer bestaande code en assets voordat je iets nieuws toevoegt.
3. Behandel losse brainstormideeën niet als goedgekeurde features.
4. Bouw in kleine, controleerbare stappen.
5. Controleer na implementatie of documentatie en daadwerkelijke game nog overeenkomen.
6. Werk relevante beslissingen en documentatie bij na goedgekeurde wijzigingen.

## 7. Belangrijk technisch openstaand punt

### Technisch openstaand

De exacte pixelpipeline is nog niet definitief vastgesteld.

Onder meer deze waarden mogen nog niet als canon worden behandeld zonder audit van de huidige game en assets:

- logical resolution, bijvoorbeeld `480×270`;
- basisgrid, bijvoorbeeld `16×16`;
- exacte native pixeldensity;
- huidige scaling- en importinstellingen.

Wel is de richting duidelijk: de spelwereld moet uiteindelijk één consistente pixeldensity en scalinglogica hebben.

## 8. Niet doen zonder expliciete beslissing

- Het spel mobile-first maken.
- De pixelartwereld vervangen door volledig flat 2D.
- Regio's behandelen als lineaire kwaliteitsprogressie.
- Complexe vrije interieurplaatsing of logistiek toevoegen alsof Château Cashflow een bouwsimulator is.
- Extra wijnstats toevoegen alleen omdat ze realistisch klinken.
- Grote late-game-systemen naar de MVP trekken.
- Bestaande goede assets vervangen zonder eerst te controleren of ze als canon kunnen dienen.
