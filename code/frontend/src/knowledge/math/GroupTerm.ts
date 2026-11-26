import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'

/** Ein Term in runden Klammern, z. B. das Argument in `arctan(y / x)`. Die Klammern wachsen mit ihrem Inhalt. */
export class GroupTerm extends MathTerm {
  readonly term: MathTerm

  constructor(term: MathTerm) {
    super()
    this.term = term
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitGroupTerm(this)
  }
}
