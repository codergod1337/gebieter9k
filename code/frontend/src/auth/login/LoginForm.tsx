import { type ChangeEvent, type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { FormCard } from '../../components/FormCard.tsx'
import { SubmitButton } from '../../components/SubmitButton.tsx'
import { LoginSecondFactorStep } from './LoginSecondFactorStep.tsx'
import { useLoginWith2fa } from './useLoginWith2fa.ts'

type LoginFormProps = {
  /** Wechselt zur Registrierung. */
  onShowRegistration: () => void
}

/**
 * Das Login-Formular mit Pflicht-2FA: E-Mail-Adresse und Passwort, dann der Code aus der Authenticator-App (ohne App erst
 * ihr Einrichten), dann ist man angemeldet. Die Logik steckt in {@link useLoginWith2fa}, der zweite Schritt in
 * {@link LoginSecondFactorStep}. Nur Bootstrap, kein eigenes CSS.
 */
export function LoginForm({ onShowRegistration }: LoginFormProps) {
  const { phase, usersTotpSetup, isBusy, errorMessage, startLogin, finishLogin, cancelLogin } = useLoginWith2fa()
  const [email, setEmail] = useState<string>('')
  const [plainPassword, setPlainPassword] = useState<string>('')

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredEmail = event.target.value
    setEmail(enteredEmail)
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredPassword = event.target.value
    setPlainPassword(enteredPassword)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const started = await startLogin(email, plainPassword)
    if (started) {
      setPlainPassword('')
    }
  }

  if (phase === 'done') {
    return (
      <FormCard iconClassName="bi bi-box-arrow-in-right" title="Anmelden">
        <Spinner animation="border" size="sm" className="me-2" />
        Angemeldet, einen Moment …
      </FormCard>
    )
  }
  if (phase === 'totpCode' || phase === 'totpSetup') {
    let secondFactorTitle = 'Anmelden'
    if (phase === 'totpSetup') {
      secondFactorTitle = 'Authenticator-App einrichten'
    }
    return (
      <FormCard iconClassName="bi bi-shield-lock" title={secondFactorTitle}>
        <LoginSecondFactorStep
          usersTotpSetup={usersTotpSetup}
          isBusy={isBusy}
          errorMessage={errorMessage}
          onSubmitCode={finishLogin}
          onCancel={cancelLogin}
        />
      </FormCard>
    )
  }
  return (
    <FormCard iconClassName="bi bi-box-arrow-in-right" title="Anmelden">
      <ErrorAlert message={errorMessage} />
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="loginEmail">
          <Form.Label>E-Mail-Adresse</Form.Label>
          {/* Bewusst kein type="email": Die E-Mail-Adresse des Admin-Kontos ist nur "alice". */}
          <Form.Control autoComplete="username" value={email} onChange={handleEmailChange} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="loginPassword">
          <Form.Label>Passwort</Form.Label>
          <Form.Control
            type="password"
            autoComplete="current-password"
            value={plainPassword}
            onChange={handlePasswordChange}
            required
          />
        </Form.Group>
        <SubmitButton isSubmitting={isBusy}>Weiter</SubmitButton>
      </Form>
      <div className="text-center mt-3">
        <Button variant="link" onClick={onShowRegistration}>
          Noch kein Konto? Registrieren
        </Button>
      </div>
    </FormCard>
  )
}
