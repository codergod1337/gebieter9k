import { Hoverlay } from '../../components/Hoverlay.tsx'
import type { SketchCoordinateSystem } from './SketchCoordinateSystem.ts'
import type { SketchPosition } from './SketchPosition.ts'

type SketchAngleProps = {
  coordinateSystem: SketchCoordinateSystem
  /** Der Scheitel des Winkels. */
  vertexPosition: SketchPosition
  /** Bis wohin der erste und der zweite Schenkel reichen; gezählt wird vom ersten zum zweiten gegen den Uhrzeigersinn. */
  firstLegEndPosition: SketchPosition
  secondLegEndPosition: SketchPosition
  /** Das Formelzeichen des Winkels, z. B. „φ“. */
  label: string
  /** Was im Hoverlay steht: welcher Winkel das ist, z. B. „Winkel φ zwischen der x-Achse und der Strecke r“. */
  hintText: string
  /** Die CSS-Klasse der Farbe, in der die Größe überall steht (`getMathHighlightClassName`). */
  highlightClassName: string
}

/** Der Radius des Bogens und wie weit das Formelzeichen vom Scheitel steht, in Einheiten des gezeichneten Systems. */
const ARC_RADIUS_UNITS = 1.05
const LABEL_RADIUS_UNITS = 0.66

/**
 * Ein Winkel in einer Skizze: der Bogen um den Scheitel und sein Formelzeichen. Zeigt man darauf (oder kommt mit der
 * Tastatur hin), leuchten seine beiden Schenkel auf und alles andere tritt zurück (Nutzer 2026-11-27: „so dass ich weiss
 * was das überhaupt für ein winkel ist“); dazu sagt das Hoverlay, welcher Winkel es ist. Das Aufleuchten macht allein
 * das CSS (`.sketch-angle:hover`, `:focus-within`), die Schenkel liegen dafür schon unsichtbar im Winkel.
 */
export function SketchAngle({
  coordinateSystem,
  vertexPosition,
  firstLegEndPosition,
  secondLegEndPosition,
  label,
  hintText,
  highlightClassName,
}: SketchAngleProps) {
  const vertexSketchX = coordinateSystem.toSketchX(vertexPosition.x)
  const vertexSketchY = coordinateSystem.toSketchY(vertexPosition.y)
  const firstLegRadians = coordinateSystem.getDirectionRadians(vertexPosition, firstLegEndPosition)
  const secondLegRadians = coordinateSystem.getDirectionRadians(vertexPosition, secondLegEndPosition)

  // der Bogen vom ersten zum zweiten Schenkel (im SVG zeigt y nach unten, deshalb läuft er dort „rückwärts“)
  const arcRadius = ARC_RADIUS_UNITS * coordinateSystem.unitLength
  const arcStartX = vertexSketchX + arcRadius * Math.cos(firstLegRadians)
  const arcStartY = vertexSketchY - arcRadius * Math.sin(firstLegRadians)
  const arcEndX = vertexSketchX + arcRadius * Math.cos(secondLegRadians)
  const arcEndY = vertexSketchY - arcRadius * Math.sin(secondLegRadians)
  const arcPath = 'M ' + arcStartX + ' ' + arcStartY + ' A ' + arcRadius + ' ' + arcRadius + ' 0 0 0 ' + arcEndX + ' ' + arcEndY

  // das Formelzeichen im halben Winkel, zwischen Scheitel und Bogen
  const middleRadians = (firstLegRadians + secondLegRadians) / 2
  const labelRadius = LABEL_RADIUS_UNITS * coordinateSystem.unitLength
  const labelSketchX = vertexSketchX + labelRadius * Math.cos(middleRadians)
  const labelSketchY = vertexSketchY - labelRadius * Math.sin(middleRadians)

  // die Fläche zum Zeigen: der ganze Sektor zwischen den Schenkeln bis zum Bogen
  const sectorPath = 'M ' + vertexSketchX + ' ' + vertexSketchY + ' L ' + arcStartX + ' ' + arcStartY + ' A ' + arcRadius + ' ' + arcRadius + ' 0 0 0 ' + arcEndX + ' ' + arcEndY + ' Z'

  const firstLegEndX = coordinateSystem.toSketchX(firstLegEndPosition.x)
  const firstLegEndY = coordinateSystem.toSketchY(firstLegEndPosition.y)
  const secondLegEndX = coordinateSystem.toSketchX(secondLegEndPosition.x)
  const secondLegEndY = coordinateSystem.toSketchY(secondLegEndPosition.y)

  // Die Schenkel liegen im Winkel, aber außerhalb der Fläche zum Zeigen: So setzt das Hoverlay am kleinen Sektor an,
  // nicht an den langen Schenkeln
  const groupClassName = 'sketch-angle ' + highlightClassName
  return (
    <g className={groupClassName}>
      <line className="sketch-angle-leg" x1={vertexSketchX} y1={vertexSketchY} x2={firstLegEndX} y2={firstLegEndY} />
      <line className="sketch-angle-leg" x1={vertexSketchX} y1={vertexSketchY} x2={secondLegEndX} y2={secondLegEndY} />
      <Hoverlay text={hintText}>
        <g className="sketch-angle-sector" tabIndex={0} role="img" aria-label={hintText}>
          <path className="sketch-hit-area" d={sectorPath} />
          <path className="sketch-quantity-arc" d={arcPath} />
          <text className="sketch-quantity-label" x={labelSketchX} y={labelSketchY} dominantBaseline="central">
            {label}
          </text>
        </g>
      </Hoverlay>
    </g>
  )
}
