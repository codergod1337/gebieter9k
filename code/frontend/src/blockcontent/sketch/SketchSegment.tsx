import type { SketchCoordinateSystem } from './SketchCoordinateSystem.ts'
import type { SketchPosition } from './SketchPosition.ts'

type SketchSegmentProps = {
  coordinateSystem: SketchCoordinateSystem
  fromPosition: SketchPosition
  toPosition: SketchPosition
  /** Das Formelzeichen der Strecke, z. B. „r“. */
  label: string
  /**
   * Auf welcher Seite der Strecke das Formelzeichen steht, von `fromPosition` nach `toPosition` gesehen: `LEFT` oder
   * `RIGHT`.
   */
  labelSide: 'LEFT' | 'RIGHT'
  /** Die CSS-Klasse der Farbe des Elements (`getSketchHighlightClassName`); leer ohne Farbe. */
  highlightClassName: string
}

/** So weit steht das Formelzeichen neben der Mitte der Strecke, in Einheiten der Skizze. */
const LABEL_DISTANCE = 17

/**
 * Eine Strecke in einer Skizze mit ihrem Formelzeichen neben der Mitte, in der Farbe ihrer Größe: dieselbe Farbe wie in
 * den Formeln der Seite.
 */
export function SketchSegment({ coordinateSystem, fromPosition, toPosition, label, labelSide, highlightClassName }: SketchSegmentProps) {
  const fromSketchX = coordinateSystem.toSketchX(fromPosition.x)
  const fromSketchY = coordinateSystem.toSketchY(fromPosition.y)
  const toSketchX = coordinateSystem.toSketchX(toPosition.x)
  const toSketchY = coordinateSystem.toSketchY(toPosition.y)

  // das Formelzeichen: von der Mitte der Strecke senkrecht zur Seite gerückt (im SVG zeigt y nach unten)
  const directionRadians = coordinateSystem.getDirectionRadians(fromPosition, toPosition)
  let sideSign = 1
  if (labelSide === 'RIGHT') {
    sideSign = -1
  }
  const middleSketchX = (fromSketchX + toSketchX) / 2
  const middleSketchY = (fromSketchY + toSketchY) / 2
  const labelSketchX = middleSketchX - sideSign * LABEL_DISTANCE * Math.sin(directionRadians)
  const labelSketchY = middleSketchY - sideSign * LABEL_DISTANCE * Math.cos(directionRadians)

  const groupClassName = 'sketch-quantity ' + highlightClassName
  return (
    <g className={groupClassName}>
      <line className="sketch-quantity-line" x1={fromSketchX} y1={fromSketchY} x2={toSketchX} y2={toSketchY} />
      <text className="sketch-quantity-label" x={labelSketchX} y={labelSketchY} dominantBaseline="central">
        {label}
      </text>
    </g>
  )
}
