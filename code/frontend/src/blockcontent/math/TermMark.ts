import type { MathHighlightKey } from './MathHighlightKey.ts'

/**
 * Die Marke an einem Term: Sie macht ihn über die Schritte einer Herleitung hinweg wiedererkennbar. Steht in zwei
 * aufeinanderfolgenden Schritten ein Term mit derselben Kennung, ist es derselbe Term, und die Anzeige führt ihn von
 * der alten an die neue Stelle. Beispiel: Aus `cos φ = x / r` wird `r · cos φ = x`; das `r` trägt in beiden Zeilen
 * die Kennung `radius` und dieselbe Farbe.
 */
export class TermMark {
  /** Die Kennung des Terms, z. B. `radius`. In einer Formel steht jede Kennung höchstens einmal. */
  readonly trackingKey: string

  /** In welcher Farbe der Term überall steht; `null` heißt in der Schriftfarbe der Formel. */
  readonly highlightKey: MathHighlightKey | null

  constructor(trackingKey: string, highlightKey: MathHighlightKey | null) {
    this.trackingKey = trackingKey
    this.highlightKey = highlightKey
  }
}
