import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'

/** Ein Bruch, z. B. `x / r`: oben der Zähler, unten der Nenner. */
export class FractionTerm extends MathTerm {
  readonly numerator: MathTerm

  readonly denominator: MathTerm

  constructor(numerator: MathTerm, denominator: MathTerm) {
    super()
    this.numerator = numerator
    this.denominator = denominator
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitFractionTerm(this)
  }
}
