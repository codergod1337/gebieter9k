import type { MathTerm } from './MathTerm.ts'
import { MathTermReactRenderer } from './MathTermReactRenderer.tsx'
import { NO_TERM_ROLES, type TermRoles } from './TermRoles.ts'

/** Der Zeichner für alle Formeln, in denen kein Term eine besondere Rolle hat; er merkt sich nichts. */
const PLAIN_MATH_TERM_RENDERER = new MathTermReactRenderer(NO_TERM_ROLES)

type MathTermViewProps = {
  term: MathTerm
  /**
   * Optional, in einer Zeile einer Herleitung: welche markierten Terme hier gekürzt werden oder von der Umformung
   * gebracht wurden ({@link TermRoles}).
   */
  termRoles?: TermRoles
}

/**
 * Zeichnet einen Term samt allem, was in ihm steckt. Ohne eigene Hülle: Schrift und Größe setzt das Element darum mit
 * der Klasse `math` (z. B. {@link EquationView} oder die Zeile einer Herleitung).
 */
export function MathTermView({ term, termRoles }: MathTermViewProps) {
  let mathTermRenderer = PLAIN_MATH_TERM_RENDERER
  if (termRoles !== undefined) {
    mathTermRenderer = new MathTermReactRenderer(termRoles)
  }
  const renderedTerm = term.accept(mathTermRenderer)
  return <>{renderedTerm}</>
}
