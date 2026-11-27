# Inhalte aus Elementen (`blockcontent`)

> Von Hand geschrieben am 2026-11-27, zusammen mit dem Code. Fassung 2 des Formats (am selben Tag hat sie Fassung 1 abgelöst).

Das allgemeine Format der Plattform für Inhalte, die mehr sind als Text: ContentBoxen, Abschnitte dazwischen, Absätze, Listen, Hinweise, nummerierte Gleichungen, Aufklapper, Figuren (Skizzen und Plots), dazu Animationen zwischen den Gleichungen. Mit Leser, Anzeige und Editor. Entstanden für die Wissensdatenbank, aber bewusst unabhängig von ihr.

- **Paket:** [`code/frontend/src/blockcontent/`](../code/frontend/src/blockcontent/) (global)
- **Gespeichert** wird ein Inhalt als EIN JSON-Text. Das Backend prüft nur, dass er ein JSON-Objekt ist; gelesen und gezeichnet wird er im Frontend.
- **Genutzt von:** den Seiten der Wissensdatenbank (Feld `content` im Kern [`KNOWLEDGE`](solr-cores/KNOWLEDGE.md), `contentFormatVersion` 2), Editor im Wissensmanager.
- **Formeln** setzt und bearbeitet die Bibliothek [MathLive](https://mathlive.io) (`mathlive` 0.111.4, MIT, exakt gepinnt in `package.json`). Sie steckt nur im Ordner `formula/`.
- **Figuren** zeichnet die Bibliothek [JSXGraph](https://jsxgraph.org) (`jsxgraph` 1.14.3, MIT oder LGPL, exakt gepinnt). Sie steckt nur im Ordner `figure/`.

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
| „wie wir komplexere skizzen anlegen. vielleicht benötigen wir da auch noch die einere oder andere biliothek. zum beispiel spektrallinien einzeichnen können oder die bolzmannverteilung plotten oder der efeld in einem leiter oder die ortskurve eines pendels plotten […] oder doppelspaltexperiment“, auf den Vorschlag JSXGraph: „ja bau das mal ein“ | Element `FIGURE`: eine Figur ist ein Text in der Sprache von JSXGraph. Die Skizze aus Fassung 1 (fünf feste Elementarten) ist dafür gelöscht. |
| „gleichungen referenzieren BENÖTIGEN WIR! ich möchte die auch verlinken. sprich eine gleichung bewkommt eine guid intern und im frontened zählen wir einfach laufend je seite durch“; „stelle dann auch sicher dass eine seite also das solr doc ein eigenes multivalued feld hat mit den gleichungs-guids dann können wir eine gleichung serverweit referenzieren […] das bietet sich dann auch für code snippet sehr gut an“ | Gleichung und Aufklapper tragen `guid` (UUID) statt `id`; Verweis im Text, Anker, Sprung über die GUID; Feld `equationGuids` im Solr-Dokument. |
| „alles was mit animation zu tun hat bitte in eine eigene animation.css, das will ich weder in base noch in default css haben“ | [`src/styles/animation.css`](../code/frontend/src/styles/animation.css): Maße UND Farben des Animations-Moduls. |

## Aufbau des Pakets

Jeder Ordner hat eine Aufgabe; die Pfeile zeigen, wer wen kennt.

| Ordner | Aufgabe | kennt |
|---|---|---|
| `formula/` | Formel setzen (`FormulaView`), Formel tippen und einem Teil eine id geben (`FormulaField`, `FormulaPopup`), ids im LaTeX lesen und entfernen (`formulaIds.ts`), eine Gleichung an ihrem Relationszeichen teilen (`splitLatexAtRelation.ts`). MathLive steckt hinter `FormulaRenderer` (`MathLiveFormulaRenderer.ts`) und `MathLiveFormulaFieldModule.ts`; beides wird erst geladen, wenn die erste Formel bzw. das erste Formelfeld erscheint. | nichts aus dem Paket |
| `inline/` | Text mit Auszeichnung lesen (`InlineMarkupParser`) und zeichnen (`InlineTextView`), Verweis auf eine Gleichung (`EquationReferenceLink.tsx`; woher er Nummer und Sprung kennt: `InlineReferenceContext.ts`). | `formula/`, `equationAnchor.ts` |
| `figure/` | Figur zeichnen (`FigureView.tsx`: DIE Anzeige jeder Skizze und jedes Plots), ihr Ausschnitt (`FigureBoundingBox.ts`). JSXGraph steckt hinter `JsxGraphFigureModule.ts` und wird erst geladen, wenn die erste Figur erscheint (259 kB gepackt). | nichts aus dem Paket |
| `elements/` | Die Elemente: JSON (`ElementJson.ts`), Modell (`ContentElement.ts`), Leser (`ElementReader.ts`), je Element genau eine Anzeige (`…ElementView.tsx`), die Liste der Anzeigen (`elementViews.ts`), die Liste zeichnen (`ElementListView.tsx`), Zustand der Aufklapper (`collapsibleState.ts`), Anhängepunkt an der Gleichung (`EquationAddition.ts`), Ziel der Adresse (`useEquationTarget.ts`, `EquationTargetContext.ts`), die Gleichungen zur Wahl (`EquationChoiceList.tsx`). | `formula/`, `inline/`, `figure/` |
| `animation/` | Animationen: JSON und Modell (`EquationAnimationJson.ts`, `EquationAnimation.ts`), Leser (`EquationAnimationReader.ts`), Abspieler (`useEquationAnimationPlayer.ts`, `FlightAnimator.ts`), Notiz mit Abspiel-Knopf (`EquationAnimationNote.tsx`), Anhängen an die Gleichungen (`EquationAnimationProvider.tsx`), Popup zum Festlegen (`EquationAnimationPopup.tsx`, `EquationAnimationEditor.tsx`, `equationAnimationChanges.ts`). | `elements/` (nur Gleichung und Anhängepunkt), `formula/` |
| `editor/` | Je Element genau ein Bearbeiten-Teil (`…ElementEditor.tsx`), die Liste der Arten (`elementKinds.ts`), die Karte eines Elements (`ElementCardEditor.tsx`), die Elemente in einem Element (`ElementListEditor.tsx`), „+ Element“ (`AddElementDropdown.tsx`), der Code eines Elements (`JsonValueEditor.tsx`), Zahlenfeld (`NumberField.tsx`), Gleichungen und Nummern für alle (`ElementEditorScope.tsx`), Verweis auf eine Gleichung wählen (`EquationReferencePopup.tsx`), der Editor selbst mit Leiste und Zeilen (`BlockContentEditor.tsx`). Nur er kennt das Popup der Animationen. | `elements/`, `formula/`, `components/AutoSizeTextArea` (global: Textfeld, so hoch wie sein Text) |
| Wurzel | `equationAnchor.ts` (der Anker `#eq-<guid>`). Setzt zusammen: `BlockContentJson.ts`, `BlockContent.ts`, `BlockContentReader.ts`, `BlockContentFrame.tsx` (wartet auf den Setzer der Formeln, hängt die Animationen an), `BlockContentView.tsx`, `BlockContentError.ts`, `blockContentFormat.ts` (`BLOCK_CONTENT_FORMAT_VERSION = 2`). | alle |

**Ein neues Element** (z. B. Tabelle, Bild) heißt: ein Fall in `ElementJson.ts` und `ContentElement.ts`, ein Fall im `ElementReader`, eine Anzeige mit ihrer Zeile in `elementViews.ts`, ein Bearbeiten-Teil mit seinem Eintrag in `editor/elementKinds.ts`. An den vorhandenen Anzeigen und Bearbeiten-Teilen ändert sich nichts.

**Die Bibliothek tauschen** heißt: `formula/MathLiveFormulaRenderer.ts`, `MathLiveFormulaFieldModule.ts` und `FormulaField.tsx` neu; der Rest kennt nur `FormulaView`, `FormulaField` und `\htmlData{id=…}{…}` im gespeicherten LaTeX.

## Format (Fassung 2)

```json
{
  "elements": [
    { "type": "CONTENT_BOX", "title": "x aus r und φ", "elements": [
      { "type": "PARAGRAPH", "text": "Die Ankathete von $\\varphi$ ist $x$, die Hypotenuse ist $r$." },
      { "type": "EQUATION", "guid": "3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b", "latex": "\\cos\\varphi = \\htmlData{id=bruch}{\\frac{x}{r}}" },
      { "type": "COLLAPSIBLE", "guid": "9c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f", "title": "Rechenweg", "elements": [
        { "type": "EQUATION", "guid": "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d", "latex": "\\htmlData{id=rLinks}{r}\\,\\cos\\varphi = \\htmlData{id=rRechts}{r}\\cdot\\htmlData{id=bruch}{\\frac{x}{\\htmlData{id=rNenner}{r}}}" }
      ] }
    ] },
    { "type": "HEADING", "text": "Von kartesisch nach polar" }
  ],
  "animations": [
    { "from": "3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b", "note": "\\cdot \\htmlData{id=r}{r}",
      "actions": [ { "id": "rLinks", "does": "APPEARS" }, { "id": "rRechts", "does": "APPEARS" }, { "id": "bruch", "does": "MOVES_TO", "target": "bruch" } ] }
  ]
}
```

### `elements`

| `type` | Felder | Bedeutung |
|---|---|---|
| `CONTENT_BOX` | `title`, `elements` | Eine ContentBox (die der Plattform) mit Titel. Nur auf oberster Ebene. Alles, was dort nicht in einer ContentBox steht, ist ein Abschnitt zwischen den ContentBoxen. |
| `COLLAPSIBLE` | `guid`, `title`, `elements` | Ein Aufklapper: sein Titel als Knopf, sein Inhalt erst nach einem Klick. Offene Aufklapper stehen in der Adresse (`?open=<guid>,<guid>`, REPLACE). |
| `HEADING` | `text` | Zwischenüberschrift. |
| `PARAGRAPH`, `HINT` | `text` | Text mit Auszeichnung (unten); der Hinweis ist hervorgehoben. |
| `LIST` | `ordered` (freiwillig), `items` | Punkte untereinander, jeder ein Text mit Auszeichnung. |
| `EQUATION` | `guid`, `latex` | Eine Gleichung in ihrer eigenen Zeile. Ihre Nummer zählt das Frontend je Inhalt durch (auch in ContentBoxen und Aufklappern); `guid` ist ihre feste Kennung, die bleibt, wenn sich die Nummer verschiebt: An ihr hängen Verweise, ihr Anker in der Adresse und ihre Animation. Hat sie auf oberster Ebene ein Relationszeichen (`=`, `<`, `\approx`, `\Rightarrow` …), steht es in der Mitte der Zeile, also in allen Zeilen untereinander. |
| `FIGURE` | `code`, `boundingBox`, `aspectRatio` | Eine Figur (Skizze oder Plot): `code` ist ihr Text in der Sprache von JSXGraph (unten), `boundingBox` ihr Ausschnitt `[left, top, right, bottom]` in ihren eigenen Koordinaten, `aspectRatio` Breite durch Höhe des Felds. |

Die Kennungen (`guid`) von Gleichungen und Aufklappern sind UUIDs; der Editor vergibt sie (`crypto.randomUUID()`), der Leser lehnt Doppelte und alles ab, was keine UUID ist. Ein leerer Titel oder Text ist erlaubt (im Editor entsteht das Element, bevor man es füllt) und wird nicht gezeichnet.

### Formeln und ids

Eine Formel ist LaTeX, so wie MathLive es versteht. Ein Teil bekommt seine id als Hülle `\htmlData{id=r1}{…}`; im gesetzten Bild trägt sein Element dann `data-id="r1"`. Eine id gilt innerhalb EINER Formel und besteht aus Buchstaben und Ziffern (vorn ein Buchstabe). Vergeben wird sie nur, wo eine Animation den Teil braucht. Zu wissen: Eine Hülle ist für LaTeX eine Gruppe, der Abstand um sie kann sich ändern (`r\htmlData{…}{\cos\varphi}` steht enger als `r\cos\varphi`; dann `\,` davorsetzen).

### Gleichungen verweisen und verlinken

- **Verweis im Text:** `[[equation:<guid>]]` in einem Absatz, Hinweis oder Listenpunkt. Gezeigt wird die Nummer der Gleichung, so wie sie gerade ist, als Link: „(3)“. Steht die Gleichung nicht in diesem Inhalt, wird daraus „(↗)“ mit einem Sprung über ihre GUID (unten), sofern der Ort des Inhalts so einen Sprung kennt (`getForeignEquationPath` an `BlockContentView` / `BlockContentEditor`); sonst „(?)“.
- **Anker:** Jede Gleichung ist ein Ziel in der Adresse, `#eq-<guid>`. Ihre Nummer am rechten Rand ist der Link dorthin: Ein Klick setzt den Anker in die Adresse (REPLACE), die sich dann weitergeben lässt.
- **Ankommen:** Meint die Adresse eine Gleichung des Inhalts, werden die Aufklapper um sie geöffnet (die Adresse behält ihren Anker), die Seite rollt zu ihr, und die Zeile hebt sich hervor (`elements/useEquationTarget.ts`). Ein Klick auf einen Verweis ist ein eigener Eintrag im Verlauf: „Zurück“ bringt einen an die Stelle, an der man gelesen hat.
- **Serverweit über die GUID** (Wissensdatenbank): Das Solr-Dokument der Seite trägt die GUIDs ihrer Gleichungen im Feld `equationGuids` ([`KNOWLEDGE.md`](solr-cores/KNOWLEDGE.md)); `/wissen/gleichung/<guid>` löst darüber die Seite auf und springt zur Gleichung.

### Text mit Auszeichnung

`**fett**`, `*kursiv*` (auch ineinander), `[Text](Adresse)` (nur `https://`, `http://`, `mailto:` und Adressen der App, die mit `/` beginnen), `$LaTeX$` für eine Formel im Satz, `[[equation:<guid>]]` für einen Verweis auf eine Gleichung, `\` vor einem dieser Zeichen nimmt ihm die Bedeutung. Was nicht geschlossen ist, bleibt Text. Ein Satzzeichen direkt hinter einer Formel bleibt an ihr hängen.

### Figuren

Eine Figur ist ein Text in JessieCode, der Sprache von JSXGraph zum Beschreiben von Zeichnungen. Jede Zeile legt etwas an; Eigenschaften stehen in `<< … >>`:

```
axis([0, 0], [1, 0]) << name: 'v', withLabel: true, ticks: << drawZero: true >> >>;
T = slider([4.2, 0.62], [7.2, 0.62], [0.5, 1, 4]) << name: 'T' >>;
f = function (v) { return sqrt(2 / PI) * v^2 / T.Value()^1.5 * exp(-v^2 / (2 * T.Value())); };
functiongraph(f, 0, 8) << strokeColor: '#8c1b3d', strokeWidth: 3 >>;
```

- **Was sie kann** (2026-11-27 ausprobiert): Punkte (fest, ziehbar oder berechnet: `point(function () { return P.X(); }, 0)`), Strecken, Geraden, Pfeile, Vielecke, Winkel, Kurven (`curve(fx, fy, a, b)`), Funktionsgraphen, Vektorfelder (`vectorfield([fx, fy], [xmin, n, xmax], [ymin, n, ymax])`), Regler (auch von selbst laufend: `t.startAnimation(1, 120, 40)`), Text mit berechnetem Inhalt, Flächen unter Kurven (`integral`), Zahlenwerte von Integralen (`NIntegral`), Schleifen und Bedingungen. Der Ausschnitt lässt sich auch im Text setzen (`$board.setView([left, top, right, bottom])`).
- **Vorgaben des Nutzers für Skizzen** (2026-11-27, damals zur alten Skizze): „jede skizze hat einen nullpunkt und eine 1 reinskaliert“ → Achsen mit `ticks: << drawZero: true >>` anlegen; „jeder punkt soll als hoverlay mindestens seine koordinaten angezeigt haben“ → das tut die Bibliothek von selbst (ihre eigene Anzeige, im Theme wie das Hoverlay gestaltet, nicht die Komponente `Hoverlay`); „für einen winkel […] die beiden achsen des winkels […] highlighten“ → das kann die Figur NICHT (sie hebt beim Zeigen nur den Winkel selbst hervor).
- **Sicherheit:** In der Sprache gibt es weder `document` noch `window` (beides ausprobiert: Fehler statt Zugriff). Trotzdem gilt Punkt 8 unter „Offen“, bevor normale User Figuren schreiben.
- **Bedienung:** Mausrad und Ziehen verschieben den Ausschnitt nicht, über einer Figur rollt die Seite. Lässt sich der Text nicht lesen, steht unter dem Feld die Meldung der Bibliothek mit Zeile.

### `animations`

Eine Animation gehört zum Übergang von der Gleichung `from` (ihre `guid`) zur NÄCHSTEN Gleichung im Inhalt.

| Feld | Bedeutung |
|---|---|
| `from` | Die `guid` der Gleichung, von der der Übergang ausgeht. |
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
- **Formelfeld:** tippen und dabei gesetzt sehen; Teil markieren, „id vergeben“, id eintippen; darunter die ids der Formel, jede zum Entfernen; Schalter „LaTeX“ zeigt den Text. Im Absatz öffnet der Knopf mit dem x² das Formelfeld als Popup und setzt `$…$` ein; der Knopf mit dem # stellt die Gleichungen des Inhalts zur Wahl (Nummer und Formel) und setzt einen Verweis auf die gewählte ein.
- **Popup „Animationen“:** links alle Gleichungen mit Nummer (die mit Animation sind markiert), rechts der Übergang der gewählten zur nächsten: beide gesetzt, die Notiz als Formelfeld, je id der Gleichung „bleibt stehen / wird gestrichen / wandert zu …“, je id der nächsten „steht einfach da / kommt aus der Notiz“. Jede Änderung gilt sofort; gespeichert wird mit dem Inhalt. Entfernt man im Editor eine Gleichung, verschwindet die Animation, die von ihr ausging.

## CSS

- `src/styles/base.css`: Formel (`.formula…`), Formelfeld (`.formula-field…`), Elemente (`.blockcontent-…`), Editor (`.blockcontent-editor…`), Figur (`.figure…`), `AutoSizeTextArea` (`.auto-size-textarea`).
- `public/themes/default.css`: ihre Farben.
- `src/styles/animation.css`: ALLES zur Animation, Maße und Farben (`.equation-animation…`, `.animation-flight-…`, der Strich `[data-cancelled]`, die Variablen `--animation-…`). Eingebunden von `EquationAnimationProvider.tsx` und `EquationAnimationPopup.tsx`.
- Das CSS und die Schriften von MathLive kommen aus dem Paket (`mathlive/static.css`, `mathlive/fonts.css`), geladen mit dem Setzer.

## Offen (noch nicht gebaut)

1. Farbe in Formeln: Fassung 1 färbte „Größen“ (x, y, r, φ) überall gleich; das ist mit den Größen entfallen. In LaTeX ginge `\textcolor{…}{…}` (auch über das Menü des Formelfelds), eine Lösung über das Theme gibt es nicht.
2. Elemente nebeneinander (Text neben Figur, zwei Spalten Gleichungen): in Fassung 1 fest eingebaut, jetzt steht alles untereinander.
3. Ein Element an einer bestimmten Stelle einfügen oder in eine andere ContentBox ziehen: heute anhängen und mit den Pfeilen verschieben.
4. Einen Verweis auf eine Gleichung einer ANDEREN Seite kann man noch nicht auswählen, nur tippen (`[[equation:<guid>]]`, die GUID steht im Anker der Gleichung); gezeigt wird dann „(↗)“ statt einer Nummer.
5. Figuren: kein Zeichnen mit der Maus (man tippt den Text); Beschriftungen in Figuren sind einfacher Text, kein gesetztes LaTeX; die Schenkel eines Winkels beim Zeigen hervorheben geht nicht; 3D, Differentialgleichungen (ein Löser ist eingebaut) und bewegte Wellenbilder sind nicht ausprobiert.
6. Bilder, Tabellen.
7. Den vorhandenen HTML-Editor (`components/RichTextEditor`, z. B. Profiltext) ablösen: eigener Schritt, dort sind Texte gespeichert.
8. Bevor normale User Inhalte schreiben dürfen: eine Prüfung im Backend und je Einsatzort die erlaubten Elemente. MathLive schreibt Text und Attribute sicher ins HTML und weist `javascript:`-Adressen ab (2026-11-27 an fünf Schadeingaben geprüft); eine eigene Prüfung ersetzt das nicht.

## Was an der ersten schwierigen Seite gefehlt hat (Vierervektoren, 2026-11-27)

Der Nutzer befürchtet, dass das Modell für schwierige Herleitungen nicht reicht („da müssen wir ja noch integrieren und substituieren und was weiss ich noch nicht alles“). Die Seite „Vierervektoren“ (27 Gleichungen: Indizes oben und unten, Matrix, Integrale mit Grenzen, partielle Integration, Substitution) ließ sich vollständig schreiben und im Editor ändern. Dabei hat gefehlt:

1. **Verweis auf eine Gleichung im Text** („(23) in (21) einsetzen“): fehlte am Nachmittag, ist seit dem 2026-11-27 gebaut (Nutzer: „gleichungen referenzieren BENÖTIGEN WIR! ich möchte die auch verlinken“), siehe „Gleichungen verweisen und verlinken“.
2. **Nebenrechnung:** Eine Animation führt immer zur NÄCHSTEN Gleichung. Die Substitution ist aber eine Rechnung neben der Hauptrechnung; von (21) nach (22) gibt es deshalb keine Animation, nur Text.
3. **Gleichung ohne Nummer** und **mehrzeilige Gleichung** (eine Kette über mehrere Zeilen unter einer Nummer): gibt es nicht; jede Zeile ist eine eigene nummerierte Gleichung, eine Kette `a = b = c` steht in einer Zeile und wird am ersten `=` ausgerichtet.
4. **Verbindung von Formel und Figur** (ein Index in der Formel hebt den passenden Teil der Figur hervor): gibt es nicht.
5. Kleinigkeit: MathLive kennt `\dots` nicht (`\ldots` geht); unbekannte Befehle stehen rot in der Formel.

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

2026-11-27, 15:35, auf dem Pi (Stand `cd569a8`, Seite um 15:33 mit `CONTENT_BOX` neu geschrieben), Firefox ohne Fenster von außen: Seite ohne Anmeldung wie zuvor (6 ContentBoxen, Abspielen); angemeldet unter dem Konto des Nutzers, nur angesehen: Editor nicht in einer ContentBox, 1640 von 1700 Pixeln breit, kein eigener Scrollbereich, 8 Zeilen (links Karte, rechts ContentBox), 18 Formelfelder, Ansicht „JSON“ mit 9 Code-Feldern, Popup mit 18 Gleichungen. Ändern und Speichern im Browser auf dem Pi nicht ausprobiert.

2026-11-27, 16:02, Figuren und drei Seiten (Typprüfung und Bau ohne Fehler; Firefox ohne Fenster, nachgestelltes Backend): „Koordinatentransformation“ (Figur statt Skizze, P ziehbar, r und φ als Text), „Figuren (Testseite)“ (Spektrallinien, Maxwell-Boltzmann mit Regler, E-Feld als Vektorfeld, Pendel mit laufendem Zeit-Regler, Doppelspalt mit zwei Reglern), „Vierervektoren“ (5 ContentBoxen, 27 Gleichungen, 2 Figuren, 7 Animationen): alle 8 Figuren gezeichnet, kein Formelfehler, keine Fehler in der Konsole; Animation „die beiden mc²/γ streichen“ abgespielt. Im Editor der Seite „Vierervektoren“: 27 Formelfelder, 2 Karten „Figur“ mit Text links und Figur rechts, kein eigener Scrollbereich; im Text der Figur einen Punkt verschoben → Figur und ihre Zahlen folgen; kaputter Text → Meldung mit Zeile unter der Figur; Ausschnitt per Zahlenfeld geändert; in der Formel mit dem Integral getippt; gespeichert (PUT).

2026-11-27, 16:17, Verweise und Anker (Typprüfung und Bau ohne Fehler; Firefox ohne Fenster, nachgestelltes Backend, das auch über `equationGuid` auflöst): Seite „Vierervektoren“: Verweise im Text als „(7)“, „(15)“ und „(↗)“; Klick auf „(15)“ → Anker in der Adresse, Zeile hervorgehoben und im Bild; Adresse mit Anker auf (23) bei geschlossenem Aufklapper → `?open=<guid>` kommt dazu, 23 statt 18 Gleichungen sichtbar, (23) im Bild; darin Klick auf „(21)“, „Zurück“ im Browser → wieder (23); Klick auf die Nummer (3) → Anker; Klick auf „(↗)“ → Seite „Koordinatentransformation“, Gleichung (9) hervorgehoben; `/wissen/gleichung/<guid>` einer Gleichung im geschlossenen Aufklapper → Seite, Aufklapper offen, (2) hervorgehoben; unbekannte GUID → „Zu dieser Gleichung gibt es keine veröffentlichte Seite.“; Animation an (25) weiter in Ordnung. Editor: Knopf „Verweis auf eine Gleichung“ an 21 Textfeldern, Popup mit 27 Gleichungen, Wahl setzt `[[equation:<guid>]]` ein, rechts steht „(3)“; Popup „Animationen“ mit derselben Liste (27, davon 7 markiert). Backend: kompiliert; das Füllen von `equationGuids` und das Auflösen im echten Solr sind erst auf dem Pi geprüft (siehe `KNOWLEDGE.md`).

NICHT geprüft: Figuren mit der Maus bedienen (Punkt ziehen, Regler schieben), die Bildschirmtastatur und das Menü des Formelfelds mit der Maus (auch im Popup), ein Handy, Chrome.
