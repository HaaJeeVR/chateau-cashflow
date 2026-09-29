# Château Cashflow — Game Design

> **Status:** Source of truth voor gameplay  
> **Doel:** Beschrijft wat de speler doet, welke systemen de kern vormen en welke ontwerpprincipes leidend zijn.

---

## 1. High concept

**Château Cashflow** is een casual management-/tycoongame over het opbouwen van een wijnwinkel.

De speler begint klein, met weinig geld, weinig assortiment en beperkte winkelcapaciteit. Door slim in te kopen, voorraad te beheren, aantrekkelijke keuzes te maken voor klanten en de winkel stap voor stap uit te breiden, groeit de zaak in reputatie en mogelijkheden.

Het spel moet snel te begrijpen zijn, maar genoeg economische spanning en variatie hebben om steeds opnieuw een volgende dag te willen spelen.

### Definitief

Het spel is géén:

- hardcore wijnsimulator;
- complexe logistieksimulator;
- uitgebreide interieurontwerpgame;
- spreadsheetgame waarin de winkel nauwelijks zichtbaar is.

De winkel zelf moet het hart van de ervaring blijven.

---

## 2. Ontwerpprincipes

### Definitief

Elke kernmechaniek moet zoveel mogelijk aan meerdere van deze principes voldoen:

1. **Korte cycli**  
   De speler hoeft niet lang te wachten voordat een beslissing zichtbaar resultaat geeft.

2. **Directe feedback**  
   Verkoop, klantreacties, geld, voorraad en groei moeten snel leesbaar zijn.

3. **Betekenisvolle keuzes**  
   Niet veel knoppen om veel knoppen te hebben. Keuzes moeten iets veranderen.

4. **Beperkte complexiteit**  
   Diepgang ontstaat uit interactie tussen eenvoudige systemen, niet uit tientallen obscure variabelen.

5. **Zichtbare groei**  
   De winkel, het assortiment, personeel en mogelijkheden moeten merkbaar ontwikkelen.

6. **Frequente beloning**  
   Unlocks en nieuwe mogelijkheden moeten regelmatig voorkomen.

7. **Nog-één-dag-gevoel**  
   Een afgeronde verkoopdag moet vanzelf uitnodigen tot nog één voorbereidende keuze en nog één ronde.

---

## 3. Inspiratie per systeem

### Definitief

### Game Dev Story

Primaire referentie voor:

- tempo;
- progression;
- duidelijke statistieken;
- medewerkers die beter worden;
- frequente unlocks;
- compacte beslissingen;
- korte cycli met duidelijke resultaten.

### Winkeltje: The Little Shop

Primaire referentie voor:

- de winkel als fysieke ruimte;
- assortiment kiezen;
- voorraad inkopen;
- schappen;
- klanten zichtbaar bedienen;
- stap voor stap uitbreiden.

### Theme Hospital

Referentie voor:

- charme;
- karakter;
- humor;
- visuele feedback;
- een winkel die levend aanvoelt.

### Big Ambitions

Alleen referentie voor:

- een gevoel van steeds grotere zakelijke schaal op lange termijn.

Niet gebruiken als argument om de vroege game ingewikkelder te maken.

---

## 4. Core loop

### Definitief

De basiscyclus is:

1. **Voorbereiden**
2. **Winkel openen**
3. **Verkoop observeren**
4. **Dagresultaten bekijken**
5. **Nieuwe keuzes maken**
6. **Volgende dag**

### 4.1 Voorbereiden

De speler maakt vóór opening een beperkt aantal betekenisvolle keuzes, bijvoorbeeld rond:

- assortiment;
- voorraad;
- prijs;
- plaatsing op schappen;
- investeringen;
- personeel;
- eventuele acties of focus voor de komende dag.

Niet al deze systemen hoeven vanaf de start beschikbaar te zijn.

### 4.2 Winkel openen

De winkel komt zichtbaar tot leven.

Klanten:

- komen binnen;
- bewegen door de winkel;
- bekijken aanbod;
- maken aankoopbeslissingen;
- kopen daadwerkelijk flessen;
- verlaten de winkel.

De speler hoeft tijdens deze fase niet constant te micromanagen.

### 4.3 Tijdcontrole

### Definitief

Tijdens de verkoopfase:

- normaal;
- 2×;
- overslaan.

Meer snelheidsknoppen zijn niet gewenst.

### 4.4 Dagresultaten

Na een korte verkoopfase moet de speler helder kunnen zien wat er is gebeurd.

### Werkhypothese

Resultaten kunnen onder meer tonen:

- omzet;
- winst;
- verkochte flessen;
- best presterende wijn;
- gemiste verkoop door lege voorraad;
- klanttevredenheid of vergelijkbare feedback;
- reputatievoortgang;
- opvallende gebeurtenis van de dag.

Exacte presentatie en metrics worden later getuned.

---

## 5. Ritme en tijdsduur

### Definitief

Een verkoopdag moet kort aanvoelen.

### Werkhypothese

Een volledige observatiefase van ongeveer tientallen seconden past beter bij de gewenste flow dan meerdere minuten.

Eerder genoemde richtwaarden zoals `30–45 seconden` zijn **tuningwaarden**, geen canon.

De game moet meerdere feedbackniveaus hebben:

- direct: individuele klant / verkoop;
- per dag: commerciële resultaten;
- middellang: winkelgroei, personeel en unlocks;
- lang: uitbouw van de onderneming.

---

## 6. Economische kern

### Definitief

De belangrijkste vroege spanning ontstaat uit **schaarse cash**.

Wanneer de speler wijn inkoopt:

- wordt geld vastgezet in voorraad;
- bestaat risico dat die voorraad langzaam verkoopt;
- kan een populaire wijn juist te snel uitverkopen;
- ontstaat een keuze tussen zekerheid, marge, prestige en vraag.

Het spel moet de speler regelmatig laten kiezen tussen bijvoorbeeld:

- goedkoop en veilig;
- duurder en prestigieuzer;
- veel voorraad van bewezen verkopers;
- kleine voorraad van spannendere wijnen;
- cash bewaren voor een volgende investering;
- investeren in capaciteit of winkelgroei.

### Ontwerpregel

Meer omzet is niet automatisch beter als daarvoor te veel kapitaal of risico nodig was.

---

## 7. Wijnen

## 7.1 Kernstats

### Definitief

Elke wijn gebruikt als ontwerpbasis:

- **Kwaliteit**
- **Prestige**
- **Vraag**
- **Schaarste**
- **Potentie**

### Definitie op hoog niveau

**Kwaliteit**  
Hoe goed de wijn intrinsiek wordt gewaardeerd binnen het spelsysteem.

**Prestige**  
Status, aantrekkingskracht en reputatiewaarde van de wijn.

**Vraag**  
Hoe makkelijk of vaak klanten deze wijn willen kopen.

**Schaarste**  
Hoe beperkt of bijzonder de beschikbaarheid is.

**Potentie**  
De mogelijkheid dat de wijn later interessanter of waardevoller wordt binnen systemen die dit ondersteunen.

### Definitief

**Marge** is geen kernstat van de wijn.

Marge ontstaat uit:

`verkoopprijs - inkoopprijs`

eventueel gecorrigeerd voor andere kosten als die later relevant worden.

## 7.2 Aantal wijnen in eerste serieuze MVP

### Definitief

Richtomvang: circa **12 wijnen**.

Dit betekent niet dat alle twaalf direct bij de start beschikbaar hoeven te zijn.

Een deel kan vroeg worden vrijgespeeld zodat de speler al snel progression ervaart.

### Ontwerpdoel

Twaalf is voldoende om:

- assortimentkeuzes mogelijk te maken;
- duidelijke verschillen tussen wijnen te voelen;
- voorraadbeslissingen interessant te maken;
- vraag en prijs te laten variëren;
- zonder enorme contentproductie te kunnen balanceren.

---

## 8. Wijnregio's

### Definitief

Wijnregio's zijn **niet lineair beter of slechter**.

Bourgogne is bijvoorbeeld niet simpelweg een “hoger level” dan een andere regio.

Regio's mogen daarom niet als klassieke kwaliteitsladder worden gebruikt.

### Idee

Regio's kunnen later inhoudelijke functies krijgen, bijvoorbeeld via:

- leveranciers;
- klantvoorkeuren;
- thematische assortimenten;
- tijdelijke trends;
- events;
- importmogelijkheden;
- regio-specialisaties;
- opdrachten;
- seizoensfocus;
- verzamel- of kennisdoelen.

Deze toepassingen zijn nog niet automatisch onderdeel van de MVP.

---

## 9. Winkel als fysieke ruimte

### Definitief

De winkel is geen decoratieve achtergrond.

Wat de speler verkoopt en hoe de zaak groeit, moet zichtbaar worden in de ruimte.

### Gekozen richting: lichte fysieke winkelmechaniek

De speler kan betekenisvolle keuzes maken rond:

- echte schappen;
- capaciteit;
- welke wijn waar beschikbaar is;
- uitbreiding van de winkel;
- visueel groeiende winkelinrichting.

### Niet gewenst als kernmechaniek

- ieder meubel pixel voor pixel vrij plaatsen;
- ingewikkelde routeoptimalisatie;
- magazijnlogistiek op simulatieschaal;
- constante handmatige bevoorrading tijdens iedere verkoopdag;
- interieurontwerp als hoofddoel van het spel.

### Werkhypothese

Schapkeuze en productplaatsing kunnen commerciële invloed hebben, maar dit moet eenvoudig en direct begrijpelijk blijven.

---

## 10. Klanten

### Definitief

Klanten moeten zichtbaar onderdeel van de winkelervaring zijn.

Ze zijn nodig om het gevolg van de keuzes van de speler tastbaar te maken.

### Werkhypothese

Verschillende klanttypen kunnen later andere voorkeuren hebben, bijvoorbeeld voor:

- prijs;
- prestige;
- kwaliteit;
- regio;
- bekende versus bijzondere wijn.

### Open tuningvraag

Hoe diep klantsegmentatie in de eerste MVP moet gaan is nog niet vastgesteld.

Het uitgangspunt blijft:

**zo eenvoudig mogelijk, zolang de keuzes van de speler betekenisvol blijven.**

---

## 11. Progression

### Definitief

De primaire progression loopt via:

**reputatie / winkelniveau**

Dit vormt de ruggengraat waaraan nieuwe mogelijkheden kunnen worden gekoppeld.

### Mogelijke unlocks

### Werkhypothese

Bij hogere reputatie kunnen bijvoorbeeld beschikbaar komen:

- nieuwe wijnen;
- nieuwe leveranciers;
- extra schapcapaciteit;
- grotere winkelruimte;
- nieuwe medewerkers;
- nieuwe klanttypen;
- prijs- of assortimentsmogelijkheden;
- systemen die pas later relevant worden.

### Ontwerpregel

Unlocks moeten frequent genoeg zijn dat de speler regelmatig iets nieuws krijgt om naar uit te kijken.

### Definitief

Regio's zijn géén lineaire progressionladder.

---

## 12. Personeel

### Definitief op hoofdlijn

Personeel is onderdeel van de beoogde progression.

Medewerkers:

- werken grotendeels automatisch;
- moeten zichtbaar bijdragen aan de winkel;
- kunnen beter worden.

Dit ondersteunt het Game Dev Story-achtige gevoel van investeren in mensen die steeds waardevoller worden.

### Werkhypothese

De eerste medewerker moet relatief vroeg bereikbaar zijn, zodat personeel snel als progressiesysteem wordt geïntroduceerd.

Een eerder genoemd doel rond de eerste tien minuten geldt als richtpunt, niet als vaste timing.

### Openstaand

Nog niet definitief:

- exacte rollen;
- aantal stats;
- levelingformule;
- salarisstructuur;
- hiringproces;
- maximale teamgrootte.

---

## 13. Visuele gameplayfilosofie

### Definitief

De spelwereld gebruikt **premium, relatief grove management-pixelart**.

De interface gebruikt een **strakkere 2D-taal** voor leesbaarheid.

Dit betekent:

- wereld en winkel mogen sfeervol en tactiel zijn;
- cijfers en knoppen moeten juist snel te begrijpen zijn;
- UI mag niet concurreren met de winkel;
- de winkel blijft visueel dominant.

### Definitief

Een eerdere volledig flat-2D-richting voor het hele spel is achterhaald.

---

## 14. MVP-scope

### Definitief

De eerste serieuze MVP moet klein genoeg blijven om volledig speelbaar en balanceerbaar te zijn.

De kern is belangrijker dan brede featuredekking.

### MVP moet minimaal bewijzen

1. Assortiment kiezen voelt betekenisvol.
2. Voorraad inkopen creëert economische spanning.
3. Klanten kopen zichtbaar in de winkel.
4. Een verkoopdag levert snelle en begrijpelijke feedback.
5. De speler kan groeien in reputatie.
6. Nieuwe mogelijkheden worden vrijgespeeld.
7. De winkel verandert zichtbaar.
8. Er is aanleiding om opnieuw een dag te spelen.

### Richting voor content

- circa 12 wijnen;
- beperkte winkelomvang;
- beperkt aantal schappen;
- een eenvoudige vroege progression;
- personeel als vroeg progressiedoel;
- geen grote late-game-systemen nodig voor MVP-validatie.

---

## 15. Niet in de vroege MVP trekken

### Idee / later

Mogelijke latere groei kan bestaan uit:

- grotere winkel;
- uitgebreid personeel;
- meerdere leveranciers;
- diepere regio-systemen;
- import;
- webshop;
- meerdere vestigingen;
- eigen label;
- andere zakelijke uitbreidingen.

### Ontwerpregel

Een late-game-idee mag pas naar voren worden gehaald als het de core loop aantoonbaar beter maakt.

---

## 16. Betekenisvolle keuzes

### Definitief

De speler moet niet voortdurend om triviale bevestigingen worden gevraagd.

Ontwerpvragen zijn relevant als verschillende opties daadwerkelijk leiden tot ander spelgedrag of een andere identiteit van Château Cashflow.

### Voorbeelden van betekenisvolle keuzes

- meer voorraad inkopen versus cash achterhouden;
- prestige versus vraag;
- assortiment verbreden versus verdiepen;
- winkelcapaciteit versus nieuwe wijn;
- medewerker aannemen versus geld bewaren;
- populaire veilige keuze versus schaarsere kans.

### Niet betekenisvol

- extra knop toevoegen zonder nieuwe beslissing;
- twee opties die praktisch hetzelfde effect hebben;
- realisme toevoegen dat niets aan het spel oplevert.

---

## 17. Tuning versus ontwerp

Veel waarden moeten bewust **niet** als definitieve game-designbeslissing worden vastgezet.

### Tuningvariabelen

Onder meer:

- exacte duur van een verkoopdag;
- klantloopsnelheid;
- prijzen;
- inkoophoeveelheden;
- winstmarges;
- reputatiepunten;
- frequentie van unlocks;
- personeelskosten;
- vraagcurves.

Deze waarden moeten tijdens spelen en testen worden aangepast zonder dat daarmee het fundamentele ontwerp verandert.

---

## 18. Open gameplayvragen

### Werkhypothese / later beslissen

Deze onderwerpen mogen nog niet stilzwijgend door een coding agent worden ingevuld:

- exacte prijsmechaniek;
- diepte van klanttypen;
- effect van productplaatsing op verkoop;
- precieze rol van Potentie;
- hoe Schaarste wordt gegenereerd;
- welke unlocks aan welke reputatieniveaus hangen;
- exacte medewerkersrollen;
- eventuele events;
- regionale systemen;
- late-game schaal.

Wanneer implementatie één van deze vragen noodzakelijk maakt, moet eerst worden vastgesteld of het om tuning of een nieuwe ontwerpbeslissing gaat.

---

## 19. Design guardrails

### Definitief

Nieuwe features moeten worden afgewezen of vereenvoudigd wanneer ze:

- de winkel minder centraal maken;
- veel micromanagement toevoegen zonder interessante keuze;
- het tempo sterk vertragen;
- wijnkennis vereisen om überhaupt te kunnen spelen;
- veel statistieken toevoegen zonder duidelijk effect;
- de MVP onnodig verbreden;
- bestaande systemen dupliceren;
- vooral realistisch zijn in plaats van leuk;
- de interface voller maken zonder gameplaywinst.

De voorkeursvraag is steeds:

> **Maakt dit de volgende dag interessanter om te spelen?**

Als het antwoord niet duidelijk ja is, is de feature waarschijnlijk niet nodig.
