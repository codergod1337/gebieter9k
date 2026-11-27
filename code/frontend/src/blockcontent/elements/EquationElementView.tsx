import { Link, useLocation } from 'react-router'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { getEquationAnchorId, getEquationHash } from '../equationAnchor.ts'
import { FormulaView } from '../formula/FormulaView.tsx'
import { splitLatexAtRelation } from '../formula/splitLatexAtRelation.ts'
import { ELEMENT_TEXTS } from './elementTexts.ts'
import type { ElementViewProps } from './ElementViewProps.ts'
import { useEquationAddition } from './EquationAddition.ts'
import { useTargetedEquationGuid } from './EquationTargetContext.ts'

/**
 * So findet ein anderes Paket (die Animation) die Zeile einer Gleichung im Dokument und darin die beiden Seiten:
 * `data-equation-guid` an der Zeile, `data-equation-side` (`left`, `right`) an den Seiten.
 */
export const EQUATION_GUID_ATTRIBUTE = 'data-equation-guid'
export const EQUATION_SIDE_ATTRIBUTE = 'data-equation-side'

/**
 * Eine Gleichung in ihrer eigenen Zeile, rechts ihre laufende Nummer in Klammern wie in einem gesetzten Skript. Hat sie
 * ein Relationszeichen (`=`, `≈`, `⇒` …), steht es in der Mitte der Zeile: So stehen die Zeichen aufeinanderfolgender
 * Gleichungen untereinander. Hinter der rechten Seite steht, was ein anderes Paket anhängt ({@link useEquationAddition}),
 * z. B. die Notiz einer Umformung mit ihrem Abspiel-Knopf. Eine leere Gleichung (im Editor noch nicht gefüllt) zeigt
 * nur ihre Nummer.
 *
 * Die Zeile ist ein Ziel in der Adresse (`#eq-<guid>`), und ihre Nummer ist der Link dorthin (Nutzer 2026-11-27: „ich
 * möchte die auch verlinken“): Ein Klick setzt den Anker in die Adresse, die sich dann kopieren und weitergeben lässt.
 * Meint die Adresse diese Gleichung, hebt sich die Zeile hervor.
 */
export function EquationElementView({ element }: ElementViewProps<'EQUATION'>) {
  const equationAddition = useEquationAddition()
  const targetedEquationGuid = useTargetedEquationGuid()
  const location = useLocation()
  const cancelledFormulaIds = equationAddition.getCancelledFormulaIds(element.guid)
  const addition = equationAddition.renderAddition(element)
  const relationSplit = splitLatexAtRelation(element.latex)
  const rowAttributes = { [EQUATION_GUID_ATTRIBUTE]: element.guid }
  const leftSideAttributes = { [EQUATION_SIDE_ATTRIBUTE]: 'left' }
  const rightSideAttributes = { [EQUATION_SIDE_ATTRIBUTE]: 'right' }
  const equationAnchorId = getEquationAnchorId(element.guid)
  const equationHash = getEquationHash(element.guid)
  const numberText = '(' + element.number + ')'
  let rowClassName = 'blockcontent-equation'
  if (targetedEquationGuid === element.guid) {
    rowClassName = 'blockcontent-equation blockcontent-equation-targeted'
  }
  const numberLink = (
    <Hoverlay text={getTextInCurrentLanguageWithValues(ELEMENT_TEXTS.equationLink, { number: String(element.number) })}>
      <Link className="blockcontent-equation-number" replace to={{ search: location.search, hash: equationHash }} state={location.state}>
        {numberText}
      </Link>
    </Hoverlay>
  )

  if (relationSplit === null) {
    return (
      <div id={equationAnchorId} className={rowClassName} {...rowAttributes}>
        <span className="blockcontent-equation-whole" {...leftSideAttributes}>
          <FormulaView latex={element.latex} displayMode="BLOCK" cancelledFormulaIds={cancelledFormulaIds} />
          {addition}
        </span>
        {numberLink}
      </div>
    )
  }
  return (
    <div id={equationAnchorId} className={rowClassName} {...rowAttributes}>
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
      {numberLink}
    </div>
  )
}
