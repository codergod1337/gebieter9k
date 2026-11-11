import type { ChangeEvent } from 'react'
import Form from 'react-bootstrap/Form'

type TotpCodeFieldProps = {
  controlId: string
  code: string
  onCodeChange: (changedCode: string) => void
  /** z. B. beim Login: gleich hineintippen */
  autoFocus?: boolean
}

/**
 * Das Feld für den 6-stelligen Code aus der Authenticator-App, überall gleich: Login, Einrichten, Testen, Abschalten.
 * Auf dem Handy mit Ziffernblock, der Browser darf Codes aus SMS oder Passwort-Manager vorschlagen.
 */
export function TotpCodeField({ controlId, code, onCodeChange, autoFocus = false }: TotpCodeFieldProps) {
  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredCode = event.target.value
    onCodeChange(enteredCode)
  }

  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label>6-stelliger Code aus der App</Form.Label>
      <Form.Control
        className="totp-code-input"
        value={code}
        onChange={handleCodeChange}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        placeholder="123 456"
        autoFocus={autoFocus}
        required
      />
    </Form.Group>
  )
}
