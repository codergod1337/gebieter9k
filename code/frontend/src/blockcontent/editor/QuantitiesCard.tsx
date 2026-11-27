import { useState } from 'react'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { QuantitiesJson, QuantityJson } from '../BlockContentJson.ts'
import { getMathHighlightClassName } from '../math/getMathHighlightClassName.ts'
import type { MathHighlightKey } from '../math/MathHighlightKey.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'
import { EditorAddButton, EditorCard, EditorRowButtons } from './EditorCard.tsx'

type QuantitiesCardProps = {
  quantities: QuantitiesJson
  onChange: (changedQuantities: QuantitiesJson) => void
}

/** Die Farben zur Wahl, in ihrer Reihenfolge; der leere Wert heißt „keine“. */
const HIGHLIGHT_CHOICES: MathHighlightKey[] = ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH']

/**
 * Die Größen der Seite: je Größe ihre Kennung, ihr Zeichen und ihre Farbe. Die Kennung steht fest, sobald es die Größe
 * gibt (die Formeln und die Skizze verweisen darauf); Zeichen und Farbe lassen sich ändern und gelten sofort überall.
 */
export function QuantitiesCard({ quantities, onChange }: QuantitiesCardProps) {
  const [newQuantityKey, setNewQuantityKey] = useState('')
  const [newQuantitySymbol, setNewQuantitySymbol] = useState('')
  const quantityKeys = Object.keys(quantities)
  const trimmedNewKey = newQuantityKey.trim()
  const trimmedNewSymbol = newQuantitySymbol.trim()
  const newKeyTaken = trimmedNewKey !== '' && quantityKeys.includes(trimmedNewKey)
  const newQuantityComplete = trimmedNewKey !== '' && trimmedNewSymbol !== '' && !newKeyTaken

  function changeQuantity(quantityKey: string, changedQuantity: QuantityJson) {
    onChange({ ...quantities, [quantityKey]: changedQuantity })
  }

  function removeQuantity(quantityKey: string) {
    const remainingQuantities: QuantitiesJson = {}
    for (const otherQuantityKey of quantityKeys) {
      if (otherQuantityKey !== quantityKey) {
        remainingQuantities[otherQuantityKey] = quantities[otherQuantityKey]
      }
    }
    onChange(remainingQuantities)
  }

  function addQuantity() {
    if (!newQuantityComplete) {
      return
    }
    onChange({ ...quantities, [trimmedNewKey]: { symbol: trimmedNewSymbol, highlight: null } })
    setNewQuantityKey('')
    setNewQuantitySymbol('')
  }

  return (
    <EditorCard kindLabel={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantitiesTitle)}>
      <p className="blockcontent-editor-help">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantitiesHint)}</p>
      {quantityKeys.map((quantityKey) => {
        const quantity = quantities[quantityKey]
        const highlight = quantity.highlight ?? null
        const highlightClassName = getMathHighlightClassName(highlight as MathHighlightKey | null)
        const sampleClassName = 'math blockcontent-editor-quantity-sample ' + highlightClassName
        return (
          <div key={quantityKey} className="blockcontent-editor-row">
            <code className="blockcontent-editor-quantity-key">{quantityKey}</code>
            <Form.Control
              size="sm"
              className="blockcontent-editor-short-input"
              aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantitySymbol)}
              value={quantity.symbol}
              onChange={(changeEvent) => changeQuantity(quantityKey, { ...quantity, symbol: changeEvent.target.value })}
            />
            <Form.Select
              size="sm"
              className="blockcontent-editor-short-input"
              aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantityHighlight)}
              value={highlight ?? ''}
              onChange={(changeEvent) => {
                const chosenHighlight = changeEvent.target.value === '' ? null : changeEvent.target.value
                changeQuantity(quantityKey, { ...quantity, highlight: chosenHighlight })
              }}>
              <option value="">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantityNoHighlight)}</option>
              {HIGHLIGHT_CHOICES.map((highlightChoice, choiceIndex) => (
                <option key={highlightChoice} value={highlightChoice}>
                  {choiceIndex + 1}
                </option>
              ))}
            </Form.Select>
            <span className={sampleClassName}>{quantity.symbol}</span>
            <EditorRowButtons onRemove={() => removeQuantity(quantityKey)} />
          </div>
        )
      })}
      <div className="blockcontent-editor-row">
        <Form.Control
          size="sm"
          placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantityKey)}
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantityKey)}
          value={newQuantityKey}
          isInvalid={newKeyTaken}
          onChange={(changeEvent) => setNewQuantityKey(changeEvent.target.value)}
        />
        <Form.Control
          size="sm"
          className="blockcontent-editor-short-input"
          placeholder={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantitySymbol)}
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantitySymbol)}
          value={newQuantitySymbol}
          onChange={(changeEvent) => setNewQuantitySymbol(changeEvent.target.value)}
        />
        <EditorAddButton label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.addQuantity)} onClick={addQuantity} />
      </div>
      {newKeyTaken && <div className="blockcontent-editor-problem">{getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.quantityKeyTaken)}</div>}
    </EditorCard>
  )
}
