import { Derivation } from '../../derivation/Derivation.ts'
import { DerivationOperation } from '../../derivation/DerivationOperation.ts'
import { DerivationStep } from '../../derivation/DerivationStep.ts'
import { Equation } from '../../math/Equation.ts'
import { FractionTerm } from '../../math/FractionTerm.ts'
import { FunctionTerm } from '../../math/FunctionTerm.ts'
import { MarkedTerm } from '../../math/MarkedTerm.ts'
import { ProductTerm } from '../../math/ProductTerm.ts'
import { SymbolTerm } from '../../math/SymbolTerm.ts'
import { TermMark } from '../../math/TermMark.ts'
import { ANGLE, RADIUS, RADIUS_MARK, X_COORDINATE } from './coordinateTransformationQuantities.ts'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'

/** Der Kosinus wandert mit, bleibt aber in der Schriftfarbe: Farbe tragen nur die vier Größen. */
const cosineMark = new TermMark('cosine', null)
const cosineOfAngle = new FunctionTerm('cos', ANGLE, cosineMark)

/**
 * „· r“ bringt auf jede Seite ein r als Faktor. Beide sind dieselbe Größe und tragen ihre Farbe, aber es sind eigene
 * Terme mit eigener Kennung: Das linke bleibt bis zum Ergebnis stehen, das rechte kürzt sich gegen das r im Nenner weg.
 */
const radiusFactorMark = new TermMark('radiusFactor', RADIUS_MARK.highlightKey)
const radiusFactorSymbol = new SymbolTerm('r')
const radiusFactor = new MarkedTerm(radiusFactorSymbol, radiusFactorMark)
const cancelledRadiusFactorMark = new TermMark('cancelledRadiusFactor', RADIUS_MARK.highlightKey)
const cancelledRadiusFactorSymbol = new SymbolTerm('r')
const cancelledRadiusFactor = new MarkedTerm(cancelledRadiusFactorSymbol, cancelledRadiusFactorMark)

// Ausgang: cos φ = x / r
const xCoordinateOverRadius = new FractionTerm(X_COORDINATE, RADIUS)
const cosineDefinition = new Equation(cosineOfAngle, xCoordinateOverRadius)
const cosineDefinitionStep = new DerivationStep(
  cosineDefinition,
  null,
  COORDINATE_TRANSFORMATION_TEXTS.cosineDefinitionExplanation,
)

// „· r“ auf beiden Seiten: r · cos φ = r · x / r
const radiusTimesCosine = new ProductTerm([radiusFactor, cosineOfAngle])
const radiusTimesFraction = new ProductTerm([cancelledRadiusFactor, xCoordinateOverRadius])
const timesRadiusEquation = new Equation(radiusTimesCosine, radiusTimesFraction)
const termKeysBroughtByTimesRadius = [radiusFactorMark.trackingKey, cancelledRadiusFactorMark.trackingKey]
const timesRadiusOperation = new DerivationOperation(
  COORDINATE_TRANSFORMATION_TEXTS.timesNotation,
  RADIUS,
  termKeysBroughtByTimesRadius,
  [],
)
const timesRadiusStep = new DerivationStep(
  timesRadiusEquation,
  timesRadiusOperation,
  COORDINATE_TRANSFORMATION_TEXTS.xCoordinateTimesRadiusExplanation,
)

// „kürzen“: rechts heben sich der Faktor r und das r im Nenner weg: r · cos φ = x
const cancelledEquation = new Equation(radiusTimesCosine, X_COORDINATE)
const termKeysCancelledOnTheRight = [cancelledRadiusFactorMark.trackingKey, RADIUS_MARK.trackingKey]
const cancelOperation = new DerivationOperation(
  COORDINATE_TRANSFORMATION_TEXTS.cancelNotation,
  null,
  [],
  termKeysCancelledOnTheRight,
)
const cancelledStep = new DerivationStep(
  cancelledEquation,
  cancelOperation,
  COORDINATE_TRANSFORMATION_TEXTS.xCoordinateCancelExplanation,
)

// „Seiten tauschen“, das Ergebnis: x = r · cos φ
const xCoordinateEquation = new Equation(X_COORDINATE, radiusTimesCosine)
const swapSidesOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.swapSidesNotation, null, [], [])
const xCoordinateStep = new DerivationStep(
  xCoordinateEquation,
  swapSidesOperation,
  COORDINATE_TRANSFORMATION_TEXTS.xCoordinateSwapExplanation,
)

/** Von polar nach kartesisch: x aus r und φ, über den Kosinus im rechtwinkligen Dreieck. */
export const X_COORDINATE_DERIVATION = new Derivation('xCoordinate', [
  cosineDefinitionStep,
  timesRadiusStep,
  cancelledStep,
  xCoordinateStep,
])
