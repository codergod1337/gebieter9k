import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import type { BlockJson, DerivationStepJson, EquationJson, OperationJson, QuantitiesJson, TermJson } from '../BlockContentJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { EditorAddButton, EditorCard, EditorRowButtons } from './EditorCard.tsx'
import { FormulaInput } from './FormulaInput.tsx'
import { moveListItem, removeListItem, replaceListItem } from './listChanges.ts'

type DerivationBlockJson = Extract<BlockJson, { type: 'DERIVATION' }>

type DerivationBlockCardProps = {
  derivationBlock: DerivationBlockJson
  quantities: QuantitiesJson
  onChange: (changedDerivationBlock: DerivationBlockJson) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

/** So trennt und verbindet das Feld mehrere Kennungen. */
const KEY_SEPARATOR = ','

function formatKeys(keys: string[] | undefined): string {
  return (keys ?? []).join(KEY_SEPARATOR + ' ')
}

function parseKeys(keysText: string): string[] {
  return keysText
    .split(KEY_SEPARATOR)
    .map((key) => key.trim())
    .filter((key) => key !== '')
}

/**
 * Die Karte einer Rechnung: Titel, Kennung und ihre Zeilen. Jede Zeile ist eine getippte Gleichung; ab der zweiten
 * steht darüber die Umformung, die sie aus der Zeile davor macht: die Notiz („·“, freiwillig), der Term dahinter
 * („r“), und die Kennungen der Terme, die sie in die neue Zeile bringt bzw. in der alten kürzt. Eine Beschreibung in
 * Worten gibt es nur, wo sie nötig ist.
 */
export function DerivationBlockCard({ derivationBlock, quantities, onChange, onMoveUp, onMoveDown, onRemove }: DerivationBlockCardProps) {
  const steps = derivationBlock.steps
  const lastStepIndex = steps.length - 1

  function changeSteps(changedSteps: DerivationStepJson[]) {
    // die erste Zeile ist der Ausgang und hat keine Umformung; jede weitere braucht eine (notfalls eine leere)
    const consistentSteps = changedSteps.map((step, stepIndex) => {
      if (stepIndex === 0) {
        return { equation: step.equation, explanation: step.explanation }
      }
      return { ...step, operation: step.operation ?? {} }
    })
    onChange({ ...derivationBlock, steps: consistentSteps })
  }

  function changeStep(stepIndex: number, changedStep: DerivationStepJson) {
    changeSteps(replaceListItem(steps, stepIndex, changedStep))
  }

  function changeOperation(stepIndex: number, changedOperation: OperationJson) {
    changeStep(stepIndex, { ...steps[stepIndex], operation: changedOperation })
  }

  function addStep() {
    const lastStep = steps[lastStepIndex]
    changeSteps([...steps, { operation: {}, equation: lastStep.equation }])
  }

  const header = (
    <>
      <Form.Control
        size="sm"
        aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.titleLabel)}
        placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.titleLabel)}
        value={derivationBlock.title}
        onChange={(changeEvent) => onChange({ ...derivationBlock, title: changeEvent.target.value })}
      />
      <Form.Control
        size="sm"
        className="blockcontent-editor-key-input"
        aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.derivationKey)}
        placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.derivationKey)}
        value={derivationBlock.key}
        onChange={(changeEvent) => onChange({ ...derivationBlock, key: changeEvent.target.value.trim() })}
      />
    </>
  )

  return (
    <EditorCard
      kindLabel={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.derivationLabel)}
      header={header}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}>
      {steps.map((step, stepIndex) => {
        let stepLabel = getTextInCurrentLanguageWithValues(BLOCK_CONTENT_EDITOR_TEXTS.stepNumber, { number: String(stepIndex + 1) })
        if (stepIndex === 0) {
          stepLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.stepStart)
        } else if (stepIndex === lastStepIndex) {
          stepLabel = getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.stepResult)
        }
        const operation = step.operation ?? {}
        const canRemove = steps.length > 1
        return (
          <div key={stepIndex} className="blockcontent-editor-part">
            {stepIndex > 0 && (
              <div className="blockcontent-editor-row blockcontent-editor-operation">
                <span className="blockcontent-editor-part-kind">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationLabel)}</span>
                <Form.Control
                  size="sm"
                  className="blockcontent-editor-short-input"
                  placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationNotation)}
                  aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationNotation)}
                  value={operation.notation ?? ''}
                  onChange={(changeEvent) => {
                    const changedNotation = changeEvent.target.value === '' ? null : changeEvent.target.value
                    changeOperation(stepIndex, { ...operation, notation: changedNotation })
                  }}
                />
                <FormulaInput
                  label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationOperand)}
                  kind="TERM"
                  optional
                  value={operation.operand ?? null}
                  quantities={quantities}
                  placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationOperand)}
                  onChange={(changedOperand) => changeOperation(stepIndex, { ...operation, operand: changedOperand as TermJson | null })}
                />
                <Form.Control
                  size="sm"
                  placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationApplies)}
                  aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationApplies)}
                  defaultValue={formatKeys(operation.applies)}
                  key={'applies-' + formatKeys(operation.applies)}
                  onBlur={(blurEvent) => changeOperation(stepIndex, { ...operation, applies: parseKeys(blurEvent.target.value) })}
                />
                <Form.Control
                  size="sm"
                  placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationCancels)}
                  aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.operationCancels)}
                  defaultValue={formatKeys(operation.cancels)}
                  key={'cancels-' + formatKeys(operation.cancels)}
                  onBlur={(blurEvent) => changeOperation(stepIndex, { ...operation, cancels: parseKeys(blurEvent.target.value) })}
                />
              </div>
            )}
            <div className="blockcontent-editor-row">
              <span className="blockcontent-editor-part-kind">{stepLabel}</span>
              <FormulaInput
                label={stepLabel}
                kind="EQUATION"
                value={step.equation}
                quantities={quantities}
                placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.stepEquationPlaceholder)}
                onChange={(changedEquation) => {
                  if (changedEquation !== null) {
                    changeStep(stepIndex, { ...step, equation: changedEquation as EquationJson })
                  }
                }}
              />
              <EditorRowButtons
                onMoveUp={() => changeSteps(moveListItem(steps, stepIndex, -1))}
                onMoveDown={() => changeSteps(moveListItem(steps, stepIndex, 1))}
                onRemove={canRemove ? () => changeSteps(removeListItem(steps, stepIndex)) : undefined}
              />
            </div>
            <div className="blockcontent-editor-row blockcontent-editor-row-indented">
              <Form.Control
                size="sm"
                placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.explanation)}
                aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.explanation)}
                value={step.explanation ?? ''}
                onChange={(changeEvent) => {
                  const changedExplanation = changeEvent.target.value === '' ? null : changeEvent.target.value
                  changeStep(stepIndex, { ...step, explanation: changedExplanation })
                }}
              />
            </div>
          </div>
        )
      })}
      <div className="blockcontent-editor-row">
        <EditorAddButton label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addStep)} onClick={addStep} />
      </div>
    </EditorCard>
  )
}
