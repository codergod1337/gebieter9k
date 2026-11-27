import { FormulaView } from '../formula/FormulaView.tsx'
import { splitLatexAtRelation } from '../formula/splitLatexAtRelation.ts'
import type { ElementViewProps } from './ElementViewProps.ts'
import { useEquationAddition } from './EquationAddition.ts'

/**
 * So findet ein anderes Paket (die Animation) die Zeile einer Gleichung im Dokument und darin die beiden Seiten:
 * `data-equation-id` an der Zeile, `data-equation-side` (`left`, `right`) an den Seiten.
 */
export const EQUATION_ID_ATTRIBUTE = 'data-equation-id'
export const EQUATION_SIDE_ATTRIBUTE = 'data-equation-side'

/**
 * Eine Gleichung in ihrer eigenen Zeile, rechts ihre laufende Nummer in Klammern wie in einem gesetzten Skript. Hat sie
 * ein Relationszeichen (`=`, `≈`, `⇒` …), steht es in der Mitte der Zeile: So stehen die Zeichen aufeinanderfolgender
 * Gleichungen untereinander. Hinter der rechten Seite steht, was ein anderes Paket anhängt ({@link useEquationAddition}),
 * z. B. die Notiz einer Umformung mit ihrem Abspiel-Knopf. Eine leere Gleichung (im Editor noch nicht gefüllt) zeigt
 * nur ihre Nummer.
 */
export function EquationElementView({ element }: ElementViewProps<'EQUATION'>) {
  const equationAddition = useEquationAddition()
  const cancelledFormulaIds = equationAddition.getCancelledFormulaIds(element.id)
  const addition = equationAddition.renderAddition(element)
  const relationSplit = splitLatexAtRelation(element.latex)
  const rowAttributes = { [EQUATION_ID_ATTRIBUTE]: element.id }
  const leftSideAttributes = { [EQUATION_SIDE_ATTRIBUTE]: 'left' }
  const rightSideAttributes = { [EQUATION_SIDE_ATTRIBUTE]: 'right' }
  const numberText = '(' + element.number + ')'

  if (relationSplit === null) {
    return (
      <div className="blockcontent-equation" {...rowAttributes}>
        <span className="blockcontent-equation-whole" {...leftSideAttributes}>
          <FormulaView latex={element.latex} displayMode="BLOCK" cancelledFormulaIds={cancelledFormulaIds} />
          {addition}
        </span>
        <span className="blockcontent-equation-number">{numberText}</span>
      </div>
    )
  }
  return (
    <div className="blockcontent-equation" {...rowAttributes}>
      <span className="blockcontent-equation-left" {...leftSideAttributes}>
        <FormulaView latex={relationSplit.left} displayMode="BLOCK" cancelledFormulaIds={cancelledFormulaIds} />
      </span>
      <span className="blockcontent-equation-relation">
        <FormulaView latex={relationSplit.relation} displayMode="BLOCK" />
      </span>
      <span className="blockcontent-equation-right" {...rightSideAttributes}>
        <FormulaView latex={relationSplit.right} displayMode="BLOCK" cancelledFormulaIds={cancelledFormulaIds} />
        {addition}
      </span>
      <span className="blockcontent-equation-number">{numberText}</span>
    </div>
  )
}
