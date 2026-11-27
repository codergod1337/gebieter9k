/** Die Zeichen einer Formel, die mit ihrem Inhalt in die Höhe wachsen. */
export type MathStretchySignShape = 'ROOT' | 'LEFT_PARENTHESIS' | 'RIGHT_PARENTHESIS'

/**
 * Je Zeichen sein Strich in einem Feld von 10 × 20 Einheiten. Das Feld wird auf die Höhe des Inhalts gezogen; der
 * Strich bleibt dabei gleich dick (`vector-effect` in base.css).
 */
const MATH_STRETCHY_SIGN_PATHS: Record<MathStretchySignShape, string> = {
  // kleiner Anstrich, Haken nach unten, dann hoch bis an die Linie über dem Radikanden
  ROOT: 'M 0.6 12.4 L 2.8 11.2 L 5.6 19.2 L 9.6 0.5 L 10 0.5',
  LEFT_PARENTHESIS: 'M 7.6 0.4 Q 1.2 10 7.6 19.6',
  RIGHT_PARENTHESIS: 'M 2.4 0.4 Q 8.8 10 2.4 19.6',
}

type MathStretchySignProps = {
  shape: MathStretchySignShape
}

/**
 * Ein Zeichen, das so hoch wird wie sein Inhalt: das Wurzelzeichen oder eine runde Klammer, als kleines SVG. Es füllt
 * das Element, in dem es steht; dessen Höhe gibt der Inhalt daneben vor. Die Farbe ist die Schriftfarbe.
 */
export function MathStretchySign({ shape }: MathStretchySignProps) {
  const signPath = MATH_STRETCHY_SIGN_PATHS[shape]
  return (
    <svg className="math-stretchy-sign" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={signPath} />
    </svg>
  )
}
