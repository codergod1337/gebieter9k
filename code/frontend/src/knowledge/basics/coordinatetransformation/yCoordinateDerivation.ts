import { Derivation } from '../../derivation/Derivation.ts'
import { DerivationOperation } from '../../derivation/DerivationOperation.ts'
import { DerivationStep } from '../../derivation/DerivationStep.ts'
import { Equation } from '../../math/Equation.ts'
import { FractionTerm } from '../../math/FractionTerm.ts'
import { FunctionTerm } from '../../math/FunctionTerm.ts'
import { ProductTerm } from '../../math/ProductTerm.ts'
import { TermMark } from '../../math/TermMark.ts'
import { ANGLE, RADIUS, Y_COORDINATE } from './coordinateTransformationQuantities.ts'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'

/** Der Sinus wandert mit, bleibt aber in der Schriftfarbe: Farbe tragen nur die vier Größen. */
const sineMark = new TermMark('sine', null)
const sineOfAngle = new FunctionTerm('sin', ANGLE, sineMark)

// Schritt 1: sin φ = y / r
const yCoordinateOverRadius = new FractionTerm(Y_COORDINATE, RADIUS)
const sineDefinition = new Equation(sineOfAngle, yCoordinateOverRadius)
const sineDefinitionStep = new DerivationStep(sineDefinition, null, COORDINATE_TRANSFORMATION_TEXTS.sineDefinitionExplanation)

// Schritt 2, „· r“: r · sin φ = y
const radiusTimesSine = new ProductTerm([RADIUS, sineOfAngle])
const radiusTimesSineEquation = new Equation(radiusTimesSine, Y_COORDINATE)
const timesRadiusOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.timesNotation, RADIUS)
const timesRadiusStep = new DerivationStep(
  radiusTimesSineEquation,
  timesRadiusOperation,
  COORDINATE_TRANSFORMATION_TEXTS.yCoordinateTimesRadiusExplanation,
)

// Schritt 3, „Seiten tauschen“: y = r · sin φ
const yCoordinateEquation = new Equation(Y_COORDINATE, radiusTimesSine)
const swapSidesOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.swapSidesNotation, null)
const yCoordinateStep = new DerivationStep(
  yCoordinateEquation,
  swapSidesOperation,
  COORDINATE_TRANSFORMATION_TEXTS.yCoordinateSwapExplanation,
)

/** Von polar nach kartesisch: y aus r und φ, über den Sinus im rechtwinkligen Dreieck. */
export const Y_COORDINATE_DERIVATION = new Derivation('yCoordinate', [sineDefinitionStep, timesRadiusStep, yCoordinateStep])
