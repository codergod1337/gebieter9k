import { type ChangeEvent, type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { FormCard } from '../../components/FormCard.tsx'
import { SubmitButton } from '../../components/SubmitButton.tsx'
import { LoginSecondFactorStep } from '../login/LoginSecondFactorStep.tsx'
import { useLoginWith2fa } from '../login/useLoginWith2fa.ts'
import { useRegistration } from './useRegistration.ts'

type RegistrationFormProps = {
  /** Wechselt zum Login. */
  onShowLogin: () => void
}

/**
 * Das Registrierungsformular: Username, E-Mail-Adresse und das Passwort zweimal. Nach der Registrierung startet gleich
 * der Login mit Pflicht-2FA, wie bei jedem anderen Login: Der neue User richtet dabei seine Authenticator-App ein.
 */
export function RegistrationForm({ onShowLogin }: RegistrationFormProps) {
  const { createRegistration, isLoading: isRegistering, error: registrationError } = useRegistration()
  const loginWith2faHook = useLoginWith2fa()

  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [plainPassword, setPlainPassword] = useState<string>('')
  const [repeatedPlainPassword, setRepeatedPlainPassword] = useState<string>('')
  const [passwordMismatchMessage, setPasswordMismatchMessage] = useState<string | null>(null)
  const [loginAfterRegistrationMessage, setLoginAfterRegistrationMessage] = useState<string | null>(null)

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const passwordsMatch = plainPassword === repeatedPlainPassword
    if (!passwordsMatch) {
      setPasswordMismatchMessage('Die beiden Passwörter stimmen nicht überein.')
      return
    }
    setPasswordMismatchMessage(null)
    setLoginAfterRegistrationMessage(null)

    const registeredUsers = await createRegistration(username, email, plainPassword)
    if (registeredUsers === null) {
      return
    }
    const loginStarted = await loginWith2faHook.startLogin(email, plainPassword)
    if (!loginStarted) {
      setLoginAfterRegistrationMessage('Die Registrierung hat geklappt, die Anmeldung danach nicht. Bitte jetzt anmelden.')
    }
  }

  let errorMessage: string | null = passwordMismatchMessage
  if (errorMessage === null && registrationError !== null) {
    errorMessage = registrationError.detail
  }
  if (errorMessage === null) {
    errorMessage = loginAfterRegistrationMessage
  }
  const isSubmitting = isRegistering || loginWith2faHook.isBusy

  if (loginWith2faHook.phase === 'done') {
    return (
      <FormCard iconClassName="bi bi-person-plus" title="Registrieren">
        Registriert und angemeldet, einen Moment …
      </FormCard>
    )
  }
  const secondFactorPhase = loginWith2faHook.phase === 'totpCode' || loginWith2faHook.phase === 'totpSetup'
  if (secondFactorPhase) {
    return (
      <FormCard iconClassName="bi bi-shield-lock" title="Registriert: Authenticator-App einrichten">
        <LoginSecondFactorStep
          usersTotpSetup={loginWith2faHook.usersTotpSetup}
          isBusy={loginWith2faHook.isBusy}
          errorMessage={loginWith2faHook.errorMessage}
          onSubmitCode={loginWith2faHook.finishLogin}
          onCancel={onShowLogin}
        />
      </FormCard>
    )
  }

  return (
    <FormCard iconClassName="bi bi-person-plus" title="Registrieren">
      <ErrorAlert message={errorMessage} />
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="registrationUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control autoComplete="nickname" value={username} onChange={handleUsernameChange} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="registrationEmail">
          <Form.Label>E-Mail-Adresse</Form.Label>
          <Form.Control type="email" autoComplete="email" value={email} onChange={handleEmailChange} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="registrationPassword">
          <Form.Label>Passwort</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            value={plainPassword}
            onChange={handlePasswordChange}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="registrationRepeatedPassword">
          <Form.Label>Passwort wiederholen</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            value={repeatedPlainPassword}
            onChange={handleRepeatedPasswordChange}
            required
          />
        </Form.Group>
        <SubmitButton isSubmitting={isSubmitting}>Registrieren</SubmitButton>
      </Form>
      <div className="text-center mt-3">
        <Button variant="link" onClick={onShowLogin}>
          Schon registriert? Anmelden
        </Button>
      </div>
    </FormCard>
  )
}
