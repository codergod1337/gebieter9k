import type { SketchHighlightKey } from './SketchHighlightKey.ts'

/** Je Platz der Palette die CSS-Klasse, die seine Farbe setzt (Theme). */
const SKETCH_HIGHLIGHT_CLASS_NAMES: Record<SketchHighlightKey, string> = {
  FIRST: 'sketch-highlight-first',
  SECOND: 'sketch-highlight-second',
  THIRD: 'sketch-highlight-third',
  FOURTH: 'sketch-highlight-fourth',
  FIFTH: 'sketch-highlight-fifth',
}

/** Die CSS-Klasse zur Farbe einer Hervorhebung in einer Skizze. Ohne Hervorhebung (`null`) kommt ein leerer Text. */
export function getSketchHighlightClassName(highlightKey: SketchHighlightKey | null): string {
  if (highlightKey === null) {
    return ''
  }
  return SKETCH_HIGHLIGHT_CLASS_NAMES[highlightKey]
}
