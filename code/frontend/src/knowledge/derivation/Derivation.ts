import type { Equation } from '../math/Equation.ts'
import type { DerivationStep } from './DerivationStep.ts'

/**
 * Eine Herleitung: eine Rechnung als Folge von Schritten, jeder genau eine Äquivalenzumformung weiter als der davor.
 * Terme mit derselben Marke in zwei aufeinanderfolgenden Schritten sind derselbe Term; daran zeigt die Anzeige, wohin
 * er gewandert ist.
 */
export class Derivation {
  /**
   * Die Kennung der Herleitung auf ihrer Seite, z. B. `xCoordinate`. Unter `<Kennung>Path` steht in der Adresse, ob
   * ihr Rechenweg eingeblendet ist.
   */
  readonly key: string

  /** Die Schritte in ihrer Reihenfolge, mindestens einer. */
  readonly steps: DerivationStep[]

  constructor(key: string, steps: DerivationStep[]) {
    this.key = key
    this.steps = steps
  }

  /** Das Ergebnis der Herleitung: die Gleichung ihres letzten Schritts. */
  getResultEquation(): Equation {
    const lastStepIndex = this.steps.length - 1
    const lastStep = this.steps[lastStepIndex]
    return lastStep.equation
  }
}
