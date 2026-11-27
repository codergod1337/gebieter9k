import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'

/** Ein Produkt, z. B. `r · cos φ`. */
export class ProductTerm extends MathTerm {
  /** Die Faktoren von links nach rechts, mindestens zwei. */
  readonly factors: MathTerm[]

  constructor(factors: MathTerm[]) {
    super()
    this.factors = factors
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitProductTerm(this)
  }
}
