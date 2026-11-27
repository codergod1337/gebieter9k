import { Derivation } from '../../derivation/Derivation.ts'
import { DerivationOperation } from '../../derivation/DerivationOperation.ts'
import { DerivationStep } from '../../derivation/DerivationStep.ts'
import { Equation } from '../../math/Equation.ts'
import { FractionTerm } from '../../math/FractionTerm.ts'
import { FunctionTerm } from '../../math/FunctionTerm.ts'
import { GroupTerm } from '../../math/GroupTerm.ts'
import { TermMark } from '../../math/TermMark.ts'
import { ANGLE, X_COORDINATE, Y_COORDINATE } from './coordinateTransformationQuantities.ts'
import { COORDINATE_TRANSFORMATION_TEXTS } from './coordinateTransformationTexts.ts'

/**
 * Die Rechenarten, um die es hier geht, in der fünften Farbe: der Tangens an φ und die beiden Arkustangens, die das
 * Anwenden auf die zwei Seiten bringt. Der Arkustangens links hebt sich mit dem Tangens auf, der rechts bleibt stehen.
 */
const tangentOfAngleMark = new TermMark('tangentOfAngle', 'FIFTH')
const arctangentOfTangentMark = new TermMark('arctangentOfTangent', 'FIFTH')
const arctangentOfFractionMark = new TermMark('arctangentOfFraction', 'FIFTH')

// Ausgang: tan φ = y / x
const tangentOfAngle = new FunctionTerm('tan', ANGLE, tangentOfAngleMark)
const yCoordinateOverXCoordinate = new FractionTerm(Y_COORDINATE, X_COORDINATE)
const tangentDefinition = new Equation(tangentOfAngle, yCoordinateOverXCoordinate)
const tangentDefinitionStep = new DerivationStep(
  tangentDefinition,
  null,
  COORDINATE_TRANSFORMATION_TEXTS.tangentDefinitionExplanation,
)

// „arctan“ auf beiden Seiten: arctan(tan φ) = arctan(y / x)
const groupedTangent = new GroupTerm(tangentOfAngle)
const arctangentOfTangent = new FunctionTerm('arctan', groupedTangent, arctangentOfTangentMark)
const groupedFraction = new GroupTerm(yCoordinateOverXCoordinate)
const arctangentOfFraction = new FunctionTerm('arctan', groupedFraction, arctangentOfFractionMark)
const arctangentEquation = new Equation(arctangentOfTangent, arctangentOfFraction)
const termKeysBroughtByArctangent = [arctangentOfTangentMark.trackingKey, arctangentOfFractionMark.trackingKey]
const arctangentOperation = new DerivationOperation(
  COORDINATE_TRANSFORMATION_TEXTS.arctangentNotation,
  null,
  termKeysBroughtByArctangent,
  [],
)
const arctangentStep = new DerivationStep(
  arctangentEquation,
  arctangentOperation,
  COORDINATE_TRANSFORMATION_TEXTS.angleArctangentExplanation,
)

// links heben sich Arkustangens und Tangens auf, das Ergebnis: φ = arctan(y / x)
const angleEquation = new Equation(ANGLE, arctangentOfFraction)
const termKeysCancelledOnTheLeft = [arctangentOfTangentMark.trackingKey, tangentOfAngleMark.trackingKey]
const inverseCancelOperation = new DerivationOperation(
  COORDINATE_TRANSFORMATION_TEXTS.inverseCancelNotation,
  null,
  [],
  termKeysCancelledOnTheLeft,
)
const angleStep = new DerivationStep(
  angleEquation,
  inverseCancelOperation,
  COORDINATE_TRANSFORMATION_TEXTS.angleInverseCancelExplanation,
)

/** Von kartesisch nach polar: φ aus x und y, über den Tangens im rechtwinkligen Dreieck. */
export const ANGLE_DERIVATION = new Derivation('angle', [tangentDefinitionStep, arctangentStep, angleStep])
