import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { MathTermView } from '../math/MathTermView.tsx'
import { TermRoles } from '../math/TermRoles.ts'
import type { DerivationOperation } from './DerivationOperation.ts'
import { DerivationOperationNote } from './DerivationOperationNote.tsx'
import type { DerivationStep } from './DerivationStep.ts'

type DerivationStepRowProps = {
  /** Der Platz des Schritts in der Herleitung, ab 0. */
  stepIndex: number
  derivationStep: DerivationStep
  /** Die Beschriftung vor der Zeile, z. B. „Ausgang“ oder „Ergebnis“; `null` bei einer Zeile des Rechenwegs dazwischen. */
  label: string | null
  /** Ob die Zeile zum eingeblendeten Rechenweg gehört: Dann stehen ihre Erklärung und die Umformung zur nächsten Zeile dabei. */
  pathShown: boolean
  /** Die Umformung, die aus diesem Schritt den nächsten macht; `null` beim letzten Schritt. */
  followingOperation: DerivationOperation | null
  /** Spielt die Umformung zum nächsten Schritt ab. */
  onPlayFollowingTransformation: () => void
}

/**
 * Die Zeile eines Schritts: davor ihre Beschriftung, dann die Gleichung; im eingeblendeten Rechenweg am Zeilenende die
 * Umformung zur nächsten Zeile samt Abspiel-Knopf und darunter die Erklärung in Worten. Beschriftung, linke Seite,
 * Gleichheitszeichen und rechte Seite sind eigene Zellen, damit die Gleichheitszeichen aller Zeilen einer Herleitung
 * untereinander stehen. Die beiden Seiten sind der Bereich, in dem Terme wandern (`data-flight-scope` mit dem Namen der
 * Seite).
 */
export function DerivationStepRow({
  stepIndex,
  derivationStep,
  label,
  pathShown,
  followingOperation,
  onPlayFollowingTransformation,
}: DerivationStepRowProps) {
  const equation = derivationStep.equation
  const explanationText = getTextInCurrentLanguage(derivationStep.explanation)
  // Was die nächste Umformung in dieser Zeile kürzt, steht im eingeblendeten Rechenweg durchgestrichen da; was die
  // Umformung davor in diese Zeile gebracht hat, kommt beim Abspielen aus ihrer Notiz
  let cancelledTrackingKeys: string[] = []
  if (pathShown && followingOperation !== null) {
    cancelledTrackingKeys = followingOperation.cancelledTermKeys
  }
  let appliedTrackingKeys: string[] = []
  if (derivationStep.operation !== null) {
    appliedTrackingKeys = derivationStep.operation.appliedTermKeys
  }
  const termRoles = new TermRoles(cancelledTrackingKeys, appliedTrackingKeys)
  // Eine Zeile ohne Beschriftung gibt es nur im eingeblendeten Rechenweg: Sie erscheint beim Einblenden
  let rowClassName = 'derivation-step'
  if (label === null) {
    rowClassName = 'derivation-step derivation-step-between'
  }
  return (
    <div className={rowClassName} data-step-index={stepIndex}>
      <span className="derivation-step-label">{label}</span>
      <span className="derivation-step-left math" data-flight-scope="left">
        <MathTermView term={equation.leftSide} termRoles={termRoles} />
      </span>
      <span className="derivation-step-relation math">
        <span className="math-relation">=</span>
      </span>
      <span className="derivation-step-right math" data-flight-scope="right">
        <MathTermView term={equation.rightSide} termRoles={termRoles} />
      </span>
      <span className="derivation-step-operation">
        {pathShown && followingOperation !== null && (
          <DerivationOperationNote operation={followingOperation} onPlay={onPlayFollowingTransformation} />
        )}
      </span>
      {pathShown && <p className="derivation-step-explanation">{explanationText}</p>}
    </div>
  )
}
