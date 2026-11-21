import type { ChangeEvent } from 'react'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { GalleryShareDurationChoice, GalleryShareDurationInput } from './galleryShareDurationInput.ts'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'

type GalleryShareDurationFieldsProps = {
  /** Was gerade gewählt und getippt ist. */
  durationInput: GalleryShareDurationInput
  /** Bei jeder Wahl und jedem Tippen: die ganze Eingabe mit dem geänderten Wert. */
  onDurationInputChange: (changedDurationInput: GalleryShareDurationInput) => void
  disabled: boolean
}

/**
 * Die Eingaben zur Laufzeit einer Galerie-Freigabe, beim Anlegen (`NewGallerySharePopup`, Schritt 2) und beim Ändern
 * (`EditGalleryShareDurationPopup`) dieselben: dauerhaft, bis zu einem Zeitpunkt oder für eine Zahl von Aufrufen. „Bis
 * wann?“ bzw. „Wie viele Aufrufe?“ erscheint erst mit der Wahl. Geprüft wird die Eingabe mit
 * `createGalleryShareLimitsOfInput`.
 */
export function GalleryShareDurationFields({ durationInput, onDurationInputChange, disabled }: GalleryShareDurationFieldsProps) {
  const durationChoice = durationInput.durationChoice

  function chooseDuration(chosenDuration: GalleryShareDurationChoice) {
    onDurationInputChange({ ...durationInput, durationChoice: chosenDuration })
  }

  function handleExpiresAtChange(event: ChangeEvent<HTMLInputElement>) {
    onDurationInputChange({ ...durationInput, expiresAtLocalText: event.target.value })
  }

  function handleMaxAccessCountChange(event: ChangeEvent<HTMLInputElement>) {
    onDurationInputChange({ ...durationInput, maxAccessCountText: event.target.value })
  }

  return (
    <>
      <Form.Check
        type="radio"
        id="galleryShareDurationPermanent"
        name="galleryShareDuration"
        label={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.durationChoicePermanent)}
        checked={durationChoice === 'PERMANENT'}
        disabled={disabled}
        onChange={() => chooseDuration('PERMANENT')}
      />
      <Form.Check
        type="radio"
        id="galleryShareDurationUntil"
        name="galleryShareDuration"
        label={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.durationChoiceUntil)}
        checked={durationChoice === 'UNTIL'}
        disabled={disabled}
        onChange={() => chooseDuration('UNTIL')}
      />
      <Form.Check
        type="radio"
        id="galleryShareDurationAccessLimited"
        name="galleryShareDuration"
        label={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.durationChoiceAccessLimited)}
        checked={durationChoice === 'ACCESS_LIMITED'}
        disabled={disabled}
        onChange={() => chooseDuration('ACCESS_LIMITED')}
      />
      {durationChoice === 'UNTIL' && (
        <Form.Group className="mt-3" controlId="galleryShareExpiresAt">
          <Form.Label>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.expiresAtInputLabel)}</Form.Label>
          <Form.Control
            type="datetime-local"
            value={durationInput.expiresAtLocalText}
            disabled={disabled}
            onChange={handleExpiresAtChange}
          />
        </Form.Group>
      )}
      {durationChoice === 'ACCESS_LIMITED' && (
        <Form.Group className="mt-3" controlId="galleryShareMaxAccessCount">
          <Form.Label>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.maxAccessCountInputLabel)}</Form.Label>
          <Form.Control
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={durationInput.maxAccessCountText}
            disabled={disabled}
            onChange={handleMaxAccessCountChange}
          />
          <Form.Text>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.maxAccessCountHint)}</Form.Text>
        </Form.Group>
      )}
    </>
  )
}
