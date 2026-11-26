import { getTextInCurrentLanguage } from '../../../language/getTextInCurrentLanguage.ts'
import { getMathHighlightClassName } from '../../math/getMathHighlightClassName.ts'
import { ANGLE_MARK, RADIUS_MARK, X_COORDINATE_MARK, Y_COORDINATE_MARK } from './coordinateTransformationQuantities.ts'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'

/** Die Skizze in ihren eigenen Einheiten: Größe des Felds, der Ursprung, der Punkt P und die Enden der Achsen. */
const SKETCH_WIDTH = 340
const SKETCH_HEIGHT = 270
const ORIGIN_X = 50
const ORIGIN_Y = 220
const POINT_X = 250
const POINT_Y = 80
const X_AXIS_END_X = 322
const Y_AXIS_END_Y = 20
/** So weit ragen die Achsen über den Ursprung hinaus nach links und unten. */
const AXIS_OVERHANG = 22
const ARROW_LENGTH = 11
const ARROW_HALF_WIDTH = 5
/** Der Bogen des Winkels φ um den Ursprung und die Kantenlänge des Zeichens für den rechten Winkel. */
const ANGLE_ARC_RADIUS = 50
const RIGHT_ANGLE_SIZE = 16

/**
 * Die Skizze zur Koordinatentransformation: Achsenkreuz, der Punkt P und das rechtwinklige Dreieck aus x, y und r mit
 * dem Winkel φ am Ursprung. Jede Größe trägt die Farbe ihrer Marke, dieselbe wie in den Formeln der Seite.
 */
export function CoordinateTransformationSketch() {
  const viewBox = '0 0 ' + SKETCH_WIDTH + ' ' + SKETCH_HEIGHT
  const sketchDescription = getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.sketchDescription)
  const xCoordinateClassName = 'sketch-quantity ' + getMathHighlightClassName(X_COORDINATE_MARK.highlightKey)
  const yCoordinateClassName = 'sketch-quantity ' + getMathHighlightClassName(Y_COORDINATE_MARK.highlightKey)
  const radiusClassName = 'sketch-quantity ' + getMathHighlightClassName(RADIUS_MARK.highlightKey)
  const angleClassName = 'sketch-quantity ' + getMathHighlightClassName(ANGLE_MARK.highlightKey)

  // die Pfeilspitzen der beiden Achsen
  const xAxisArrowBackX = X_AXIS_END_X - ARROW_LENGTH
  const xAxisArrowPoints =
    X_AXIS_END_X + ',' + ORIGIN_Y + ' ' + xAxisArrowBackX + ',' + (ORIGIN_Y - ARROW_HALF_WIDTH) + ' ' + xAxisArrowBackX + ',' + (ORIGIN_Y + ARROW_HALF_WIDTH)
  const yAxisArrowBackY = Y_AXIS_END_Y + ARROW_LENGTH
  const yAxisArrowPoints =
    ORIGIN_X + ',' + Y_AXIS_END_Y + ' ' + (ORIGIN_X - ARROW_HALF_WIDTH) + ',' + yAxisArrowBackY + ' ' + (ORIGIN_X + ARROW_HALF_WIDTH) + ',' + yAxisArrowBackY

  // der Winkel φ: sein Bogen von der x-Achse hoch bis zur Strecke r (im SVG zeigt y nach unten)
  const horizontalDistance = POINT_X - ORIGIN_X
  const verticalDistance = ORIGIN_Y - POINT_Y
  const angleRadians = Math.atan2(verticalDistance, horizontalDistance)
  const angleCosine = Math.cos(angleRadians)
  const angleSine = Math.sin(angleRadians)
  const angleArcStartX = ORIGIN_X + ANGLE_ARC_RADIUS
  const angleArcEndX = ORIGIN_X + ANGLE_ARC_RADIUS * angleCosine
  const angleArcEndY = ORIGIN_Y - ANGLE_ARC_RADIUS * angleSine
  const angleArcPath =
    'M ' + angleArcStartX + ' ' + ORIGIN_Y + ' A ' + ANGLE_ARC_RADIUS + ' ' + ANGLE_ARC_RADIUS + ' 0 0 0 ' + angleArcEndX + ' ' + angleArcEndY
  // φ steht im halben Winkel zwischen Ursprung und Bogen
  const halfAngleRadians = angleRadians / 2
  const angleLabelDistance = ANGLE_ARC_RADIUS * 0.62
  const angleLabelX = ORIGIN_X + angleLabelDistance * Math.cos(halfAngleRadians)
  const angleLabelY = ORIGIN_Y - angleLabelDistance * Math.sin(halfAngleRadians) + 5

  // das Zeichen für den rechten Winkel zwischen x und y
  const rightAnglePath = 'M ' + (POINT_X - RIGHT_ANGLE_SIZE) + ' ' + ORIGIN_Y + ' v ' + -RIGHT_ANGLE_SIZE + ' h ' + RIGHT_ANGLE_SIZE
  const rightAngleDotX = POINT_X - RIGHT_ANGLE_SIZE / 2
  const rightAngleDotY = ORIGIN_Y - RIGHT_ANGLE_SIZE / 2

  // die Beschriftungen: x unter seiner Strecke, y rechts daneben, r oberhalb seiner Mitte
  const xCoordinateLabelX = (ORIGIN_X + POINT_X) / 2
  const xCoordinateLabelY = ORIGIN_Y + 26
  const yCoordinateLabelX = POINT_X + 16
  const yCoordinateLabelY = (ORIGIN_Y + POINT_Y) / 2 + 6
  const radiusLabelOffset = 18
  const radiusLabelX = (ORIGIN_X + POINT_X) / 2 - radiusLabelOffset * angleSine
  const radiusLabelY = (ORIGIN_Y + POINT_Y) / 2 - radiusLabelOffset * angleCosine + 6

  return (
    <svg className="sketch" viewBox={viewBox} role="img" aria-label={sketchDescription}>
      {/* Achsenkreuz */}
      <line className="sketch-axis" x1={ORIGIN_X - AXIS_OVERHANG} y1={ORIGIN_Y} x2={xAxisArrowBackX} y2={ORIGIN_Y} />
      <polygon className="sketch-axis-arrow" points={xAxisArrowPoints} />
      <text className="sketch-axis-label" x={X_AXIS_END_X - 4} y={ORIGIN_Y + 22}>
        x
      </text>
      <line className="sketch-axis" x1={ORIGIN_X} y1={ORIGIN_Y + AXIS_OVERHANG} x2={ORIGIN_X} y2={yAxisArrowBackY} />
      <polygon className="sketch-axis-arrow" points={yAxisArrowPoints} />
      <text className="sketch-axis-label" x={ORIGIN_X - 18} y={Y_AXIS_END_Y + 10}>
        y
      </text>

      {/* rechter Winkel zwischen x und y */}
      <path className="sketch-helper-line" d={rightAnglePath} />
      <circle className="sketch-helper-dot" cx={rightAngleDotX} cy={rightAngleDotY} r={1.6} />

      {/* Winkel φ */}
      <g className={angleClassName}>
        <path className="sketch-quantity-arc" d={angleArcPath} />
        <text className="sketch-quantity-label" x={angleLabelX} y={angleLabelY}>
          φ
        </text>
      </g>

      {/* Strecke x auf der x-Achse */}
      <g className={xCoordinateClassName}>
        <line className="sketch-quantity-line" x1={ORIGIN_X} y1={ORIGIN_Y} x2={POINT_X} y2={ORIGIN_Y} />
        <text className="sketch-quantity-label" x={xCoordinateLabelX} y={xCoordinateLabelY}>
          x
        </text>
      </g>

      {/* Strecke y senkrecht darauf */}
      <g className={yCoordinateClassName}>
        <line className="sketch-quantity-line" x1={POINT_X} y1={ORIGIN_Y} x2={POINT_X} y2={POINT_Y} />
        <text className="sketch-quantity-label" x={yCoordinateLabelX} y={yCoordinateLabelY}>
          y
        </text>
      </g>

      {/* Strecke r vom Ursprung zum Punkt */}
      <g className={radiusClassName}>
        <line className="sketch-quantity-line" x1={ORIGIN_X} y1={ORIGIN_Y} x2={POINT_X} y2={POINT_Y} />
        <text className="sketch-quantity-label" x={radiusLabelX} y={radiusLabelY}>
          r
        </text>
      </g>

      {/* der Punkt P */}
      <circle className="sketch-point" cx={POINT_X} cy={POINT_Y} r={4.5} />
      <text className="sketch-point-label" x={POINT_X + 10} y={POINT_Y - 8}>
        P
      </text>
    </svg>
  )
}
