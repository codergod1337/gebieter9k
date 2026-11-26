import { Derivation } from '../../derivation/Derivation.ts'
import { DerivationOperation } from '../../derivation/DerivationOperation.ts'
import { DerivationStep } from '../../derivation/DerivationStep.ts'
import { Equation } from '../../math/Equation.ts'
import { FractionTerm } from '../../math/FractionTerm.ts'
import { FunctionTerm } from '../../math/FunctionTerm.ts'
import { ProductTerm } from '../../math/ProductTerm.ts'
import { TermMark } from '../../math/TermMark.ts'
import { ANGLE, RADIUS, X_COORDINATE } from './coordinateTransformationQuantities.ts'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'

/** Der Kosinus wandert mit, bleibt aber in der Schriftfarbe: Farbe tragen nur die vier Größen. */
const cosineMark = new TermMark('cosine', null)
const cosineOfAngle = new FunctionTerm('cos', ANGLE, cosineMark)

// Schritt 1: cos φ = x / r
const xCoordinateOverRadius = new FractionTerm(X_COORDINATE, RADIUS)
const cosineDefinition = new Equation(cosineOfAngle, xCoordinateOverRadius)
const cosineDefinitionStep = new DerivationStep(
  cosineDefinition,
  null,
  COORDINATE_TRANSFORMATION_TEXTS.cosineDefinitionExplanation,
)

// Schritt 2, „· r“: r · cos φ = x
const radiusTimesCosine = new ProductTerm([RADIUS, cosineOfAngle])
const radiusTimesCosineEquation = new Equation(radiusTimesCosine, X_COORDINATE)
const timesRadiusOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.timesNotation, RADIUS)
const timesRadiusStep = new DerivationStep(
  radiusTimesCosineEquation,
  timesRadiusOperation,
  COORDINATE_TRANSFORMATION_TEXTS.xCoordinateTimesRadiusExplanation,
)

// Schritt 3, „Seiten tauschen“: x = r · cos φ
const xCoordinateEquation = new Equation(X_COORDINATE, radiusTimesCosine)
const swapSidesOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.swapSidesNotation, null)
const xCoordinateStep = new DerivationStep(
  xCoordinateEquation,
  swapSidesOperation,
  COORDINATE_TRANSFORMATION_TEXTS.xCoordinateSwapExplanation,
)

/** Von polar nach kartesisch: x aus r und φ, über den Kosinus im rechtwinkligen Dreieck. */
export const X_COORDINATE_DERIVATION = new Derivation('xCoordinate', [cosineDefinitionStep, timesRadiusStep, xCoordinateStep])
