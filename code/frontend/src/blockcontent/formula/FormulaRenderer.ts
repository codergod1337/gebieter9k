/**
 * Wie eine Formel gesetzt wird: als eigene Zeile (große Brüche, Grenzen über und unter dem Zeichen) oder mitten im
 * Satz (flach, in der Höhe der Zeile).
 */
export type FormulaDisplayMode = 'BLOCK' | 'INLINE'

/** Eine gesetzte Formel: ihr HTML, oder der Grund, warum sie sich nicht setzen ließ. */
export type RenderedFormula = { markup: string; problem: null } | { markup: null; problem: string }

/**
 * Setzt eine Formel aus ihrem LaTeX. Der Rest der App kennt nur diese Schnittstelle, nicht die Bibliothek dahinter
 * ({@link MathLiveFormulaRenderer}): Wird die Bibliothek getauscht, ändert sich nur das Paket `blockcontent/formula`.
 */
export type FormulaRenderer = {
  renderFormula: (latex: string, displayMode: FormulaDisplayMode) => RenderedFormula
}
