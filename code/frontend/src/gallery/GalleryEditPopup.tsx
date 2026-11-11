import { type ChangeEvent, type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { MultilingualRichTextEditor } from '../components/MultilingualRichTextEditor.tsx'
import { isAnyRichTextLanguageTooLong, sanitizeMultilingualRichText } from '../components/richTextHtml.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { VisibilityPicker } from '../components/VisibilityPicker.tsx'
import { SubmitButton } from '../components/SubmitButton.tsx'
import type { Visibility } from '../users/Users.ts'
import { GALLERY_DESCRIPTION_MAX_LENGTH, GALLERY_TITLE_MAX_LENGTH, type GalleryInput } from './Gallery.ts'

type GalleryEditPopupProps = {
  /** „Neue Galerie“ oder „Galerie bearbeiten“. */
  title: string
  /** Die gespeicherten Werte beim Bearbeiten, `null` beim Anlegen. */
  initialGalleryInput: GalleryInput | null
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  /** Speichert; liefert, ob es geklappt hat. Dann schließt das Popup. */
  onSave: (galleryInput: GalleryInput) => Promise<boolean>
  onClose: () => void
}

/** Neue Galerien sind wie neue Profile erst einmal öffentlich (Nutzer 2026-11-09); umstellen geht gleich beim Anlegen. */
const NEW_GALLERY_VISIBILITY: Visibility = 'ANY'

/**
 * Eine Galerie anlegen oder ändern, als Popup: Titel, Beschreibung und Sichtbarkeit ({@link VisibilityPicker}). Die
 * Sichtbarkeit gilt für die Galerie und alle ihre Bilder. Die Längen prüft auch das Backend.
 */
export function GalleryEditPopup({ title, initialGalleryInput, isSaving, errorMessage, onSave, onClose }: GalleryEditPopupProps) {
  const [enteredTitle, setEnteredTitle] = useState<string>(initialGalleryInput?.title ?? '')
  const [enteredDescription, setEnteredDescription] = useState<MultilingualText>(initialGalleryInput?.description ?? {})
  const [chosenVisibility, setChosenVisibility] = useState<Visibility>(
    initialGalleryInput?.visibility ?? NEW_GALLERY_VISIBILITY,
  )
  const titleMissing = enteredTitle.trim() === ''
  const descriptionTooLong = isAnyRichTextLanguageTooLong(enteredDescription, GALLERY_DESCRIPTION_MAX_LENGTH)

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const changedTitle = event.target.value
    setEnteredTitle(changedTitle)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (titleMissing || descriptionTooLong) {
      return
    }
    const checkedDescription = sanitizeMultilingualRichText(enteredDescription)
    const galleryInput: GalleryInput = { title: enteredTitle, description: checkedDescription, visibility: chosenVisibility }
    const saved = await onSave(galleryInput)
    if (saved) {
      onClose()
    }
  }

  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert message={errorMessage} />
          <Form.Group className="mb-3" controlId="galleryTitle">
            <Form.Label>Titel</Form.Label>
            <Form.Control
              type="text"
              autoFocus
              maxLength={GALLERY_TITLE_MAX_LENGTH}
              placeholder="z. B. Sommer an der See"
              value={enteredTitle}
              disabled={isSaving}
              onChange={handleTitleChange}
            />
          </Form.Group>
          <div className="mb-3">
            <div className="form-label">Beschreibung</div>
            <MultilingualRichTextEditor
              value={enteredDescription}
              onChange={setEnteredDescription}
              ariaLabel="Beschreibung der Galerie"
              disabled={isSaving}
              placeholder="Worum geht es in der Galerie? (darf leer bleiben)"
              compact
              maxPlainTextLength={GALLERY_DESCRIPTION_MAX_LENGTH}
            />
          </div>
          <div className="form-label">Sichtbar für</div>
          <VisibilityPicker
            value={chosenVisibility}
            onChange={setChosenVisibility}
            ariaLabel="Galerie sichtbar für"
            disabled={isSaving}
          />
          <Form.Text className="d-block mt-2">Gilt für die Galerie und alle ihre Bilder.</Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <SubmitButton isSubmitting={isSaving} fullWidth={false} disabled={titleMissing || descriptionTooLong}>
            Speichern
          </SubmitButton>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
