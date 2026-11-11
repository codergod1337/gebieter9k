import type { FormEvent, ReactNode } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { ErrorAlert } from './ErrorAlert.tsx'
import { SubmitButton } from './SubmitButton.tsx'

type EditValuePopupProps = {
  /** z. B. „Name von fileName“ */
  title: string
  /** Die Eingabe für den einen Wert. */
  children: ReactNode
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. Das Popup bleibt dann offen. */
  errorMessage: string | null
  /** z. B. solange die Eingabe ungültig ist */
  saveDisabled?: boolean
  onSave: () => void
  onClose: () => void
}

/**
 * Das kleine Popup zum Ändern eines einzelnen Werts direkt aus der Tabellenzeile: oben die Eingabe, unten Abbrechen und
 * Speichern, Enter speichert. Der Aufrufer schließt es nach dem Speichern. Global, weil jede Tabelle es nutzen kann.
 */
export function EditValuePopup({
  title,
  children,
  isSaving,
  errorMessage,
  saveDisabled = false,
  onSave,
  onClose,
}: EditValuePopupProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveDisabled || isSaving) {
      return
    }
    onSave()
  }

  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert message={errorMessage} />
          {children}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <SubmitButton isSubmitting={isSaving} fullWidth={false} disabled={saveDisabled}>
            Speichern
          </SubmitButton>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
