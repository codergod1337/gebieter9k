import Alert from 'react-bootstrap/Alert'
import { AuthenticatorAppLinks } from './AuthenticatorAppLinks.tsx'
import { TotpQrCode } from './TotpQrCode.tsx'
import type { UsersTotpSetup } from './UsersTotp.ts'

type TotpSetupInstructionsProps = {
  usersTotpSetup: UsersTotpSetup
}

/** Das Geheimnis in Viererblöcken, zum Abtippen: `GEZD GNBV …`. */
function groupSecretInBlocks(secretBase32: string): string {
  const secretBlocks = secretBase32.match(/.{1,4}/g) ?? []
  return secretBlocks.join(' ')
}

/**
 * Das Einrichten der Authenticator-App, überall gleich (Login und Profil): die Schritte, der QR-Code (gilt für Google,
 * Microsoft und jede andere TOTP-App), der Schlüssel zum Abtippen samt roter Warnung (notieren, er wird nur jetzt
 * gezeigt) und die Links zu den Apps. Das Feld für den ersten Code baut der Aufrufer darunter.
 */
export function TotpSetupInstructions({ usersTotpSetup }: TotpSetupInstructionsProps) {
  const groupedSecret = groupSecretInBlocks(usersTotpSetup.secretBase32)
  return (
    <>
      <ol className="totp-steps">
        <li>
          App öffnen und auf „+“ tippen: Google Authenticator „QR-Code scannen“, Microsoft Authenticator „Anderes Konto
          (Google, Facebook usw.)“. Noch keine App? Die Links stehen unter dem Schlüssel.
        </li>
        <li>Diesen QR-Code scannen.</li>
        <li>Den Code eingeben, den die App jetzt für „{usersTotpSetup.issuer}“ zeigt, und bestätigen.</li>
      </ol>
      <div className="totp-qr-code-area">
        <TotpQrCode otpauthUri={usersTotpSetup.otpauthUri} />
      </div>
      <p className="small text-body-secondary mb-1">Dein Schlüssel (scannen geht nicht? Dann diesen in der App abtippen):</p>
      <p className="totp-secret">{groupedSecret}</p>
      <Alert variant="danger" className="totp-secret-warning">
        <i className="bi bi-exclamation-triangle-fill totp-secret-warning-icon" aria-hidden="true"></i>
        <span>
          <strong>Diesen Schlüssel jetzt notieren!</strong> Verlierst du Handy oder App, brauchst du ihn, um die
          Authenticator-App hier wieder abzuschalten. Er wird nur jetzt gezeigt; gespeichert ist er nur verschlüsselt,
          auch ein Admin sieht ihn nie.
        </span>
      </Alert>
      <AuthenticatorAppLinks />
    </>
  )
}
