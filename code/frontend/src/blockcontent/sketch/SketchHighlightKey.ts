/**
 * Die Farben, in denen eine Strecke oder ein Winkel einer Skizze hervorgehoben sein kann. Es sind Plätze einer Palette,
 * keine festen Farbtöne: Welche Farbe ein Platz hat, bestimmt das Theme (`--sketch-highlight-first` bis
 * `--sketch-highlight-fifth`).
 */
export type SketchHighlightKey = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH'

/** Alle Plätze der Palette in ihrer Reihenfolge. */
export const SKETCH_HIGHLIGHT_KEYS: SketchHighlightKey[] = ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH']
