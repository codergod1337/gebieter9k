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
 * Das Quadrat an r: Es kommt beim Wurzelziehen als Wurzel auf die andere Seite. Die Zwei an r und das Wurzelzeichen
 * tragen deshalb dieselbe Marke.
 */
const squareOfRadiusMark = new TermMark('squareOfRadius', 'FIFTH')
const exponentTwo = new NumberTerm('2')
const exponentTwoOfRadius = new MarkedTerm(exponentTwo, squareOfRadiusMark)

// Schritt 1: r² = x² + y²
const radiusSquared = new PowerTerm(RADIUS, exponentTwoOfRadius)
const xCoordinateSquared = new PowerTerm(X_COORDINATE, exponentTwo)
const yCoordinateSquared = new PowerTerm(Y_COORDINATE, exponentTwo)
const sumOfSquares = new SumTerm([xCoordinateSquared, yCoordinateSquared])
const pythagoreanEquation = new Equation(radiusSquared, sumOfSquares)
const pythagoreanStep = new DerivationStep(pythagoreanEquation, null, COORDINATE_TRANSFORMATION_TEXTS.pythagoreanExplanation)

// Schritt 2, „√“: r = √(x² + y²)
const rootOfSumOfSquares = new RootTerm(sumOfSquares, squareOfRadiusMark)
const radiusEquation = new Equation(RADIUS, rootOfSumOfSquares)
const rootOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.rootNotation, null)
const radiusStep = new DerivationStep(radiusEquation, rootOperation, COORDINATE_TRANSFORMATION_TEXTS.radiusRootExplanation)

/** Von kartesisch nach polar: r aus x und y, über den Satz des Pythagoras. */
export const RADIUS_DERIVATION = new Derivation('radius', [pythagoreanStep, radiusStep])
