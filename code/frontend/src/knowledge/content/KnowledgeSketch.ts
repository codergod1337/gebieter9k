import type { MathHighlightKey } from '../math/MathHighlightKey.ts'
import type { SketchCoordinateSystem } from '../sketch/SketchCoordinateSystem.ts'
import type { SketchPosition } from '../sketch/SketchPosition.ts'

/** Ein Punkt einer Skizze: Beim Zeigen nennt er seinen Namen und seine Koordinaten, auf Wunsch eine Zeile mehr. */
export type KnowledgeSketchPoint = {
  type: 'POINT'
  position: SketchPosition
  /** Der Buchstabe am Punkt, z. B. „P“; `null` ohne. */
  label: string | null
  hintName: string | null
  hintDetail: string | null
}

/** Eine Strecke mit ihrem Formelzeichen in der Farbe ihrer Größe. */
export type KnowledgeSketchSegment = {
  type: 'SEGMENT'
  fromPosition: SketchPosition
  toPosition: SketchPosition
  label: string
  labelSide: 'LEFT' | 'RIGHT'
  highlightKey: MathHighlightKey | null
}

/** Ein Winkel am Scheitel zwischen zwei Schenkeln; beim Zeigen hebt er seine Schenkel hervor. */
export type KnowledgeSketchAngle = {
  type: 'ANGLE'
  vertexPosition: SketchPosition
  firstLegEndPosition: SketchPosition
  secondLegEndPosition: SketchPosition
  label: string
  hintText: string
  highlightKey: MathHighlightKey | null
}

/** Das Zeichen für einen rechten Winkel am Scheitel zwischen zwei Schenkeln. */
export type KnowledgeSketchRightAngle = {
  type: 'RIGHT_ANGLE'
  vertexPosition: SketchPosition
  firstLegEndPosition: SketchPosition
  secondLegEndPosition: SketchPosition
}

export type KnowledgeSketchElement =
  | KnowledgeSketchPoint
  | KnowledgeSketchSegment
  | KnowledgeSketchAngle
  | KnowledgeSketchRightAngle

/**
 * Eine Skizze, wie sie im Inhalt einer Seite steht: das Feld, das Achsenkreuz (wo der Nullpunkt liegt, wie lang die
 * Strecke von 0 bis 1 ist, wie weit die Achsen reichen) und ihre Elemente in der Reihenfolge, in der sie gezeichnet
 * werden (Späteres liegt über Früherem).
 */
export type KnowledgeSketch = {
  width: number
  height: number
  coordinateSystem: SketchCoordinateSystem
  axisMaxX: number
  axisMaxY: number
  /** Für Screenreader: was die Skizze zeigt. */
  description: string
  elements: KnowledgeSketchElement[]
}
