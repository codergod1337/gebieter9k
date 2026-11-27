# Konzept: Wissensdatenbank

Stand 2026-11-27: Das Modul steht im Frontend, mit einem Demokapitel („Grundlagen“, Seite „Koordinatentransformation“)
und seiner Kachel auf Startseite und Login-Seite.
Die Inhalte stehen dafür im Code. Der eigene Solr-Kern ist die Richtung, aber noch nicht begonnen (Abschnitt 4).

## 1. Was es werden soll (Nutzer, 2026-11-24 und 2026-11-26)

- Ein **interaktives Lernskript** zu Mathematik, Physik und Chemie, als eigenes großes Paket in gebiter9k, erreichbar
  **ohne Login**.
- **Umfang als Ziel:** Von der Komplexität her soll sich damit ein Bachelor in Physik und Chemie abbilden lassen.
- **Oberfläche:** eigene Reiter, später eine kleine Suche.
- **Kern-Wunsch:** Rechnungen so nachvollziehbar, dass man jede Äquivalenzumformung einzeln sieht und erkennt, wohin
  welche Variable „geschoben“ wird, farblich und animiert. Beispiel: Aus `cos φ = x / r` wird durch „· r“ die Zeile
  `r · cos φ = x`; das `r` trägt in beiden Zeilen dieselbe Farbe und wandert sichtbar vom Nenner nach links.
- **Qualität:** „bilderbuchmäßig“, eigene Klassen in eigenen Dateien, sauber gegliederte Architektur, SOLID, so weit es
  Sinn ergibt; „kein hingerotzter Pfusch“.
- **Später genannt:** das Stern-Gerlach-Experiment „simulieren“ bzw. darstellen, Statistik.

Nicht verwechseln: Jupyter-Notebooks kommen nicht in die App (Entscheidung vom 2026-11-21).

## 2. Entscheidungen

| Entscheidung | Von wem, wann | Dazu |
|---|---|---|
| Paket in gebiter9k, kein eigenes Projekt | Nutzer, 2026-11-24 | Am selben Tag als Python-Projekt in `~/Dokumente/coding/pythonpower` begonnen und verworfen. |
| Ohne Login | Nutzer, 2026-11-24 | Besucher ohne Konto sollen es benutzen können. |
| Erstes Kapitel „Grundlagen“ | Nutzer, 2026-11-24 | Koordinatensysteme und die Bewegung eines Körpers. |
| Inhalte kommen in einen **eigenen Solr-Kern** | Nutzer, 2026-11-26 | „ein solr wissens kern dokument pro seite“; wie fein eine Seite geschnitten ist (je Unterpunkt, gröber, feiner), ist bewusst offen. Dazu Referenzen (bei uns der Name für die Hooks der Vorlage), Status und Schlagwörter. Löst „Inhalte stehen im Code“ und „kein Backend“ vom 2026-11-24 ab. |
| **Kein Rich-Text** als Format des Inhalts | Nutzer, 2026-11-26 | „maximale freiheit“ für Formeln, „maybe auch mini svg“, damit sich Äquivalenzumformungen eindeutig animieren lassen („wo welcher wert hingeht“). Wie genau abgelegt wird, ist offen. |
| **Ansehen auch ohne Anmeldung, Schreiben nur über Admin-Endpunkte** | Nutzer, 2026-11-27 | „wissensdatenbank soll auch für anonym verfügbar sein zum ANSEHEN schreiben erst mal nur über admin endpunkte. schreiben machen wir aber erst wenn wir alle feinheiten am dummy test modul dafür geklärt haben!“ Also: Lesen über `/api/share/…`, Schreiben über `/api/admin/…` (nur ADMIN), und das Schreiben wird erst gebaut, wenn am Demo-Modul alles geklärt ist. |
| Erst ein **Demo ohne Solr-Kern** | Nutzer, 2026-11-26 | „ein wissensdatenbank modul […] noch ohne solr kern einfach mit einem demokapitel und zwar grundlagen/ koordinaten transformation“. Gebaut, siehe Abschnitt 3. |

## 3. Was gebaut ist (2026-11-26, nur Frontend)

Adresse, ohne Anmeldung: `/wissen` → `/wissen/grundlagen` (Übersicht des Kapitels) →
`/wissen/grundlagen/koordinatentransformation`.

**Einstieg (2026-11-27):** die Kachel „Wissensdatenbank“. Angemeldet steht sie auf der Startseite (jeder Angemeldete,
kein Recht nötig), für Besucher ohne Konto dieselbe Kachel auf der Login-Seite unter „Ohne Anmeldung ansehen“
(`home/VisitorTiles`). Beide kommen aus einer Liste: `home/homeTiles.ts`, dort trägt die Kachel
`visibleWithoutLogin: true`.

**Die Seite „Koordinatentransformation“:** Einleitung mit Skizze, vier Rechnungen (x und y aus r und φ; r und φ aus x
und y), Zusammenfassung mit dem Hinweis zu `atan2`. Jede Größe hat auf der ganzen Seite eine Farbe, in der Skizze wie
in den Formeln.

**Eine Rechnung (Stand 2026-11-27, nach der Rückmeldung in 3a):**

- Immer zu sehen sind **Ausgang und Ergebnis**. „Rechenweg einblenden“ zeigt alle Umformungen dazwischen, jede in ihrer
  eigenen Zeile mit Erklärung, „Rechenweg ausblenden“ nimmt sie wieder weg. Der Zustand steht in der Adresse
  (`?xCoordinatePath=shown`). Eingeblendet bleibt alles stehen: Man schaut zwei Zeilen zurück und liest weiter.
- Am Ende jeder Zeile steht die Umformung zur nächsten („| · r“) mit einem **Abspiel-Knopf**: Er zeigt, wie aus dieser
  Zeile die nächste wird, beliebig oft und in beliebiger Reihenfolge.
- **Die Bewegung zeigt die Rechenregel:**
  - Auf beiden Seiten dasselbe tun: Was dazukommt, wandert sichtbar aus der Notiz der Umformung an beide Seiten.
    Beispiel „· r“: aus `cos φ = x / r` wird `r · cos φ = r · x / r`, beide `r` kommen aus dem „· r“.
  - Kürzen und Aufheben: Was wegfällt, steht in seiner Zeile **durchgestrichen**, und das bleibt so, wie auf dem
    Papier. Beim Abspielen wird erst der Strich gezogen, dann entsteht die nächste Zeile. Beispiel: In
    `r · cos φ = r · x / r` sind rechts der Faktor `r` und das `r` im Nenner durchgestrichen, die nächste Zeile ist
    `r · cos φ = x`. Ebenso heben sich in `√(r²)` Wurzel und Quadrat auf und in `arctan(tan φ)` Arkustangens und Tangens.
  - Seitenwechsel: Ein Term, der die Seite der Gleichung wechselt, wandert auf einem Bogen hinüber (z. B. bei „Seiten
    tauschen“); alles andere gleitet gerade an seinen neuen Platz.
- Die vier Rechnungen: x und y je drei Umformungen („· r“ → „kürzen“ → „Seiten tauschen“), r und φ je zwei („√“ bzw.
  „arctan“ auf beiden Seiten → „hebt sich auf“).

**Die Skizze (Stand 2026-11-27):** jede Skizze aus denselben Bausteinen (`knowledge/sketch/`). Ein Achsenkreuz mit
feinem Raster, dem **Nullpunkt „0“ und der „1“ an beiden Achsen**; **jeder Punkt** nennt beim Zeigen seine Koordinaten
im Hoverlay (P zusätzlich seine Polarkoordinaten: „P (4 | 3)“, „polar: r = 5, φ ≈ 36,87°“); **ein Winkel** hebt beim
Zeigen seine beiden Schenkel hervor, alles andere tritt zurück, und das Hoverlay sagt, welcher Winkel es ist.

**Aufbau des Pakets `code/frontend/src/knowledge/`:**

| Ordner | Inhalt |
|---|---|
| `knowledge/` | Das Modul: `Knowledge.tsx` (Subheader, je Kapitel ein Reiter), `KnowledgeStartPage`, `KnowledgeChapterPage` (Liste der Seiten eines Kapitels), `KnowledgePageContent` (sucht die Seite zur Adresse), `knowledgeChapters.ts` (alle Kapitel), `knowledgePaths.ts`, `knowledgeTexts.ts`, `knowledgeIcon.ts`, die Typen `KnowledgeChapter` und `KnowledgePage`. |
| `knowledge/math/` | Eine Formel als Baum aus Termen, je Klasse eine Datei, ohne React: `MathTerm` (Basis), `SymbolTerm`, `NumberTerm`, `SumTerm`, `ProductTerm`, `FractionTerm`, `PowerTerm`, `RootTerm`, `FunctionTerm`, `GroupTerm`, `MarkedTerm`, dazu `TermMark` (Kennung + Farbe), `TermRoles` (welche Terme einer Zeile gekürzt bzw. von der Umformung gebracht sind), `Equation`. Gezeichnet wird über den Visitor `MathTermReactRenderer` (`MathTermView`, `EquationView`); Wurzelzeichen und Klammern sind kleine SVGs, die mit dem Inhalt wachsen (`MathStretchySign`). |
| `knowledge/derivation/` | Eine Rechnung: `Derivation`, `DerivationStep`, `DerivationOperation` (das „\| · r“ am Zeilenende samt dem, was die Umformung bringt und kürzt). Anzeige: `DerivationBox`, `DerivationStepRow`, `DerivationOperationNote`. Ob der Rechenweg eingeblendet ist: `useDerivationPathVisibility`; das Abspielen einer Umformung: `useDerivationFlight` mit `TermFlightAnimator` (reines DOM). |
| `knowledge/sketch/` | Die Bausteine jeder Skizze: `SketchCoordinateSystem` (Nullpunkt und Maßstab), `Sketch` (Rahmen), `SketchAxes`, `SketchPoint`, `SketchSegment`, `SketchAngle`, `formatSketchNumber`, `SketchPosition`. |
| `knowledge/basics/` | Das Kapitel „Grundlagen“ (`basicsChapter.ts`) und im Unterordner `coordinatetransformation/` die Seite: Texte, die vier Größen mit ihren Marken, je Rechnung eine Datei, die Skizze, die Seite selbst. |

Global dazugekommen: `components/PlayButton` (der Abspiel-Knopf).

**So liest der Animator, was zu tun ist:** an Attributen, die der Zeichner an die Elemente der Terme schreibt.
`data-tracking-key`: die Kennung der Marke; dieselbe Kennung in zwei aufeinanderfolgenden Zeilen ist derselbe Term.
`data-cancelled`: Der Term wird mit der nächsten Umformung gekürzt. `data-flight-origin="cause"`: Die Umformung hat ihn
in diese Zeile gebracht, er kommt aus ihrer Notiz. `data-flight-scope="left|right"` an den beiden Seiten der Gleichung:
daran erkennt der Animator einen Seitenwechsel.

**CSS:** der Satz der Formeln (Bruch, Exponent, Wurzel, Klammern, der Strich durch Gekürztes), die Zeilen der Rechnung
und die Skizze stehen in `src/styles/base.css`; Schrift, die fünf Farben der Hervorhebung (`--math-highlight-first` bis
`-fifth`), die Farbe des Strichs (`--math-cancel-color`), die Dauer des Wanderns (`--math-flight-milliseconds`, 0
schaltet es ab) und das Hervorheben in der Skizze stehen im Theme.

**Ein neues Kapitel oder eine neue Seite:** Kapitel = neuer Ordner mit seiner Kapitel-Datei und ein Eintrag in
`knowledgeChapters.ts`; Seite = neuer Ordner im Kapitel und ein Eintrag in dessen `pages`. Routen und Reiter entstehen
daraus von selbst, `App.tsx` bleibt, wie es ist.

**Von Claude festgelegt, weil der Nutzer bauen statt antworten wollte (alles leicht zu ändern):**

- Ordner `knowledge`, Bezeichner englisch wie im übrigen Code, Adresse deutsch (`/wissen/…`).
- Formeln als eigene Term-Klassen, gezeichnet mit HTML und CSS, **kein npm-Paket**. Haken: Jede neue Schreibweise
  (Integral, Vektor, Matrix) ist eine neue Klasse und eine Methode im Zeichner.
- Jede Größe trägt dauerhaft ihre Farbe; beim Abspielen wandern alle markierten Terme.
- Das Paket ist fest in der App (kein Nachladen): Mit den Inhalten in Solr bleibt es klein.
- Ein- und Ausblenden des Rechenwegs ersetzt den Eintrag im Verlauf (REPLACE), damit „Zurück“ im Browser die Seite
  verlässt und nicht Kasten für Kasten zuklappt.
- P liegt in der Skizze bei (4 | 3): damit ist r genau 5.

Geprüft am 2026-11-27: Typprüfung und Bau ohne Fehler; im Firefox ohne Fenster mit echter Maus durchgeklickt und
fotografiert (ausgeblendet, eingeblendet, jede Art von Umformung beim Abspielen, Hoverlays der Punkte, Winkel).

## 3a. Rückmeldung zum Demo (Nutzer, 2026-11-27) – umgesetzt am selben Tag, siehe Abschnitt 3

„wissensdatenbank naja da müssen wir noch feilen“. Seine Punkte, wörtlich:

1. **Umformungen:** „es geht primär nicht nur darum, dass sich einfach was nutzlos bewegt, aber es soll eben es besser
   einprägbar machen, wenn etwas die gleichungsseite wechselt, gekürzt wird oder vom zähler in den nenner wandert. das
   prägt sich für ein menschenhirn besser durch eine bewegung ein und auch wenn man sieht wo etwas gekürzt wird!“
2. **Rechenweg:** „wir haben immer den formelausgang und den formel endzustand angezeigt, und bei bedarf will ich dann
   den genauen rechenweg mit allen äquivalenzumformungen eiblenden können.“ Grund: Bei einem schwierigeren Thema muss man
   „noch mal 2 schritte zurück um was kurz nachzuschauen und dann wieder vorhüpfen“.
3. **Skizzen:** „eine nummer zu lieblos“, „zu wenige details“; „jede skizze hat einen nullpunkt und eine 1
   reinskaliert. jeder punkt soll als hoverlay mindestens seine koordinaten angezeigt haben. für einen winkel wäre es
   schön wenn man die beiden achsen des winkels als "hoverlay" dann highlighten würde, so dass ich weiss was das
   überhaupt für ein winkel ist.“

Noch nicht gezeigt, weil die Seite keinen Fall dafür hat: ein Term, der vom Zähler in den Nenner wandert.
Der umgesetzte Stand ist seit dem 2026-11-27 auf dem Pi (Commit `7453d7d`); eine Rückmeldung des Nutzers dazu steht aus.


## 3b. Hierarchie und Solr-Kern (Nutzer, 2026-11-27) – zu klären, BEVOR echter Inhalt entsteht

„und bedenke, ich will später die wissensdatenbank in einem solr kern ablegen. sprich wir müssen uns noch überlegen
wie wir da die hirarchieen abbilden ich will ja später rubrik = mathe, physik, ML, Code etc haben, je rubrik dann
unterrubriken mit grundlagen sowas wir was ist metrik, was ist ein kreuzprodukt, koordinatentrafos, in mathe dann
analysis 1 und 2 lin alg was es halt alles so gibt, ich hatte das alles mal an der uni und will es nicht komplett
vergessen, das ist so mein antrieb, eben alles was man in einem psysik machelor studium so lernt und in einem
softwaretechnikstudium, das würde ich step by step dann mit dir erarbeiten und digital verewigen, und in solr dass wir
danach super suchen können. ich tendiere dazu dann kapitel und unterkapitel als solr doc felder zu nutzen und so eine
verlinkung zu erzeugen. die struktur habe ich dir ja schon genannt, anfangen würde ich mit mathe grundlagen, und
physik grundlagen,aber wir gesagt bevor es richtigen inhalt gibt, sollten wir die architektur des wissens datenbank
kernes klären. denn ich will ja auch die seiten wieder finden können“

Was daraus feststeht:

- **Antrieb:** alles festhalten, was man in einem Physik-Bachelor und in einem Softwaretechnik-Studium lernt, Schritt
  für Schritt gemeinsam erarbeitet, und in Solr gut durchsuchbar („die seiten wieder finden“).
- **Hierarchie:** oben die **Rubrik** (Mathe, Physik, ML, Code, …), darunter **Unterrubriken** (in Mathe z. B.
  Grundlagen, Analysis 1, Analysis 2, Lineare Algebra), darunter die Seiten (z. B. „Was ist eine Metrik“, „Was ist ein
  Kreuzprodukt“, Koordinatentransformationen).
- **Tendenz des Nutzers:** Kapitel und Unterkapitel als Felder des Solr-Dokuments, darüber die Verlinkung.
- **Reihenfolge:** zuerst die Architektur des Kerns klären; die ersten Inhalte danach: Mathe Grundlagen und Physik
  Grundlagen.

Folge für das Demo (noch nicht umgesetzt): Dort ist „Grundlagen“ heute die oberste Ebene (ein Reiter) mit Seiten
darunter. Nach dieser Hierarchie wäre es Rubrik „Mathe“ → Unterrubrik „Grundlagen“ → Seite „Koordinatentransformation“.

## 3c. Der Kern `KNOWLEDGE`: Vorschlag von Claude, vom Nutzer am 2026-11-27 bestätigt („ja das sieht gut aus“)

Noch nicht gebaut ist der Kern selbst. **Gebaut am 2026-11-27 (lokal): die Gliederung in Postgres** (Rückfrage 1,
Nutzer: „dann machen wir das mapping der ganzen keys zum anzeigetext in postgres“): Entity `KnowledgeSection`
([`entities/KnowledgeSection.md`](entities/KnowledgeSection.md)), Endpunkte unter `/api/admin/knowledge-section` (nur
ADMIN) und `/api/share/knowledge-section` (Lesen ohne Anmeldung), im Frontend als Stammdaten (`knowledgeSections`) und
das neue Admin-Modul **„Wissensmanager“** (`/knowledge-manager`, Kachel nur ADMIN) mit dem Reiter „Gliederung“:
Rubriken, Kapitel der gewählten Rubrik, Unterkapitel des gewählten Kapitels; anlegen, umbenennen, Reihenfolge am Griff.
Kein Löschen. Der Wissensmanager bekommt später auch die Seiten und ihren Editor.

**Keys sind änderbar (Nutzer 2026-11-27):** „wir können doch keys ändern, wenn wir direkt nach einer änderung, also in
der selben transaktion durch alle wissensdokumente cursoriterieren und den jeweiligen key ändern“. Gebaut für die
Gliederung (`changeKnowledgeSectionKey`: der Punkt und alles darunter, eine Postgres-Transaktion). **Pflicht für den
Kern:** Dieselbe Methode zieht dann zuerst alle Dokumente mit dem alten Key per Cursor nach und ändert Postgres zuletzt
(Solr und Postgres teilen keine Transaktion; neu startbar wie beim Löschen). Dasselbe gilt für `pageKey`.

Vorgaben des Nutzers dazu (2026-11-27): ein Feld `language` (vorerst nur `de`, weitere Sprachen später ergänzbar); die
ganze Seite in einem langen String, der NICHT durchsucht wird; für die Suche später aufbereitete Schlagwörter daraus;
die Architektur soll solide sein und die Seiten gut zu bearbeiten; meist schreibt Claude die Seiten nach seiner
Beschreibung; dazu ein Editor, in dem er selbst Seiten anlegt und ändert („mini wikipedia aber nur der admin schreibt
und alle dürfen lesen“).

**Grundsätze des Vorschlags:**

- **Ein Dokument = eine Seite in einer Sprache.** Die englische Fassung einer Seite wäre später ein zweites Dokument
  mit derselben `pageGuid` und `language` = `en`. An den Feldern ändert eine neue Sprache nichts. Haken: Der
  Volltext-Typ `TEXT_SUCHE` ist auf Deutsch eingestellt; eine zweite Sprache braucht dann einen eigenen Texttyp im
  Configset.
- **Hierarchie als Keys im Dokument** (Tendenz des Nutzers): `rubricKey` → `chapterKey` → `subChapterKey` → Seite. Die
  Tiefe ist damit fest (Rubrik, Kapitel, Unterkapitel); eine vierte Ebene hieße ein neues Feld.
- **Namen und Reihenfolge der Rubriken und Kapitel als Stammdaten in Postgres** (vom Nutzer bestätigt), so wie die
  FileClass zur Datei und die Rubrik zum Markt: Im Dokument steht nur der Key. Eine Rubrik umbenennen oder umsortieren
  fasst dann kein einziges Dokument an, und die Namen sind wie überall mehrsprachig (`{"de": "Mathe"}`).
- **Der Inhalt als ein String** (`content`), gespeichert, nicht indexiert: die Seite als JSON aus den Bausteinen des
  Demos (Textabsätze, Rechnungen mit ihren Schritten, Skizzen). Dazu `contentFormatVersion`, damit sich das Format
  ändern darf und alte Seiten lesbar bleiben.
- **Suche** vorerst über `title`, `summary` und `tags`; die aus dem Inhalt aufbereiteten Schlagwörter kommen später
  als eigenes Feld, das nur das Backend setzt.
- **Lesen** ohne Anmeldung über `/api/share/…`, nur `PUBLISHED`. **Schreiben** nur ADMIN über `/api/admin/…`.

**Die Felder:**

| Feld | Typ | setzt | Beispiel | Wozu |
|---|---|---|---|---|
| `id` | STRING, Pflicht | Backend | `3f2a…-…_de` | Schlüssel des Dokuments: `pageGuid` + `_` + `language`. |
| `pageGuid` | STRING | Backend | `3f2a…-…` | Die Seite über alle Sprachen hinweg; ändert sich nie, auch nicht beim Verschieben. |
| `language` | STRING | Admin | `de` | Sprache dieser Fassung; erlaubt sind die aktiven Sprachen der Plattform. |
| `rubricKey` | STRING | Admin | `MATHE` | Rubrik. |
| `chapterKey` | STRING | Admin | `GRUNDLAGEN` | Kapitel in der Rubrik. |
| `subChapterKey` | STRING, darf fehlen | Admin | `KOORDINATEN` | Unterkapitel im Kapitel. |
| `pageKey` | STRING | Admin | `KOORDINATENTRANSFORMATION` | Die Seite in ihrer Adresse: `/wissen/mathe/grundlagen/koordinatentransformation`. Eindeutig je Kapitel und Sprache. |
| `listingPosition` | LONG | Admin | `3` | Reihenfolge der Seiten in ihrem Kapitel bzw. Unterkapitel. |
| `title` | TEXT_EDGE, Ngram-Zwilling, hohes Suchgewicht | Admin | `Koordinatentransformation` | Überschrift, wird beim Tippen gefunden. |
| `summary` | TEXT_SUCHE, mittleres Suchgewicht | Admin | `Kartesische Koordinaten und Polarkoordinaten ineinander umrechnen.` | Ein Satz für die Übersicht des Kapitels und für Treffer der Suche. |
| `content` | STRING, gespeichert, NICHT indexiert | Admin | `{"blocks":[…]}` | Die ganze Seite als ein langer String. Wird nie durchsucht. |
| `contentFormatVersion` | LONG | Backend | `1` | In welcher Fassung des Formats `content` geschrieben ist. |
| `tags` | STRING, mehrwertig, Suggest-Zwilling, Suchgewicht | Admin | `polarkoordinaten`, `pythagoras` | Schlagwörter von Hand, ohne Raute, wie im Kern FILE. |
| `status` | STRING, Pflicht | Admin | `PUBLISHED` | `DRAFT` (nur der Admin sieht die Seite), `PUBLISHED` (alle), `DELETED` (weich gelöscht). |
| `relatedPageGuids` | STRING, mehrwertig | Admin | `8c11…-…` | „Siehe auch“ und „baut auf“: Verweise auf andere Seiten über ihre `pageGuid`. |
| `authorUsersGuid` | STRING | Backend | `7777…` | Wer die Seite angelegt hat. |
| `createdAt` | DATE | Backend | `2026-11-27T10:00:00Z` | Angelegt am. |
| `lastChangedAt` | DATE | Backend | `2026-11-27T10:30:00Z` | Zuletzt geändert am. |
| `wtf` | Referenz | Admin | `DEMO` | Kommt in jedem Kern von selbst: beliebige Markierungen. |

Später, eigener Gang (Nutzer): die aus `content` aufbereiteten Schlagwörter für die Suche als eigenes Feld.

**Die zwei Rückfragen vom 2026-11-27:**

1. Namen und Reihenfolge der Rubriken und Kapitel als Stammdaten in Postgres? **Beantwortet: ja, in Postgres** (gebaut,
   siehe oben).
2. Wie schreibt Claude Seiten? **Beantwortet (Nutzer 2026-11-27): unter dem Konto des Nutzers** („ich lege sonst einen
   neuen 2fa key für meinen user in der .env an. dann postest du unter meinem user, das ist mir sowieso am liebsten“).
   Claude meldet sich also wie der Admin an (Passwort und 2FA-Schlüssel aus `code/.env`) und nutzt die normalen
   Admin-Endpunkte. Das Einspielen aus Dateien im Repo entfällt. Je User gibt es genau einen 2FA-Schlüssel: Ein neuer
   ersetzt den in seiner Authenticator-App. Alter Stand der Frage, überholt: Anmelden kann er sich wegen der Authenticator-App nicht. Vorschlag: Seiten als Dateien im
   Repo, die das Backend in den Kern einspielt; so kommen sie wie Code über Git auf den Pi und haben einen Verlauf.

## 4. Wie es weitergeht (nur Richtung)

1. Der Nutzer sieht sich das Demo an; daran wird besprochen, was am Wandern und an den Formeln anders soll.
2. Der Solr-Kern: Kern in `gebiter.solr.core-keys` (YAML) und `SOLR_CORES` (`.env`), Felder im Solr-Manager, Doku in
   `docu/solr-cores/`. Lesen ohne Login über `/api/share/…`, Schreiben für Berechtigte.
3. Die Seiten kommen aus dem Kern statt aus dem Code; die Suche über die Themen fällt dabei mit ab.
4. Danach: die Bewegung (ein Punkt im Achsenkreuz, Slider, Umschalter kartesisch/polar), weitere Kapitel,
   Stern-Gerlach, Statistik.

## 5. Offene Fragen

1. **Wie liegt der Inhalt im Solr-Dokument?** Entschieden ist nur: kein Rich-Text. Eine Vorlage von Claude mit drei
   Möglichkeiten (Formeltext mit Marken, eigener Baum als JSON, fertige Zeichnung je Schritt) hat der Nutzer am
   2026-11-26 nicht angenommen („du nervst mich“): nicht noch einmal als Auswahl vorlegen, am Demo besprechen. Das Demo
   nutzt einen eigenen Baum aus Termen; der ließe sich als JSON ablegen.
2. **Namen im Kern:** Kern-Key (Vorschlag `KNOWLEDGE`) und Feldnamen (englisch wie im Kern FILE?).
3. **Referenzen:** Welche? Eine Referenz ist bei uns automatisch ein Feld in JEDEM Kern (wie `wtf`); was nur im
   Wissenskern gilt (z. B. „gehört zu Kapitel“), wäre ein normales Feld dieses Kerns.
4. **Status:** Welche (Entwurf, veröffentlicht, gelöscht)? Der Nutzer sprach von „Statusfeldern“ in der Mehrzahl.
5. **Wie geschrieben wird:** Entschieden ist (2026-11-27): nur über Admin-Endpunkte, und erst nach dem Klären am
   Demo-Modul. Offen: im Browser (Editor) oder per Einspielen?
6. **Sicherung:** Der Text läge nur in Solr. Den Export eines Kerns gibt es per Knopf, das Einspielen ist nicht gebaut.
7. **Einstieg:** erledigt am 2026-11-27 (Kachel auf Startseite und Login-Seite, Abschnitt 3).
8. **Was steuert der Slider** in der späteren Bewegungsansicht: die Zeit entlang einer Bahn oder direkt die Koordinaten?
