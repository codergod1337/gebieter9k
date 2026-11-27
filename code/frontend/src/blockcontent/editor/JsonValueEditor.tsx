import { useState } from 'react'
import { AutoSizeTextArea } from '../../components/AutoSizeTextArea.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { BLOCK_CONTENT_EDITOR_TEXTS } from './blockContentEditorTexts.ts'

type JsonValueEditorProps = {
  /** Für Screenreader, z. B. „Der Code dieses Elements“. */
  label: string
  /** Der Wert, dessen JSON bearbeitet wird. */
  value: unknown
  /** Ob der getippte, als JSON lesbare Wert an diese Stelle passt; die Meldung, wenn nicht, sonst `null`. */
  findProblem: (parsedValue: unknown) => string | null
  /** Der geänderte Wert, sobald das Getippte gültiges JSON ist und passt. */
  onChange: (changedValue: unknown) => void
}

/** So weit sind verschachtelte Stücke des JSON eingerückt. */
const JSON_INDENT_SPACES = 2

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, JSON_INDENT_SPACES)
}

/** Ob der getippte Text denselben Wert beschreibt: Dann bleibt er stehen, wie er getippt ist (Einrückung, Schreibmarke). */
function describesSameValue(text: string, value: unknown): boolean {
  try {
    const parsedText: unknown = JSON.parse(text)
    return JSON.stringify(parsedText) === JSON.stringify(value)
  } catch {
    return false
  }
}

/**
 * Ein Stück des Inhalts als JSON zum Bearbeiten (der „Code“ eines Elements oder der Animationen): ein Textfeld, das so
 * hoch ist wie sein Text ({@link AutoSizeTextArea}), also ohne eigenen Scrollbalken. Solange das Getippte kein gültiges JSON ist oder nicht an die
 * Stelle passt, steht der Grund darunter und der Inhalt bleibt, wie er war; sobald es passt, geht der Wert hinaus.
 * Ändert sich der Wert von außen (z. B. „Änderungen verwerfen“), zeigt das Feld wieder ihn.
 */
export function JsonValueEditor({ label, value, findProblem, onChange }: JsonValueEditorProps) {
  const formattedValue = formatJson(value)
  const [text, setText] = useState(formattedValue)
  const [shownFormattedValue, setShownFormattedValue] = useState(formattedValue)
  const [problem, setProblem] = useState<string | null>(null)

  // der Wert hat sich geändert: Stammt die Änderung nicht aus diesem Feld, zeigt es den neuen Wert
  if (formattedValue !== shownFormattedValue) {
    setShownFormattedValue(formattedValue)
    if (!describesSameValue(text, value)) {
      setText(formattedValue)
      setProblem(null)
    }
  }

  function handleTextChange(changedText: string) {
    setText(changedText)
    let parsedValue: unknown
    try {
      parsedValue = JSON.parse(changedText)
    } catch {
      setProblem(getTextInCurrentLanguage(BLOCK_CONTENT_EDITOR_TEXTS.jsonInvalid))
      return
    }
    const valueProblem = findProblem(parsedValue)
    setProblem(valueProblem)
    if (valueProblem === null) {
      onChange(parsedValue)
    }
  }

  return (
    <div className="blockcontent-editor-json">
      <AutoSizeTextArea label={label} className="blockcontent-editor-code" isInvalid={problem !== null} value={text} onChange={handleTextChange} />
      {problem !== null && <span className="blockcontent-editor-json-problem">{problem}</span>}
    </div>
  )
}
