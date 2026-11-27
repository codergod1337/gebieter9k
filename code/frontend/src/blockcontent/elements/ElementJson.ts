import type { SketchJson } from '../sketch/SketchJson.ts'

/**
 * Ein Element eines Inhalts, so wie es gespeichert wird und wie der Editor es bearbeitet (Fassung 2). Es ist eine
 * Handvoll (Nutzer 2026-11-27: „wir haben formeln und eine hand voll html elemente“):
 *
 * - `BOX`: ein Kasten mit Titel, der wieder Elemente enthält. Nur auf oberster Ebene. Alles, was dort NICHT in einem
 *   Kasten steht, ist ein Abschnitt zwischen den Kästen.
 * - `COLLAPSIBLE`: ein Aufklapper mit Titel (z. B. „Rechenweg“): Sein Inhalt ist erst nach einem Klick zu sehen.
 * - `HEADING`: eine Zwischenüberschrift.
 * - `PARAGRAPH`, `HINT`: Text mit Auszeichnung (`**fett**`, `*kursiv*`, `[Text](Adresse)`, `$LaTeX$`).
 * - `LIST`: Punkte untereinander, mit Punkt davor oder nummeriert.
 * - `EQUATION`: eine Gleichung als LaTeX in ihrer eigenen Zeile. Ihre Nummer (1), (2), … ergibt sich aus der
 *   Reihenfolge im Inhalt; ihre `id` ist die feste Kennung, an der z. B. eine Animation hängt.
 * - `SKETCH`: eine Skizze.
 *
 * Ein neues Element heißt: hier ein Fall, im {@link ElementReader} ein Fall, eine Anzeige (`elementViews.ts`) und ein
 * Bearbeiten-Teil (`editor/elementKinds.ts`).
 */
export type ElementJson =
  | { type: 'BOX'; title: string; elements: ElementJson[] }
  | { type: 'COLLAPSIBLE'; id: string; title: string; elements: ElementJson[] }
  | { type: 'HEADING'; text: string }
  | { type: 'PARAGRAPH'; text: string }
  | { type: 'HINT'; text: string }
  | { type: 'LIST'; ordered?: boolean; items: string[] }
  | { type: 'EQUATION'; id: string; latex: string }
  | { type: 'SKETCH'; sketch: SketchJson }

/** Die Art eines Elements, z. B. `EQUATION`. */
export type ElementType = ElementJson['type']

/** Das JSON eines Elements dieser Art. */
export type ElementJsonOfType<Type extends ElementType> = Extract<ElementJson, { type: Type }>

/** Eine Gleichung, so wie sie gespeichert wird. */
export type EquationJson = ElementJsonOfType<'EQUATION'>

/** Die Gleichungen einer Liste von Elementen in der Reihenfolge des Inhalts, auch die in Kästen und Aufklappern. */
export function collectEquationJsons(elements: ElementJson[]): EquationJson[] {
  const equations: EquationJson[] = []
  for (const element of elements) {
    if (element.type === 'EQUATION') {
      equations.push(element)
    } else if (element.type === 'BOX' || element.type === 'COLLAPSIBLE') {
      const nestedEquations = collectEquationJsons(element.elements)
      equations.push(...nestedEquations)
    }
  }
  return equations
}

/** Alle festen Kennungen (`id`) einer Liste von Elementen, auch die in Kästen und Aufklappern. */
export function collectElementIds(elements: ElementJson[]): string[] {
  const elementIds: string[] = []
  for (const element of elements) {
    if (element.type === 'EQUATION' || element.type === 'COLLAPSIBLE') {
      elementIds.push(element.id)
    }
    if (element.type === 'BOX' || element.type === 'COLLAPSIBLE') {
      const nestedElementIds = collectElementIds(element.elements)
      elementIds.push(...nestedElementIds)
    }
  }
  return elementIds
}
