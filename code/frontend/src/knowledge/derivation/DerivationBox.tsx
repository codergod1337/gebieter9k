import Button from 'react-bootstrap/Button'
import { ContentBox } from '../../components/ContentBox.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { Derivation } from './Derivation.ts'
import type { DerivationOperation } from './DerivationOperation.ts'
import { DerivationStepRow } from './DerivationStepRow.tsx'
import { DERIVATION_TEXTS } from './derivationTexts.ts'
import { useDerivationProgress } from './useDerivationProgress.ts'
import { useDerivationStepFlight } from './useDerivationStepFlight.ts'

type DerivationBoxProps = {
  title: string
  derivation: Derivation
}

/**
 * Eine Herleitung zum Durchklicken, in einer ContentBox: Zu sehen sind die Schritte bis zum aktuellen, jede Umformung
 * in einer eigenen Zeile. „Nächster Schritt“ zeigt genau eine Umformung mehr; dabei wandern die markierten Terme
 * sichtbar von ihrer Stelle in der alten Zeile an ihre Stelle in der neuen. Im Fuß stehen der Stand und die Knöpfe.
 */
export function DerivationBox({ title, derivation }: DerivationBoxProps) {
  const derivationProgress = useDerivationProgress(derivation)
  const shownStepCount = derivationProgress.shownStepCount
  const stepsContainerRef = useDerivationStepFlight(shownStepCount)
  const shownSteps = derivation.steps.slice(0, shownStepCount)

  const progressText = getTextInCurrentLanguageWithValues(DERIVATION_TEXTS.stepProgress, {
    step: String(shownStepCount),
    stepCount: String(derivation.steps.length),
  })
  const footer = (
    <div className="derivation-controls">
      <span className="derivation-progress">{progressText}</span>
      <Button
        size="sm"
        variant="outline-secondary"
        disabled={!derivationProgress.hasPreviousStep}
        onClick={derivationProgress.showPreviousStep}>
        <i className="bi bi-arrow-up me-1" aria-hidden="true"></i>
        {getTextInCurrentLanguage(DERIVATION_TEXTS.showPreviousStep)}
      </Button>
      <Button size="sm" variant="primary" disabled={!derivationProgress.hasNextStep} onClick={derivationProgress.showNextStep}>
        <i className="bi bi-arrow-down me-1" aria-hidden="true"></i>
        {getTextInCurrentLanguage(DERIVATION_TEXTS.showNextStep)}
      </Button>
    </div>
  )

  return (
    <ContentBox title={title} footer={footer}>
      <div ref={stepsContainerRef} className="derivation-steps">
        {shownSteps.map((derivationStep, stepIndex) => {
          // Die Umformung steht am Ende der Zeile, auf die sie angewendet wird, sobald die nächste Zeile zu sehen ist
          let followingOperation: DerivationOperation | null = null
          const followingStepIndex = stepIndex + 1
          if (followingStepIndex < shownSteps.length) {
            followingOperation = shownSteps[followingStepIndex].operation
          }
          return (
            <DerivationStepRow
              key={stepIndex}
              stepIndex={stepIndex}
              derivationStep={derivationStep}
              followingOperation={followingOperation}
            />
          )
        })}
      </div>
    </ContentBox>
  )
}
