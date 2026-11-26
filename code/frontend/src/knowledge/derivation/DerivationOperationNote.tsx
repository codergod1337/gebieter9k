import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { MathTermView } from '../math/MathTermView.tsx'
import type { DerivationOperation } from './DerivationOperation.ts'

type DerivationOperationNoteProps = {
  operation: DerivationOperation
}

/**
 * Die Notiz einer Umformung am Ende der Zeile, auf die sie angewendet wird, wie man sie von Hand schreibt: ein Strich,
 * dahinter die Umformung, z. B. „| · r“. Für den Flug der Terme ist sie die Ursache (`data-flight-cause`): Sie
 * erscheint zuerst.
 */
export function DerivationOperationNote({ operation }: DerivationOperationNoteProps) {
  const notationText = getTextInCurrentLanguage(operation.notation)
  return (
    <span className="derivation-operation math" data-flight-cause="true">
      <span className="derivation-operation-bar" aria-hidden="true">
        |
      </span>
      <span className="derivation-operation-notation">{notationText}</span>
      {operation.operand !== null && <MathTermView term={operation.operand} />}
    </span>
  )
}
