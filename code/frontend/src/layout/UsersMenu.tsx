import Dropdown from 'react-bootstrap/Dropdown'
import { NavLink, useNavigate } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { useCountdown } from './useCountdown.ts'

/**
 * Das Menü hinter dem Profil-Symbol rechts im Header, wie in der Vorlage: oben die Box, wer angemeldet ist (E-Mail,
 * Username, welche Sitzung und wann sie sich das nächste Mal erneuert), darunter Profil und Abmelden. Ein
 * Bootstrap-Dropdown: Klick daneben und Esc schließen es, die Pfeiltasten wandern durch die Einträge. Ohne Anmeldung
 * zeigt es nichts.
 */
export function UsersMenu() {
  const navigate = useNavigate()
  const { session, nextSessionRenewalAt, logout } = useCurrentSession()
  const sessionRenewalCountdown = useCountdown(nextSessionRenewalAt)

  if (session === null) {
    return null
  }

  /** Danach zur Startseite, damit es nach der nächsten Anmeldung dort weitergeht. */
  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const toggleLabel = 'Benutzermenü von ' + session.users.email
  const sessionNumberText = 'Sitzung #' + session.sessionNumber
  const sessionText = session.users.username + ' · ' + sessionNumberText + ' · Erneuerung in ' + sessionRenewalCountdown

  return (
    <Dropdown align="end">
      {/* nur das Symbol mit dünnem Rand, kein Text, kein Pfeil: die E-Mail steht im Kopf der Klappe */}
      <Dropdown.Toggle as="button" type="button" bsPrefix="header-icon-button" aria-label={toggleLabel}>
        <i className="bi bi-person-circle"></i>
      </Dropdown.Toggle>
      <Dropdown.Menu className="users-menu-panel">
        <div className="users-menu-head">
          <strong>{session.users.email}</strong>
          <span className="users-menu-head-sub">{sessionText}</span>
        </div>
        <div className="users-menu-list">
          <Dropdown.Item as={NavLink} to="/profile">
            <i className="bi bi-person"></i>
            Profil
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item as="button" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            Abmelden
          </Dropdown.Item>
        </div>
      </Dropdown.Menu>
    </Dropdown>
  )
}
