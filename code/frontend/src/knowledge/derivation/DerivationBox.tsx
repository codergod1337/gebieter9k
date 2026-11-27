import type { ReactNode } from 'react'
import Button from 'react-bootstrap/Button'
import { ContentBox } from '../../components/ContentBox.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { Derivation } from './Derivation.ts'
import type { DerivationOperation } from './DerivationOperation.ts'
import { DerivationStepRow } from './DerivationStepRow.tsx'
import { DERIVATION_TEXTS } from './derivationTexts.ts'
import { useDerivationCancellations } from './useDerivationCancellations.ts'
import { useDerivationFlight } from './useDerivationFlight.ts'
import { useDerivationPathVisibility } from './useDerivationPathVisibility.ts'

type DerivationBoxProps = {
  title: string
  derivation: Derivation
}

/**
 * Eine Herleitung in einer ContentBox (Nutzer 2026-11-27): Immer zu sehen sind ihr Ausgang und ihr Ergebnis. Der Knopf
 * im Fuß blendet bei Bedarf den ganzen Rechenweg dazwischen ein, mit allen Äquivalenzumformungen, jede in ihrer eigenen
 * Zeile, und wieder aus. Im eingeblendeten Rechenweg bleibt alles stehen: Man schaut zwei Zeilen zurück und liest
 * weiter, ohne dass etwas verschwindet. Jede Umformung hat einen Abspiel-Knopf, der zeigt, wie aus ihrer Zeile die
 * nächste wird; die markierten Terme wandern dabei sichtbar an ihre neue Stelle. Jede Umformung ist ein eigener
 * Schritt: Eine Zeile entsteht ohne Strich, durchgestrichen wird erst beim Abspielen der Umformung, die kürzt
 * ({@link useDerivationCancellations}).
 */
export function DerivationBox({ title, derivation }: DerivationBoxProps) {
  const pathVisibility = useDerivationPathVisibility(derivation)
  const derivationFlight = useDerivationFlight()
  const derivationCancellations = useDerivationCancellations()
  const pathShown = pathVisibility.pathShown
  const steps = derivation.steps
  const lastStepIndex = steps.length - 1
  const transformationCount = lastStepIndex
  const startLabel = getTextInCurrentLanguage(DERIVATION_TEXTS.startLabel)
  const resultLabel = getTextInCurrentLanguage(DERIVATION_TEXTS.resultLabel)

  function playTransformationInto(targetStepIndex: number) {
    derivationCancellations.showCancellationOfTransformationInto(targetStepIndex)
    derivationFlight.playTransformationInto(targetStepIndex)
  }

  function hidePath() {
    derivationCancellations.resetCancellations()
    pathVisibility.hidePath()
  }

  const rows: ReactNode[] = []
  steps.forEach((derivationStep, stepIndex) => {
    const isStart = stepIndex === 0
    const isResult = stepIndex === lastStepIndex
    const betweenStartAndResult = !isStart && !isResult
    if (betweenStartAndResult && !pathShown) {
      return
    }
    let label: string | null = null
    if (isStart) {
      label = startLabel
    } else if (isResult) {
      label = resultLabel
    }
    let followingOperation: DerivationOperation | null = null
    const followingStepIndex = stepIndex + 1
    if (!isResult) {
      followingOperation = steps[followingStepIndex].operation
    }
    rows.push(
      <DerivationStepRow
        key={stepIndex}
        stepIndex={stepIndex}
        derivationStep={derivationStep}
        label={label}
        pathShown={pathShown}
        cancellationShown={derivationCancellations.isCancellationShown(stepIndex)}
        followingOperation={followingOperation}
        onPlayFollowingTransformation={() => playTransformationInto(followingStepIndex)}
      />,
    )
    // Ausgeblendet steht zwischen Ausgang und Ergebnis ein Zeichen dafür, dass dazwischen etwas liegt
    if (isStart && !pathShown && transformationCount > 0) {
      rows.push(
        <div key="gap" className="derivation-gap" aria-hidden="true">
          <span className="derivation-gap-dots">⋮</span>
        </div>,
      )
    }
  })

  let transformationCountText = getTextInCurrentLanguageWithValues(DERIVATION_TEXTS.transformationCountMany, {
    transformationCount: String(transformationCount),
  })
  if (transformationCount === 1) {
    transformationCountText = getTextInCurrentLanguage(DERIVATION_TEXTS.transformationCountOne)
  }
  let pathButton = (
    <Button size="sm" variant="primary" onClick={pathVisibility.showPath}>
      <i className="bi bi-chevron-down me-1" aria-hidden="true"></i>
      {getTextInCurrentLanguage(DERIVATION_TEXTS.showPath)}
    </Button>
  )
  if (pathShown) {
    pathButton = (
      <Button size="sm" variant="outline-secondary" onClick={hidePath}>
        <i className="bi bi-chevron-up me-1" aria-hidden="true"></i>
        {getTextInCurrentLanguage(DERIVATION_TEXTS.hidePath)}
      </Button>
    )
  }
  const footer = (
    <div className="derivation-controls">
      <span className="derivation-count">{transformationCountText}</span>
      {transformationCount > 0 && pathButton}
    </div>
  )

  return (
    <ContentBox title={title} footer={footer}>
      <div ref={derivationFlight.stepsContainerRef} className="derivation-steps">
        {rows}
      </div>
    </ContentBox>
  )
}
