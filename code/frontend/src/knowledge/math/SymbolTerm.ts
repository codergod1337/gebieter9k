import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'

/** Eine Größe mit ihrem Formelzeichen, z. B. `r` oder `φ`. */
export class SymbolTerm extends MathTerm {
  /** Das Formelzeichen, so wie es in der Formel steht. */
  readonly symbol: string

  constructor(symbol: string) {
    super()
    this.symbol = symbol
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitSymbolTerm(this)
  }
}
