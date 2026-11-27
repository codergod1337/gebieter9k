import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'

/** Eine Summe, z. B. `x² + y²`. */
export class SumTerm extends MathTerm {
  /** Die Summanden von links nach rechts, mindestens zwei. */
  readonly summands: MathTerm[]

  constructor(summands: MathTerm[]) {
    super()
    this.summands = summands
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitSumTerm(this)
  }
}
