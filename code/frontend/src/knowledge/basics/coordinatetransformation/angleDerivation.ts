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
 * Der Tangens an φ: Er kommt als Arkustangens auf die andere Seite. Beide Funktionsnamen tragen deshalb dieselbe
 * Marke.
 */
const tangentOfAngleMark = new TermMark('tangentOfAngle', 'FIFTH')

// Schritt 1: tan φ = y / x
const tangentOfAngle = new FunctionTerm('tan', ANGLE, tangentOfAngleMark)
const yCoordinateOverXCoordinate = new FractionTerm(Y_COORDINATE, X_COORDINATE)
const tangentDefinition = new Equation(tangentOfAngle, yCoordinateOverXCoordinate)
const tangentDefinitionStep = new DerivationStep(
  tangentDefinition,
  null,
  COORDINATE_TRANSFORMATION_TEXTS.tangentDefinitionExplanation,
)

// Schritt 2, „arctan“: φ = arctan(y / x)
const groupedFraction = new GroupTerm(yCoordinateOverXCoordinate)
const arctangentOfFraction = new FunctionTerm('arctan', groupedFraction, tangentOfAngleMark)
const angleEquation = new Equation(ANGLE, arctangentOfFraction)
const arctangentOperation = new DerivationOperation(COORDINATE_TRANSFORMATION_TEXTS.arctangentNotation, null)
const angleStep = new DerivationStep(angleEquation, arctangentOperation, COORDINATE_TRANSFORMATION_TEXTS.angleArctangentExplanation)

/** Von kartesisch nach polar: φ aus x und y, über den Tangens im rechtwinkligen Dreieck. */
export const ANGLE_DERIVATION = new Derivation('angle', [tangentDefinitionStep, angleStep])
