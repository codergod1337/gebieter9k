import { useUrlParam } from '../../navigation/useUrlParam.ts'
import type { Derivation } from './Derivation.ts'

/** Rückmeldung von {@link useDerivationProgress}: wie weit eine Herleitung gezeigt ist und wie man weitergeht. */
export type DerivationProgress = {
  /** So viele Schritte sind gezeigt, mindestens einer. */
  shownStepCount: number
  hasPreviousStep: boolean
  hasNextStep: boolean
  showNextStep: () => void
  showPreviousStep: () => void
}

/** Die Endung des Parameters in der Adresse, z. B. `xCoordinateStep=2`. */
const STEP_URL_PARAM_SUFFIX = 'Step'

/**
 * Wie viele Schritte die Adresse nennt (ab 1, wie man sie liest). Fehlt die Angabe oder ist sie unbrauchbar, ist es
 * der erste Schritt; mehr als die Herleitung hat, zeigt alle.
 */
function parseShownStepCount(urlStepText: string | null, stepCount: number): number {
  if (urlStepText === null) {
    return 1
  }
  const urlStepNumber = Number.parseInt(urlStepText, 10)
  if (!Number.isFinite(urlStepNumber) || urlStepNumber < 1) {
    return 1
  }
  if (urlStepNumber > stepCount) {
    return stepCount
  }
  return urlStepNumber
}

/**
 * Der Stand einer Herleitung: wie viele ihrer Schritte gezeigt sind. Er steht in der Adresse (`<Kennung>Step`), damit
 * Neuladen und ein weitergegebener Link dieselbe Zeile zeigen; der erste Schritt lässt den Parameter weg. Weiter und
 * zurück ersetzen den Eintrag im Verlauf (REPLACE): Es ist ein Blättern innerhalb der geöffneten Ansicht.
 */
export function useDerivationProgress(derivation: Derivation): DerivationProgress {
  const stepUrlParamName = derivation.key + STEP_URL_PARAM_SUFFIX
  const stepUrlParam = useUrlParam(stepUrlParamName)
  const stepCount = derivation.steps.length
  const shownStepCount = parseShownStepCount(stepUrlParam.value, stepCount)
  const hasPreviousStep = shownStepCount > 1
  const hasNextStep = shownStepCount < stepCount

  function showStepCount(changedShownStepCount: number) {
    let urlStepText: string | null = String(changedShownStepCount)
    if (changedShownStepCount <= 1) {
      urlStepText = null
    }
    stepUrlParam.changeValue(urlStepText, 'REPLACE')
  }

  function showNextStep() {
    if (!hasNextStep) {
      return
    }
    showStepCount(shownStepCount + 1)
  }

  function showPreviousStep() {
    if (!hasPreviousStep) {
      return
    }
    showStepCount(shownStepCount - 1)
  }

  return { shownStepCount, hasPreviousStep, hasNextStep, showNextStep, showPreviousStep }
}
