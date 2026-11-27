import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { EquationJson } from '../elements/ElementJson.ts'
import { FormulaField } from '../formula/FormulaField.tsx'
import { readFormulaIds } from '../formula/formulaIds.ts'
import { FormulaView } from '../formula/FormulaView.tsx'
import { ANIMATION_TEXTS } from './animationTexts.ts'
import {
  changeAnimationNote,
  changeSourcePartBehaviour,
  changeTargetPartAppearing,
  findSourceOfTargetPart,
  getSourcePartBehaviour,
  isTargetPartAppearing,
  type SourcePartBehaviour,
} from './equationAnimationChanges.ts'
import type { EquationAnimationJson } from './EquationAnimationJson.ts'

type EquationAnimationEditorProps = {
  /** Die Gleichung, von der der Übergang ausgeht, und ihre Nummer. */
  equation: EquationJson
  equationNumber: number
  /** Die nächste Gleichung im Inhalt; `null` bei der letzten. */
  nextEquation: EquationJson | null
  /** Die Animation des Übergangs; `null`, wenn es noch keine gibt. */
  animation: EquationAnimationJson | null
  /** Die geänderte Animation; `null` heißt: entfernen. */
  onAnimationChange: (changedAnimation: EquationAnimationJson | null) => void
}

/** Die Werte der Auswahl „Was geschieht mit dem Teil“; hinter `MOVES_TO:` steht die id des Ziels. */
const STAYS_VALUE = 'STAYS'
const CANCELLED_VALUE = 'CANCELLED'
const MOVES_TO_VALUE_PREFIX = 'MOVES_TO:'
const TARGET_PLAIN_VALUE = 'PLAIN'
const TARGET_APPEARS_VALUE = 'APPEARS'

/** Das Verhalten als Wert der Auswahl. */
function formatBehaviourValue(behaviour: SourcePartBehaviour): string {
  if (behaviour.does === 'MOVES_TO') {
    return MOVES_TO_VALUE_PREFIX + behaviour.target
  }
  if (behaviour.does === 'CANCELLED') {
    return CANCELLED_VALUE
  }
  return STAYS_VALUE
}

/** Der Wert der Auswahl als Verhalten. */
function parseBehaviourValue(behaviourValue: string): SourcePartBehaviour {
  if (behaviourValue.startsWith(MOVES_TO_VALUE_PREFIX)) {
    const target = behaviourValue.slice(MOVES_TO_VALUE_PREFIX.length)
    return { does: 'MOVES_TO', target }
  }
  if (behaviourValue === CANCELLED_VALUE) {
    return { does: 'CANCELLED' }
  }
  return { does: 'STAYS' }
}

/**
 * Die Animation EINES Übergangs zum Festlegen (Nutzer 2026-11-27: „welches element mit welcher id sich wie in der
 * nächsten gleichungsnummer verhält“): oben die Gleichung und die nächste, gesetzt; dann die Notiz der Umformung; dann
 * je id der Gleichung, was mit dem Teil geschieht (bleibt stehen, wird gestrichen, wandert zu einer id der nächsten),
 * und je id der nächsten Gleichung, ob der Teil einfach dasteht oder aus der Notiz kommt. Jede Änderung gilt sofort.
 */
export function EquationAnimationEditor({ equation, equationNumber, nextEquation, animation, onAnimationChange }: EquationAnimationEditorProps) {
  if (nextEquation === null) {
    return <p className="equation-animation-editor-hint">{getTextInCurrentLanguage(ANIMATION_TEXTS.lastEquation)}</p>
  }
  const nextEquationNumber = equationNumber + 1
  const numberValues = { fromNumber: String(equationNumber), toNumber: String(nextEquationNumber) }
  const sourceFormulaIds = readFormulaIds(equation.latex)
  const targetFormulaIds = readFormulaIds(nextEquation.latex)
  const noteLabel = getTextInCurrentLanguage(ANIMATION_TEXTS.noteLabel)
  const note = animation?.note ?? ''

  return (
    <div className="equation-animation-editor">
      <h3 className="equation-animation-editor-title">{getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.transitionTitle, numberValues)}</h3>
      <div className="equation-animation-editor-equation">
        <span className="equation-animation-editor-label">
          {getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.fromLabel, { number: String(equationNumber) })}
        </span>
        <FormulaView latex={equation.latex} displayMode="BLOCK" />
      </div>
      <div className="equation-animation-editor-equation">
        <span className="equation-animation-editor-label">
          {getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.toLabel, { number: String(nextEquationNumber) })}
        </span>
        <FormulaView latex={nextEquation.latex} displayMode="BLOCK" />
      </div>

      <div className="equation-animation-editor-section">
        <span className="equation-animation-editor-label">{noteLabel}</span>
        <FormulaField
          label={noteLabel}
          latex={note}
          onLatexChange={(changedNote) => onAnimationChange(changeAnimationNote(animation, equation.id, changedNote))}
        />
      </div>

      <div className="equation-animation-editor-section">
        <span className="equation-animation-editor-label">
          {getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.sourcePartsTitle, { number: String(equationNumber) })}
        </span>
        {sourceFormulaIds.length === 0 && (
          <p className="equation-animation-editor-hint">{getTextInCurrentLanguage(ANIMATION_TEXTS.noSourceIds)}</p>
        )}
        {sourceFormulaIds.map((formulaId) => {
          const behaviour = getSourcePartBehaviour(animation, formulaId)
          const behaviourLabel = getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.behaviourLabel, { formulaId })
          return (
            <div key={formulaId} className="equation-animation-editor-part">
              <span className="equation-animation-editor-id">{formulaId}</span>
              <Form.Select
                size="sm"
                aria-label={behaviourLabel}
                value={formatBehaviourValue(behaviour)}
                onChange={(changeEvent) => {
                  const changedBehaviour = parseBehaviourValue(changeEvent.target.value)
                  onAnimationChange(changeSourcePartBehaviour(animation, equation.id, formulaId, changedBehaviour))
                }}>
                <option value={STAYS_VALUE}>{getTextInCurrentLanguage(ANIMATION_TEXTS.staysBehaviour)}</option>
                <option value={CANCELLED_VALUE}>{getTextInCurrentLanguage(ANIMATION_TEXTS.cancelledBehaviour)}</option>
                {targetFormulaIds.map((targetFormulaId) => (
                  <option key={targetFormulaId} value={MOVES_TO_VALUE_PREFIX + targetFormulaId}>
                    {getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.movesToBehaviour, { targetFormulaId })}
                  </option>
                ))}
              </Form.Select>
            </div>
          )
        })}
      </div>

      <div className="equation-animation-editor-section">
        <span className="equation-animation-editor-label">
          {getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.targetPartsTitle, { number: String(nextEquationNumber) })}
        </span>
        {targetFormulaIds.length === 0 && (
          <p className="equation-animation-editor-hint">{getTextInCurrentLanguage(ANIMATION_TEXTS.noTargetIds)}</p>
        )}
        {targetFormulaIds.map((formulaId) => {
          const sourceFormulaId = findSourceOfTargetPart(animation, formulaId)
          const behaviourLabel = getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.behaviourLabel, { formulaId })
          if (sourceFormulaId !== null) {
            return (
              <div key={formulaId} className="equation-animation-editor-part">
                <span className="equation-animation-editor-id">{formulaId}</span>
                <span className="equation-animation-editor-fixed">
                  {getTextInCurrentLanguageWithValues(ANIMATION_TEXTS.targetOfMove, { formulaId: sourceFormulaId })}
                </span>
              </div>
            )
          }
          let targetValue = TARGET_PLAIN_VALUE
          if (isTargetPartAppearing(animation, formulaId)) {
            targetValue = TARGET_APPEARS_VALUE
          }
          return (
            <div key={formulaId} className="equation-animation-editor-part">
              <span className="equation-animation-editor-id">{formulaId}</span>
              <Form.Select
                size="sm"
                aria-label={behaviourLabel}
                value={targetValue}
                onChange={(changeEvent) => {
                  const appearing = changeEvent.target.value === TARGET_APPEARS_VALUE
                  onAnimationChange(changeTargetPartAppearing(animation, equation.id, formulaId, appearing))
                }}>
                <option value={TARGET_PLAIN_VALUE}>{getTextInCurrentLanguage(ANIMATION_TEXTS.targetPlainBehaviour)}</option>
                <option value={TARGET_APPEARS_VALUE}>{getTextInCurrentLanguage(ANIMATION_TEXTS.targetAppearsBehaviour)}</option>
              </Form.Select>
            </div>
          )
        })}
      </div>

      {animation !== null && (
        <div className="equation-animation-editor-section">
          <Button size="sm" variant="outline-danger" onClick={() => onAnimationChange(null)}>
            {getTextInCurrentLanguage(ANIMATION_TEXTS.removeAnimation)}
          </Button>
        </div>
      )}
    </div>
  )
}
