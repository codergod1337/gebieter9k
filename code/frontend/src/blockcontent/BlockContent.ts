import type { Derivation } from './derivation/Derivation.ts'
import type { InlineNode } from './inline/InlineNode.ts'
import type { Equation } from './math/Equation.ts'
import type { SketchContent } from './SketchContent.ts'

/** Ein Absatz Text mit Auszeichnung (fett, kursiv, Links, Formeln mitten im Satz). */
export type ParagraphPart = {
  type: 'PARAGRAPH'
  /** Der Text, wie er getippt ist. */
  text: string
  /** Derselbe Text, gelesen: seine Stücke zum Zeichnen. */
  inlines: InlineNode[]
}

/** Eine Liste: Punkte untereinander, mit Punkt davor oder nummeriert; jeder Punkt ein Text mit Auszeichnung. */
export type ListPart = {
  type: 'LIST'
  ordered: boolean
  items: InlineNode[][]
}

/** Gleichungen untereinander, auf Wunsch mit einer Überschrift, z. B. die Ergebnisse in einer Zusammenfassung. */
export type EquationsPart = {
  type: 'EQUATIONS'
  heading: string | null
  equations: Equation[]
}

/** Ein hervorgehobener Hinweis, z. B. „Vorsicht beim Winkel“. */
export type HintPart = {
  type: 'HINT'
  text: string
  inlines: InlineNode[]
}

export type BoxPart = ParagraphPart | ListPart | EquationsPart | HintPart

/** Ein Kasten mit Titel: seine Teile untereinander, daneben auf Wunsch eine Skizze. */
export type BoxBlock = {
  type: 'BOX'
  title: string
  parts: BoxPart[]
  sketch: SketchContent | null
}

/** Eine Rechnung in ihrem eigenen Kasten: Ausgang und Ergebnis, der Rechenweg zum Einblenden. */
export type DerivationBlock = {
  type: 'DERIVATION'
  title: string
  derivation: Derivation
}

export type ContentBlock = BoxBlock | DerivationBlock

/**
 * Ein Inhalt aus Bausteinen, fertig zum Zeichnen: seine Bausteine von oben nach unten. Allgemein, nicht nur für die
 * Wissensdatenbank (dort ist er der Inhalt einer Seite). Er entsteht aus dem JSON-Text
 * im Feld `content` des Solr-Dokuments ({@link BlockContentReader}).
 */
export type BlockContent = {
  blocks: ContentBlock[]
}
