# Inhalte aus Bausteinen (`blockcontent`)

> Von Hand geschrieben am 2026-11-27, zusammen mit dem Code.

Das allgemeine Format der Plattform für Inhalte, die mehr sind als Text: Kästen mit Absätzen, Gleichungen und Hinweisen,
Rechnungen mit einzeln abspielbaren Umformungen, Skizzen. Dazu der Leser, die Anzeige und der Editor. Entstanden für die
Wissensdatenbank, aber bewusst unabhängig von ihr (Nutzer 2026-11-27: „ich würde das gerne als allgemeinen richtext
editor nutzen wollen, wenn wir uns schon die mühe machen so ein ding anzulegen dann gleich richtig“).

- **Paket:** [`code/frontend/src/blockcontent/`](../code/frontend/src/blockcontent/) (global; bis zum 2026-11-27 unter `knowledge/`)
- **Gespeichert** wird ein Inhalt als ein JSON-Text. Das Backend prüft nur, dass er ein JSON-Objekt ist; gelesen und gezeichnet wird er im Frontend. Kein HTML: Der Zeichner setzt nur Text und eigene Bausteine, es gibt nichts zu bereinigen.
- **Genutzt von:** den Seiten der Wissensdatenbank (Feld `content` im Kern [`KNOWLEDGE`](solr-cores/KNOWLEDGE.md)), Editor im Wissensmanager.

## Aufbau des Pakets

| Ort | Inhalt |
|---|---|
| `blockcontent/` | `BlockContentJson.ts` (die Form des JSON, wie der Editor es schreibt), `BlockContentReader.ts` (JSON-Text → Bausteine; nennt bei einem Fehler die Stelle), `BlockContent.ts` und `SketchContent.ts` (das Modell zum Zeichnen), `BlockContentError.ts`, `blockContentFormat.ts` (die Fassung, die das Frontend lesen kann), Anzeige: `BlockContentView.tsx`, `BoxBlockView.tsx`, `SketchContentView.tsx`. |
| `blockcontent/math/` | Eine Formel als Baum aus Termen (`SymbolTerm`, `NumberTerm`, `SumTerm`, `ProductTerm`, `FractionTerm`, `PowerTerm`, `RootTerm`, `FunctionTerm`, `GroupTerm`, `MarkedTerm`, `TermMark`, `TermRoles`, `Equation`) und ihr Zeichner (`MathTermReactRenderer`, `MathTermView`, `EquationView`). |
| `blockcontent/derivation/` | Eine Rechnung: `Derivation`, `DerivationStep`, `DerivationOperation`; Anzeige `DerivationBox` (Ausgang und Ergebnis, Rechenweg zum Einblenden), das Abspielen einer Umformung (`useDerivationFlight`, `TermFlightAnimator`), welche Zeile zeigt, was gekürzt wird (`useDerivationCancellations`). |
| `blockcontent/sketch/` | Die Bausteine einer Skizze: Achsenkreuz, Punkt, Strecke, Winkel, rechter Winkel. |
| `blockcontent/inline/` | Text mit Auszeichnung: `InlineMarkupParser.ts` (getippter Text → Stücke), `InlineNode.ts`, `InlineTextView.tsx` (zeichnet fett, kursiv, Links, Formeln im Satz). |
| `blockcontent/formulatext/` | Formeln als getippter Text: `FormulaTextParser.ts` (Text → Term-JSON), `FormulaTextPrinter.ts` (Term-JSON → Text), `FormulaTextError.ts`, `formulaHighlights.ts`. |
| `blockcontent/editor/` | Der Editor: `BlockContentEditor.tsx` (Ansichten „Bausteine“ und „JSON“, Vorschau daneben), `BlockContentCardsEditor.tsx`, die Karten `QuantitiesCard`, `BoxBlockCard`, `DerivationBlockCard`, `SketchEditor.tsx` (die Skizze als Elementliste), `FormulaInput.tsx`, `InlineTextArea.tsx` (Textfeld mit Leiste), `EditorCard.tsx`, `listChanges.ts`, `blockContentEditorTexts.ts`. |

CSS: Lage und Maße in `src/styles/base.css` (`.blockcontent-…`, `.math-…`, `.derivation-…`, `.sketch-…`), Farben und Form im Theme.

## Format (Fassung 1)

Ein JSON-Objekt. Texte stehen in der Sprache der Seite.

```json
{
  "quantities": { "radius": { "symbol": "r", "highlight": "THIRD" }, "angle": { "symbol": "φ", "highlight": "FOURTH" } },
  "blocks": [
    { "type": "BOX", "title": "Worum es geht",
      "parts": [ { "type": "PARAGRAPH", "text": "…" } ],
      "sketch": { "width": 340, "height": 280, "originX": 52, "originY": 228, "unitLength": 48,
                  "axisMaxX": 5.6, "axisMaxY": 4.3, "description": "…", "elements": [ … ] } },
    { "type": "DERIVATION", "key": "xCoordinate", "title": "x aus r und φ",
      "steps": [
        { "equation": { "left": TERM, "right": TERM }, "explanation": "Woher der Ausgang kommt." },
        { "operation": { "notation": "·", "operand": TERM, "applies": ["radiusFactor"], "cancels": [] },
          "equation": { "left": TERM, "right": TERM } }
      ] },
    { "type": "BOX", "title": "Zusammenfassung",
      "parts": [ { "type": "EQUATIONS", "heading": "Von polar nach kartesisch", "equations": [ { "resultOf": "xCoordinate" } ] },
                 { "type": "HINT", "text": "…" } ] }
  ]
}
```

- **`quantities`** (freiwillig): die Größen der Seite, je Kennung ihr Zeichen und ihre Farbe (`FIRST` bis `FIFTH` oder keine). Eine Größe trägt auf der ganzen Seite dieselbe Farbe, in den Formeln und in der Skizze.
- **`BOX`**: ein Kasten mit `title` und `parts` von oben nach unten: `PARAGRAPH` (`text`), `LIST` (`ordered` freiwillig, `items`: je Punkt ein Text), `EQUATIONS` (`heading` freiwillig, `equations`; Gruppen, die aufeinander folgen, stehen nebeneinander), `HINT` (`text`). Der Text eines Absatzes, Hinweises oder Listenpunkts trägt Auszeichnung (unten). Mit `sketch` steht die Skizze neben den Teilen.
- **`DERIVATION`**: eine Rechnung mit `key` (eindeutig auf der Seite; steht als `<key>Path=shown` in der Adresse), `title` und `steps`. Der erste Schritt ist der Ausgang, der letzte das Ergebnis; jeder weitere hat die `operation`, die ihn aus dem davor macht: freiwillig `notation` (das hinter dem Strich: Rechenschreibweise wie `·`, `√`, `arctan`; Worte sind möglich, aber nur für schwierige Schritte gedacht, Nutzer 2026-11-27: „wortbeschreibungen lassen wir optional aber nicht für solche PILLEPALLE OPERATIONEN“; ein einfacher Schritt wie Kürzen oder Seiten tauschen bekommt keine Notiz und zeigt nur den Abspiel-Knopf), freiwillig `operand` (ein Term), `applies` (Kennungen der Terme der NEUEN Zeile, die die Umformung bringt) und `cancels` (Kennungen der Terme der Zeile DAVOR, die sie kürzt). `explanation` nur, wo sie nötig ist (Nutzer 2026-11-27: „nicht ausformulieren“).
- **Gleichung**: `{"left": TERM, "right": TERM}` oder `{"resultOf": "<key einer Rechnung>"}` (ihr Ergebnis).
- **TERM**, ein Baum mit `type`: `QUANTITY` (`key`), `SYMBOL` (`text`), `NUMBER` (`text`), `SUM` (`terms`), `PRODUCT` (`factors`), `FRACTION` (`numerator`, `denominator`), `POWER` (`base`, `exponent`), `ROOT` (`radicand`), `FUNCTION` (`name`, `argument`), `GROUP` (`term`, Klammern), `NEGATIVE` (`term`, ein Minus davor; `a − b` ist die Summe aus `a` und `NEGATIVE` b). Eine `mark` (`{"key": "…", "highlight": "FIFTH" | null}`) macht einen Term über die Zeilen hinweg verfolgbar: dieselbe Kennung in zwei Zeilen ist derselbe Term. Bei `ROOT` gilt sie dem Wurzelzeichen, bei `FUNCTION` dem Namen. Eine `QUANTITY` trägt ihre Kennung von selbst.
- **Skizze**: das Feld (`width`, `height`), das Achsenkreuz (`originX`, `originY`, `unitLength`: wo der Nullpunkt liegt und wie lang die Strecke von 0 bis 1 ist; `axisMaxX`, `axisMaxY`), `description` für Screenreader und `elements` in Zeichenreihenfolge: `POINT` (`position`, freiwillig `label`, `hintName`, `hintDetail`), `SEGMENT` (`from`, `to`, `label`, `labelSide` `LEFT`/`RIGHT`, freiwillig `quantity` für die Farbe), `ANGLE` (`vertex`, `firstLegEnd`, `secondLegEnd`, `label`, `hint`, freiwillig `quantity`), `RIGHT_ANGLE` (`vertex`, `firstLegEnd`, `secondLegEnd`). Positionen als `{"x": 4, "y": 3}` in den Einheiten des Achsenkreuzes.
- Passt etwas nicht, zeigt die Seite statt des Inhalts die Stelle, z. B. „blocks[0].parts[0].type: unbekannter Teil "FOO"“. Eine höhere `contentFormatVersion`, als das Frontend kennt, zeigt den Hinweis, neu zu laden.

## Text mit Auszeichnung

In Absatz, Hinweis und Listenpunkt, getippt oder über die Leiste des Textfelds im Editor gesetzt. Nachsichtig: Was nicht geschlossen ist, bleibt Text. Kein HTML.

| Schreibweise | Bedeutung |
|---|---|
| `**fett**` | fett |
| `*kursiv*` | kursiv (auch ineinander: `*kursiv mit **fett***`) |
| `[Text](https://adresse)` | Link; erlaubt sind `https://`, `http://`, `mailto:` (neues Fenster, ohne Herkunft) und innerhalb der App `/wissen/mathe`; alles andere bleibt Text |
| `$r · cos φ$` | eine Formel mitten im Satz, in der Schreibweise der getippten Formeln; lässt sie sich nicht lesen, bleibt ihr Text unterschlängelt stehen und sagt beim Zeigen, was nicht passt |
| `\*` | ein `\` davor nimmt einem Zeichen die Bedeutung |

## Formeln als getippter Text

Im Editor tippt man eine Formel, statt ihren Baum als JSON zu schreiben. Leser und Schreiber sind genau gegengleich: Was der Schreiber ausgibt, liest der Leser wieder zum selben Baum.

| Schreibweise | Bedeutung |
|---|---|
| `a + b` | Summe |
| `a - b`, `-a`, `x^-1` | Differenz, negativ (auch mit dem echten Minuszeichen `−`); ein Minus ganz vorn gilt dem ersten Produkt, sonst dem nächsten Einzelstück |
| `a · b` oder `a * b` | Produkt |
| `a / b` | Bruch; bindet stärker als das Produkt: `r · x / r` ist r mal (x durch r) |
| `a^2`, `x^(n + 1)` | Potenz |
| `√(a + b)` oder `sqrt(a + b)` | Wurzel |
| `cos φ`, `arctan(y / x)`, `f(x)` | Funktion: ein Name aus mindestens zwei Buchstaben vor einem Term, oder ein Buchstabe direkt vor einer Klammer |
| `( … )` | sichtbare Klammern; als Zähler, Nenner, Exponent oder unter der Wurzel fallen sie weg (`(a + b) / c`), für sichtbare dort ein zweites Paar: `((a + b)) / c` |
| `{ … }` | klammert, ohne dass man es sieht: `{a + b} · c` |
| `x`, `r`, `φ` | ein Zeichen, das wie eine Größe der Seite aussieht, IST diese Größe und trägt ihre Farbe |
| `r#weg` | Kennung (Marke): Daran verfolgt die Rechnung den Term von Zeile zu Zeile, und daran nennt eine Umformung, was sie bringt oder kürzt |
| `2#quadrat:5` | Kennung mit Farbe: Ziffer 1 bis 5, `0` ausdrücklich keine; ohne Ziffer erbt ein Zeichen die Farbe der Größe, die so aussieht |
| `cos#kosinus φ`, `√#wurzel(…)` | die Marke am Funktionsnamen bzw. am Wurzelzeichen |
| `links = rechts` | Gleichung |
| `@xCoordinate` | statt einer Gleichung: das Ergebnis der Rechnung mit dieser Kennung |

Beispiele von der Seite „Koordinatentransformation“: `r#radiusFactor · cos#cosine φ = r#cancelledRadiusFactor · x / r`, `√#rootOfRadiusSquared:5(r^2#squareOfRadius:5) = √#rootOfSumOfSquares:5(x^2 + y^2)`.

Noch nicht möglich, weil der Term-Baum es nicht kennt: Indizes, Vektoren, Integrale, Ungleichungen. Eine neue Schreibweise heißt: eine Term-Klasse, ein Fall im Zeichner, im `BlockContentReader`, im Leser und im Schreiber der Formeln.

## Editor

`<BlockContentEditor contentText=… onContentTextChange=… />`: Er hält nichts selbst, bekommt den JSON-Text und meldet jede Änderung; gespeichert wird beim Aufrufer. Links wird bearbeitet, rechts steht sofort die Vorschau (derselbe Leser wie die fertige Seite); beide Hälften sind gleich hoch und rollen für sich.

- **Ansicht „Bausteine“** (Vorgabe): oben die Größen der Seite (Kennung, Zeichen, Farbe), darunter je Baustein eine Karte. Kasten: Titel; Absätze und Hinweise als Textfelder mit einer Leiste (fett, kursiv, Link, Formel im Satz: setzt die Zeichen um die Markierung); Listen (nummeriert oder nicht) mit ihren Punkten; Gleichungen als getippte Formeln; die Skizze als Liste ihrer Elemente (Punkt, Strecke, Winkel, rechter Winkel) mit Zahlenfeldern für jeden Ort, dazu Feld, Nullpunkt, Länge der 1 und Reichweite der Achsen. Rechnung: Titel, Kennung, je Zeile die getippte Gleichung; ab der zweiten Zeile die Umformung dorthin: Notiz (freiwillig), Term dahinter, „bringt“ und „kürzt“ als Kennungen, dazu eine Beschreibung (freiwillig). Karten und Zeilen lassen sich hinzufügen, verschieben und entfernen. Lässt sich eine getippte Formel nicht lesen, steht darunter, was nicht passt, und die gespeicherte Formel bleibt, wie sie war.
- **Ansicht „JSON“** (`?editorView=json`, REPLACE): der ganze Inhalt als eingerückter Text, für alles, was die Karten noch nicht können.
- Lässt sich der Inhalt nicht lesen, steht statt der Vorschau die Stelle im JSON; der Aufrufer sperrt dann das Speichern (`readBlockContentProblem`).

Eingesetzt im Wissensmanager: [`knowledgemanager/page/KnowledgePageContentEditor.tsx`](../code/frontend/src/knowledgemanager/page/KnowledgePageContentEditor.tsx).

## Offen (noch nicht gebaut)

1. Den vorhandenen HTML-Editor (`components/RichTextEditor`, z. B. Profiltext) ablösen: eigener Schritt, dort sind Texte gespeichert.
2. Weitere Schreibweisen in Formeln (Indizes, Vektoren, Integrale).
3. Überschriften im Text, Bilder, Tabellen.
4. Für Inhalte, die normale User schreiben: eine Prüfung der Bausteine im Backend und je Einsatzort die erlaubten Bausteine.
5. Eine Größe umbenennen (Kennung), ohne dass ihre Verweise brechen; heute steht die Kennung fest.

## Getestet

2026-11-27: Formeln als Text mit Node (Wegwerf-Skript): alle 20 Formeln der Seite „Koordinatentransformation“ als Text ausgegeben und wieder gelesen ergeben denselben Baum; 19 eigene Fälle stabil (`(a + b) / (c + d)`, `((a + b)) / c`, `{a + b} · c`, `x^(n + 1)`, `sin x^2`, `ln(x + 1)`, `f(x) + g(y)`, `{a / b}#bruch:2 · c`, `3,5 · x` …); abgelehnt mit Meldung: `a - b`, `a +`, `(a + b`, `a $ b`, `r#`, `x#n:9`, leer, `2x`, ein `=` im Term, eine Gleichung ohne `=`.

2026-11-27: Editor im Firefox ohne Fenster gegen ein nachgestelltes Backend: sieben Karten (Größen, zwei Kästen, vier Rechnungen), 28 Formelfelder; Formel ändern → Vorschau folgt; abgeschnittene Formel → Meldung unter dem Feld, Inhalt bleibt; Titel und Absatz ändern; Zeile und Kasten anhängen, verschieben, entfernen; Farbe einer Größe ändern → Vorschau färbt um; Ansicht „JSON“ und zurück; speichern (ein `PUT` mit `content`). Gegen das echte Backend noch nicht geprüft.

2026-11-27, 13:45, die Ergänzungen (Firefox ohne Fenster, nachgestelltes Backend; Formeln zusätzlich mit Node, 57 Fälle, 0 falsch): Absatz `Das ist **fett**, das *kursiv mit **beidem***, ein [Link](https://example.org), intern [Mathe](/wissen/mathe), die Formel $x / r$ und kaputt $x / $` → zwei fett, ein kursiv, Link außen mit neuem Fenster, Link innen, ein Bruch im Satz, der kaputte Teil als Text mit Hinweis; Leiste „fett“ um eine Markierung; Liste mit zwei Punkten, nummeriert; `cos φ - 1 = -x / r` zeigt zwei Minuszeichen; Skizze: acht Elemente als Zeilen mit 37 Zahlenfeldern, Punkt P verschoben, Punkt angehängt (Vorschau folgt).
