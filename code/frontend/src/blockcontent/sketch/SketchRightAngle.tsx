import type { SketchCoordinateSystem } from './SketchCoordinateSystem.ts'
import type { SketchPosition } from './SketchPosition.ts'

type SketchRightAngleProps = {
  coordinateSystem: SketchCoordinateSystem
  /** Der Scheitel des rechten Winkels. */
  vertexPosition: SketchPosition
  /** Je ein Punkt auf den beiden Schenkeln; nur die Richtung vom Scheitel aus zählt. */
  firstLegEndPosition: SketchPosition
  secondLegEndPosition: SketchPosition
}

/** Die Kantenlänge des Zeichens und der Radius seines Punkts, in Einheiten der Skizze. */
const RIGHT_ANGLE_SIZE = 15
const RIGHT_ANGLE_DOT_RADIUS = 1.6

/**
 * Das Zeichen für einen rechten Winkel: ein kleines Quadrat am Scheitel zwischen den beiden Schenkeln, mit einem Punkt
 * in der Mitte. Fällt ein Schenkel auf den Scheitel, wird nichts gezeichnet.
 */
export function SketchRightAngle({
  coordinateSystem,
  vertexPosition,
  firstLegEndPosition,
  secondLegEndPosition,
}: SketchRightAngleProps) {
  const vertexSketchX = coordinateSystem.toSketchX(vertexPosition.x)
  const vertexSketchY = coordinateSystem.toSketchY(vertexPosition.y)
  const firstLegSketchX = coordinateSystem.toSketchX(firstLegEndPosition.x) - vertexSketchX
  const firstLegSketchY = coordinateSystem.toSketchY(firstLegEndPosition.y) - vertexSketchY
  const secondLegSketchX = coordinateSystem.toSketchX(secondLegEndPosition.x) - vertexSketchX
  const secondLegSketchY = coordinateSystem.toSketchY(secondLegEndPosition.y) - vertexSketchY
  const firstLegLength = Math.hypot(firstLegSketchX, firstLegSketchY)
  const secondLegLength = Math.hypot(secondLegSketchX, secondLegSketchY)
  if (firstLegLength === 0 || secondLegLength === 0) {
    return null
  }
  // je Schenkel ein Schritt der Kantenlänge vom Scheitel weg; die Ecke gegenüber liegt in beiden Richtungen
  const firstStepX = (firstLegSketchX / firstLegLength) * RIGHT_ANGLE_SIZE
  const firstStepY = (firstLegSketchY / firstLegLength) * RIGHT_ANGLE_SIZE
  const secondStepX = (secondLegSketchX / secondLegLength) * RIGHT_ANGLE_SIZE
  const secondStepY = (secondLegSketchY / secondLegLength) * RIGHT_ANGLE_SIZE
  const firstCornerX = vertexSketchX + firstStepX
  const firstCornerY = vertexSketchY + firstStepY
  const oppositeCornerX = firstCornerX + secondStepX
  const oppositeCornerY = firstCornerY + secondStepY
  const secondCornerX = vertexSketchX + secondStepX
  const secondCornerY = vertexSketchY + secondStepY
  const squarePath =
    'M ' + firstCornerX + ' ' + firstCornerY + ' L ' + oppositeCornerX + ' ' + oppositeCornerY + ' L ' + secondCornerX + ' ' + secondCornerY
  const dotX = vertexSketchX + (firstStepX + secondStepX) / 2
  const dotY = vertexSketchY + (firstStepY + secondStepY) / 2
  return (
    <>
      <path className="sketch-helper-line" d={squarePath} />
      <circle className="sketch-helper-dot" cx={dotX} cy={dotY} r={RIGHT_ANGLE_DOT_RADIUS} />
    </>
  )
}
