import { type ChangeEvent, type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { createSha256Hex } from '../auth/createSha256Hex.ts'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { SubmitButton } from '../components/SubmitButton.tsx'
import { showToast } from '../components/toastStore.ts'
import { useUsersCredential } from '../users/useUsersCredential.ts'

type ProfilePasswordPopupProps = {
  onClose: () => void
}

/**
 * Das eigene Passwort ändern (Profil, „Sicherheit“): das bisherige und zweimal das neue. Beide gehen nur als SHA-256 ans
 * Backend, wie beim Login; das Klartext-Passwort verlässt den Browser nie.
 */
export function ProfilePasswordPopup({ onClose }: ProfilePasswordPopupProps) {
  const usersCredentialHook = useUsersCredential()
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [repeatedNewPassword, setRepeatedNewPassword] = useState<string>('')
  const [mismatchMessage, setMismatchMessage] = useState<string | null>(null)

  function handleCurrentPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setCurrentPassword(event.target.value)
  }

  function handleNewPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setNewPassword(event.target.value)
  }

  function handleRepeatedNewPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setRepeatedNewPassword(event.target.value)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword !== repeatedNewPassword) {
      setMismatchMessage('Die beiden neuen Passwörter sind nicht gleich.')
      return
    }
    setMismatchMessage(null)
    const currentSha256HexPassword = await createSha256Hex(currentPassword)
    const newSha256HexPassword = await createSha256Hex(newPassword)
    const changed = await usersCredentialHook.changeOwnUsersCredential({ currentSha256HexPassword, newSha256HexPassword })
    if (!changed) {
      return
    }
    showToast({ kind: 'success', title: 'Passwort geändert', text: 'Ab der nächsten Anmeldung gilt das neue.' })
    onClose()
  }

  let errorMessage = mismatchMessage
  if (errorMessage === null && usersCredentialHook.error !== null) {
    errorMessage = usersCredentialHook.error.detail
  }

  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Passwort ändern</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert message={errorMessage} />
          <Form.Group className="mb-3" controlId="profilePasswordCurrent">
            <Form.Label>Bisheriges Passwort</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={handleCurrentPasswordChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="profilePasswordNew">
            <Form.Label>Neues Passwort</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={handleNewPasswordChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="profilePasswordRepeated">
            <Form.Label>Neues Passwort wiederholen</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={repeatedNewPassword}
              onChange={handleRepeatedNewPasswordChange}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={usersCredentialHook.isLoading}>
            Abbrechen
          </Button>
          <SubmitButton isSubmitting={usersCredentialHook.isLoading} fullWidth={false}>
            Speichern
          </SubmitButton>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
