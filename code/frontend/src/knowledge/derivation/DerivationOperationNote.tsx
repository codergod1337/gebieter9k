import { PlayButton } from '../../components/PlayButton.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { MathTermView } from '../math/MathTermView.tsx'
import type { DerivationOperation } from './DerivationOperation.ts'
import { DERIVATION_TEXTS } from './derivationTexts.ts'

type DerivationOperationNoteProps = {
  operation: DerivationOperation
  /** Spielt die Umformung ab, die diese Notiz nennt. */
  onPlay: () => void
}

/**
 * Die Notiz einer Umformung am Ende der Zeile, auf die sie angewendet wird, wie man sie von Hand schreibt: ein Strich,
 * dahinter die Umformung, z. B. „| · r“. Daneben der Abspiel-Knopf: Er zeigt, wie aus dieser Zeile die nächste wird.
 * Für den Flug der Terme ist die Notiz die Ursache (`data-flight-cause`): Sie leuchtet zuerst auf. Was die Umformung
 * auf beiden Seiten dazubringt, kommt aus ihr (`data-flight-cause-source`): aus dem Term hinter der Schreibweise, ohne
 * Term aus der Schreibweise selbst. Hat die Umformung keine Notiz (Kürzen, Seiten tauschen), steht nur der
 * Abspiel-Knopf da.
 */
export function DerivationOperationNote({ operation, onPlay }: DerivationOperationNoteProps) {
  const notationText = operation.notation
  const noteShown = notationText !== null || operation.operand !== null
  const playLabel = getTextInCurrentLanguage(DERIVATION_TEXTS.playTransformation)
  return (
    <span className="derivation-operation-note">
      {noteShown && (
        <span className="derivation-operation math" data-flight-cause="true">
          <span className="derivation-operation-bar" aria-hidden="true">
            |
          </span>
          {operation.operand === null && (
            <span className="derivation-operation-notation" data-flight-cause-source="true">
              {notationText}
            </span>
          )}
          {operation.operand !== null && (
            <>
              <span className="derivation-operation-notation">{notationText}</span>
              <span data-flight-cause-source="true">
                <MathTermView term={operation.operand} />
              </span>
            </>
          )}
        </span>
      )}
      <PlayButton label={playLabel} onClick={onPlay} />
    </span>
  )
}
