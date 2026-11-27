import { type RefObject, useEffect, useRef } from 'react'
import { TermFlightAnimator } from './TermFlightAnimator.ts'

/** Rückmeldung von {@link useDerivationFlight}. */
export type DerivationFlight = {
  /** Für das Element, in dem die Zeilen der Schritte stehen (jede mit `data-step-index`). */
  stepsContainerRef: RefObject<HTMLDivElement | null>
  /** Spielt die Umformung ab, die in den Schritt mit diesem Platz führt (ab 1): von der Zeile davor in seine Zeile. */
  playTransformationInto: (targetStepIndex: number) => void
}

/** Die Dauer eines Flugs steht im Theme, als Zahl in Millisekunden. 0 oder keine Angabe: kein Flug. */
const FLIGHT_DURATION_CSS_VARIABLE = '--math-flight-milliseconds'

/** Wer im System weniger Bewegung wünscht, bekommt keinen Flug. */
const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

/** Die Dauer eines Flugs aus dem Theme; 0, wenn sie fehlt oder keine Zahl ist. */
function readFlightDurationMilliseconds(stepsContainer: HTMLElement): number {
  const stepsContainerStyle = window.getComputedStyle(stepsContainer)
  const durationText = stepsContainerStyle.getPropertyValue(FLIGHT_DURATION_CSS_VARIABLE)
  const durationMilliseconds = Number.parseFloat(durationText)
  if (!Number.isFinite(durationMilliseconds)) {
    return 0
  }
  return durationMilliseconds
}

/** Die Zeile eines Schritts im Bereich der Schritte, `null` wenn sie nicht gezeichnet ist. */
function findStepRow(stepsContainer: HTMLElement, stepIndex: number): HTMLElement | null {
  const stepRowSelector = '[data-step-index="' + stepIndex + '"]'
  return stepsContainer.querySelector<HTMLElement>(stepRowSelector)
}

/**
 * Das Abspielen einer einzelnen Umformung in einer Herleitung: Die Terme wandern von der Zeile davor in die Zeile des
 * Schritts ({@link TermFlightAnimator}). Beide Zeilen stehen dabei schon da und bleiben stehen; man kann jede
 * Umformung beliebig oft und in beliebiger Reihenfolge ansehen. Eine laufende Umformung bricht ab, sobald eine andere
 * beginnt oder die Herleitung verschwindet.
 */
export function useDerivationFlight(): DerivationFlight {
  const stepsContainerRef = useRef<HTMLDivElement>(null)
  const runningAnimatorRef = useRef<TermFlightAnimator | null>(null)

  useEffect(() => {
    return () => {
      const runningAnimator = runningAnimatorRef.current
      if (runningAnimator !== null) {
        runningAnimator.cancelFlight()
      }
    }
  }, [])

  function playTransformationInto(targetStepIndex: number) {
    const stepsContainer = stepsContainerRef.current
    if (stepsContainer === null) {
      return
    }
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY)
    if (reducedMotionQuery.matches) {
      return
    }
    const durationMilliseconds = readFlightDurationMilliseconds(stepsContainer)
    if (durationMilliseconds <= 0) {
      return
    }
    const sourceRow = findStepRow(stepsContainer, targetStepIndex - 1)
    const targetRow = findStepRow(stepsContainer, targetStepIndex)
    if (sourceRow === null || targetRow === null) {
      return
    }
    const runningAnimator = runningAnimatorRef.current
    if (runningAnimator !== null) {
      runningAnimator.cancelFlight()
    }
    const termFlightAnimator = new TermFlightAnimator(stepsContainer)
    runningAnimatorRef.current = termFlightAnimator
    termFlightAnimator.startFlight(sourceRow, targetRow, durationMilliseconds)
  }

  return { stepsContainerRef, playTransformationInto }
}
