import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import { EmojiPicker } from './EmojiPicker.tsx'
import { ErrorAlert } from './ErrorAlert.tsx'

type EmojiPickerPopupProps = {
  /** Titel des Popups, z. B. „Smiley vergeben“. */
  title: string
  /** Solange gespeichert wird, ist alles gesperrt. */
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  /** Ein Emoji gewählt. Der Aufrufer speichert und schließt. */
  onPick: (emoji: string) => void
  onClose: () => void
}

/** Ein Emoji wählen, in einem Popup wie die Auswahl eines Rechts: die Suche mit Gruppen ({@link EmojiPicker}). */
export function EmojiPickerPopup({ title, isSaving, errorMessage, onPick, onClose }: EmojiPickerPopupProps) {
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorAlert message={errorMessage} />
        <EmojiPicker onPick={onPick} disabled={isSaving} />
      </Modal.Body>
      <Modal.Footer>
        {isSaving && <Spinner animation="border" size="sm" className="me-auto" />}
        <Button variant="secondary" onClick={onClose}>
          Schließen
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
