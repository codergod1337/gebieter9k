import type { MultilingualText } from '../../language/MultilingualText.ts'
import type { MathTerm } from '../math/MathTerm.ts'

/**
 * Die Umformung zwischen zwei Schritten einer Herleitung, so wie man sie hinter den Strich am Zeilenende schreibt,
 * z. B. „| · r“, „| √“ oder „| Seiten tauschen“.
 */
export class DerivationOperation {
  /** Was hinter dem Strich steht: ein Rechenzeichen (`·`, `√`), ein Funktionsname (`arctan`) oder Worte. */
  readonly notation: MultilingualText

  /** Der Term hinter der Schreibweise, z. B. das `r` in „· r“; `null` ohne. */
  readonly operand: MathTerm | null

  constructor(notation: MultilingualText, operand: MathTerm | null) {
    this.notation = notation
    this.operand = operand
  }
}
