import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { BlockJson, BoxPartJson, EquationJson, QuantitiesJson, SketchJson } from '../BlockContentJson.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { EditorAddButton, EditorCard, EditorRowButtons } from './EditorCard.tsx'
import { FormulaInput } from './FormulaInput.tsx'
import { InlineTextArea } from './InlineTextArea.tsx'
import { moveListItem, removeListItem, replaceListItem } from './listChanges.ts'
import { SketchEditor } from './SketchEditor.tsx'

type BoxBlockJson = Extract<BlockJson, { type: 'BOX' }>

type BoxBlockCardProps = {
  boxBlock: BoxBlockJson
  quantities: QuantitiesJson
  onChange: (changedBoxBlock: BoxBlockJson) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

/** Eine neue Gleichung, bis man sie tippt: links und rechts ein Platzhalter. */
const EMPTY_EQUATION: EquationJson = { left: { type: 'SYMBOL', text: 'a' }, right: { type: 'SYMBOL', text: 'b' } }

/**
 * Die Karte eines Kastens: sein Titel und seine Teile untereinander (Absatz, Hinweis, Gleichungen), jeder mit seinen
 * Feldern und Knöpfen zum Verschieben und Entfernen; unten hängt man neue Teile an. Die Skizze des Kastens steht
 * darunter als Liste ihrer Elemente ({@link SketchEditor}).
 */
export function BoxBlockCard({ boxBlock, quantities, onChange, onMoveUp, onMoveDown, onRemove }: BoxBlockCardProps) {
  const sketch = boxBlock.sketch ?? null

  function changeParts(changedParts: BoxPartJson[]) {
    onChange({ ...boxBlock, parts: changedParts })
  }

  function changePart(partIndex: number, changedPart: BoxPartJson) {
    changeParts(replaceListItem(boxBlock.parts, partIndex, changedPart))
  }

  function addSketch() {
    const newSketch: SketchJson = {
      width: 340,
      height: 280,
      originX: 52,
      originY: 228,
      unitLength: 48,
      axisMaxX: 5.6,
      axisMaxY: 4.3,
      description: boxBlock.title,
      elements: [],
    }
    onChange({ ...boxBlock, sketch: newSketch })
  }

  const titleInput = (
    <Form.Control
      size="sm"
      aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.titleLabel)}
      placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.titleLabel)}
      value={boxBlock.title}
      onChange={(changeEvent) => onChange({ ...boxBlock, title: changeEvent.target.value })}
    />
  )

  return (
    <EditorCard
      kindLabel={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.boxLabel)}
      header={titleInput}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}>
      {boxBlock.parts.map((part, partIndex) => {
        const partButtons = (
          <EditorRowButtons
            onMoveUp={() => changeParts(moveListItem(boxBlock.parts, partIndex, -1))}
            onMoveDown={() => changeParts(moveListItem(boxBlock.parts, partIndex, 1))}
            onRemove={() => changeParts(removeListItem(boxBlock.parts, partIndex))}
          />
        )
        if (part.type === 'EQUATIONS') {
          return (
            <div key={partIndex} className="blockcontent-editor-part">
              <div className="blockcontent-editor-row">
                <span className="blockcontent-editor-part-kind">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationsLabel)}</span>
                <Form.Control
                  size="sm"
                  placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationsHeading)}
                  aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationsHeading)}
                  value={part.heading ?? ''}
                  onChange={(changeEvent) => {
                    const changedHeading = changeEvent.target.value === '' ? null : changeEvent.target.value
                    changePart(partIndex, { ...part, heading: changedHeading })
                  }}
                />
                {partButtons}
              </div>
              {part.equations.map((equation, equationIndex) => (
                <div key={equationIndex} className="blockcontent-editor-row blockcontent-editor-row-indented">
                  <FormulaInput
                    label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationsLabel)}
                    kind="EQUATION"
                    value={equation}
                    quantities={quantities}
                    placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.equationPlaceholder)}
                    onChange={(changedEquation) => {
                      if (changedEquation !== null) {
                        const changedEquations = replaceListItem(part.equations, equationIndex, changedEquation as EquationJson)
                        changePart(partIndex, { ...part, equations: changedEquations })
                      }
                    }}
                  />
                  <EditorRowButtons
                    onRemove={() => changePart(partIndex, { ...part, equations: removeListItem(part.equations, equationIndex) })}
                  />
                </div>
              ))}
              <div className="blockcontent-editor-row blockcontent-editor-row-indented">
                <EditorAddButton
                  label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addEquation)}
                  onClick={() => changePart(partIndex, { ...part, equations: [...part.equations, EMPTY_EQUATION] })}
                />
              </div>
            </div>
          )
        }
        if (part.type === 'LIST') {
          return (
            <div key={partIndex} className="blockcontent-editor-part">
              <div className="blockcontent-editor-row">
                <span className="blockcontent-editor-part-kind">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.listLabel)}</span>
                <Form.Check
                  type="checkbox"
                  className="blockcontent-editor-check"
                  id={'listOrdered' + partIndex}
                  label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.listOrdered)}
                  checked={part.ordered === true}
                  onChange={(changeEvent) => changePart(partIndex, { ...part, ordered: changeEvent.target.checked })}
                />
                {partButtons}
              </div>
              {part.items.map((item, itemIndex) => (
                <div key={itemIndex} className="blockcontent-editor-row blockcontent-editor-row-indented">
                  <Form.Control
                    size="sm"
                    aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.listItem)}
                    value={item}
                    onChange={(changeEvent) => changePart(partIndex, { ...part, items: replaceListItem(part.items, itemIndex, changeEvent.target.value) })}
                  />
                  <EditorRowButtons
                    onMoveUp={() => changePart(partIndex, { ...part, items: moveListItem(part.items, itemIndex, -1) })}
                    onMoveDown={() => changePart(partIndex, { ...part, items: moveListItem(part.items, itemIndex, 1) })}
                    onRemove={() => changePart(partIndex, { ...part, items: removeListItem(part.items, itemIndex) })}
                  />
                </div>
              ))}
              <div className="blockcontent-editor-row blockcontent-editor-row-indented">
                <EditorAddButton
                  label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addListItem)}
                  onClick={() => changePart(partIndex, { ...part, items: [...part.items, ''] })}
                />
              </div>
            </div>
          )
        }
        const partKindLabel =
          part.type === 'HINT'
            ? getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.hintLabel)
            : getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.paragraphLabel)
        return (
          <div key={partIndex} className="blockcontent-editor-part">
            <div className="blockcontent-editor-row blockcontent-editor-row-top">
              <span className="blockcontent-editor-part-kind">{partKindLabel}</span>
              <InlineTextArea
                label={partKindLabel}
                value={part.text}
                rows={3}
                onChange={(changedText) => changePart(partIndex, { ...part, text: changedText })}
              />
              {partButtons}
            </div>
          </div>
        )
      })}
      <div className="blockcontent-editor-row">
        <EditorAddButton
          label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addParagraph)}
          onClick={() => changeParts([...boxBlock.parts, { type: 'PARAGRAPH', text: '' }])}
        />
        <EditorAddButton
          label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addList)}
          onClick={() => changeParts([...boxBlock.parts, { type: 'LIST', ordered: false, items: [''] }])}
        />
        <EditorAddButton
          label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addEquations)}
          onClick={() => changeParts([...boxBlock.parts, { type: 'EQUATIONS', heading: null, equations: [EMPTY_EQUATION] }])}
        />
        <EditorAddButton
          label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addHint)}
          onClick={() => changeParts([...boxBlock.parts, { type: 'HINT', text: '' }])}
        />
        {sketch === null && <EditorAddButton label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addSketch)} onClick={addSketch} />}
      </div>
      {sketch !== null && (
        <SketchEditor
          sketch={sketch}
          quantities={quantities}
          onChange={(changedSketch) => onChange({ ...boxBlock, sketch: changedSketch })}
          onRemove={() => onChange({ ...boxBlock, sketch: null })}
        />
      )}
    </EditorCard>
  )
}
