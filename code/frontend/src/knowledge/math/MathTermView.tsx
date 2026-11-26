import type { MathTerm } from './MathTerm.ts'
import { MathTermReactRenderer } from './MathTermReactRenderer.tsx'

/** Der eine Zeichner für alle Formeln; er merkt sich nichts und kann deshalb geteilt werden. */
const MATH_TERM_REACT_RENDERER = new MathTermReactRenderer()

type MathTermViewProps = {
  term: MathTerm
}

/**
 * Zeichnet einen Term samt allem, was in ihm steckt. Ohne eigene Hülle: Schrift und Größe setzt das Element darum mit
 * der Klasse `math` (z. B. {@link EquationView} oder die Zeile einer Herleitung).
 */
export function MathTermView({ term }: MathTermViewProps) {
  const renderedTerm = term.accept(MATH_TERM_REACT_RENDERER)
  return <>{renderedTerm}</>
}
