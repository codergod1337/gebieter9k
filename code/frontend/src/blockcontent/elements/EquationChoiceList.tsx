import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { FormulaView } from '../formula/FormulaView.tsx'
import type { EquationJson } from './ElementJson.ts'
import { ELEMENT_TEXTS } from './elementTexts.ts'

type EquationChoiceListProps = {
  /** Für Screenreader, z. B. „Gleichungen“. */
  label: string
  /** Die Gleichungen des Inhalts in ihrer Reihenfolge; ihre Stelle + 1 ist ihre Nummer. */
  equations: EquationJson[]
  /** Die Kennung der gerade gewählten Gleichung; ohne Angabe ist keine gewählt. */
  selectedEquationGuid?: string | null
  /** Die Kennungen der Gleichungen, die ein Zeichen tragen (z. B. „hat eine Animation“); ohne Angabe keine. */
  markedEquationGuids?: string[]
  /** Was das Zeichen bedeutet, für Screenreader. */
  markLabel?: string
  onChoose: (equationGuid: string) => void
}

const NO_MARKED_EQUATION_GUIDS: string[] = []

/**
 * Die Gleichungen eines Inhalts zur Wahl (die Übersicht „wie viele gleichungen wir auf einer seite haben, latex style“,
 * Nutzer 2026-11-27): je Gleichung eine Zeile mit ihrer Nummer und ihrer Formel; ein Klick wählt sie. Benutzt vom Popup
 * „Animationen“ und vom Verweis auf eine Gleichung im Text.
 */
export function EquationChoiceList({
  label,
  equations,
  selectedEquationGuid = null,
  markedEquationGuids = NO_MARKED_EQUATION_GUIDS,
  markLabel = '',
  onChoose,
}: EquationChoiceListProps) {
  if (equations.length === 0) {
    return <p className="equation-choice-empty">{getTextInCurrentLanguage(ELEMENT_TEXTS.noEquations)}</p>
  }
  return (
    <div className="equation-choice-list" role="listbox" aria-label={label}>
      {equations.map((equation, equationIndex) => {
        const selected = equation.guid === selectedEquationGuid
        const marked = markedEquationGuids.includes(equation.guid)
        let rowClassName = 'equation-choice'
        if (selected) {
          rowClassName = 'equation-choice equation-choice-selected'
        }
        return (
          <button key={equation.guid} type="button" role="option" aria-selected={selected} className={rowClassName} onClick={() => onChoose(equation.guid)}>
            <span className="equation-choice-number">({equationIndex + 1})</span>
            <FormulaView latex={equation.latex} displayMode="INLINE" />
            {marked && <i className="bi bi-play-circle equation-choice-mark" role="img" aria-label={markLabel}></i>}
          </button>
        )
      })}
    </div>
  )
}
