import { type ChangeEvent, type FormEvent, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { AuthenticatorAppLinks } from '../auth/totp/AuthenticatorAppLinks.tsx'
import { TotpCodeField } from '../auth/totp/TotpCodeField.tsx'
import { TotpSetupInstructions } from '../auth/totp/TotpSetupInstructions.tsx'
import type { UsersTotpCodeCheck, UsersTotpSetup, UsersTotpStatus } from '../auth/totp/UsersTotp.ts'
import { useUsersTotp } from '../auth/totp/useUsersTotp.ts'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { formatDateTimeWithRelativeDays } from '../components/formatDateTime.ts'
import { SubmitButton } from '../components/SubmitButton.tsx'
import { showToast } from '../components/toastStore.ts'

type ProfileAuthenticatorPopupProps = {
  usersTotpStatus: UsersTotpStatus
  onClose: () => void
  /** nach jeder Änderung (eingerichtet, abgeschaltet): den Stand neu laden */
  onStatusChanged: () => void
}

/**
 * Die Authenticator-App im Profil („Sicherheit“), erklärt in `docu/konzept-2fa-totp.md`. Noch nicht eingerichtet: Knopf
 * „QR-Code anzeigen“, dann dieselbe Anzeige wie beim Login ({@link TotpSetupInstructions}) und der erste Code zum
 * Bestätigen. Aktiv: einen Code testen, so wie es der Login tut, oder abschalten, mit einem Code oder ohne App mit dem
 * Schlüssel. Ohne beides entfernt sie nur ein Admin. Weil die App Pflicht ist, verlangt die nächste Anmeldung nach dem
 * Abschalten, sie neu einzurichten.
 */
export function ProfileAuthenticatorPopup({ usersTotpStatus, onClose, onStatusChanged }: ProfileAuthenticatorPopupProps) {
  const usersTotpHook = useUsersTotp()
  const [usersTotpSetup, setUsersTotpSetup] = useState<UsersTotpSetup | null>(null)
  const [code, setCode] = useState<string>('')
  const [secretInput, setSecretInput] = useState<string>('')
  const [lastCodeCheck, setLastCodeCheck] = useState<UsersTotpCodeCheck | null>(null)
  const isActive = usersTotpStatus.state === 'ACTIVE'

  function handleSecretInputChange(event: ChangeEvent<HTMLInputElement>) {
    setSecretInput(event.target.value)
  }

  async function handleCreateSetup() {
    const createdUsersTotpSetup = await usersTotpHook.createOwnUsersTotpSetup()
    if (createdUsersTotpSetup === null) {
      return
    }
    setUsersTotpSetup(createdUsersTotpSetup)
    setCode('')
    onStatusChanged()
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const confirmedUsersTotpStatus = await usersTotpHook.confirmOwnUsersTotp(code)
    if (confirmedUsersTotpStatus === null) {
      return
    }
    showToast({ kind: 'success', title: 'Authenticator aktiv', text: 'Der erste Code hat gepasst.' })
    onStatusChanged()
    onClose()
  }

  async function handleCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const codeCheck = await usersTotpHook.checkOwnUsersTotpCode(code)
    if (codeCheck === null) {
      return
    }
    setLastCodeCheck(codeCheck)
    setCode('')
  }

  /** Abschalten mit dem aktuellen Code aus der App. */
  async function handleDeleteWithCode() {
    const deleted = await usersTotpHook.deleteOwnUsersTotp(code, null)
    finishDelete(deleted)
  }

  /** Abschalten ohne App: mit dem Schlüssel, der beim Einrichten gezeigt wurde. */
  async function handleDeleteWithSecret() {
    const deleted = await usersTotpHook.deleteOwnUsersTotp(null, secretInput)
    finishDelete(deleted)
  }

  function finishDelete(deleted: boolean) {
    if (!deleted) {
      return
    }
    showToast({
      kind: 'success',
      title: 'Authenticator abgeschaltet',
      text: 'Die nächste Anmeldung verlangt, sie neu einzurichten. In der App kannst du den alten Eintrag löschen.',
    })
    onStatusChanged()
    onClose()
  }

  let errorMessage: string | null = null
  if (usersTotpHook.error !== null) {
    errorMessage = usersTotpHook.error.detail
  }

  const codeInput = <TotpCodeField controlId="profileAuthenticatorCode" code={code} onCodeChange={setCode} />

  let popupBody
  if (isActive) {
    let activeSinceText = 'Aktiv.'
    if (usersTotpStatus.confirmedAt !== null) {
      const confirmedAtText = formatDateTimeWithRelativeDays(usersTotpStatus.confirmedAt)
      activeSinceText = 'Aktiv seit ' + confirmedAtText + '.'
    }
    let codeCheckVariant = 'warning'
    if (lastCodeCheck !== null && lastCodeCheck.valid) {
      codeCheckVariant = 'success'
    }
    popupBody = (
      <>
        <Form onSubmit={handleCheck}>
          <p>
            {activeSinceText} Hier testest du einen Code, so wie es der Login tut. Jeder Code gilt nur einmal.
          </p>
          {lastCodeCheck !== null && <Alert variant={codeCheckVariant}>{lastCodeCheck.message}</Alert>}
          {codeInput}
          <div className="d-flex flex-wrap justify-content-between gap-2">
            <Button variant="outline-danger" onClick={handleDeleteWithCode} disabled={usersTotpHook.isLoading || code === ''}>
              <i className="bi bi-x-circle me-1"></i>Mit diesem Code abschalten
            </Button>
            <SubmitButton isSubmitting={usersTotpHook.isLoading} fullWidth={false}>
              <i className="bi bi-check2-circle me-1"></i>Code testen
            </SubmitButton>
          </div>
        </Form>
        <hr />
        <Form.Group className="mb-3" controlId="profileAuthenticatorSecret">
          <Form.Label>App verloren? Mit dem Schlüssel von der Einrichtung abschalten</Form.Label>
          <Form.Control
            className="totp-secret-input"
            value={secretInput}
            onChange={handleSecretInputChange}
            autoComplete="off"
            spellCheck={false}
            placeholder="GEZD GNBV …"
          />
          <Form.Text>Leerzeichen und Kleinschreibung sind egal. Ohne Schlüssel kann nur ein Admin die App entfernen.</Form.Text>
        </Form.Group>
        <div className="d-flex justify-content-end">
          <Button
            variant="outline-danger"
            onClick={handleDeleteWithSecret}
            disabled={usersTotpHook.isLoading || secretInput.trim() === ''}>
            <i className="bi bi-key me-1"></i>Mit dem Schlüssel abschalten
          </Button>
        </div>
      </>
    )
  } else if (usersTotpSetup === null) {
    popupBody = (
      <>
        <p>
          Eine Authenticator-App zeigt alle 30 Sekunden einen neuen 6-stelligen Code. Ein QR-Code gilt für jede App:
          Google Authenticator, Microsoft Authenticator, Aegis, 2FAS oder Apples Passwörter-App.
        </p>
        <AuthenticatorAppLinks />
        <p className="small text-body-secondary">
          Der QR-Code enthält dein Geheimnis. Er wird nur jetzt einmal gezeigt; wer ihn fotografiert, kann deine Codes
          rechnen.
        </p>
        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={handleCreateSetup} disabled={usersTotpHook.isLoading}>
            <i className="bi bi-qr-code me-1"></i>QR-Code anzeigen
          </Button>
        </div>
      </>
    )
  } else {
    popupBody = (
      <Form onSubmit={handleConfirm}>
        <TotpSetupInstructions usersTotpSetup={usersTotpSetup} />
        {codeInput}
        <div className="d-flex justify-content-end">
          <SubmitButton isSubmitting={usersTotpHook.isLoading} fullWidth={false}>
            <i className="bi bi-shield-check me-1"></i>Bestätigen
          </SubmitButton>
        </div>
      </Form>
    )
  }

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Authenticator-App</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorAlert message={errorMessage} />
        {popupBody}
      </Modal.Body>
    </Modal>
  )
}
