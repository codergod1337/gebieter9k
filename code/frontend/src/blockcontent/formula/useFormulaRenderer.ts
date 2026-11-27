import { useEffect, useState } from 'react'
import type { FormulaRenderer } from './FormulaRenderer.ts'

/** Rückmeldung von {@link useFormulaRenderer}. */
export type FormulaRendererState = {
  /** Der Setzer der Formeln; `null`, solange er noch lädt oder nicht geladen werden konnte. */
  formulaRenderer: FormulaRenderer | null
  /** Warum der Setzer nicht geladen werden konnte; `null` ohne Fehler. */
  errorMessage: string | null
}

/** Der Setzer, sobald er einmal geladen ist: Jede weitere Formel bekommt ihn sofort, ohne zu warten. */
let loadedFormulaRenderer: FormulaRenderer | null = null

/** Das laufende Laden; alle, die gleichzeitig eine Formel zeigen wollen, warten auf dasselbe. */
let formulaRendererLoading: Promise<FormulaRenderer> | null = null

/** Lädt den Setzer der Formeln nach (ein eigenes Stück der App, nur wo Formeln stehen) und merkt ihn sich. */
function loadFormulaRenderer(): Promise<FormulaRenderer> {
  if (formulaRendererLoading === null) {
    formulaRendererLoading = import('./MathLiveFormulaRenderer.ts').then((rendererModule) => {
      const formulaRenderer = new rendererModule.MathLiveFormulaRenderer()
      loadedFormulaRenderer = formulaRenderer
      return formulaRenderer
    })
    // nach einem Fehler (z. B. Netz weg) versucht es der nächste Aufruf noch einmal
    formulaRendererLoading.catch(() => {
      formulaRendererLoading = null
    })
  }
  return formulaRendererLoading
}

/**
 * Der Setzer der Formeln für eine Komponente. Die Bibliothek dahinter wird erst geladen, wenn die erste Formel gezeigt
 * werden soll; bis dahin ist der Setzer `null`.
 */
export function useFormulaRenderer(): FormulaRendererState {
  const [formulaRenderer, setFormulaRenderer] = useState<FormulaRenderer | null>(loadedFormulaRenderer)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (formulaRenderer !== null) {
      return
    }
    let stillShown = true
    loadFormulaRenderer()
      .then((loadedRenderer) => {
        if (stillShown) {
          setFormulaRenderer(loadedRenderer)
        }
      })
      .catch((caughtError: unknown) => {
        if (stillShown) {
          setErrorMessage(String(caughtError))
        }
      })
    return () => {
      stillShown = false
    }
  }, [formulaRenderer])

  return { formulaRenderer, errorMessage }
}
