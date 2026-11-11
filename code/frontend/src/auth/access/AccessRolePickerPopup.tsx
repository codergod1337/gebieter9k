import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import type { AccessRole } from './AccessRole.ts'
import { AccessRoleBadge } from './AccessRoleBadge.tsx'
import { AccessRolePicker } from './AccessRolePicker.tsx'

type AccessRolePickerPopupProps = {
  /** Titel des Popups, z. B. „Wer liest fileName?“ */
  title: string
  /** Das gewählte Recht, `null` für niemand. */
  selectedAccessRole: AccessRole | null
  /** Alle Rechte aus den Stammdaten. */
  accessRoles: AccessRole[]
  /** Was „niemand“ bedeutet, z. B. „Kein User bekommt das Feld, nur das Backend nutzt es.“ */
  noAccessRoleText: string
  /** Solange gespeichert wird, ist alles gesperrt. */
  isSaving: boolean
  /** Fehler des Speicherns, `null` wenn keiner. */
  errorMessage: string | null
  /** Ein Recht gewählt, `null` für niemand. Der Aufrufer speichert und schließt. */
  onPick: (accessRoleKey: string | null) => void
  onClose: () => void
}

/**
 * Genau ein Recht wählen, in einem Popup: oben, was jetzt gilt, darunter „niemand“ und die Auswahl wie die Hook-Suche
 * der Vorlage ({@link AccessRolePicker}). Ein Klick wählt.
 */
export function AccessRolePickerPopup({
  title,
  selectedAccessRole,
  accessRoles,
  noAccessRoleText,
  isSaving,
  errorMessage,
  onPick,
  onClose,
}: AccessRolePickerPopupProps) {
  const noAccessRoleSelected = selectedAccessRole === null
  let selectedAccessRoleKey: string | null = null
  if (selectedAccessRole !== null) {
    selectedAccessRoleKey = selectedAccessRole.key
  }
  const offeredAccessRoles = accessRoles.filter((accessRole) => accessRole.key !== selectedAccessRoleKey)

  function handleNoAccessRoleClick() {
    onPick(null)
  }

  function handleAccessRolePick(accessRole: AccessRole) {
    onPick(accessRole.key)
  }

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorAlert message={errorMessage} />
        <p className="mb-2">
          Jetzt:{' '}
          {selectedAccessRole !== null && <AccessRoleBadge accessRole={selectedAccessRole} />}
          {noAccessRoleSelected && <span>niemand. {noAccessRoleText}</span>}
        </p>
        <AccessRolePicker accessRoles={offeredAccessRoles} onPick={handleAccessRolePick} disabled={isSaving} />
        {!noAccessRoleSelected && (
          <button type="button" className="access-role-picker-entry" disabled={isSaving} onClick={handleNoAccessRoleClick}>
            <span>niemand</span>
            <span className="access-role-picker-key">{noAccessRoleText}</span>
          </button>
        )}
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
