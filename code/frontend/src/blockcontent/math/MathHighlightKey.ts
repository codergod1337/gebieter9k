/**
 * Die Farben, in denen ein Term hervorgehoben sein kann. Es sind Plätze einer Palette, keine festen Farbtöne: Welche
 * Farbe ein Platz hat, bestimmt das Theme (`--math-highlight-first` bis `--math-highlight-fifth`). Welcher Platz zu
 * welcher Größe gehört, legt die Seite fest, z. B. `x` auf dem ersten und `r` auf dem dritten.
 */
export type MathHighlightKey = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH'
