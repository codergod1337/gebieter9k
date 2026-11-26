import { type RefObject, useLayoutEffect, useRef } from 'react'
import { TermFlightAnimator } from './TermFlightAnimator.ts'

/** Die Dauer eines Flugs steht im Theme, als Zahl in Millisekunden. 0 oder keine Angabe: kein Flug. */
const FLIGHT_DURATION_CSS_VARIABLE = '--math-flight-milliseconds'

/** Wer im System weniger Bewegung wünscht, bekommt die neue Zeile ohne Flug. */
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
 * Lässt die Terme wandern, sobald eine Herleitung genau einen Schritt weiter gezeigt wird: von der Zeile davor in die
 * neue ({@link TermFlightAnimator}). Beim ersten Anzeigen, beim Zurückgehen und bei einem Sprung über mehrere Schritte
 * (Adresse von Hand geändert) fliegt nichts.
 *
 * @returns die Referenz für das Element, in dem die Zeilen der Schritte stehen (jede mit `data-step-index`)
 */
export function useDerivationStepFlight(shownStepCount: number): RefObject<HTMLDivElement | null> {
  const stepsContainerRef = useRef<HTMLDivElement>(null)
  const previousShownStepCountRef = useRef<number>(shownStepCount)

  // Vor dem Malen: Die neue Zeile steht schon im Dokument und lässt sich ausmessen, ist aber noch nicht zu sehen
  useLayoutEffect(() => {
    const previousShownStepCount = previousShownStepCountRef.current
    previousShownStepCountRef.current = shownStepCount
    const stepsContainer = stepsContainerRef.current
    if (stepsContainer === null) {
      return undefined
    }
    const oneStepFurther = shownStepCount === previousShownStepCount + 1
    if (!oneStepFurther) {
      return undefined
    }
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY)
    if (reducedMotionQuery.matches) {
      return undefined
    }
    const durationMilliseconds = readFlightDurationMilliseconds(stepsContainer)
    if (durationMilliseconds <= 0) {
      return undefined
    }
    const sourceRow = findStepRow(stepsContainer, shownStepCount - 2)
    const targetRow = findStepRow(stepsContainer, shownStepCount - 1)
    if (sourceRow === null || targetRow === null) {
      return undefined
    }
    const termFlightAnimator = new TermFlightAnimator(stepsContainer)
    termFlightAnimator.startFlight(sourceRow, targetRow, durationMilliseconds)
    return () => {
      termFlightAnimator.cancelFlight()
    }
  }, [shownStepCount])

  return stepsContainerRef
}
