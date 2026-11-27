import { useRef } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'

type InlineTextAreaProps = {
  /** Für Screenreader, z. B. „Absatz“. */
  label: string
  value: string
  rows: number
  onChange: (changedValue: string) => void
}

/** Was ein Knopf der Leiste um die Markierung setzt: davor und dahinter. */
type MarkupWrap = {
  before: string
  after: string
}

const BOLD_WRAP: MarkupWrap = { before: '**', after: '**' }
const ITALIC_WRAP: MarkupWrap = { before: '*', after: '*' }
const LINK_WRAP: MarkupWrap = { before: '[', after: '](https://)' }
const FORMULA_WRAP: MarkupWrap = { before: '$', after: '$' }

/**
 * Ein Textfeld für Text mit Auszeichnung (Absatz, Hinweis): darüber eine kleine Leiste mit fett, kursiv, Link und
 * Formel. Ein Klick setzt die Zeichen der Auszeichnung um die markierte Stelle (`**fett**`, `*kursiv*`,
 * `[Text](Adresse)`, `$Formel$`); man kann sie genauso gut tippen. Die Markierung bleibt danach auf dem Text dazwischen.
 */
export function InlineTextArea({ label, value, rows, onChange }: InlineTextAreaProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

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
          onClick={() => wrapSelection(FORMULA_WRAP)}>
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
    </div>
  )
}
