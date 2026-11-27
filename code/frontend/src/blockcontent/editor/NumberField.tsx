import Form from 'react-bootstrap/Form'

type NumberFieldProps = {
  label: string
  value: number
  onChange: (changedValue: number) => void
}

/** Ein kleines Zahlenfeld im Editor; solange dort keine Zahl steht, bleibt der alte Wert. */
export function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <Form.Control
      size="sm"
      type="number"
      step="any"
      className="blockcontent-editor-number-input"
      aria-label={label}
      title={label}
      value={value}
      onChange={(changeEvent) => {
        const changedValue = Number(changeEvent.target.value)
        if (changeEvent.target.value !== '' && Number.isFinite(changedValue)) {
          onChange(changedValue)
        }
      }}
    />
  )
}
