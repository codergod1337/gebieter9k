import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import { useNavigate } from 'react-router'
import { useLoadedData } from '../api/useLoadedData.ts'
import { adminAccessRoleKey } from '../auth/access/adminAccessRoleKey.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import type { UsersTotpStatus } from '../auth/totp/UsersTotp.ts'
import { useUsersTotp } from '../auth/totp/useUsersTotp.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { formatDateTimeWithRelativeDays } from '../components/formatDateTime.ts'
import { ProfileAuthenticatorPopup } from './ProfileAuthenticatorPopup.tsx'
import { ProfileMailTestPopup } from './ProfileMailTestPopup.tsx'
import { ProfilePasswordPopup } from './ProfilePasswordPopup.tsx'

type ProfileSecurityBoxProps = {
  /** Der Platz dieser Sitzung. */
  sessionNumber: number
  /** Zeit bis zur nächsten Erneuerung als `mm:ss`. */
  sessionRenewalCountdown: string | null
}

/** Welches Popup gerade offen ist. */
type OpenSecurityPopup = 'PASSWORD' | 'AUTHENTICATOR' | 'MAIL_TEST' | null

/** Die Zeile der Authenticator-App: was sie gerade ist. */
function getAuthenticatorText(usersTotpStatus: UsersTotpStatus | null): string {
  if (usersTotpStatus === null) {
    return 'Stand wird geladen …'
  }
  if (usersTotpStatus.state === 'PENDING') {
    return 'Einrichten angefangen, der erste Code fehlt noch.'
  }
  if (usersTotpStatus.state === 'ACTIVE' && usersTotpStatus.confirmedAt !== null) {
    const confirmedAtText = formatDateTimeWithRelativeDays(usersTotpStatus.confirmedAt)
    return 'Aktiv seit ' + confirmedAtText + '. Jede Anmeldung fragt nach dem Code.'
  }
  return 'Nicht eingerichtet: Die nächste Anmeldung verlangt es. Google, Microsoft oder jede andere TOTP-App.'
}

/**
 * Box „Sicherheit“, wie in der Vorlage: Passwort ändern, Authenticator-App (2FA, einrichten und testen), Test-Mail
 * (Vorstufe der 2FA per E-Mail, nur Admin) und die Sitzung (Platz, nächste Erneuerung, Abmelden). Jede Aktion öffnet
 * ein Popup. Ein Konto löscht allein der Admin, nie der User selbst.
 */
export function ProfileSecurityBox({ sessionNumber, sessionRenewalCountdown }: ProfileSecurityBoxProps) {
  const navigate = useNavigate()
  const { logout, hasAccessRole } = useCurrentSession()
  const usersTotpHook = useUsersTotp()
  const loadedUsersTotpStatus = useLoadedData(usersTotpHook.getOwnUsersTotpStatus)
  const usersTotpStatus = loadedUsersTotpStatus.data
  const reloadUsersTotpStatus = loadedUsersTotpStatus.reload
  const [openSecurityPopup, setOpenSecurityPopup] = useState<OpenSecurityPopup>(null)
  const currentUsersIsAdmin = hasAccessRole(adminAccessRoleKey)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handleUsersTotpStatusChanged() {
    void reloadUsersTotpStatus()
  }

  function closeSecurityPopup() {
    setOpenSecurityPopup(null)
  }

  const sessionText =
    'Sitzung #' + sessionNumber + ', erneuert sich von selbst, das nächste Mal in ' + sessionRenewalCountdown + '.'
  const authenticatorText = getAuthenticatorText(usersTotpStatus)
  let authenticatorButtonText = 'Einrichten'
  let authenticatorButtonIconClassName = 'bi bi-qr-code me-1'
  if (usersTotpStatus !== null && usersTotpStatus.state === 'ACTIVE') {
    authenticatorButtonText = 'Testen'
    authenticatorButtonIconClassName = 'bi bi-shield-check me-1'
  }

  return (
    <ContentBox title="Sicherheit" footer="Ein Konto löscht allein der Admin.">
      <div className="profile-security-row">
        <span className="d-flex flex-column">
          <strong>Passwort</strong>
          <span className="small text-body-secondary">Ändern mit dem bisherigen Passwort.</span>
        </span>
        <Button variant="outline-secondary" size="sm" onClick={() => setOpenSecurityPopup('PASSWORD')}>
          <i className="bi bi-key me-1"></i>
          Ändern
        </Button>
      </div>
      <div className="profile-security-row">
        <span className="d-flex flex-column">
          <strong>Authenticator-App (2FA)</strong>
          <span className="small text-body-secondary">{authenticatorText}</span>
        </span>
        <Button
          variant="outline-secondary"
          size="sm"
          disabled={usersTotpStatus === null}
          onClick={() => setOpenSecurityPopup('AUTHENTICATOR')}>
          <i className={authenticatorButtonIconClassName}></i>
          {authenticatorButtonText}
        </Button>
      </div>
      {currentUsersIsAdmin && (
        <div className="profile-security-row">
          <span className="d-flex flex-column">
            <strong>E-Mail (2FA)</strong>
            <span className="small text-body-secondary">
              Erst prüfen, ob über den SMTP-Zugang aus der .env eine Mail ankommt.
            </span>
          </span>
          <Button variant="outline-secondary" size="sm" onClick={() => setOpenSecurityPopup('MAIL_TEST')}>
            <i className="bi bi-envelope me-1"></i>
            Test-Mail
          </Button>
        </div>
      )}
      <div className="profile-security-row">
        <span className="d-flex flex-column">
          <strong>Diese Sitzung</strong>
          <span className="small text-body-secondary">{sessionText}</span>
        </span>
        <Button variant="outline-danger" size="sm" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-1"></i>
          Abmelden
        </Button>
      </div>
      {openSecurityPopup === 'PASSWORD' && <ProfilePasswordPopup onClose={closeSecurityPopup} />}
      {openSecurityPopup === 'AUTHENTICATOR' && usersTotpStatus !== null && (
        <ProfileAuthenticatorPopup
          usersTotpStatus={usersTotpStatus}
          onClose={closeSecurityPopup}
          onStatusChanged={handleUsersTotpStatusChanged}
        />
      )}
      {openSecurityPopup === 'MAIL_TEST' && <ProfileMailTestPopup onClose={closeSecurityPopup} />}
    </ContentBox>
  )
}
