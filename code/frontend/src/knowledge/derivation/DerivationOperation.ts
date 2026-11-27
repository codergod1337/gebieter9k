import type { MultilingualText } from '../../language/MultilingualText.ts'
import type { MathTerm } from '../math/MathTerm.ts'

/**
 * Die Umformung zwischen zwei Schritten einer Herleitung, so wie man sie hinter den Strich am Zeilenende schreibt,
 * z. B. „| · r“, „| kürzen“ oder „| Seiten tauschen“. Sie nennt auch, was sie mit den Termen tut, damit die Anzeige es
 * zeigen kann (Nutzer 2026-11-27: Die Bewegung soll die Rechenregel einprägen):
 * - Was sie bringt: Auf beiden Seiten dasselbe tun heißt, dass in der neuen Zeile Terme stehen, die es vorher nicht gab,
 *   z. B. das `r` links und rechts nach „· r“. Sie kommen beim Abspielen aus der Notiz.
 * - Was sie kürzt: Terme der Zeile davor, die sich wegheben, z. B. das `r` im Zähler und das im Nenner. Sie stehen dort
 *   durchgestrichen.
 */
export class DerivationOperation {
  /** Was hinter dem Strich steht: ein Rechenzeichen (`·`, `√`), ein Funktionsname (`arctan`) oder Worte. */
  readonly notation: MultilingualText

  /** Der Term hinter der Schreibweise, z. B. das `r` in „· r“; `null` ohne. */
  readonly operand: MathTerm | null

  /** Die Kennungen der Terme der NEUEN Zeile, die die Umformung gebracht hat; leer, wenn sie nichts bringt. */
  readonly appliedTermKeys: string[]

  /** Die Kennungen der Terme der Zeile DAVOR, die die Umformung kürzt; leer, wenn sie nichts kürzt. */
  readonly cancelledTermKeys: string[]

  constructor(notation: MultilingualText, operand: MathTerm | null, appliedTermKeys: string[], cancelledTermKeys: string[]) {
    this.notation = notation
    this.operand = operand
    this.appliedTermKeys = appliedTermKeys
    this.cancelledTermKeys = cancelledTermKeys
  }
}
