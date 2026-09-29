# Château Cashflow — Art Bible

> **Status:** Source of truth voor art direction en visuele consistentie  
> **Doel:** Zorgen dat nieuwe en bestaande assets één herkenbare visuele familie vormen, zonder de stijl onnodig rigide te maken.

---

## 1. Visuele kern

### Definitief

**Château Cashflow** gebruikt:

- een **premium, relatief grove management-pixelartstijl** voor de spelwereld;
- een **strakke, goed leesbare 2D-UI** voor informatie, panelen en bediening;
- een warme, charmante Europese wijnwinkel als belangrijkste visuele context;
- een stijl die leesbaarheid en karakter belangrijker vindt dan fotografisch detail.

De winkelwereld en de UI hoeven dus niet exact dezelfde grafische taal te gebruiken.

De bedoeling is juist:

- **wereld:** sfeervol, tactiel, levendig;
- **UI:** helder, rustig, functioneel.

---

## 2. Belangrijk stijlprincipe

### Definitief

Nieuwe assets moeten voelen alsof ze uit **dezelfde game** komen.

Dat betekent niet dat ieder object identiek moet worden opgebouwd.

De gewenste relatie is:

> **family resemblance, geen kopieergedrag**

Nieuwe objecten mogen eigen karakter hebben zolang ze binnen dezelfde visuele logica blijven.

---

## 3. Wereldstijl

### Definitief

De spelwereld gebruikt een managementgame-achtige pixelartstijl met:

- relatief duidelijke, grove pixelclusters;
- beperkte microdetails;
- leesbare silhouetten;
- duidelijke materiaalverschillen;
- warme, uitnodigende sfeer;
- voldoende contrast tussen interactieve objecten en achtergrond;
- schaal die managementinformatie ondersteunt.

De stijl moet niet verschuiven naar:

- extreem fijne pixelart;
- photobashing;
- semi-realistische digitale schilderstijl;
- volledig vectorachtige flat art;
- overdreven retro 8-bit;
- hypergedetailleerde JRPG-sprites.

---

## 4. UI-stijl

### Definitief

De UI gebruikt een schonere 2D-benadering dan de wereld.

Doelen:

- snel scanbaar;
- weinig visuele ruis;
- duidelijke hiërarchie;
- beperkte hoeveelheid knoppen;
- belangrijke cijfers direct zichtbaar;
- winkelbeeld blijft dominant.

De UI mag dus strakker zijn dan de wereld zonder dat dit als stijlbreuk wordt gezien.

### Richtlijnen

- Houd panelen compact.
- Gebruik consistente spacing.
- Gebruik iconen alleen als ze betekenis toevoegen.
- Vermijd decoratie die informatie moeilijker leesbaar maakt.
- Laat gameplaykeuzes zoveel mogelijk rondom de winkel plaatsvinden in plaats van in een losstaand dashboard.
- Vermijd schermen vol tabbladen als dezelfde informatie eenvoudiger kan worden getoond.

---

## 5. Kleur en sfeer

### Werkhypothese

De eerdere visuele richting bevat terugkerende associaties met:

- bordeaux;
- crème;
- saliegroen;
- honingkleurig / warm hout;
- gedempte natuurlijke tinten;
- warme highlights.

Deze kleuren zijn **richtinggevend**, niet exact vastgelegd.

De definitieve palettewaarden moeten pas worden vastgezet nadat bestaande canon-assets zijn geïnventariseerd.

### Niet doen

- Nieuwe assets introduceren met een compleet ander verzadigingsniveau.
- Willekeurig zeer felle neonkleuren toevoegen.
- UI-kleuren kiezen die concurreren met gameplayfeedback.
- Per asset zelfstandig een nieuw kleurenpalet bedenken.

---

## 6. Canon assets

### Werkhypothese

Bestaande goede assets worden niet automatisch vervangen.

Assets die goed passen bij de gewenste stijl kunnen worden aangewezen als **Canon Asset**.

Canon-assets dienen als visuele referentie voor nieuwe assets.

### Canon Asset Register

Voor iedere canon-asset wordt later minimaal bijgehouden:

- Asset ID
- Bestandsnaam
- Asset family
- Gebruik in game
- Native formaat / resolutie
- Schaal
- Belangrijke stijlkenmerken
- Status
- Eventuele afwijkingen of uitzonderingen

### Statussen

- **Canon** — leidend voorbeeld.
- **Accepted** — bruikbaar en passend, maar niet leidend.
- **Needs normalization** — inhoudelijk goed, technisch/stilistisch nog aanpassen.
- **Placeholder** — tijdelijk.
- **Deprecated** — niet meer gebruiken voor nieuwe content.

---

## 7. Asset families

### Werkhypothese

Assets worden gegroepeerd in families, bijvoorbeeld:

- winkelinterieur;
- schappen;
- wijnflessen;
- klanten;
- personeel;
- meubels;
- decoratie;
- iconen;
- UI-componenten;
- achtergronden;
- effecten / feedback;
- logo / branding.

Nieuwe assets worden primair vergeleken met assets uit dezelfde familie.

Een wijnfles hoeft bijvoorbeeld niet exact dezelfde contourregels te hebben als een klanten-sprite, zolang beide binnen hun eigen familie consistent zijn en de game als geheel coherent blijft.

---

## 8. Hard rules versus soft guidelines

### Definitief principe

De art bible maakt onderscheid tussen:

### Hard rules

Regels die de visuele of technische consistentie beschermen en niet zomaar mogen worden gebroken.

Voorbeelden:

- geen willekeurige scaling;
- geen smoothing bij pixelart;
- geen asset importeren met zichtbaar andere pixeldensity;
- geen volledig andere perspectiefstijl binnen dezelfde asset family;
- geen UI-element dat de gameplaywereld visueel overstemt;
- geen nieuwe visual style invoeren zonder expliciete beslissing.

### Soft guidelines

Richtlijnen waar creatieve vrijheid is toegestaan.

Voorbeelden:

- exacte vorm van een kast;
- lichte variatie in houttint;
- subtiele verschillen tussen klanttypes;
- decoratieve details;
- kleine asymmetrie;
- variatie in flessenlabels;
- karaktervolle uitzonderingen die de stijl niet breken.

---

## 9. Pixel density en scaling

### Definitief richtinggevend principe

De spelwereld moet uiteindelijk één consistente pixelpipeline gebruiken.

### Hard rules

- Pixelart wordt niet bilineair of smooth geschaald.
- Scaling gebeurt waar mogelijk met **integer multiples**.
- Nearest-neighbour is de voorkeursmethode voor pixelart.
- Assets met verschillende pixeldensity mogen niet ongecontroleerd naast elkaar worden gebruikt.
- Een achtergrond mag niet een zichtbaar andere pixelmaat hebben dan de spelobjecten waarvoor hij als wereldcontext dient.

### Technisch openstaand

Nog niet definitief vastgesteld:

- logical resolution;
- native game resolution;
- exact basisgrid;
- camera scale;
- sprite base sizes;
- pixels-per-unit;
- engine import settings;
- eventuele pixel-perfect camera-instellingen.

Eerdere voorbeelden zoals `480×270` en `16×16` zijn **voorstellen**, geen canon.

Deze waarden moeten worden vastgesteld na audit van:

1. huidige game;
2. bestaande assets;
3. engine-instellingen;
4. gewenste schermverhouding.

---

## 10. Normalisatiepipeline

### Werkhypothese

Bestaande assets met goede inhoud maar afwijkende resolutie hoeven niet direct te worden weggegooid.

Voorkeursproces:

1. Identificeer de beste inhoudelijke assets.
2. Bepaal welke hiervan canon kunnen worden.
3. Meet hun native pixel density en schaal.
4. Kies één technische standaard voor de game.
5. Normaliseer bruikbare assets naar die standaard.
6. Controleer het resultaat in de daadwerkelijke game.
7. Vervang alleen assets die inhoudelijk én technisch niet meer passen.

### Belangrijk

AI-gegenereerde beelden worden behandeld als **bronmateriaal**, niet automatisch als productieklaar pixelartbestand.

---

## 11. Generatieve art

### Definitief principe

Een prompt is geen style guide.

Nieuwe generatieve assets moeten worden gestuurd door:

- deze art bible;
- relevante canon-assets;
- asset-familyregels;
- technische vereisten;
- het daadwerkelijke gebruik in de game.

### Promptstructuur

Een goede assetprompt bevat minimaal:

1. functie van de asset;
2. asset family;
3. perspectief;
4. schaal / beoogde native grootte;
5. visuele stijl;
6. materiaal / kleur;
7. rand- en schaduwgedrag;
8. transparante of vaste achtergrond;
9. wat expliciet niet gewenst is;
10. verwijzing naar canon-assets waar mogelijk.

### Niet doen

- Alleen "in de stijl van Château Cashflow" schrijven zonder technische context.
- Iedere asset vanuit nul laten improviseren.
- Assetprompts volstoppen met tegenstrijdige stijladjectieven.
- Generatieve output direct implementeren zonder controle.

---

## 12. Perspectief

### Technisch / visueel openstaand

Het precieze perspectief van winkelinterieur en objecten moet worden afgeleid uit de bestaande game en beste canon-assets.

Voor implementatie moet worden gecontroleerd:

- camerahoek;
- mate van top-down versus zijaanzicht;
- verticale schaal;
- meubelperspectief;
- overlapregels;
- character scale.

### Hard rule

Binnen één gameplayruimte mag geen duidelijk conflicterend perspectief worden gebruikt.

---

## 13. Schaduw, licht en materiaal

### Werkhypothese

De wereld moet warm en tactiel aanvoelen zonder complexe realistische belichting.

Voorkeur:

- eenvoudige, consistente schaduwlogica;
- leesbare contactschaduwen;
- beperkte highlights;
- materialen herkenbaar door kleur en pixelpatroon;
- hout, glas, papier en textiel visueel onderscheidbaar.

### Niet doen

- hyperrealistische reflecties naast simpele sprites;
- extreem zachte gradients die pixelart doen vervagen;
- per asset andere lichtbron.

---

## 14. Personages

### Werkhypothese

Klanten en personeel moeten:

- snel van elkaar te onderscheiden zijn;
- voldoende karakter hebben;
- klein genoeg blijven om de winkel leesbaar te houden;
- visueel passen bij managementgame-pixelart;
- animaties eenvoudig houden.

### Voorkeur

Karakter ontstaat eerder via:

- silhouet;
- kleding;
- houding;
- kleine props;
- beperkte animatie;

dan via grote hoeveelheden gezichtdetail.

---

## 15. Wijnflessen en labels

### Werkhypothese

Wijnen moeten visueel voldoende verschillend zijn om assortiment herkenbaar te maken, zonder dat iedere fles een illustratieproject wordt.

Mogelijke variatie:

- fleskleur;
- capsule;
- labelkleur;
- labelvorm;
- flesvorm;
- kleine prestige-indicatoren.

### Ontwerpregel

De visuele verschillen moeten gameplayleesbaarheid ondersteunen.

---

## 16. Achtergronden

### Hard rules

- Achtergronden moeten dezelfde technische pixelpipeline volgen als de spelwereld.
- Achtergronden mogen niet veel fijner of grover gepixeld zijn dan voorgrondobjecten.
- Detailniveau mag de winkelobjecten niet wegdrukken.
- Achtergronden ondersteunen sfeer, geen visuele competitie.

### Technisch openstaand

Bestaande achtergronden moeten later worden geaudit op:

- native resolutie;
- scaling;
- pixeldensity;
- kleurgebruik;
- perspectief;
- contrast;
- detailniveau.

---

## 17. Animatie

### Werkhypothese

Animatie is functioneel en compact.

Voorkeur:

- korte loops;
- duidelijke state changes;
- weinig frames waar dat voldoende is;
- animatie vooral inzetten voor feedback en levendigheid.

Voorbeelden:

- klant loopt;
- klant bekijkt schap;
- fles wordt gekocht;
- medewerker vult bij;
- subtiele kassafeedback;
- unlockmoment;
- dagsluiting.

### Niet doen

- lange animaties die tempo vertragen;
- cosmetische animaties die belangrijke feedback maskeren;
- overdreven framecounts die productie onnodig duur maken.

---

## 18. Feedback en VFX

### Werkhypothese

Feedback moet leesbaar maar beheerst zijn.

Gebruik effecten bijvoorbeeld voor:

- verkoop;
- geld;
- reputatie;
- unlock;
- lege voorraad;
- bijzondere klantreactie.

### Ontwerpregel

Effecten ondersteunen de winkelervaring en mogen niet de sfeer van een arcadegame overnemen.

---

## 19. Logo en branding

### Werkhypothese

Château Cashflow mag visueel premium en speels combineren.

Branding hoeft niet exact dezelfde pixelstijl te gebruiken als de spelwereld, zolang:

- sfeer aansluit;
- kleurtaal aansluit;
- het logo goed werkt op titel-, menu- en marketingformaten.

Bestaande logo-iteraties moeten later worden beoordeeld voordat één versie definitief canon wordt.

---

## 20. Art review

### Definitief procesprincipe

Nieuwe of gewijzigde assets worden minimaal beoordeeld op:

1. **Style fit** — hoort dit bij Château Cashflow?
2. **Family fit** — past dit bij vergelijkbare assets?
3. **Pixel consistency** — klopt density en scaling?
4. **Readability** — is het object direct herkenbaar?
5. **Gameplay fit** — ondersteunt het de functie?
6. **Palette fit** — wijkt kleurgebruik niet vreemd af?
7. **Perspective fit** — klopt het met de wereld?
8. **Implementation fit** — werkt het technisch in de game?

### Reviewuitkomst

- Accept as Canon
- Accept
- Normalize
- Revise
- Replace
- Keep as Placeholder

---

## 21. Simplify pass

### Definitief procesprincipe

Na een art- of UI-iteratie wordt bewust gekeken wat verwijderd of vereenvoudigd kan worden.

Vragen:

- Is er detail dat op speelschaal toch niet zichtbaar is?
- Kan een element met minder pixels duidelijker worden?
- Zijn er kleuren die niets toevoegen?
- Zijn er decoraties die gameplayinformatie verstoppen?
- Is de UI visueel drukker geworden zonder functionele winst?

---

## 22. Wat niet stilzwijgend mag worden veranderd

Zonder expliciete ontwerpbeslissing niet:

- pixelartwereld vervangen door flat 2D;
- desktop-first wijzigen naar mobile-first;
- pixeldensity per asset family willekeurig aanpassen;
- perspectief fundamenteel wijzigen;
- UI veel drukker maken;
- hele palette vervangen;
- canon-assets massaal weggooien;
- smoothing introduceren;
- exacte technical pixel pipeline verzinnen zonder audit.

---

## 23. Eerstvolgende art-audit door Work

### Taak

Work moet later de daadwerkelijke bestaande assets en game inspecteren en rapporteren:

- welke assets nu in gebruik zijn;
- welke pixel densities voorkomen;
- welke achtergrondresoluties bestaan;
- welke scaling/importinstellingen worden gebruikt;
- welke assets stijlankers kunnen zijn;
- welke assets inconsistent zijn;
- welke assets eenvoudig genormaliseerd kunnen worden;
- welk logisch technisch standaardformaat het minst destructief is.

### Belangrijk

De audit moet **eerst rapporteren en pas daarna aanpassen**.

De art bible bepaalt de richting; de audit bepaalt de beste technische vertaling naar het bestaande project.
