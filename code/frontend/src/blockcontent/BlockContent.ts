import type { EquationAnimation } from './animation/EquationAnimation.ts'
import type { ContentElement, EquationElement } from './elements/ContentElement.ts'

/**
 * Ein Inhalt aus Elementen, fertig zum Zeichnen. Allgemein, nicht nur für die Wissensdatenbank (dort ist er der Inhalt
 * einer Seite, das Feld `content` ihres Solr-Dokuments). Er entsteht aus dem JSON-Text ({@link BlockContentReader}).
 */
export type BlockContent = {
  /** Die Elemente von oben nach unten. */
  elements: ContentElement[]
  /** Alle Gleichungen in der Reihenfolge des Inhalts, auch die in ContentBoxen und Aufklappern. */
  equations: EquationElement[]
  /** Die Animationen der Übergänge zwischen den Gleichungen. */
  animations: EquationAnimation[]
}
