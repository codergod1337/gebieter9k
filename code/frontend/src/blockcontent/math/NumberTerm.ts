import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'

/** Eine feste Zahl in einer Formel, z. B. die `2` im Quadrat `r²`. */
export class NumberTerm extends MathTerm {
  /** Die Zahl, so wie sie in der Formel steht, z. B. `2` oder `0,5`. */
  readonly numberText: string

  constructor(numberText: string) {
    super()
    this.numberText = numberText
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitNumberTerm(this)
  }
}
