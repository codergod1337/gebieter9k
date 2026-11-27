# Inhalte aus Elementen (`blockcontent`)

> Von Hand geschrieben am 2026-11-27, zusammen mit dem Code. Fassung 2 des Formats (am selben Tag hat sie Fassung 1 abgelöst).

Das allgemeine Format der Plattform für Inhalte, die mehr sind als Text: ContentBoxen, Abschnitte dazwischen, Absätze, Listen, Hinweise, nummerierte Gleichungen, Aufklapper, Skizzen, dazu Animationen zwischen den Gleichungen. Mit Leser, Anzeige und Editor. Entstanden für die Wissensdatenbank, aber bewusst unabhängig von ihr.

- **Paket:** [`code/frontend/src/blockcontent/`](../code/frontend/src/blockcontent/) (global)
- **Gespeichert** wird ein Inhalt als EIN JSON-Text. Das Backend prüft nur, dass er ein JSON-Objekt ist; gelesen und gezeichnet wird er im Frontend.
- **Genutzt von:** den Seiten der Wissensdatenbank (Feld `content` im Kern [`KNOWLEDGE`](solr-cores/KNOWLEDGE.md), `contentFormatVersion` 2), Editor im Wissensmanager.
- **Formeln** setzt und bearbeitet die Bibliothek [MathLive](https://mathlive.io) (`mathlive` 0.111.4, MIT, exakt gepinnt in `package.json`). Sie steckt nur im Ordner `formula/`.

## Vorgaben des Nutzers (2026-11-27, wörtlich)

| Vorgabe | Was daraus folgt |
|---|---|
| „ich würde das gerne als allgemeinen richtext editor nutzen wollen, wenn wir uns schon die mühe machen so ein ding anzulegen dann gleich richtig“ | Paket global, nichts darin kennt die Wissensdatenbank. |
| „du sollst nicht ein modell anhand des inhalts entwerfen“, „wir wollen da später formaln und herleitungen aus der elektrodynamik und quantenmechanik abbilden“ | Kein eigenes Formel-Modell: Eine Formel ist LaTeX. Fassung 1 (Term-Baum, eigene Tipp-Schreibweise, „Größen“, Baustein „Rechnung“) ist gelöscht. |
| „normales latex hilf uns nichts, denn wir sollten jedem element eine id mitgeben KÖNNEN, genau dann wenn es in eine animation muss“, „ich will das rad auch nciht neu erfinden müssen“, „einen formeleditor innerhalb vom richtexteditor“ | MathLive als Formelfeld; ein Teil bekommt seine id über den Befehl `\htmlData{id=…}{…}`, den MathLive mitbringt. |
| „eine übersicht wie viele gleichungen wir auf einer seite haben, latex style“ | Jede Gleichung hat ihre laufende Nummer (1), (2), …; der Editor zeigt die Zahl, das Popup „Animationen“ die Liste. |
| „wir definieren immer die ganze seite in einem solr wissens dokument! sprich contentboxen und zwischen abschnitte oder sonstiges muss auch im richtext abbildbar sein“ | Die ContentBox ist ein Element; was auf oberster Ebene nicht in einer ContentBox steht, ist ein Abschnitt dazwischen. Elemente UND Animationen stehen im selben JSON. |
| „wir haben formeln und eine hand voll html elemente die animationen benötigen wir ja in einem separaten modul. sprich wir müssen ja nur die gleichungsnummer angeben und dann welches element mit welcher id sich wie in der nächsten gleichungsnummer verhält, das hat aber nichts im editor zu suchen, dort definiere ich nur die ids der elemente und animationen stelle ich mir in einem popup vor“ | Ordner `animation/` für sich; die Elemente und ihr Editor wissen nichts von Animationen; festgelegt wird im Popup „Animationen“. |
| „darstellung viel besser ich will aber im editor kein inbox gescrolle! wir zeigen beim bearbeiten immer contenbox NENNE DEN […] KASTEN AUCH CONTENTBOX!!! und eine kontentbox rechts hat links davon den code/ bzw den inhalt der sie definiert. wir machen nur einen scrollbalken auf der hauptansicht. den editor will ich selbst nicht in einer contenbox angezeigt haben, denn da wollen wir den maximalen platz“ | Das Element heißt überall ContentBox (im Format `CONTENT_BOX`). Der Editor ist eine Folge von Zeilen (links Definition, rechts das Element), ohne eigene Scrollbereiche, nicht in einer ContentBox, über die ganze Breite. |
| „alles was mit animation zu tun hat bitte in eine eigene animation.css, das will ich weder in base noch in default css haben“ | [`src/styles/animation.css`](../code/frontend/src/styles/animation.css): Maße UND Farben des Animations-Moduls. |

## Aufbau des Pakets

Jeder Ordner hat eine Aufgabe; die Pfeile zeigen, wer wen kennt.

| Ordner | Aufgabe | kennt |
|---|---|---|
| `formula/` | Formel setzen (`FormulaView`), Formel tippen und einem Teil eine id geben (`FormulaField`, `FormulaPopup`), ids im LaTeX lesen und entfernen (`formulaIds.ts`), eine Gleichung an ihrem Relationszeichen teilen (`splitLatexAtRelation.ts`). MathLive steckt hinter `FormulaRenderer` (`MathLiveFormulaRenderer.ts`) und `MathLiveFormulaFieldModule.ts`; beides wird erst geladen, wenn die erste Formel bzw. das erste Formelfeld erscheint. | nichts aus dem Paket |
| `inline/` | Text mit Auszeichnung lesen (`InlineMarkupParser`) und zeichnen (`InlineTextView`). | `formula/` |
| `sketch/` | Skizze: JSON (`SketchJson.ts`), Leser (`SketchReader.ts`), Modell, Anzeige (`SketchContentView.tsx`) und ihre Bausteine. | `elements/jsonValues.ts` |
| `elements/` | Die Elemente: JSON (`ElementJson.ts`), Modell (`ContentElement.ts`), Leser (`ElementReader.ts`), je Element genau eine Anzeige (`…ElementView.tsx`), die Liste der Anzeigen (`elementViews.ts`), die Liste zeichnen (`ElementListView.tsx`), Zustand der Aufklapper (`collapsibleState.ts`), Anhängepunkt an der Gleichung (`EquationAddition.ts`). | `formula/`, `inline/`, `sketch/` |
| `animation/` | Animationen: JSON und Modell (`EquationAnimationJson.ts`, `EquationAnimation.ts`), Leser (`EquationAnimationReader.ts`), Abspieler (`useEquationAnimationPlayer.ts`, `FlightAnimator.ts`), Notiz mit Abspiel-Knopf (`EquationAnimationNote.tsx`), Anhängen an die Gleichungen (`EquationAnimationProvider.tsx`), Popup zum Festlegen (`EquationAnimationPopup.tsx`, `EquationAnimationEditor.tsx`, `equationAnimationChanges.ts`). | `elements/` (nur Gleichung und Anhängepunkt), `formula/` |
| `editor/` | Je Element genau ein Bearbeiten-Teil (`…ElementEditor.tsx`), die Liste der Arten (`elementKinds.ts`), die Karte eines Elements (`ElementCardEditor.tsx`), die Elemente in einem Element (`ElementListEditor.tsx`), „+ Element“ (`AddElementDropdown.tsx`), der Code eines Elements (`JsonValueEditor.tsx`), Kennungen und Nummern für alle (`ElementEditorScope.tsx`), der Editor selbst mit Leiste und Zeilen (`BlockContentEditor.tsx`). Nur er kennt das Popup der Animationen. | `elements/`, `formula/`, `sketch/` |
| Wurzel | Setzt zusammen: `BlockContentJson.ts`, `BlockContent.ts`, `BlockContentReader.ts`, `BlockContentFrame.tsx` (wartet auf den Setzer der Formeln, hängt die Animationen an), `BlockContentView.tsx`, `BlockContentError.ts`, `blockContentFormat.ts` (`BLOCK_CONTENT_FORMAT_VERSION = 2`). | alle |

**Ein neues Element** (z. B. Tabelle, Bild) heißt: ein Fall in `ElementJson.ts` und `ContentElement.ts`, ein Fall im `ElementReader`, eine Anzeige mit ihrer Zeile in `elementViews.ts`, ein Bearbeiten-Teil mit seinem Eintrag in `editor/elementKinds.ts`. An den vorhandenen Anzeigen und Bearbeiten-Teilen ändert sich nichts.

**Die Bibliothek tauschen** heißt: `formula/MathLiveFormulaRenderer.ts`, `MathLiveFormulaFieldModule.ts` und `FormulaField.tsx` neu; der Rest kennt nur `FormulaView`, `FormulaField` und `\htmlData{id=…}{…}` im gespeicherten LaTeX.

## Format (Fassung 2)

```json
{
  "elements": [
    { "type": "CONTENT_BOX", "title": "x aus r und φ", "elements": [
      { "type": "PARAGRAPH", "text": "Die Ankathete von $\\varphi$ ist $x$, die Hypotenuse ist $r$." },
      { "type": "EQUATION", "id": "x1", "latex": "\\cos\\varphi = \\htmlData{id=bruch}{\\frac{x}{r}}" },
      { "type": "COLLAPSIBLE", "id": "c1", "title": "Rechenweg", "elements": [
        { "type": "EQUATION", "id": "x2", "latex": "\\htmlData{id=rLinks}{r}\\,\\cos\\varphi = \\htmlData{id=rRechts}{r}\\cdot\\htmlData{id=bruch}{\\frac{x}{\\htmlData{id=rNenner}{r}}}" }
      ] }
    ] },
    { "type": "HEADING", "text": "Von kartesisch nach polar" }
  ],
  "animations": [
    { "from": "x1", "note": "\\cdot \\htmlData{id=r}{r}",
      "actions": [ { "id": "rLinks", "does": "APPEARS" }, { "id": "rRechts", "does": "APPEARS" }, { "id": "bruch", "does": "MOVES_TO", "target": "bruch" } ] }
  ]
}
```

### `elements`

| `type` | Felder | Bedeutung |
|---|---|---|
| `CONTENT_BOX` | `title`, `elements` | Eine ContentBox (die der Plattform) mit Titel. Nur auf oberster Ebene. Alles, was dort nicht in einer ContentBox steht, ist ein Abschnitt zwischen den ContentBoxen. |
| `COLLAPSIBLE` | `id`, `title`, `elements` | Ein Aufklapper: sein Titel als Knopf, sein Inhalt erst nach einem Klick. Offene Aufklapper stehen in der Adresse (`?open=c1,c3`, REPLACE). |
| `HEADING` | `text` | Zwischenüberschrift. |
| `PARAGRAPH`, `HINT` | `text` | Text mit Auszeichnung (unten); der Hinweis ist hervorgehoben. |
| `LIST` | `ordered` (freiwillig), `items` | Punkte untereinander, jeder ein Text mit Auszeichnung. |
| `EQUATION` | `id`, `latex` | Eine Gleichung in ihrer eigenen Zeile. Ihre Nummer ergibt sich aus der Reihenfolge im Inhalt (auch in ContentBoxen und Aufklappern); `id` ist ihre feste Kennung, die bleibt, wenn sich die Nummer verschiebt. Hat sie auf oberster Ebene ein Relationszeichen (`=`, `<`, `\approx`, `\Rightarrow` …), steht es in der Mitte der Zeile, also in allen Zeilen untereinander. |
| `SKETCH` | `sketch` | Eine Skizze: Feld, Achsenkreuz, Elemente `POINT`, `SEGMENT`, `ANGLE`, `RIGHT_ANGLE`; `highlight` ist ein Platz der Palette (`FIRST` … `FIFTH`). |

Die Kennungen (`id`) von Gleichungen und Aufklappern sind im Inhalt eindeutig; der Editor vergibt sie (`e1`, `e2`, … bzw. `c1`, …). Ein leerer Titel oder Text ist erlaubt (im Editor entsteht das Element, bevor man es füllt) und wird nicht gezeichnet.

### Formeln und ids

Eine Formel ist LaTeX, so wie MathLive es versteht. Ein Teil bekommt seine id als Hülle `\htmlData{id=r1}{…}`; im gesetzten Bild trägt sein Element dann `data-id="r1"`. Eine id gilt innerhalb EINER Formel und besteht aus Buchstaben und Ziffern (vorn ein Buchstabe). Vergeben wird sie nur, wo eine Animation den Teil braucht. Zu wissen: Eine Hülle ist für LaTeX eine Gruppe, der Abstand um sie kann sich ändern (`r\htmlData{…}{\cos\varphi}` steht enger als `r\cos\varphi`; dann `\,` davorsetzen).

### Text mit Auszeichnung

`**fett**`, `*kursiv*` (auch ineinander), `[Text](Adresse)` (nur `https://`, `http://`, `mailto:` und Adressen der App, die mit `/` beginnen), `$LaTeX$` für eine Formel im Satz, `\` vor einem dieser Zeichen nimmt ihm die Bedeutung. Was nicht geschlossen ist, bleibt Text. Ein Satzzeichen direkt hinter einer Formel bleibt an ihr hängen.

### `animations`

Eine Animation gehört zum Übergang von der Gleichung `from` (ihre feste Kennung) zur NÄCHSTEN Gleichung im Inhalt.

| Feld | Bedeutung |
|---|---|
| `from` | Die Kennung der Gleichung, von der der Übergang ausgeht. |
| `note` | Freiwillig: die Notiz der Umformung als LaTeX, wie man sie hinter den Strich am Zeilenende schreibt (`\cdot r`, `\arctan`). Worte nur für schwierige Schritte, nie für Kleinkram wie Kürzen. |
| `actions` | Je Teil, was geschieht: `{"id", "does": "MOVES_TO", "target"}` wandert an die Stelle des Teils `target` der nächsten Gleichung (wechselt er die Seite der Gleichung, auf einem Bogen); `{"id", "does": "CANCELLED"}` wird durchgestrichen, bevor die nächste Gleichung erscheint; `{"id", "does": "APPEARS"}` meint einen Teil der NÄCHSTEN Gleichung, der aus der Notiz kommt (aus ihrem ersten Teil mit id, sonst aus der ganzen Notiz). |

Angezeigt wird eine Animation am Ende der Zeile ihrer Gleichung: die Notiz hinter einem Strich und der Abspiel-Knopf, nur wenn die Gleichung und die nächste zu sehen sind (also nicht, solange die nächste in einem geschlossenen Aufklapper steckt). Jeder Übergang ist ein eigener Schritt: Durchgestrichen wird erst beim Abspielen, der Strich bleibt danach stehen. Der Leser prüft die Form, nicht, ob es Gleichung und ids noch gibt: Was fehlt, wird beim Abspielen übersprungen. Wer im System weniger Bewegung wünscht, bekommt kein Wandern.

## Editor

[`BlockContentEditor`](../code/frontend/src/blockcontent/editor/BlockContentEditor.tsx) bekommt den JSON-Text (`contentText`) und meldet jede Änderung (`onContentTextChange`); er speichert nichts selbst. Was der Aufrufer dazutut (Stand, „Speichern“), steht rechts in seiner Leiste (`actions`).

- **Zeilen:** je Element der obersten Ebene eine Zeile: links seine Definition, rechts das Element selbst, gezeichnet vom selben Leser wie die fertige Seite (eine ContentBox also als ContentBox). Auf schmalen Schirmen steht die Definition über dem Element.
- **Ein Scrollbalken:** Nichts im Editor rollt für sich, nur die Seite. Die Leiste bleibt dabei oben stehen; ist die Definition länger als ihr Element, bleibt auch das Element rechts im Blick.
- **Keine ContentBox um den Editor, volle Breite:** Der Aufrufer setzt ihn direkt auf die Seite; die Klasse `main-wide` irgendwo im Inhalt sagt der Seite, dass sie ihren breiten Rand hergibt (`.main-content:has(.main-wide)` in `base.css`).
- **Leiste:** „Elemente | JSON“ (was die linke Seite zeigt, in der Adresse als `?editorView=json`, REPLACE), die Zahl der Gleichungen, „Animationen (n von m)“, rechts die Knöpfe des Aufrufers.
- **Links, Ansicht „Elemente“:** die Karte des Elements mit seiner Art, Verschieben, Entfernen und seinem Bearbeiten-Teil; ContentBox und Aufklapper enthalten wieder Karten und ein „+ Element“. Eine Gleichung zeigt ihre Nummer. Unter den Zeilen hängt „+ Element“ ein neues Element der obersten Ebene an.
- **Links, Ansicht „JSON“:** der Code des Elements in einem Textfeld, das so hoch ist wie sein Text. Solange das Getippte kein gültiges JSON ist, steht „Noch kein gültiges JSON.“ darunter und der Inhalt bleibt, wie er war; sobald es passt, folgt das Element rechts. Macht der Code den Inhalt unlesbar (z. B. eine unbekannte Art), steht die Stelle über den Zeilen und Speichern ist gesperrt. Unter den Elementen stehen die Animationen als Code.
- **Formelfeld:** tippen und dabei gesetzt sehen; Teil markieren, „id vergeben“, id eintippen; darunter die ids der Formel, jede zum Entfernen; Schalter „LaTeX“ zeigt den Text. Im Absatz öffnet der Knopf mit dem x² das Formelfeld als Popup und setzt `$…$` ein.
- **Popup „Animationen“:** links alle Gleichungen mit Nummer (die mit Animation sind markiert), rechts der Übergang der gewählten zur nächsten: beide gesetzt, die Notiz als Formelfeld, je id der Gleichung „bleibt stehen / wird gestrichen / wandert zu …“, je id der nächsten „steht einfach da / kommt aus der Notiz“. Jede Änderung gilt sofort; gespeichert wird mit dem Inhalt. Entfernt man im Editor eine Gleichung, verschwindet die Animation, die von ihr ausging.

## CSS

- `src/styles/base.css`: Formel (`.formula…`), Formelfeld (`.formula-field…`), Elemente (`.blockcontent-…`), Editor (`.blockcontent-editor…`), Skizze (`.sketch…`).
- `public/themes/default.css`: ihre Farben.
- `src/styles/animation.css`: ALLES zur Animation, Maße und Farben (`.equation-animation…`, `.animation-flight-…`, der Strich `[data-cancelled]`, die Variablen `--animation-…`). Eingebunden von `EquationAnimationProvider.tsx` und `EquationAnimationPopup.tsx`.
- Das CSS und die Schriften von MathLive kommen aus dem Paket (`mathlive/static.css`, `mathlive/fonts.css`), geladen mit dem Setzer.

## Offen (noch nicht gebaut)

1. Farbe in Formeln: Fassung 1 färbte „Größen“ (x, y, r, φ) überall gleich; das ist mit den Größen entfallen. In LaTeX ginge `\textcolor{…}{…}` (auch über das Menü des Formelfelds), eine Lösung über das Theme gibt es nicht.
2. Elemente nebeneinander (Text neben Skizze, zwei Spalten Gleichungen): in Fassung 1 fest eingebaut, jetzt steht alles untereinander.
3. Ein Element an einer bestimmten Stelle einfügen oder in eine andere ContentBox ziehen: heute anhängen und mit den Pfeilen verschieben.
4. Verweis im Text auf eine Gleichung („siehe (3)“), der mitwandert, wenn sich die Nummer verschiebt.
5. Die Skizze ist noch die aus Fassung 1 (fünf feste Elementarten aus der einen Zeichnung); sie braucht dieselbe Frage wie die Formeln: allgemein statt aus dem Inhalt.
6. Bilder, Tabellen.
7. Den vorhandenen HTML-Editor (`components/RichTextEditor`, z. B. Profiltext) ablösen: eigener Schritt, dort sind Texte gespeichert.
8. Bevor normale User Inhalte schreiben dürfen: eine Prüfung im Backend und je Einsatzort die erlaubten Elemente. MathLive schreibt Text und Attribute sicher ins HTML und weist `javascript:`-Adressen ab (2026-11-27 an fünf Schadeingaben geprüft); eine eigene Prüfung ersetzt das nicht.

## Getestet

2026-11-27, MathLive in einer Wegwerf-Kopie (Node und Firefox ohne Fenster): `\htmlData{id=r1}{r}` wird `data-id="r1"`; im Eingabefeld bleibt die id beim Laden und beim Weitertippen erhalten; eine Auswahl bekommt per `insert('\htmlData{id=…}{#@}')` ihre id; ohne Fehler gesetzt: `\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}`, ein Ringintegral mit Grenzen, Schrödinger mit `\ket`, `\braket`, eine Pauli-Matrix, Indizes oben und unten, `\cancel`; ein unbekannter Befehl wird als Fehler gesetzt; `\href{javascript:…}` wirft (wird als „ließ sich nicht setzen“ gezeigt), HTML in `\text`, `\htmlData`, `\class`, `\cssId` wird maskiert.

2026-11-27, 15:00, Fassung 2 (Typprüfung und Bau ohne Fehler; Firefox ohne Fenster gegen ein nachgestelltes Backend; Seite „Koordinatentransformation“ mit 6 ContentBoxen, 2 Zwischenüberschriften, 18 Gleichungen, 4 Aufklappern, 10 Animationen):

- Seite: 6 ContentBoxen, Nummern (1) … (18) (bei geschlossenen Aufklappern sichtbar (1), (4), (5), (8) …), 56 gesetzte Formeln ohne Fehler, Relationszeichen untereinander, auch über einen offenen Aufklapper hinweg; Aufklapper öffnen → `?open=c1`, zwei Gleichungen und drei Abspiel-Knöpfe mehr, Notiz „| · r“.
- Abspielen: „mal r“ (zwei `r` kommen aus der Notiz, `cos φ` und der Bruch wandern), „kürzen“ (zwei `r` durchgestrichen, bleibt stehen), „Seiten tauschen“ (beide Seiten auf einem Bogen); der wandernde Bruch bleibt ein Bruch.
- Editor: 42 Karten, 18 Formelfelder, „18 Gleichungen“, „Animationen (10 von 17)“; in `x = r\cos\varphi` das `x` markiert, id `links` vergeben → `\htmlData{id=links}{x}=r\cos\varphi`, Marke unter dem Feld, Element in der Vorschau; „+ Element“ → Gleichung (19), mit echten Tasten `E=mc^2` getippt → Vorschau folgt.
- Popup „Animationen“: 19 Gleichungen, 10 markiert; Übergang (1) → (2) zeigt Notiz und je id das Verhalten; bei (15) „links: wird gestrichen“ gewählt und die Notiz `-x` mit echten Tasten getippt → Animation 11, in der Vorschau ein Abspiel-Knopf mehr.
- JSON-Ansicht 14 811 Zeichen mit `elements` und `animations`; Speichern schickt den Inhalt (PUT), danach „Gespeichert“. Keine Fehler in der Konsole.

2026-11-27, 15:15, auf dem Pi (Stand `04098bd`, Seite um 15:09 in Fassung 2 geschrieben), Firefox ohne Fenster von außen: ohne Anmeldung 6 ContentBoxen, Nummern (1) … (18), 56 Formeln ohne Fehler, Aufklapper geöffnet, „mal r“ und „kürzen“ abgespielt; angemeldet unter dem Konto des Nutzers, nur angesehen: Editor mit 42 Karten und 18 Formelfeldern (MathLive geladen), „Animationen (10 von 17)“, Popup mit 18 Gleichungen. Ändern und Speichern im Browser auf dem Pi nicht ausprobiert.

2026-11-27, 15:29, Editor in Zeilen (Firefox ohne Fenster, nachgestelltes Backend, Fenster 1700 breit): Der Editor steht in keiner ContentBox und ist 1640 Pixel breit; kein Element darin rollt für sich, die Seite rollt; Leiste „Elemente | JSON“, „18 Gleichungen“, „Animationen (10 von 17)“, „Änderungen verwerfen“, „Inhalt speichern“ und bleibt beim Rollen oben; 8 Zeilen, links ContentBox / Überschrift / ContentBox …, rechts jeweils dieselbe ContentBox bzw. Überschrift; id vergeben und neue ContentBox mit Gleichung (getippt `E=mc^2`, rechts (19)) wie zuvor. Ansicht „JSON“: 10 Code-Felder ohne eigenen Scrollbalken, das erste beginnt mit `"type": "CONTENT_BOX"`, das letzte sind die Animationen; halb getippter Code → „Noch kein gültiges JSON.“, rechts bleibt der alte Stand; gültiger Code → rechts folgt; unbekannte Art → Stelle über den Zeilen, Speichern gesperrt, das Feld behält den getippten Text. Speichern schickt den Inhalt (PUT). Keine Fehler in der Konsole.

NICHT geprüft: die Bildschirmtastatur und das Menü des Formelfelds mit der Maus (auch im Popup), ein Handy, Chrome.
