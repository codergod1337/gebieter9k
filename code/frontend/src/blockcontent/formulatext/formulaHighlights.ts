/**
 * Die Farben einer Marke im Formeltext: hinter dem Namen als Ziffer, z. B. `2#quadrat:5`. `0` heißt ausdrücklich
 * „keine Farbe“; ohne Ziffer erbt ein Zeichen die Farbe der Größe, die so aussieht (z. B. `r#faktor` die von r).
 */
export const HIGHLIGHT_KEYS_BY_DIGIT: Record<string, string | null> = {
  '0': null,
  '1': 'FIRST',
  '2': 'SECOND',
  '3': 'THIRD',
  '4': 'FOURTH',
  '5': 'FIFTH',
}

/** Die Ziffer zu einer Farbe; `0` für keine. */
export function getHighlightDigit(highlightKey: string | null): string {
  for (const digit of Object.keys(HIGHLIGHT_KEYS_BY_DIGIT)) {
    if (HIGHLIGHT_KEYS_BY_DIGIT[digit] === highlightKey) {
      return digit
    }
  }
  return '0'
}
