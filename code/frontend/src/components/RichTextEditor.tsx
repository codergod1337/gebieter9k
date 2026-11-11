import { type ClipboardEvent, useEffect, useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import { Hoverlay } from './Hoverlay.tsx'
import { hasRichTextContent, sanitizeRichTextHtml } from './richTextHtml.ts'

type RichTextEditorProps = {
  /** Das HTML; der Editor meldet nach jeder Eingabe sein rohes innerHTML, gespeichert wird bereinigt. */
  value: string
  onChange: (changedHtml: string) => void
  ariaLabel: string
  disabled?: boolean
  /** Grauer Hinweis im leeren Feld. */
  placeholder?: string
  /** Niedriges Feld, z. B. für eine Antwort im Gästebuch. */
  compact?: boolean
}

/** Die Absatzarten der Werkzeugleiste, wie `formatBlock` sie kennt. */
type RichTextBlockTagName = 'p' | 'h1' | 'h2' | 'h3'

/** Was an der Schreibmarke gerade gilt, damit die Knöpfe es zeigen. */
type RichTextActiveFormats = {
  bold: boolean
  italic: boolean
  blockTagName: string
}

const NO_ACTIVE_FORMATS: RichTextActiveFormats = { bold: false, italic: false, blockTagName: '' }

type RichTextBlockTool = {
  blockTagName: RichTextBlockTagName
  iconClassName: string
  label: string
}

const RICH_TEXT_BLOCK_TOOLS: RichTextBlockTool[] = [
  { blockTagName: 'h1', iconClassName: 'bi bi-type-h1', label: 'Überschrift 1' },
  { blockTagName: 'h2', iconClassName: 'bi bi-type-h2', label: 'Überschrift 2' },
  { blockTagName: 'h3', iconClassName: 'bi bi-type-h3', label: 'Überschrift 3' },
  { blockTagName: 'p', iconClassName: 'bi bi-paragraph', label: 'Normaler Text' },
]

/**
 * Ein kleiner Texteditor für EINE Sprache nach dem RichTextEditor der Vorlage; Aufrufer nehmen den
 * {@link MultilingualRichTextEditor}, denn jeder Rich-Text ist mehrsprachig (Nutzer 2026-11-09): fett, kursiv, Überschrift 1 bis 3,
 * normaler Text und Trennlinie, sonst nichts, keine Farben (das Theme bestimmt sie). Das Feld ist contentEditable und
 * uncontrolled: innerHTML wird nur gesetzt, wenn `value` von außen wechselt, jede Eingabe meldet den Stand. Einfügen
 * nimmt nur reinen Text, so kommt kein fremdes HTML herein. Gespeichert und gezeigt wird nur, was
 * {@link sanitizeRichTextHtml} durchlässt; das Backend bereinigt beim Speichern noch einmal.
 */
export function RichTextEditor({ value, onChange, ariaLabel, disabled = false, placeholder = '', compact = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeFormats, setActiveFormats] = useState<RichTextActiveFormats>(NO_ACTIVE_FORMATS)
  const [empty, setEmpty] = useState<boolean>(() => !hasRichTextContent(value))

  // Nur ein Wechsel von außen setzt das Feld neu; der eigene Stand ist schon drin, sonst spränge die Schreibmarke
  useEffect(() => {
    const editorElement = editorRef.current
    if (editorElement !== null && editorElement.innerHTML !== value) {
      const sanitizedHtml = sanitizeRichTextHtml(value)
      editorElement.innerHTML = sanitizedHtml
      setEmpty(!hasRichTextContent(sanitizedHtml))
    }
  }, [value])

  function reportChange() {
    const editorElement = editorRef.current
    if (editorElement === null) {
      return
    }
    const currentHtml = editorElement.innerHTML
    setEmpty(!hasRichTextContent(currentHtml))
    onChange(currentHtml)
  }

  function readActiveFormats() {
    const formatBlockValue = document.queryCommandValue('formatBlock')
    const blockTagName = formatBlockValue.toLowerCase()
    const bold = document.queryCommandState('bold')
    const italic = document.queryCommandState('italic')
    setActiveFormats({ bold, italic, blockTagName })
  }

  /** Ein Werkzeug ausführen, Fokus halten, Stand melden; die Knöpfe verhindern per onMouseDown den Verlust der Auswahl. */
  function runCommand(commandName: string, commandValue?: string) {
    document.execCommand(commandName, false, commandValue)
    editorRef.current?.focus()
    reportChange()
    readActiveFormats()
  }

  /** Eine Überschrift noch einmal geklickt wird wieder normaler Text. */
  function applyBlockTool(blockTagName: RichTextBlockTagName) {
    let targetBlockTagName: RichTextBlockTagName = blockTagName
    if (activeFormats.blockTagName === blockTagName && blockTagName !== 'p') {
      targetBlockTagName = 'p'
    }
    runCommand('formatBlock', targetBlockTagName)
  }

  /** Enter macht einen Absatz (p), nicht ein div. */
  function handleFocus() {
    document.execCommand('defaultParagraphSeparator', false, 'p')
    readActiveFormats()
  }

  /** Einfügen wird hart bereinigt: Nur der reine Text landet im Feld. */
  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    const pastedText = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, pastedText)
    reportChange()
  }

  function renderToolButton(key: string, iconClassName: string, label: string, active: boolean, onClick: () => void) {
    return (
      <Hoverlay key={key} text={label}>
        <Button
          variant="outline-secondary"
          size="sm"
          className="rich-text-tool"
          active={active}
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}>
          <i className={iconClassName} aria-hidden="true"></i>
        </Button>
      </Hoverlay>
    )
  }

  let editorClassName = 'rich-text-editor form-control'
  if (compact) {
    editorClassName += ' rich-text-editor-compact'
  }
  if (empty) {
    editorClassName += ' is-empty'
  }

  return (
    <div className="rich-text">
      <div className="rich-text-toolbar" role="toolbar" aria-label={ariaLabel + ': Format'}>
        {renderToolButton('bold', 'bi bi-type-bold', 'Fett', activeFormats.bold, () => runCommand('bold'))}
        {renderToolButton('italic', 'bi bi-type-italic', 'Kursiv', activeFormats.italic, () => runCommand('italic'))}
        <span className="rich-text-toolbar-separator" aria-hidden="true" />
        {RICH_TEXT_BLOCK_TOOLS.map((blockTool) =>
          renderToolButton(
            blockTool.blockTagName,
            blockTool.iconClassName,
            blockTool.label,
            activeFormats.blockTagName === blockTool.blockTagName,
            () => applyBlockTool(blockTool.blockTagName),
          ),
        )}
        <span className="rich-text-toolbar-separator" aria-hidden="true" />
        {renderToolButton('hr', 'bi bi-hr', 'Trennlinie', false, () => runCommand('insertHorizontalRule'))}
      </div>
      <div
        ref={editorRef}
        className={editorClassName}
        data-placeholder={placeholder}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-placeholder={placeholder}
        onInput={reportChange}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onKeyUp={readActiveFormats}
        onMouseUp={readActiveFormats}
      />
    </div>
  )
}
