import type { ChangeEvent, ReactNode } from 'react'
import Form from 'react-bootstrap/Form'

type RangeSliderProps = {
  /** Basis für die ids von Regler und Zahlenfeld. */
  id: string
  /** Beschriftung über dem Regler, auch für Screenreader. */
  label: string
  value: number
  /** Kleinster und größter Wert, beide erlaubt. Der Aufrufer nennt den Bereich, z. B. aus der Felddefinition. */
  min: number
  max: number
  /** Schrittweite, Standard 1 (ganze Zahlen). */
  step?: number
  /** Bei jedem Schiebeschritt und jedem Tippen, schon auf min bis max begrenzt und auf den Schritt gerundet. */
  onChange: (changedValue: number) => void
  /** Was der Wert bedeutet, unter dem Regler, z. B. „-1: nicht durchsucht“. Ohne: nichts. */
  describeValue?: (value: number) => ReactNode
  disabled?: boolean
}

/**
 * Ein Wert in einem Bereich von bis, wie der NumberPicker der Vorlage: Schieberegler und Zahlenfeld nebeneinander, beide
 * am selben Wert. Getippte Werte werden auf den Bereich begrenzt und auf den Schritt gerundet. Nichts Fachliches: Bereich,
 * Beschriftung und Bedeutung kommen vom Aufrufer. Global, damit jeder Wert von bis gleich bedient wird.
 */
export function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  describeValue,
  disabled = false,
}: RangeSliderProps) {
  function changeTo(rawValue: string) {
    if (rawValue.trim() === '') {
      return
    }
    const enteredValue = Number(rawValue)
    if (Number.isNaN(enteredValue)) {
      return
    }
    const steppedValue = Math.round(enteredValue / step) * step
    const valueAboveMin = Math.max(min, steppedValue)
    const valueInRange = Math.min(max, valueAboveMin)
    onChange(valueInRange)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value
    changeTo(rawValue)
  }

  const rangeId = id + '-range'
  const numberId = id + '-number'
  let valueDescription: ReactNode = null
  if (describeValue !== undefined) {
    valueDescription = describeValue(value)
  }

  return (
    <div className="range-slider">
      <Form.Label htmlFor={rangeId}>{label}</Form.Label>
      <div className="range-slider-row">
        <span className="range-slider-limit">{min}</span>
        <Form.Range
          id={rangeId}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        />
        <span className="range-slider-limit">{max}</span>
        <Form.Control
          id={numberId}
          className="range-slider-number"
          type="number"
          size="sm"
          min={min}
          max={max}
          step={step}
          aria-label={label}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
      {valueDescription !== null && <Form.Text>{valueDescription}</Form.Text>}
    </div>
  )
}
