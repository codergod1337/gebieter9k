import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { MathTermView } from '../math/MathTermView.tsx'
import type { DerivationOperation } from './DerivationOperation.ts'
import { DerivationOperationNote } from './DerivationOperationNote.tsx'
import type { DerivationStep } from './DerivationStep.ts'

type DerivationStepRowProps = {
  /** Der Platz des Schritts in der Herleitung, ab 0. */
  stepIndex: number
  derivationStep: DerivationStep
  /** Die Umformung, die aus diesem Schritt den nächsten macht; `null`, solange der nächste nicht gezeigt ist. */
  followingOperation: DerivationOperation | null
}

/**
 * Die Zeile eines Schritts: die Gleichung, am Zeilenende die Umformung zum nächsten Schritt, darunter die Erklärung in
 * Worten. Linke Seite, Gleichheitszeichen und rechte Seite sind eigene Zellen, damit die Gleichheitszeichen aller
 * Zeilen einer Herleitung untereinander stehen. Die beiden Seiten sind der Bereich, in dem Terme wandern
 * (`data-flight-scope`).
 */
export function DerivationStepRow({ stepIndex, derivationStep, followingOperation }: DerivationStepRowProps) {
  const equation = derivationStep.equation
  const explanationText = getTextInCurrentLanguage(derivationStep.explanation)
  return (
    <div className="derivation-step" data-step-index={stepIndex}>
      <span className="derivation-step-left math" data-flight-scope="true">
        <MathTermView term={equation.leftSide} />
      </span>
      <span className="derivation-step-relation math">
        <span className="math-relation">=</span>
      </span>
      <span className="derivation-step-right math" data-flight-scope="true">
        <MathTermView term={equation.rightSide} />
      </span>
      <span className="derivation-step-operation">
        {followingOperation !== null && <DerivationOperationNote operation={followingOperation} />}
      </span>
      <p className="derivation-step-explanation">{explanationText}</p>
    </div>
  )
}
