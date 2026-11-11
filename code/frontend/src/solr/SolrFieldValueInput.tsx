import type { ChangeEvent } from 'react'
import Form from 'react-bootstrap/Form'
import { type ValueSuggestion, ValuesInput } from '../components/ValuesInput.tsx'
import type { SolrField } from './SolrField.ts'
import type { SolrFieldInputValue } from './solrFieldInputValue.ts'

type SolrFieldValueInputProps = {
  controlId: string
  solrField: SolrField
  value: SolrFieldInputValue
  onChange: (changedValue: SolrFieldInputValue) => void
  disabled?: boolean
  /** kleine Eingabe, z. B. in einer Tabellenzeile */
  compact?: boolean
  /** Nur bei mehrwertigen Feldern: Vervollständigung aus vorhandenen Werten (z. B. Tags), siehe {@link ValuesInput}. */
  searchSuggestions?: (typedText: string) => Promise<ValueSuggestion[]>
  /** Nur bei mehrwertigen Feldern: einheitliche Form je Wert, z. B. Tags ohne Raute. */
  normalizeValue?: (value: string) => string
}

/**
 * Die Eingabe zu einem Solr-Feld, je nach Typ: mehrwertig Chips ({@link ValuesInput}), BOOLEAN ein Schalter, TEXT_SUCHE
 * ein mehrzeiliges Feld, Zahlen ein Zahlenfeld, DATE Datum und Uhrzeit, sonst eine Zeile Text. Nur die Eingabe, ohne
 * Label; das setzt der Aufrufer.
 */
export function SolrFieldValueInput({
  controlId,
  solrField,
  value,
  onChange,
  disabled = false,
  compact = false,
  searchSuggestions,
  normalizeValue,
}: SolrFieldValueInputProps) {
  let controlSize: 'sm' | undefined = undefined
  if (compact) {
    controlSize = 'sm'
  }

  if (Array.isArray(value)) {
    return (
      <ValuesInput
        controlId={controlId}
        values={value}
        onChange={onChange}
        disabled={disabled}
        searchSuggestions={searchSuggestions}
        normalizeValue={normalizeValue}
      />
    )
  }

  if (typeof value === 'boolean') {
    return (
      <Form.Check
        type="switch"
        id={controlId}
        checked={value}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
      />
    )
  }

  function handleTextChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange(event.target.value)
  }

  if (solrField.type === 'TEXT_SUCHE') {
    return (
      <Form.Control
        id={controlId}
        as="textarea"
        rows={2}
        size={controlSize}
        value={value}
        disabled={disabled}
        onChange={handleTextChange}
      />
    )
  }

  let inputType = 'text'
  let inputStep: string | undefined = undefined
  if (solrField.type === 'LONG') {
    inputType = 'number'
    inputStep = '1'
  } else if (solrField.type === 'DOUBLE') {
    inputType = 'number'
    inputStep = 'any'
  } else if (solrField.type === 'DATE') {
    inputType = 'datetime-local'
  }
  return (
    <Form.Control
      id={controlId}
      type={inputType}
      step={inputStep}
      size={controlSize}
      value={value}
      disabled={disabled}
      onChange={handleTextChange}
    />
  )
}
