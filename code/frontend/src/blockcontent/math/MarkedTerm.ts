import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'
import type { TermMark } from './TermMark.ts'

/**
 * Ein Term mit einer Marke ({@link TermMark}): Der Term selbst bleibt, was er ist, die Marke macht ihn über die
 * Schritte einer Herleitung hinweg wiedererkennbar und färbt ihn. Jeder Term lässt sich so markieren, auch ein
 * zusammengesetzter.
 */
export class MarkedTerm extends MathTerm {
  readonly term: MathTerm

  readonly termMark: TermMark

  constructor(term: MathTerm, termMark: TermMark) {
    super()
    this.term = term
    this.termMark = termMark
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitMarkedTerm(this)
  }
}
