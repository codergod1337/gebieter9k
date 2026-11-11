import type { ReactNode } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import { ErrorAlert } from './ErrorAlert.tsx'

type ConfirmDeletePopupProps = {
  title: string
  /** Die Frage, z. B. „Soll alice wirklich gelöscht werden?“ */
  children: ReactNode
  isDeleting: boolean
  /** Fehler des Löschens, `null` wenn keiner. */
  errorMessage: string | null
  onConfirm: () => void
  onClose: () => void
}

/** Die Sicherheitsabfrage vor jedem Löschen. Gelöscht wird erst mit „Löschen“. */
export function ConfirmDeletePopup({
  title,
  children,
  isDeleting,
  errorMessage,
  onConfirm,
  onClose,
}: ConfirmDeletePopupProps) {
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorAlert message={errorMessage} />
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
          Abbrechen
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting && <Spinner animation="border" size="sm" className="me-2" />}
          Löschen
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
