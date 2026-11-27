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
import { ANGLE, RADIUS, RADIUS_MARK, Y_COORDINATE } from './coordinateTransformationQuantities.ts'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'

/** Der Sinus wandert mit, bleibt aber in der Schriftfarbe: Farbe tragen nur die vier Größen. */
const sineMark = new TermMark('sine', null)
const sineOfAngle = new FunctionTerm('sin', ANGLE, sineMark)

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

// Ausgang: sin φ = y / r
const yCoordinateOverRadius = new FractionTerm(Y_COORDINATE, RADIUS)
const sineDefinition = new Equation(sineOfAngle, yCoordinateOverRadius)
const sineDefinitionStep = new DerivationStep(sineDefinition, null, COORDINATE_TRANSFORMATION_TEXTS.sineDefinitionExplanation)

// „· r“ auf beiden Seiten: r · sin φ = r · y / r
const radiusTimesSine = new ProductTerm([radiusFactor, sineOfAngle])
const radiusTimesFraction = new ProductTerm([cancelledRadiusFactor, yCoordinateOverRadius])
const timesRadiusEquation = new Equation(radiusTimesSine, radiusTimesFraction)
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
  COORDINATE_TRANSFORMATION_TEXTS.yCoordinateTimesRadiusExplanation,
)

// „kürzen“: rechts heben sich der Faktor r und das r im Nenner weg: r · sin φ = y
const cancelledEquation = new Equation(radiusTimesSine, Y_COORDINATE)
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
  COORDINATE_TRANSFORMATION_TEXTS.yCoordinateCancelExplanation,
)

// „Seiten tauschen“, das Ergebnis: y = r · sin φ
const yCoordinateEquation = new Equation(Y_COORDINATE, radiusTimesSine)
const swapSidesOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.swapSidesNotation, null, [], [])
const yCoordinateStep = new DerivationStep(
  yCoordinateEquation,
  swapSidesOperation,
  COORDINATE_TRANSFORMATION_TEXTS.yCoordinateSwapExplanation,
)

/** Von polar nach kartesisch: y aus r und φ, über den Sinus im rechtwinkligen Dreieck. */
export const Y_COORDINATE_DERIVATION = new Derivation('yCoordinate', [
  sineDefinitionStep,
  timesRadiusStep,
  cancelledStep,
  yCoordinateStep,
])
