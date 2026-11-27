import { Derivation } from '../../derivation/Derivation.ts'
import { DerivationOperation } from '../../derivation/DerivationOperation.ts'
import { DerivationStep } from '../../derivation/DerivationStep.ts'
import { Equation } from '../../math/Equation.ts'
import { MarkedTerm } from '../../math/MarkedTerm.ts'
import { NumberTerm } from '../../math/NumberTerm.ts'
import { PowerTerm } from '../../math/PowerTerm.ts'
import { RootTerm } from '../../math/RootTerm.ts'
import { SumTerm } from '../../math/SumTerm.ts'
import { TermMark } from '../../math/TermMark.ts'
import { RADIUS, X_COORDINATE, Y_COORDINATE } from './coordinateTransformationQuantities.ts'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'

/**
 * Die Rechenarten, um die es hier geht, in der fünften Farbe: das Quadrat an r und die beiden Wurzeln, die das
 * Wurzelziehen auf die zwei Seiten bringt. Die Wurzel links hebt sich mit dem Quadrat auf, die rechts bleibt stehen.
 */
const squareOfRadiusMark = new TermMark('squareOfRadius', 'FIFTH')
const rootOfRadiusSquaredMark = new TermMark('rootOfRadiusSquared', 'FIFTH')
const rootOfSumOfSquaresMark = new TermMark('rootOfSumOfSquares', 'FIFTH')
const exponentTwo = new NumberTerm('2')
const exponentTwoOfRadius = new MarkedTerm(exponentTwo, squareOfRadiusMark)

// Ausgang: r² = x² + y²
const radiusSquared = new PowerTerm(RADIUS, exponentTwoOfRadius)
const xCoordinateSquared = new PowerTerm(X_COORDINATE, exponentTwo)
const yCoordinateSquared = new PowerTerm(Y_COORDINATE, exponentTwo)
const sumOfSquares = new SumTerm([xCoordinateSquared, yCoordinateSquared])
const pythagoreanEquation = new Equation(radiusSquared, sumOfSquares)
const pythagoreanStep = new DerivationStep(pythagoreanEquation, null, COORDINATE_TRANSFORMATION_TEXTS.pythagoreanExplanation)

// „√“ auf beiden Seiten: √(r²) = √(x² + y²)
const rootOfRadiusSquared = new RootTerm(radiusSquared, rootOfRadiusSquaredMark)
const rootOfSumOfSquares = new RootTerm(sumOfSquares, rootOfSumOfSquaresMark)
const rootEquation = new Equation(rootOfRadiusSquared, rootOfSumOfSquares)
const termKeysBroughtByRoot = [rootOfRadiusSquaredMark.trackingKey, rootOfSumOfSquaresMark.trackingKey]
const rootOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.rootNotation, null, termKeysBroughtByRoot, [])
const rootStep = new DerivationStep(rootEquation, rootOperation, COORDINATE_TRANSFORMATION_TEXTS.radiusRootExplanation)

// links heben sich Wurzel und Quadrat auf, das Ergebnis: r = √(x² + y²)
const radiusEquation = new Equation(RADIUS, rootOfSumOfSquares)
const termKeysCancelledOnTheLeft = [rootOfRadiusSquaredMark.trackingKey, squareOfRadiusMark.trackingKey]
const inverseCancelOperation = new DerivationOperation(
  COORDINATE_TRANSFORMATION_TEXTS.inverseCancelNotation,
  null,
  [],
  termKeysCancelledOnTheLeft,
)
const radiusStep = new DerivationStep(
  radiusEquation,
  inverseCancelOperation,
  COORDINATE_TRANSFORMATION_TEXTS.radiusInverseCancelExplanation,
)

/** Von kartesisch nach polar: r aus x und y, über den Satz des Pythagoras. */
export const RADIUS_DERIVATION = new Derivation('radius', [pythagoreanStep, rootStep, radiusStep])
