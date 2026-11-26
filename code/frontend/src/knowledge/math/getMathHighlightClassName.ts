import type { MathHighlightKey } from './MathHighlightKey.ts'

/** Je Platz der Palette die CSS-Klasse, die seine Farbe setzt (Theme). */
const MATH_HIGHLIGHT_CLASS_NAMES: Record<MathHighlightKey, string> = {
  FIRST: 'math-highlight-first',
  SECOND: 'math-highlight-second',
  THIRD: 'math-highlight-third',
  FOURTH: 'math-highlight-fourth',
  FIFTH: 'math-highlight-fifth',
}

/**
 * Die CSS-Klasse zur Farbe einer Hervorhebung, für Formeln und für Skizzen: So trägt `r` in der Skizze dieselbe Farbe
 * wie in jeder Formel. Ohne Hervorhebung (`null`) kommt ein leerer Text.
 */
export function getMathHighlightClassName(highlightKey: MathHighlightKey | null): string {
  if (highlightKey === null) {
    return ''
  }
  return MATH_HIGHLIGHT_CLASS_NAMES[highlightKey]
}
