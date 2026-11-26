import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'
import type { TermMark } from './TermMark.ts'

/** Eine Quadratwurzel, z. B. `√(x² + y²)`: das Wurzelzeichen und darunter der Radikand. */
export class RootTerm extends MathTerm {
  readonly radicand: MathTerm

  /**
   * Die Marke am Wurzelzeichen selbst, `null` ohne. Damit lässt sich zeigen, dass ein Quadrat von der anderen Seite
   * herübergekommen und zur Wurzel geworden ist.
   */
  readonly signMark: TermMark | null

  constructor(radicand: MathTerm, signMark: TermMark | null) {
    super()
    this.radicand = radicand
    this.signMark = signMark
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitRootTerm(this)
  }
}
