import { useState } from 'react'
import { flushSync } from 'react-dom'

/** Rückmeldung von {@link useDerivationCancellations}. */
export type DerivationCancellations = {
  /** Ob in der Zeile dieses Schritts durchgestrichen steht, was die Umformung zur nächsten Zeile kürzt. */
  isCancellationShown: (stepIndex: number) => boolean
  /**
   * Vor dem Abspielen der Umformung in den Schritt mit diesem Platz (ab 1): Die Zeile davor zeigt ab jetzt, was diese
   * Umformung kürzt; die Zeile, die entsteht, steht wieder ohne Strich da. Gilt sofort, noch vor dem nächsten Zeichnen.
   */
  showCancellationOfTransformationInto: (targetStepIndex: number) => void
  /** Alle Zeilen wieder ohne Strich, z. B. wenn der Rechenweg ausgeblendet wird. */
  resetCancellations: () => void
}

/**
 * Welche Zeilen einer Herleitung gerade zeigen, was gekürzt wird (Nutzer 2026-11-27: Schritte, nicht alles in einer
 * Animation, „erst wurzelziehen über beide seiten, und erst danach kürzen“). Eine Zeile entsteht deshalb immer ohne
 * Strich. Durchgestrichen wird erst, wenn man die Umformung abspielt, die kürzt; der Strich bleibt danach stehen wie auf
 * dem Papier, bis die Zeile neu entsteht (die Umformung davor wird noch einmal abgespielt) oder der Rechenweg
 * ausgeblendet wird.
 */
export function useDerivationCancellations(): DerivationCancellations {
  const [cancellationShownStepIndexes, setCancellationShownStepIndexes] = useState<number[]>([])

  function isCancellationShown(stepIndex: number) {
    return cancellationShownStepIndexes.includes(stepIndex)
  }

  function showCancellationOfTransformationInto(targetStepIndex: number) {
    const sourceStepIndex = targetStepIndex - 1
    // sofort zeichnen: Der Animator misst gleich danach die Zeilen aus und zieht den Strich durch das Gekürzte
    flushSync(() => {
      setCancellationShownStepIndexes((shownStepIndexes) => {
        const otherShownStepIndexes = shownStepIndexes.filter((shownStepIndex) => {
          return shownStepIndex !== sourceStepIndex && shownStepIndex !== targetStepIndex
        })
        return [...otherShownStepIndexes, sourceStepIndex]
      })
    })
  }

  function resetCancellations() {
    setCancellationShownStepIndexes([])
  }

  return { isCancellationShown, showCancellationOfTransformationInto, resetCancellations }
}
