import { type ChangeEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { createSha256Hex } from '../../auth/createSha256Hex.ts'
import { EditValuePopup } from '../../components/EditValuePopup.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { NewUsers, Users } from '../../users/Users.ts'
import { useUsers } from '../../users/useUsers.ts'
import { NEW_USERS_TEXTS } from './newUsersTexts.ts'

/** Die Form einer GUID: 8-4-4-4-12 Hex-Zeichen. Ob sie frei ist, prüft das Backend. */
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type NewUsersPopupProps = {
  /** Der User ist angelegt; der Aufrufer schließt das Popup und lädt seine Liste neu. */
  onCreated: (createdUsers: Users) => void
  onClose: () => void
}

/**
 * Der Admin legt einen User an (Nutzer 2026-11-11), im kleinen Popup statt auf eigener Seite: dieselben Angaben wie bei
 * der Registrierung (Username, E-Mail-Adresse, Passwort zweimal), dazu wahlweise die GUID. Das Passwort darf leer
 * bleiben, dann setzt das Backend das Startpasswort. Ein eingegebenes Passwort wird wie überall im Browser mit SHA-256
 * gehasht, der Server sieht es nie im Klartext. Eine Authenticator-App hat der neue User noch nicht; er richtet sie bei
 * seiner ersten Anmeldung ein.
 */
export function NewUsersPopup({ onCreated, onClose }: NewUsersPopupProps) {
  const createUsersHook = useUsers()
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [plainPassword, setPlainPassword] = useState<string>('')
  const [repeatedPlainPassword, setRepeatedPlainPassword] = useState<string>('')
  const [enteredGuid, setEnteredGuid] = useState<string>('')
  /** Was schon im Browser nicht passt (Passwörter verschieden, GUID ohne Form), `null` wenn nichts. */
  const [inputErrorMessage, setInputErrorMessage] = useState<string | null>(null)

  function handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredUsername = event.target.value
    setUsername(enteredUsername)
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredEmail = event.target.value
    setEmail(enteredEmail)
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredPassword = event.target.value
    setPlainPassword(enteredPassword)
  }

  function handleRepeatedPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredRepeatedPassword = event.target.value
    setRepeatedPlainPassword(enteredRepeatedPassword)
  }

  function handleGuidChange(event: ChangeEvent<HTMLInputElement>) {
    const typedGuid = event.target.value
    setEnteredGuid(typedGuid)
  }

  async function handleCreate() {
    const passwordsMatch = plainPassword === repeatedPlainPassword
    if (!passwordsMatch) {
      const passwordMismatchMessage = getTextInCurrentLanguage(NEW_USERS_TEXTS.passwordMismatch)
      setInputErrorMessage(passwordMismatchMessage)
      return
    }
    const trimmedGuid = enteredGuid.trim()
    const guidGiven = trimmedGuid !== ''
    const guidHasValidForm = GUID_PATTERN.test(trimmedGuid)
    if (guidGiven && !guidHasValidForm) {
      const guidInvalidMessage = getTextInCurrentLanguage(NEW_USERS_TEXTS.guidInvalid)
      setInputErrorMessage(guidInvalidMessage)
      return
    }
    setInputErrorMessage(null)

    const newUsers: NewUsers = { username, email }
    if (guidGiven) {
      newUsers.guid = trimmedGuid
    }
    const passwordGiven = plainPassword !== ''
    if (passwordGiven) {
      newUsers.sha256HexPassword = await createSha256Hex(plainPassword)
    }
    const createdUsers = await createUsersHook.createUsers(newUsers)
    if (createdUsers === null) {
      return
    }
    onCreated(createdUsers)
  }

  function handleSave() {
    void handleCreate()
  }

  let errorMessage: string | null = inputErrorMessage
  if (errorMessage === null && createUsersHook.error !== null) {
    errorMessage = createUsersHook.error.detail
  }
  const isSaving = createUsersHook.isLoading
  const saveDisabled = username.trim() === '' || email.trim() === ''

  return (
    <EditValuePopup
      title={getTextInCurrentLanguage(NEW_USERS_TEXTS.popupTitle)}
      isSaving={isSaving}
      errorMessage={errorMessage}
      saveDisabled={saveDisabled}
      onSave={handleSave}
      onClose={onClose}>
      <Form.Group className="mb-3" controlId="newUsersUsername">
        <Form.Label>{getTextInCurrentLanguage(NEW_USERS_TEXTS.usernameLabel)}</Form.Label>
        <Form.Control autoFocus autoComplete="off" value={username} onChange={handleUsernameChange} disabled={isSaving} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="newUsersEmail">
        <Form.Label>{getTextInCurrentLanguage(NEW_USERS_TEXTS.emailLabel)}</Form.Label>
        <Form.Control autoComplete="off" value={email} onChange={handleEmailChange} disabled={isSaving} />
        <Form.Text>{getTextInCurrentLanguage(NEW_USERS_TEXTS.emailHint)}</Form.Text>
      </Form.Group>
      <Form.Group className="mb-3" controlId="newUsersPassword">
        <Form.Label>{getTextInCurrentLanguage(NEW_USERS_TEXTS.passwordLabel)}</Form.Label>
        <Form.Control
          type="password"
          autoComplete="new-password"
          value={plainPassword}
          onChange={handlePasswordChange}
          disabled={isSaving}
        />
        <Form.Text>{getTextInCurrentLanguage(NEW_USERS_TEXTS.passwordHint)}</Form.Text>
      </Form.Group>
      <Form.Group className="mb-3" controlId="newUsersRepeatedPassword">
        <Form.Label>{getTextInCurrentLanguage(NEW_USERS_TEXTS.repeatedPasswordLabel)}</Form.Label>
        <Form.Control
          type="password"
          autoComplete="new-password"
          value={repeatedPlainPassword}
          onChange={handleRepeatedPasswordChange}
          disabled={isSaving}
        />
      </Form.Group>
      <Form.Group controlId="newUsersGuid">
        <Form.Label>{getTextInCurrentLanguage(NEW_USERS_TEXTS.guidLabel)}</Form.Label>
        <Form.Control autoComplete="off" value={enteredGuid} onChange={handleGuidChange} disabled={isSaving} />
        <Form.Text>{getTextInCurrentLanguage(NEW_USERS_TEXTS.guidHint)}</Form.Text>
      </Form.Group>
    </EditValuePopup>
  )
}
