import { type ChangeEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import type { SymbolEntry } from '../symbol/symbolCatalog.ts'
import { getSymbolClassNameByPackAndName } from '../symbol/symbolCatalog.ts'
import {
  BADGE_EFFECT_OPTIONS,
  BADGE_GRADIENT_OPTIONS,
  BADGE_LOOK_COLOR_OPTIONS,
  BADGE_STRUCTURE_OPTIONS,
  type BadgeEffect,
  type BadgeGradient,
  type BadgeLook,
  type BadgeLookColorField,
  type BadgeStructure,
  EMPTY_BADGE_LOOK,
} from './BadgeLook.ts'
import { randomBadgeLook } from './randomBadgeLook.ts'
import { SymbolPickerPopup } from './SymbolPickerPopup.tsx'

/** Der Wert, den der Farbwähler zeigt, solange eine Farbe auf Standard steht. Gespeichert wird dann `null`. */
const UNSET_COLOR_PICKER_VALUE = '#808080'

type BadgeLookFieldsProps = {
  /** Basis für die ids der Eingabefelder */
  controlId: string
  value: BadgeLook
  onChange: (changedLook: BadgeLook) => void
}

/**
 * Der Editor für das Aussehen eines Badges, wie in der Vorlage, nur reichhaltiger: Verlauf, Struktur, Effekte, Farben und
 * Symbol. Jeder Wert lässt sich auf Standard zurücksetzen. „Würfeln“ probiert ein stimmiges Aussehen aus. Die Vorschau
 * zeigt das Formular, das ihn nutzt, weil nur es die Form des Badges kennt.
 */
export function BadgeLookFields({ controlId, value, onChange }: BadgeLookFieldsProps) {
  const [isSymbolPickerOpen, setIsSymbolPickerOpen] = useState<boolean>(false)

  function handleGradientChange(event: ChangeEvent<HTMLSelectElement>) {
    const chosenGradient = event.target.value
    let gradient: BadgeGradient | null = null
    if (chosenGradient !== '') {
      gradient = chosenGradient as BadgeGradient
    }
    onChange({ ...value, gradient })
  }

  function handleStructureChange(event: ChangeEvent<HTMLSelectElement>) {
    const chosenStructure = event.target.value
    let structure: BadgeStructure | null = null
    if (chosenStructure !== '') {
      structure = chosenStructure as BadgeStructure
    }
    onChange({ ...value, structure })
  }

  function handleEffectToggle(effect: BadgeEffect) {
    const currentEffects = value.effects ?? []
    let changedEffects = [...currentEffects, effect]
    if (currentEffects.includes(effect)) {
      changedEffects = currentEffects.filter((currentEffect) => currentEffect !== effect)
    }
    let effects: BadgeEffect[] | null = null
    if (changedEffects.length > 0) {
      effects = changedEffects
    }
    onChange({ ...value, effects })
  }

  function handleColorChange(field: BadgeLookColorField, event: ChangeEvent<HTMLInputElement>) {
    const chosenColor = event.target.value
    onChange({ ...value, [field]: chosenColor })
  }

  function handleColorReset(field: BadgeLookColorField) {
    onChange({ ...value, [field]: null })
  }

  function handleSymbolPick(symbolEntry: SymbolEntry) {
    setIsSymbolPickerOpen(false)
    onChange({ ...value, symbolPack: symbolEntry.pack, symbolName: symbolEntry.name })
  }

  function handleSymbolRemove() {
    onChange({ ...value, symbolPack: null, symbolName: null })
  }

  function handleRandomLook() {
    const randomLook = randomBadgeLook(value)
    onChange(randomLook)
  }

  function handleResetLook() {
    onChange(EMPTY_BADGE_LOOK)
  }

  const activeEffects = value.effects ?? []
  let symbolClassName: string | null = null
  if (value.symbolPack !== null && value.symbolName !== null) {
    symbolClassName = getSymbolClassNameByPackAndName(value.symbolPack, value.symbolName)
  }

  return (
    <fieldset className="badge-look-fields mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <legend className="badge-look-fields-title mb-0">Aussehen des Badges</legend>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={handleRandomLook}>
            <i className="bi bi-dice-5 me-1" aria-hidden="true"></i>
            Würfeln
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={handleResetLook}>
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
            alles Standard
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-3">
        <Col md={6}>
          <Form.Group controlId={controlId + 'Gradient'}>
            <Form.Label>Verlauf</Form.Label>
            <Form.Select value={value.gradient ?? ''} onChange={handleGradientChange}>
              <option value="">Standard (oben → unten)</option>
              {BADGE_GRADIENT_OPTIONS.map((gradientOption) => (
                <option key={gradientOption.value} value={gradientOption.value}>
                  {gradientOption.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId={controlId + 'Structure'}>
            <Form.Label>Struktur darüber</Form.Label>
            <Form.Select value={value.structure ?? ''} onChange={handleStructureChange}>
              <option value="">keine</option>
              {BADGE_STRUCTURE_OPTIONS.map((structureOption) => (
                <option key={structureOption.value} value={structureOption.value}>
                  {structureOption.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="mb-3">
        <div className="form-label">Effekte (die letzten fünf sind animiert)</div>
        <div className="d-flex flex-wrap gap-2">
          {BADGE_EFFECT_OPTIONS.map((effectOption) => {
            const isActive = activeEffects.includes(effectOption.value)
            let effectVariant = 'outline-secondary'
            if (isActive) {
              effectVariant = 'primary'
            }
            return (
              <Button
                key={effectOption.value}
                variant={effectVariant}
                size="sm"
                active={isActive}
                aria-pressed={isActive}
                onClick={() => handleEffectToggle(effectOption.value)}>
                {effectOption.label}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="mb-3">
        <div className="form-label">Farben (leer: Standard)</div>
        <div className="badge-look-color-grid">
          {BADGE_LOOK_COLOR_OPTIONS.map((colorOption) => {
            const color = value[colorOption.field]
            const isUnset = color === null
            const colorInputId = controlId + colorOption.field
            const resetLabel = colorOption.label + ' auf Standard'
            let colorPickerClassName = 'badge-look-color-picker'
            if (isUnset) {
              colorPickerClassName = 'badge-look-color-picker badge-look-color-unset'
            }
            return (
              <div key={colorOption.field} className="badge-look-color">
                <label htmlFor={colorInputId} className="small">
                  {colorOption.label}
                </label>
                <div className="d-flex align-items-center gap-1">
                  <Form.Control
                    id={colorInputId}
                    type="color"
                    className={colorPickerClassName}
                    value={color ?? UNSET_COLOR_PICKER_VALUE}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => handleColorChange(colorOption.field, event)}
                  />
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    disabled={isUnset}
                    aria-label={resetLabel}
                    onClick={() => handleColorReset(colorOption.field)}>
                    <i className="bi bi-x-circle" aria-hidden="true"></i>
                  </Button>
                </div>
                <code className="small">{color ?? 'Standard'}</code>
              </div>
            )
          })}
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className="form-label mb-0">Symbol</span>
        {symbolClassName !== null && (
          <span className="badge-look-symbol-choice">
            <i className={symbolClassName} aria-hidden="true"></i>
            <code>{value.symbolPack + ':' + value.symbolName}</code>
          </span>
        )}
        {symbolClassName === null && <span className="small">keins</span>}
        <Button variant="outline-secondary" size="sm" onClick={() => setIsSymbolPickerOpen(true)}>
          <i className="bi bi-grid-3x3-gap me-1" aria-hidden="true"></i>
          Symbol wählen …
        </Button>
        {symbolClassName !== null && (
          <Button variant="outline-secondary" size="sm" onClick={handleSymbolRemove}>
            ohne Symbol
          </Button>
        )}
      </div>

      {isSymbolPickerOpen && (
        <SymbolPickerPopup onPick={handleSymbolPick} onClose={() => setIsSymbolPickerOpen(false)} />
      )}
    </fieldset>
  )
}
