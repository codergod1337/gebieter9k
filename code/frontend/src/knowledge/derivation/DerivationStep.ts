import type { Equation } from '../math/Equation.ts'
import type { DerivationOperation } from './DerivationOperation.ts'

/** Ein Schritt einer Herleitung: eine Gleichung, wie sie aus dem Schritt davor entsteht. */
export class DerivationStep {
  readonly equation: Equation

  /** Die Umformung, die aus dem Schritt davor diesen macht; `null` beim ersten Schritt. */
  readonly operation: DerivationOperation | null

  /**
   * Eine Beschreibung in Worten, nur wo sie nötig ist (Nutzer 2026-11-27: „nicht ausformulieren“): woher der Ausgang
   * kommt, oder was an einer schwierigeren Umformung zu beachten ist (z. B. ein Integral mit Grenzen). Bei einer
   * einfachen Umformung genügt ihre Notiz („| · r“), dann `null`. Der Text steht in der Sprache der Seite.
   */
  readonly explanation: string | null

  constructor(equation: Equation, operation: DerivationOperation | null, explanation: string | null) {
    this.equation = equation
    this.operation = operation
    this.explanation = explanation
  }
}
