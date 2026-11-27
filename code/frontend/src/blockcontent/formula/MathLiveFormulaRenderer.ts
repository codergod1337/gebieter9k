import { convertLatexToMarkup } from 'mathlive/ssr'
// Aussehen und Schriften der gesetzten Formeln; beides kommt mit der Bibliothek und wird erst mit ihr geladen
import 'mathlive/static.css'
import 'mathlive/fonts.css'
import type { FormulaDisplayMode, FormulaRenderer, RenderedFormula } from './FormulaRenderer.ts'

/**
 * Setzt Formeln mit MathLive (nur der Teil der Bibliothek, der setzt, ohne das Eingabefeld). MathLive schreibt Text und
 * Attribute selbst sicher ins HTML und weist Adressen wie `javascript:` ab; lässt sich etwas nicht setzen, kommt der
 * Grund zurück statt eines Fehlers, der die Seite mitreißt.
 */
export class MathLiveFormulaRenderer implements FormulaRenderer {
  renderFormula(latex: string, displayMode: FormulaDisplayMode): RenderedFormula {
    let defaultMode: 'math' | 'inline-math' = 'math'
    if (displayMode === 'INLINE') {
      defaultMode = 'inline-math'
    }
    try {
      const markup = convertLatexToMarkup(latex, { defaultMode })
      return { markup, problem: null }
    } catch (caughtError) {
      let problem = String(caughtError)
      if (caughtError instanceof Error) {
        problem = caughtError.message
      }
      return { markup: null, problem }
    }
  }
}
