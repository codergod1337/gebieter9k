import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'

/**
 * Ein Term mit Minus davor, z. B. `−b`. Eine Differenz ist damit eine Summe mit einem negativen Summanden
 * (`a − b` = Summe aus `a` und `−b`); der Zeichner schreibt dort ein Minuszeichen statt „+ −“.
 */
export class NegativeTerm extends MathTerm {
  readonly term: MathTerm

  constructor(term: MathTerm) {
    super()
    this.term = term
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitNegativeTerm(this)
  }
}
