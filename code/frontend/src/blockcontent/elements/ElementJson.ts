/**
 * Ein Element eines Inhalts, so wie es gespeichert wird und wie der Editor es bearbeitet (Fassung 2). Es ist eine
 * Handvoll (Nutzer 2026-11-27: „wir haben formeln und eine hand voll html elemente“):
 *
 * - `CONTENT_BOX`: eine ContentBox mit Titel, die wieder Elemente enthält. Nur auf oberster Ebene. Alles, was dort
 *   NICHT in einer ContentBox steht, ist ein Abschnitt zwischen den ContentBoxen.
 * - `COLLAPSIBLE`: ein Aufklapper mit Titel (z. B. „Rechenweg“): Sein Inhalt ist erst nach einem Klick zu sehen. Auch
 *   er trägt eine `guid`: Unter ihr steht in der Adresse, ob er offen ist.
 * - `HEADING`: eine Zwischenüberschrift.
 * - `PARAGRAPH`, `HINT`: Text mit Auszeichnung (`**fett**`, `*kursiv*`, `[Text](Adresse)`, `$LaTeX$`).
 * - `LIST`: Punkte untereinander, mit Punkt davor oder nummeriert.
 * - `EQUATION`: eine Gleichung als LaTeX in ihrer eigenen Zeile. Ihre Nummer (1), (2), … zählt das Frontend je Inhalt
 *   durch; ihre `guid` (eine UUID, vom Editor vergeben) ist die feste Kennung: An ihr hängen Verweise im Text, ihr Anker
 *   in der Adresse und ihre Animation (Nutzer 2026-11-27: „eine gleichung bekommt eine guid intern und im frontend
 *   zählen wir einfach laufend je seite durch“).
 * - `FIGURE`: eine Figur (Skizze oder Plot): ihr Text in der Sprache der Zeichenbibliothek JSXGraph (`code`), ihr
 *   Ausschnitt `[left, top, right, bottom]` in ihren eigenen Koordinaten und ihr Seitenverhältnis (Breite durch Höhe).
 *
 * Ein neues Element heißt: hier ein Fall, im {@link ElementReader} ein Fall, eine Anzeige (`elementViews.ts`) und ein
 * Bearbeiten-Teil (`editor/elementKinds.ts`).
 */
export type ElementJson =
  | { type: 'CONTENT_BOX'; title: string; elements: ElementJson[] }
  | { type: 'COLLAPSIBLE'; guid: string; title: string; elements: ElementJson[] }
  | { type: 'HEADING'; text: string }
  | { type: 'PARAGRAPH'; text: string }
  | { type: 'HINT'; text: string }
  | { type: 'LIST'; ordered?: boolean; items: string[] }
  | { type: 'EQUATION'; guid: string; latex: string }
  | { type: 'FIGURE'; code: string; boundingBox: [number, number, number, number]; aspectRatio: number }

/** Die Art eines Elements, z. B. `EQUATION`. */
export type ElementType = ElementJson['type']

/** Das JSON eines Elements dieser Art. */
export type ElementJsonOfType<Type extends ElementType> = Extract<ElementJson, { type: Type }>

/** Eine Gleichung, so wie sie gespeichert wird. */
export type EquationJson = ElementJsonOfType<'EQUATION'>

/** Die Gleichungen einer Liste von Elementen in der Reihenfolge des Inhalts, auch die in ContentBoxen und Aufklappern. */
export function collectEquationJsons(elements: ElementJson[]): EquationJson[] {
  const equations: EquationJson[] = []
  for (const element of elements) {
    if (element.type === 'EQUATION') {
      equations.push(element)
    } else if (element.type === 'CONTENT_BOX' || element.type === 'COLLAPSIBLE') {
      const nestedEquations = collectEquationJsons(element.elements)
      equations.push(...nestedEquations)
    }
  }
  return equations
}
