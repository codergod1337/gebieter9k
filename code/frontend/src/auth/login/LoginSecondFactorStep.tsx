import { type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { SubmitButton } from '../../components/SubmitButton.tsx'
import { TotpCodeField } from '../totp/TotpCodeField.tsx'
import { TotpSetupInstructions } from '../totp/TotpSetupInstructions.tsx'
import type { UsersTotpSetup } from '../totp/UsersTotp.ts'

type LoginSecondFactorStepProps = {
  /** Nur beim Einrichten (noch keine App): QR-Code und Schlüssel. `null`: die App ist schon eingerichtet. */
  usersTotpSetup: UsersTotpSetup | null
  isBusy: boolean
  errorMessage: string | null
  /** Liefert, ob der Code gepasst hat. */
  onSubmitCode: (code: string) => Promise<boolean>
  onCancel: () => void
}

/**
 * Der zweite Schritt des Logins: der Code aus der Authenticator-App. Ohne App richtet der User sie hier ein (dieselbe
 * Anzeige wie im Profil), ihr erster Code meldet an. Ein falscher Code leert das Feld; nach zu vielen geht es mit
 * „Abbrechen“ zurück zum Passwort.
 */
export function LoginSecondFactorStep({
  usersTotpSetup,
  isBusy,
  errorMessage,
  onSubmitCode,
  onCancel,
}: LoginSecondFactorStepProps) {
  const [code, setCode] = useState<string>('')
  const setupNeeded = usersTotpSetup !== null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const accepted = await onSubmitCode(code)
    if (!accepted) {
      setCode('')
    }
  }

  let introText = 'Jetzt den Code aus deiner Authenticator-App eingeben.'
  let submitText = 'Anmelden'
  if (setupNeeded) {
    introText =
      'Zu jeder Anmeldung gehört ein Code aus einer Authenticator-App. Du hast noch keine eingerichtet: Das geht jetzt, ' +
      'einmalig, danach bist du angemeldet.'
    submitText = 'Einrichten und anmelden'
  }

  return (
    <Form onSubmit={handleSubmit}>
      <p>{introText}</p>
      <ErrorAlert message={errorMessage} />
      {setupNeeded && <TotpSetupInstructions usersTotpSetup={usersTotpSetup} />}
      <TotpCodeField controlId="loginTotpCode" code={code} onCodeChange={setCode} autoFocus={!setupNeeded} />
      <SubmitButton isSubmitting={isBusy}>{submitText}</SubmitButton>
      <div className="text-center mt-3">
        <Button variant="link" onClick={onCancel} disabled={isBusy}>
          Abbrechen, zurück zur Anmeldung
        </Button>
      </div>
    </Form>
  )
}
