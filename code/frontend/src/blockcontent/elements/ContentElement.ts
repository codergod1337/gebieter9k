import type { InlineNode } from '../inline/InlineNode.ts'
import type { SketchContent } from '../sketch/SketchContent.ts'

/** Eine ContentBox mit Titel: ihre Elemente untereinander. */
export type ContentBoxElement = {
  type: 'CONTENT_BOX'
  title: string
  elements: ContentElement[]
}

/** Ein Aufklapper: sein Titel als Knopf, sein Inhalt erst nach einem Klick. */
export type CollapsibleElement = {
  type: 'COLLAPSIBLE'
  /** Die feste Kennung: Unter ihr steht in der Adresse, ob er offen ist. */
  id: string
  title: string
  elements: ContentElement[]
}

/** Eine Zwischenüberschrift. */
export type HeadingElement = {
  type: 'HEADING'
  text: string
}

/** Ein Absatz Text mit Auszeichnung (fett, kursiv, Links, Formeln mitten im Satz). */
export type ParagraphElement = {
  type: 'PARAGRAPH'
  /** Der Text, wie er getippt ist. */
  text: string
  /** Derselbe Text, gelesen: seine Stücke zum Zeichnen. */
  inlines: InlineNode[]
}

/** Ein hervorgehobener Hinweis, z. B. „Vorsicht beim Winkel“. */
export type HintElement = {
  type: 'HINT'
  text: string
  inlines: InlineNode[]
}

/** Eine Liste: Punkte untereinander, mit Punkt davor oder nummeriert; jeder Punkt ein Text mit Auszeichnung. */
export type ListElement = {
  type: 'LIST'
  ordered: boolean
  items: InlineNode[][]
}

/** Eine Gleichung in ihrer eigenen Zeile. */
export type EquationElement = {
  type: 'EQUATION'
  /** Die feste Kennung; sie bleibt, auch wenn sich die Nummer verschiebt. */
  id: string
  /** Die laufende Nummer im Inhalt, ab 1. */
  number: number
  latex: string
}

/** Eine Skizze. */
export type SketchContentElement = {
  type: 'SKETCH'
  sketch: SketchContent
}

/** Ein Element eines Inhalts, fertig zum Zeichnen. Es entsteht aus seinem JSON ({@link ElementReader}). */
export type ContentElement =
  | ContentBoxElement
  | CollapsibleElement
  | HeadingElement
  | ParagraphElement
  | HintElement
  | ListElement
  | EquationElement
  | SketchContentElement

/** Ein Element dieser Art, z. B. `ContentElementOfType<'EQUATION'>`. */
export type ContentElementOfType<Type extends ContentElement['type']> = Extract<ContentElement, { type: Type }>
