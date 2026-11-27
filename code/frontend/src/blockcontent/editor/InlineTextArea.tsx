import { useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { FormulaPopup } from '../formula/FormulaPopup.tsx'
import { EquationReferencePopup } from './EquationReferencePopup.tsx'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'

type InlineTextAreaProps = {
  /** Für Screenreader, z. B. „Absatz“. */
  label: string
  value: string
  rows: number
  onChange: (changedValue: string) => void
}

/** Eine Formel, die gerade im Popup entsteht: Sie ersetzt im Text den Bereich von `start` bis `end`. */
type FormulaInsertion = {
  start: number
  end: number
  initialLatex: string
}

/** Was ein Knopf der Leiste um die Markierung setzt: davor und dahinter. */
type MarkupWrap = {
  before: string
  after: string
}

const BOLD_WRAP: MarkupWrap = { before: '**', after: '**' }
const ITALIC_WRAP: MarkupWrap = { before: '*', after: '*' }
const LINK_WRAP: MarkupWrap = { before: '[', after: '](https://)' }
const FORMULA_MARKER = '$'
/** Ein Verweis auf eine Gleichung, so wie er im Text steht: `[[equation:<guid>]]`. */
const EQUATION_REFERENCE_START = '[[equation:'
const EQUATION_REFERENCE_END = ']]'

/**
 * Ein Textfeld für Text mit Auszeichnung (Absatz, Hinweis): darüber eine kleine Leiste mit fett, kursiv, Link und
 * Formel. Ein Klick auf fett, kursiv oder Link setzt die Zeichen der Auszeichnung um die markierte Stelle (`**fett**`,
 * `*kursiv*`, `[Text](Adresse)`); man kann sie genauso gut tippen. Der Knopf „Formel“ öffnet das Formelfeld und setzt
 * die fertige Formel als `$LaTeX$` an die Stelle der Schreibmarke; war dort schon LaTeX markiert, beginnt das Feld damit.
 * Der Knopf mit dem # stellt die Gleichungen des Inhalts zur Wahl und setzt einen Verweis auf die gewählte ein
 * (`[[equation:<guid>]]`); im fertigen Text steht dort ihre Nummer.
 */
export function InlineTextArea({ label, value, rows, onChange }: InlineTextAreaProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  /** Offenes Formelfeld: wo im Text die Formel landet und womit das Feld beginnt; `null`, wenn es zu ist. */
  const [formulaInsertion, setFormulaInsertion] = useState<FormulaInsertion | null>(null)
  /** Offenes Popup „Verweis auf eine Gleichung“: die Stelle der Schreibmarke, an der der Verweis landet; `null`, wenn es zu ist. */
  const [referencePosition, setReferencePosition] = useState<number | null>(null)

  function wrapSelection(markupWrap: MarkupWrap) {
    const textArea = textAreaRef.current
    if (textArea === null) {
      return
    }
    const selectionStart = textArea.selectionStart
    const selectionEnd = textArea.selectionEnd
    const textBefore = value.slice(0, selectionStart)
    const selectedText = value.slice(selectionStart, selectionEnd)
    const textAfter = value.slice(selectionEnd)
    onChange(textBefore + markupWrap.before + selectedText + markupWrap.after + textAfter)
    // nach dem Zeichnen steht die Markierung wieder auf dem Text zwischen den Zeichen
    const innerStart = selectionStart + markupWrap.before.length
    const innerEnd = innerStart + selectedText.length
    window.requestAnimationFrame(() => {
      textArea.focus()
      textArea.setSelectionRange(innerStart, innerEnd)
    })
  }

  function openFormulaPopup() {
    const textArea = textAreaRef.current
    if (textArea === null) {
      return
    }
    const start = textArea.selectionStart
    const end = textArea.selectionEnd
    // markiertes LaTeX (mit oder ohne seine $-Zeichen) ist der Anfang im Formelfeld
    let initialLatex = value.slice(start, end)
    const wrappedInMarkers = initialLatex.length >= 2 && initialLatex.startsWith(FORMULA_MARKER) && initialLatex.endsWith(FORMULA_MARKER)
    if (wrappedInMarkers) {
      initialLatex = initialLatex.slice(1, -1)
    }
    setFormulaInsertion({ start, end, initialLatex })
  }

  function insertFormula(latex: string) {
    if (formulaInsertion === null) {
      return
    }
    const textBefore = value.slice(0, formulaInsertion.start)
    const textAfter = value.slice(formulaInsertion.end)
    onChange(textBefore + FORMULA_MARKER + latex + FORMULA_MARKER + textAfter)
    setFormulaInsertion(null)
  }

  function openReferencePopup() {
    const textArea = textAreaRef.current
    if (textArea === null) {
      return
    }
    setReferencePosition(textArea.selectionEnd)
  }

  function insertReference(equationGuid: string) {
    if (referencePosition === null) {
      return
    }
    const textBefore = value.slice(0, referencePosition)
    const textAfter = value.slice(referencePosition)
    onChange(textBefore + EQUATION_REFERENCE_START + equationGuid + EQUATION_REFERENCE_END + textAfter)
    setReferencePosition(null)
  }

  return (
    <div className="blockcontent-editor-inline-text">
      <div className="blockcontent-editor-inline-toolbar">
        <Button
          size="sm"
          variant="outline-secondary"
          className="control-button"
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.markupBold)}
          onClick={() => wrapSelection(BOLD_WRAP)}>
          <i className="bi bi-type-bold"></i>
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          className="control-button"
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.markupItalic)}
          onClick={() => wrapSelection(ITALIC_WRAP)}>
          <i className="bi bi-type-italic"></i>
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          className="control-button"
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.markupLink)}
          onClick={() => wrapSelection(LINK_WRAP)}>
          <i className="bi bi-link-45deg"></i>
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          className="control-button"
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.markupFormula)}
          onClick={openFormulaPopup}>
          <i className="bi bi-superscript"></i>
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          className="control-button"
          aria-label={getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.markupEquationReference)}
          onClick={openReferencePopup}>
          <i className="bi bi-hash"></i>
        </Button>
      </div>
      <Form.Control
        as="textarea"
        size="sm"
        rows={rows}
        ref={textAreaRef}
        aria-label={label}
        value={value}
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
      />
      {referencePosition !== null && <EquationReferencePopup onChoose={insertReference} onClose={() => setReferencePosition(null)} />}
      {formulaInsertion !== null && (
        <FormulaPopup initialLatex={formulaInsertion.initialLatex} onConfirm={insertFormula} onClose={() => setFormulaInsertion(null)} />
      )}
    </div>
  )
}
