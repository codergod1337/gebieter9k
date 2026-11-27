import type { Derivation } from '../derivation/Derivation.ts'
import type { Equation } from '../math/Equation.ts'
import type { KnowledgeSketch } from './KnowledgeSketch.ts'

/** Ein Absatz Text. */
export type KnowledgeParagraphPart = {
  type: 'PARAGRAPH'
  text: string
}

/** Gleichungen untereinander, auf Wunsch mit einer Überschrift, z. B. die Ergebnisse in einer Zusammenfassung. */
export type KnowledgeEquationsPart = {
  type: 'EQUATIONS'
  heading: string | null
  equations: Equation[]
}

/** Ein hervorgehobener Hinweis, z. B. „Vorsicht beim Winkel“. */
export type KnowledgeHintPart = {
  type: 'HINT'
  text: string
}

export type KnowledgeBoxPart = KnowledgeParagraphPart | KnowledgeEquationsPart | KnowledgeHintPart

/** Ein Kasten mit Titel: seine Teile untereinander, daneben auf Wunsch eine Skizze. */
export type KnowledgeBoxBlock = {
  type: 'BOX'
  title: string
  parts: KnowledgeBoxPart[]
  sketch: KnowledgeSketch | null
}

/** Eine Rechnung in ihrem eigenen Kasten: Ausgang und Ergebnis, der Rechenweg zum Einblenden. */
export type KnowledgeDerivationBlock = {
  type: 'DERIVATION'
  title: string
  derivation: Derivation
}

export type KnowledgeContentBlock = KnowledgeBoxBlock | KnowledgeDerivationBlock

/**
 * Der Inhalt einer Wissensseite, fertig zum Zeichnen: ihre Bausteine von oben nach unten. Er entsteht aus dem JSON-Text
 * im Feld `content` des Solr-Dokuments ({@link KnowledgeContentReader}).
 */
export type KnowledgeContent = {
  blocks: KnowledgeContentBlock[]
}
