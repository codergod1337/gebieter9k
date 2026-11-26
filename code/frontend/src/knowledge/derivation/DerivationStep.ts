import type { MultilingualText } from '../../language/MultilingualText.ts'
import type { Equation } from '../math/Equation.ts'
import type { DerivationOperation } from './DerivationOperation.ts'

/** Ein Schritt einer Herleitung: eine Gleichung, wie sie aus dem Schritt davor entsteht, und warum sie gilt. */
export class DerivationStep {
  readonly equation: Equation

  /** Die Umformung, die aus dem Schritt davor diesen macht; `null` beim ersten Schritt. */
  readonly operation: DerivationOperation | null

  /** In Worten, warum die Gleichung gilt bzw. was die Umformung getan hat. */
  readonly explanation: MultilingualText

  constructor(equation: Equation, operation: DerivationOperation | null, explanation: MultilingualText) {
    this.equation = equation
    this.operation = operation
    this.explanation = explanation
  }
}
