import { Hoverlay } from '../../components/Hoverlay.tsx'
import { formatSketchNumber } from './formatSketchNumber.ts'
import type { SketchCoordinateSystem } from './SketchCoordinateSystem.ts'
import type { SketchPosition } from './SketchPosition.ts'

type SketchPointProps = {
  coordinateSystem: SketchCoordinateSystem
  position: SketchPosition
  /** Der Name des Punkts in der Skizze, z. B. „P“; `null`: Der Punkt steht ohne Namen da. */
  label: string | null
  /** Wie der Punkt im Hoverlay heißt, z. B. „P“ oder „Ursprung“; `null`: Dort stehen nur die Koordinaten. */
  hintName: string | null
  /** Optional eine zweite Zeile im Hoverlay, z. B. derselbe Ort in Polarkoordinaten. */
  hintDetail?: string
}

/** Der Radius des Punkts und der unsichtbaren Fläche, auf die man zeigt, in Einheiten der Skizze. */
const POINT_RADIUS = 4.5
const POINT_HIT_RADIUS = 13

/**
 * Ein Punkt in einer Skizze. Jeder Punkt zeigt beim Zeigen (oder mit der Tastatur) mindestens seine Koordinaten im
 * Hoverlay (Nutzer 2026-11-27), z. B. „P (4 | 3)“. Um den kleinen Punkt liegt eine größere unsichtbare Fläche, damit
 * man ihn leicht trifft.
 */
export function SketchPoint({ coordinateSystem, position, label, hintName, hintDetail }: SketchPointProps) {
  const sketchX = coordinateSystem.toSketchX(position.x)
  const sketchY = coordinateSystem.toSketchY(position.y)
  const coordinatesText = '(' + formatSketchNumber(position.x) + ' | ' + formatSketchNumber(position.y) + ')'
  let hintTitle = coordinatesText
  if (hintName !== null) {
    hintTitle = hintName + ' ' + coordinatesText
  }
  const hint = (
    <span className="sketch-hint">
      <span>{hintTitle}</span>
      {hintDetail !== undefined && <span className="small">{hintDetail}</span>}
    </span>
  )
  return (
    <Hoverlay text={hint}>
      <g className="sketch-point" tabIndex={0} role="img" aria-label={hintTitle}>
        <circle className="sketch-hit-area" cx={sketchX} cy={sketchY} r={POINT_HIT_RADIUS} />
        <circle className="sketch-point-dot" cx={sketchX} cy={sketchY} r={POINT_RADIUS} />
        {label !== null && (
          <text className="sketch-point-label" x={sketchX + 10} y={sketchY - 9}>
            {label}
          </text>
        )}
      </g>
    </Hoverlay>
  )
}
