# Konzept: Wissensdatenbank

Stand 2026-11-26: Das Modul steht im Frontend, mit einem Demokapitel („Grundlagen“, Seite „Koordinatentransformation“).
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
| Erst ein **Demo ohne Solr-Kern** | Nutzer, 2026-11-26 | „ein wissensdatenbank modul […] noch ohne solr kern einfach mit einem demokapitel und zwar grundlagen/ koordinaten transformation“. Gebaut, siehe Abschnitt 3. |

## 3. Was gebaut ist (2026-11-26, nur Frontend)

Adresse, ohne Anmeldung: `/wissen` → `/wissen/grundlagen` (Übersicht des Kapitels) →
`/wissen/grundlagen/koordinatentransformation`. Es gibt noch keinen Link dorthin (keine Kachel, nichts auf der
Login-Seite): Man ruft die Adresse auf.

**Die Seite „Koordinatentransformation“:** Einleitung mit Skizze (Achsenkreuz, Punkt P, Dreieck aus x, y, r, Winkel φ),
vier Herleitungen zum Durchklicken (x und y aus r und φ; r und φ aus x und y), Zusammenfassung mit dem Hinweis zu
`atan2`. „Nächster Schritt“ zeigt genau eine Umformung; dabei gleitet jede Größe als Kopie von ihrer Stelle in der alten
Zeile an ihre Stelle in der neuen. Jede Größe hat auf der ganzen Seite eine Farbe, in der Skizze wie in den Formeln.

**Aufbau des Pakets `code/frontend/src/knowledge/`:**

| Ordner | Inhalt |
|---|---|
| `knowledge/` | Das Modul: `Knowledge.tsx` (Subheader, je Kapitel ein Reiter), `KnowledgeStartPage`, `KnowledgeChapterPage` (Liste der Seiten eines Kapitels), `KnowledgePageContent` (sucht die Seite zur Adresse), `knowledgeChapters.ts` (alle Kapitel), `knowledgePaths.ts`, `knowledgeTexts.ts`, die Typen `KnowledgeChapter` und `KnowledgePage`. |
| `knowledge/math/` | Eine Formel als Baum aus Termen, je Klasse eine Datei, ohne React: `MathTerm` (Basis), `SymbolTerm`, `NumberTerm`, `SumTerm`, `ProductTerm`, `FractionTerm`, `PowerTerm`, `RootTerm`, `FunctionTerm`, `GroupTerm`, `MarkedTerm`, dazu `TermMark` (Kennung + Farbe), `Equation`. Gezeichnet wird über den Visitor `MathTermReactRenderer` (`MathTermView`, `EquationView`); Wurzelzeichen und Klammern sind kleine SVGs, die mit dem Inhalt wachsen (`MathStretchySign`). |
| `knowledge/derivation/` | Eine Herleitung: `Derivation`, `DerivationStep`, `DerivationOperation` (das „\| · r“ am Zeilenende). Anzeige: `DerivationBox`, `DerivationStepRow`, `DerivationOperationNote`. Der Stand steht in der Adresse (`useDerivationProgress`, z. B. `?xCoordinateStep=2`); das Wandern macht `TermFlightAnimator` (reines DOM), angestoßen von `useDerivationStepFlight`. |
| `knowledge/basics/` | Das Kapitel „Grundlagen“ (`basicsChapter.ts`) und im Unterordner `coordinatetransformation/` die Seite: Texte, die vier Größen mit ihren Marken, je Herleitung eine Datei, die Skizze, die Seite selbst. |

**So funktioniert das Wandern:** Ein Term mit Marke (`MarkedTerm`, oder die Marke am Wurzelzeichen bzw. am Namen einer
Funktion) trägt im Dokument seine Kennung (`data-tracking-key`). Steht dieselbe Kennung in zwei aufeinanderfolgenden
Schritten, ist es derselbe Term: Der Animator misst beide Stellen aus und führt eine Kopie von der alten zur neuen.
Sieht der Term am Ziel anders aus (aus dem Quadrat an `r` wird das Wurzelzeichen, aus `tan` wird `arctan`), blendet
die Kopie beim Ankommen über.

**CSS:** der Satz der Formeln (Bruch, Exponent, Wurzel, Klammern), die Zeilen der Herleitung und die Skizze stehen in
`src/styles/base.css`; Schrift, die fünf Farben der Hervorhebung (`--math-highlight-first` bis `-fifth`) und die Dauer
des Wanderns (`--math-flight-milliseconds`, 0 schaltet es ab) stehen im Theme.

**Ein neues Kapitel oder eine neue Seite:** Kapitel = neuer Ordner mit seiner Kapitel-Datei und ein Eintrag in
`knowledgeChapters.ts`; Seite = neuer Ordner im Kapitel und ein Eintrag in dessen `pages`. Routen und Reiter entstehen
daraus von selbst, `App.tsx` bleibt, wie es ist.

**Von Claude festgelegt, weil der Nutzer bauen statt antworten wollte (alles leicht zu ändern):**

- Ordner `knowledge`, Bezeichner englisch wie im übrigen Code, Adresse deutsch (`/wissen/…`).
- Formeln als eigene Term-Klassen, gezeichnet mit HTML und CSS, **kein npm-Paket**. Haken: Jede neue Schreibweise
  (Integral, Vektor, Matrix) ist eine neue Klasse und eine Methode im Zeichner.
- Jede Größe trägt dauerhaft ihre Farbe; bei einer Umformung wandern alle markierten Terme, nicht nur der eine.
- Das Paket ist fest in der App (kein Nachladen): Mit den Inhalten in Solr bleibt es klein.

Geprüft am 2026-11-26: Typprüfung und Bau ohne Fehler; im Firefox ohne Fenster durchgeklickt und fotografiert
(Übersicht, Seite, Wandern mitten im Flug, Neuladen mit Stand in der Adresse, „Schritt zurück“, schmale Breite).
Noch nicht committet, nicht auf dem Pi.

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
5. **Wer schreibt die Seiten, und wo** (im Browser, per Einspielen)?
6. **Sicherung:** Der Text läge nur in Solr. Den Export eines Kerns gibt es per Knopf, das Einspielen ist nicht gebaut.
7. **Einstieg:** Link für Besucher (Login-Seite?), Kachel für angemeldete User?
8. **Was steuert der Slider** in der späteren Bewegungsansicht: die Zeit entlang einer Bahn oder direkt die Koordinaten?
