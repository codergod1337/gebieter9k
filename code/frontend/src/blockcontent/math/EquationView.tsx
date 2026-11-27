import type { Equation } from './Equation.ts'
import { MathTermView } from './MathTermView.tsx'

type EquationViewProps = {
  equation: Equation
}

/** Eine Gleichung in einer Zeile, z. B. in einer Zusammenfassung: linke Seite, Gleichheitszeichen, rechte Seite. */
export function EquationView({ equation }: EquationViewProps) {
  return (
    <span className="math">
      <MathTermView term={equation.leftSide} />
      <span className="math-relation">=</span>
      <MathTermView term={equation.rightSide} />
    </span>
  )
}
