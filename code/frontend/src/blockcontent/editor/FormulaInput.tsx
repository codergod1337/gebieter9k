import { useMemo, useState } from 'react'
import Form from 'react-bootstrap/Form'
import type { EquationJson, QuantitiesJson, TermJson } from '../BlockContentJson.ts'
import { FormulaTextError } from '../formulatext/FormulaTextError.ts'
import { FormulaTextParser } from '../formulatext/FormulaTextParser.ts'
import { FormulaTextPrinter } from '../formulatext/FormulaTextPrinter.ts'

type FormulaInputProps = {
  /** Für Screenreader, z. B. „Gleichung der Zeile 2“. */
  label: string
  /** Ob das Feld eine Gleichung (`links = rechts`) oder einen einzelnen Term enthält. */
  kind: 'EQUATION' | 'TERM'
  /** Die Formel als JSON; `null`, wenn es keine gibt. */
  value: EquationJson | TermJson | null
  quantities: QuantitiesJson
  /** Ob das Feld leer sein darf (dann kommt `null`). */
  optional?: boolean
  placeholder?: string
  /** Die gelesene Formel, sobald sich der Text lesen lässt; `null` für ein leeres, freiwilliges Feld. */
  onChange: (changedValue: EquationJson | TermJson | null) => void
}

/**
 * Ein Feld, in dem man eine Formel tippt statt eines verschachtelten Objekts ({@link FormulaTextParser}). Solange sich
 * der Text nicht lesen lässt, bleibt die gespeicherte Formel, wie sie war, und unter dem Feld steht, was nicht passt.
 * Ändert sich die Formel von außen (andere Ansicht, andere Farbe einer Größe), übernimmt das Feld ihren Text.
 */
export function FormulaInput({ label, kind, value, quantities, optional = false, placeholder, onChange }: FormulaInputProps) {
  const printedText = useMemo(() => {
    if (value === null) {
      return ''
    }
    const formulaTextPrinter = new FormulaTextPrinter(quantities)
    if (kind === 'EQUATION') {
      return formulaTextPrinter.printEquation(value as EquationJson)
    }
    return formulaTextPrinter.printTerm(value as TermJson)
  }, [value, kind, quantities])
  const [draftText, setDraftText] = useState(printedText)
  /** Der Text der Formel, die dieses Feld zuletzt kannte: Weicht der neue davon ab, kam die Änderung von außen. */
  const [knownPrintedText, setKnownPrintedText] = useState(printedText)
  const [problem, setProblem] = useState<string | null>(null)

  if (printedText !== knownPrintedText) {
    setKnownPrintedText(printedText)
    setDraftText(printedText)
    setProblem(null)
  }

  function handleTextChange(changedText: string) {
    setDraftText(changedText)
    if (changedText.trim() === '' && optional) {
      setProblem(null)
      setKnownPrintedText('')
      onChange(null)
      return
    }
    try {
      const formulaTextParser = new FormulaTextParser(quantities)
      const formulaTextPrinter = new FormulaTextPrinter(quantities)
      if (kind === 'EQUATION') {
        const parsedEquation = formulaTextParser.parseEquation(changedText)
        setKnownPrintedText(formulaTextPrinter.printEquation(parsedEquation))
        onChange(parsedEquation)
      } else {
        const parsedTerm = formulaTextParser.parseTerm(changedText)
        setKnownPrintedText(formulaTextPrinter.printTerm(parsedTerm))
        onChange(parsedTerm)
      }
      setProblem(null)
    } catch (caughtError) {
      if (caughtError instanceof FormulaTextError) {
        setProblem(caughtError.message)
      } else {
        setProblem(String(caughtError))
      }
    }
  }

  /** Beim Verlassen steht die Formel in ihrer sauberen Schreibweise da, wenn sie sich lesen ließ. */
  function handleBlur() {
    if (problem === null) {
      setDraftText(knownPrintedText)
    }
  }

  return (
    <div className="blockcontent-editor-formula">
      <Form.Control
        size="sm"
        className="blockcontent-editor-formula-input"
        aria-label={label}
        spellCheck={false}
        placeholder={placeholder}
        value={draftText}
        isInvalid={problem !== null}
        onChange={(changeEvent) => handleTextChange(changeEvent.target.value)}
        onBlur={handleBlur}
      />
      {problem !== null && <div className="blockcontent-editor-problem">{problem}</div>}
    </div>
  )
}
