import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'

/** Eine Potenz, z. B. `r²`: die Basis und hochgestellt der Exponent. */
export class PowerTerm extends MathTerm {
  readonly base: MathTerm

  readonly exponent: MathTerm

  constructor(base: MathTerm, exponent: MathTerm) {
    super()
    this.base = base
    this.exponent = exponent
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitPowerTerm(this)
  }
}
