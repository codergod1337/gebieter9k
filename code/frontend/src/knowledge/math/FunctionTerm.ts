import { MathTerm } from './MathTerm.ts'
import type { MathTermVisitor } from './MathTermVisitor.ts'
import type { TermMark } from './TermMark.ts'

/**
 * Eine Funktion mit ihrem Argument, z. B. `cos φ` oder `arctan(y / x)`. Klammern um das Argument setzt, wer die Formel
 * schreibt, über einen {@link GroupTerm}.
 */
export class FunctionTerm extends MathTerm {
  /** Der Name der Funktion, so wie er in der Formel steht, z. B. `cos`. */
  readonly functionName: string

  readonly argument: MathTerm

  /**
   * Die Marke am Namen der Funktion, `null` ohne. Damit lässt sich zeigen, dass z. B. der Tangens von der einen Seite
   * als Arkustangens auf die andere gekommen ist.
   */
  readonly nameMark: TermMark | null

  constructor(functionName: string, argument: MathTerm, nameMark: TermMark | null) {
    super()
    this.functionName = functionName
    this.argument = argument
    this.nameMark = nameMark
  }

  accept<Result>(visitor: MathTermVisitor<Result>): Result {
    return visitor.visitFunctionTerm(this)
  }
}
