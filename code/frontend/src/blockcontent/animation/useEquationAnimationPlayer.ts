import { type RefObject, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { EQUATION_GUID_ATTRIBUTE, EQUATION_SIDE_ATTRIBUTE } from '../elements/EquationElementView.tsx'
import { findFormulaIdElement } from '../formula/formulaIds.ts'
import type { EquationAnimation } from './EquationAnimation.ts'
import { type Flight, FlightAnimator } from './FlightAnimator.ts'

/** Rückmeldung von {@link useEquationAnimationPlayer}. */
export type EquationAnimationPlayer = {
  /** Für das Element, in dem alle Gleichungen des Inhalts stehen: die Ebene, in der die Teile wandern. */
  flightLayerRef: RefObject<HTMLDivElement | null>
  /** Ob in dieser Gleichung durchgestrichen steht, was ihre Animation kürzt: erst, nachdem sie abgespielt wurde. */
  isCancellationShown: (equationGuid: string) => boolean
  /** Spielt die Animation ab: von ihrer Gleichung zur nächsten (deren Kennung der Aufrufer nennt). */
  playAnimation: (equationAnimation: EquationAnimation, nextEquationGuid: string) => void
}

/** So findet man an einer Gleichung die Notiz ihrer Umformung und darin das Stück, aus dem neue Teile kommen. */
export const ANIMATION_CAUSE_ATTRIBUTE = 'data-animation-cause'
export const ANIMATION_CAUSE_SOURCE_ATTRIBUTE = 'data-animation-cause-source'

/** Die Dauer eines Flugs steht in animation.css, als Zahl in Millisekunden. 0 oder keine Angabe: kein Flug. */
const FLIGHT_DURATION_CSS_VARIABLE = '--animation-flight-milliseconds'

/** Wer im System weniger Bewegung wünscht, bekommt keinen Flug. */
const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

/** Die Dauer eines Flugs aus animation.css; 0, wenn sie fehlt oder keine Zahl ist. */
function readFlightDurationMilliseconds(flightLayer: HTMLElement): number {
  const flightLayerStyle = window.getComputedStyle(flightLayer)
  const durationText = flightLayerStyle.getPropertyValue(FLIGHT_DURATION_CSS_VARIABLE)
  const durationMilliseconds = Number.parseFloat(durationText)
  if (!Number.isFinite(durationMilliseconds)) {
    return 0
  }
  return durationMilliseconds
}

/** Die Zeile einer Gleichung in der Ebene; `null`, wenn sie gerade nicht gezeichnet ist (z. B. in einem geschlossenen Aufklapper). */
function findEquationRow(flightLayer: HTMLElement, equationGuid: string): HTMLElement | null {
  const equationRowSelector = '[' + EQUATION_GUID_ATTRIBUTE + '="' + CSS.escape(equationGuid) + '"]'
  return flightLayer.querySelector<HTMLElement>(equationRowSelector)
}

/** Auf welcher Seite der Gleichung ein Teil steht (`left`, `right`); `null`, wenn auf keiner. */
function getEquationSide(partElement: HTMLElement): string | null {
  const sideElement = partElement.closest<HTMLElement>('[' + EQUATION_SIDE_ATTRIBUTE + ']')
  if (sideElement === null) {
    return null
  }
  return sideElement.getAttribute(EQUATION_SIDE_ATTRIBUTE)
}

/**
 * Das Stück der Notiz, aus dem neue Teile kommen: ihr erster Teil mit id (z. B. nur das `r` in „· r“), sonst die ganze
 * Notiz; `null`, wenn die Gleichung keine Notiz hat.
 */
function findCauseSourceElement(equationRow: HTMLElement): HTMLElement | null {
  const causeSourceElement = equationRow.querySelector<HTMLElement>('[' + ANIMATION_CAUSE_SOURCE_ATTRIBUTE + ']')
  if (causeSourceElement === null) {
    return null
  }
  const markedPartElement = causeSourceElement.querySelector<HTMLElement>('[data-id]')
  if (markedPartElement !== null) {
    return markedPartElement
  }
  return causeSourceElement
}

/**
 * Das Abspielen der Animationen eines Inhalts (Paket `blockcontent/animation`): Aus dem, was eine Animation sagt
 * („r1 wandert zu r2“, „r3 wird gestrichen“), und den fertig gezeichneten Gleichungen werden die Elemente, die der
 * {@link FlightAnimator} bewegt. Jeder Übergang ist ein eigener Schritt (Nutzer 2026-11-27: „erst wurzelziehen über
 * beide seiten, und erst danach kürzen“): Eine Gleichung steht ohne Strich da; durchgestrichen wird erst, wenn man ihre
 * Animation abspielt, und der Strich bleibt danach stehen wie auf dem Papier, bis die Gleichung neu entsteht (die
 * Animation davor wird noch einmal abgespielt). Fehlt ein genannter Teil, wird er übersprungen. Ein laufendes Abspielen
 * bricht ab, sobald ein anderes beginnt oder der Inhalt verschwindet.
 */
export function useEquationAnimationPlayer(): EquationAnimationPlayer {
  const flightLayerRef = useRef<HTMLDivElement>(null)
  const runningAnimatorRef = useRef<FlightAnimator | null>(null)
  const [cancellationShownEquationGuids, setCancellationShownEquationGuids] = useState<string[]>([])

  useEffect(() => {
    return () => {
      const runningAnimator = runningAnimatorRef.current
      if (runningAnimator !== null) {
        runningAnimator.cancelFlight()
      }
    }
  }, [])

  function isCancellationShown(equationGuid: string) {
    return cancellationShownEquationGuids.includes(equationGuid)
  }

  function playAnimation(equationAnimation: EquationAnimation, nextEquationGuid: string) {
    const fromEquationGuid = equationAnimation.fromEquationGuid
    // sofort zeichnen: Die Gleichung zeigt ab jetzt, was gekürzt wird, die nächste steht wieder ohne Strich da; gleich
    // danach werden beide ausgemessen
    flushSync(() => {
      setCancellationShownEquationGuids((shownEquationGuids) => {
        const otherShownEquationGuids = shownEquationGuids.filter((shownEquationGuid) => {
          return shownEquationGuid !== fromEquationGuid && shownEquationGuid !== nextEquationGuid
        })
        return [...otherShownEquationGuids, fromEquationGuid]
      })
    })

    const flightLayer = flightLayerRef.current
    if (flightLayer === null) {
      return
    }
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY)
    if (reducedMotionQuery.matches) {
      return
    }
    const durationMilliseconds = readFlightDurationMilliseconds(flightLayer)
    if (durationMilliseconds <= 0) {
      return
    }
    const sourceRow = findEquationRow(flightLayer, fromEquationGuid)
    const targetRow = findEquationRow(flightLayer, nextEquationGuid)
    if (sourceRow === null || targetRow === null) {
      return
    }

    const causeElement = sourceRow.querySelector<HTMLElement>('[' + ANIMATION_CAUSE_ATTRIBUTE + ']')
    const causeSourceElement = findCauseSourceElement(sourceRow)
    const cancelledElements = [...sourceRow.querySelectorAll<HTMLElement>('[data-cancelled]')]
    const flights: Flight[] = []
    for (const action of equationAnimation.actions) {
      if (action.does === 'MOVES_TO') {
        const sourceElement = findFormulaIdElement(sourceRow, action.formulaId)
        const targetElement = findFormulaIdElement(targetRow, action.targetFormulaId)
        if (sourceElement !== null && targetElement !== null) {
          // wechselt der Teil die Seite der Gleichung, wandert er auf einem Bogen hinüber
          const changesSide = getEquationSide(sourceElement) !== getEquationSide(targetElement)
          flights.push({ sourceElement, targetElement, onArc: changesSide })
        }
      } else if (action.does === 'APPEARS') {
        const targetElement = findFormulaIdElement(targetRow, action.formulaId)
        if (causeSourceElement !== null && targetElement !== null) {
          flights.push({ sourceElement: causeSourceElement, targetElement, onArc: true })
        }
      }
    }

    const runningAnimator = runningAnimatorRef.current
    if (runningAnimator !== null) {
      runningAnimator.cancelFlight()
    }
    const flightAnimator = new FlightAnimator(flightLayer)
    runningAnimatorRef.current = flightAnimator
    flightAnimator.startFlight({ causeElement, cancelledElements, appearingElement: targetRow, flights }, durationMilliseconds)
  }

  return { flightLayerRef, isCancellationShown, playAnimation }
}
