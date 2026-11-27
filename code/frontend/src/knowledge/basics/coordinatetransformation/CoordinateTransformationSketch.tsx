import { getTextInCurrentLanguage } from '../../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../../language/getTextInCurrentLanguageWithValues.ts'
import { getMathHighlightClassName } from '../../math/getMathHighlightClassName.ts'
import { formatSketchNumber } from '../../sketch/formatSketchNumber.ts'
import { Sketch } from '../../sketch/Sketch.tsx'
import { SketchAngle } from '../../sketch/SketchAngle.tsx'
import { SketchAxes } from '../../sketch/SketchAxes.tsx'
import { SketchCoordinateSystem } from '../../sketch/SketchCoordinateSystem.ts'
import { SketchPoint } from '../../sketch/SketchPoint.tsx'
import type { SketchPosition } from '../../sketch/SketchPosition.ts'
import { SketchSegment } from '../../sketch/SketchSegment.tsx'
import { ANGLE_MARK, RADIUS_MARK, X_COORDINATE_MARK, Y_COORDINATE_MARK } from './coordinateTransformationQuantities.ts'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'

/** Das Feld der Skizze und ihr Koordinatensystem: wo der Nullpunkt liegt und wie lang die Strecke von 0 bis 1 ist. */
const SKETCH_WIDTH = 340
const SKETCH_HEIGHT = 280
const COORDINATE_SYSTEM = new SketchCoordinateSystem(52, 228, 48)
const AXIS_MAX_X = 5.6
const AXIS_MAX_Y = 4.3

/** Der Ursprung, der Punkt P und der Fußpunkt seines Lots auf die x-Achse. Mit (4 | 3) ist r genau 5. */
const ORIGIN_POSITION: SketchPosition = { x: 0, y: 0 }
const POINT_POSITION: SketchPosition = { x: 4, y: 3 }
const FOOT_POSITION: SketchPosition = { x: POINT_POSITION.x, y: 0 }

/** Die Kantenlänge des Zeichens für den rechten Winkel, in Einheiten der Skizze. */
const RIGHT_ANGLE_SIZE = 15

/**
 * Die Skizze zur Koordinatentransformation: Achsenkreuz mit Raster, Nullpunkt und der 1 an beiden Achsen, der Punkt
 * P (4 | 3) und das rechtwinklige Dreieck aus x, y und r mit dem Winkel φ am Ursprung. Jede Größe trägt die Farbe ihrer
 * Marke, dieselbe wie in den Formeln der Seite. Jeder Punkt nennt beim Zeigen seine Koordinaten, P zusätzlich seine
 * Polarkoordinaten; der Winkel hebt beim Zeigen seine beiden Schenkel hervor.
 */
export function CoordinateTransformationSketch() {
  const sketchDescription = getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.sketchDescription)
  const xCoordinateClassName = getMathHighlightClassName(X_COORDINATE_MARK.highlightKey)
  const yCoordinateClassName = getMathHighlightClassName(Y_COORDINATE_MARK.highlightKey)
  const radiusClassName = getMathHighlightClassName(RADIUS_MARK.highlightKey)
  const angleClassName = getMathHighlightClassName(ANGLE_MARK.highlightKey)

  // P in Polarkoordinaten, für sein Hoverlay und das des Winkels
  const radius = Math.hypot(POINT_POSITION.x, POINT_POSITION.y)
  const angleRadians = COORDINATE_SYSTEM.getDirectionRadians(ORIGIN_POSITION, POINT_POSITION)
  const angleDegrees = (angleRadians * 180) / Math.PI
  const radiusText = formatSketchNumber(radius)
  const angleDegreesText = formatSketchNumber(angleDegrees)
  const pointPolarHint = getTextInCurrentLanguageWithValues(COORDINATE_TRANSFORMATION_TEXTS.sketchPointPolarHint, {
    radius: radiusText,
    degrees: angleDegreesText,
  })
  const angleHint = getTextInCurrentLanguageWithValues(COORDINATE_TRANSFORMATION_TEXTS.sketchAngleHint, {
    degrees: angleDegreesText,
  })

  // das Zeichen für den rechten Winkel zwischen x und y, am Fußpunkt
  const footSketchX = COORDINATE_SYSTEM.toSketchX(FOOT_POSITION.x)
  const footSketchY = COORDINATE_SYSTEM.toSketchY(FOOT_POSITION.y)
  const rightAnglePath = 'M ' + (footSketchX - RIGHT_ANGLE_SIZE) + ' ' + footSketchY + ' v ' + -RIGHT_ANGLE_SIZE + ' h ' + RIGHT_ANGLE_SIZE
  const rightAngleDotX = footSketchX - RIGHT_ANGLE_SIZE / 2
  const rightAngleDotY = footSketchY - RIGHT_ANGLE_SIZE / 2

  return (
    <Sketch width={SKETCH_WIDTH} height={SKETCH_HEIGHT} description={sketchDescription}>
      <SketchAxes coordinateSystem={COORDINATE_SYSTEM} maxX={AXIS_MAX_X} maxY={AXIS_MAX_Y} />
      <path className="sketch-helper-line" d={rightAnglePath} />
      <circle className="sketch-helper-dot" cx={rightAngleDotX} cy={rightAngleDotY} r={1.6} />
      <SketchAngle
        coordinateSystem={COORDINATE_SYSTEM}
        vertexPosition={ORIGIN_POSITION}
        firstLegEndPosition={FOOT_POSITION}
        secondLegEndPosition={POINT_POSITION}
        label="φ"
        hintText={angleHint}
        highlightClassName={angleClassName}
      />
      <SketchSegment
        coordinateSystem={COORDINATE_SYSTEM}
        fromPosition={ORIGIN_POSITION}
        toPosition={FOOT_POSITION}
        label="x"
        labelSide="RIGHT"
        highlightClassName={xCoordinateClassName}
      />
      <SketchSegment
        coordinateSystem={COORDINATE_SYSTEM}
        fromPosition={FOOT_POSITION}
        toPosition={POINT_POSITION}
        label="y"
        labelSide="RIGHT"
        highlightClassName={yCoordinateClassName}
      />
      <SketchSegment
        coordinateSystem={COORDINATE_SYSTEM}
        fromPosition={ORIGIN_POSITION}
        toPosition={POINT_POSITION}
        label="r"
        labelSide="LEFT"
        highlightClassName={radiusClassName}
      />
      <SketchPoint
        coordinateSystem={COORDINATE_SYSTEM}
        position={ORIGIN_POSITION}
        label={null}
        hintName={getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.sketchOriginHintName)}
      />
      <SketchPoint
        coordinateSystem={COORDINATE_SYSTEM}
        position={FOOT_POSITION}
        label={null}
        hintName={getTextInCurrentLanguage(COORDINATE_TRANSFORMATION_TEXTS.sketchFootHintName)}
      />
      <SketchPoint coordinateSystem={COORDINATE_SYSTEM} position={POINT_POSITION} label="P" hintName="P" hintDetail={pointPolarHint} />
    </Sketch>
  )
}
