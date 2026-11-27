import { useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { FormulaPopup } from '../formula/FormulaPopup.tsx'
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

/**
 * Ein Textfeld für Text mit Auszeichnung (Absatz, Hinweis): darüber eine kleine Leiste mit fett, kursiv, Link und
 * Formel. Ein Klick auf fett, kursiv oder Link setzt die Zeichen der Auszeichnung um die markierte Stelle (`**fett**`,
 * `*kursiv*`, `[Text](Adresse)`); man kann sie genauso gut tippen. Der Knopf „Formel“ öffnet das Formelfeld und setzt
 * die fertige Formel als `$LaTeX$` an die Stelle der Schreibmarke; war dort schon LaTeX markiert, beginnt das Feld damit.
 */
export function InlineTextArea({ label, value, rows, onChange }: InlineTextAreaProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  /** Offenes Formelfeld: wo im Text die Formel landet und womit das Feld beginnt; `null`, wenn es zu ist. */
  const [formulaInsertion, setFormulaInsertion] = useState<FormulaInsertion | null>(null)

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
      {formulaInsertion !== null && (
        <FormulaPopup initialLatex={formulaInsertion.initialLatex} onConfirm={insertFormula} onClose={() => setFormulaInsertion(null)} />
      )}
    </div>
  )
}
