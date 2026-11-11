import { Link } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { OriginBackButton } from '../navigation/OriginBackButton.tsx'
import { OnlineUsersCount } from './OnlineUsersCount.tsx'
import { OwnAccessRoleCollection } from './OwnAccessRoleCollection.tsx'
import { UsersMenu } from './UsersMenu.tsx'

/**
 * Der Header jeder Seite, wie in der Vorlage, für beide Zustände gebaut: links die Marke zur Startseite, daneben „Zurück
 * zu …“, solange man aus einer Seite in eine Unterseite gegangen ist ({@link OriginBackButton}), rechts nach der
 * Anmeldung „Online (N)“ ({@link OnlineUsersCount}), die eigene Position (ARC) und das Benutzermenü. Er bleibt beim Scrollen oben stehen. Den Subheader
 * darunter rendert allein das jeweilige Modul.
 */
export function AppHeader() {
  const { session } = useCurrentSession()
  const isLoggedIn = session !== null

  return (
    <header className="header">
      <Link className="header-brand" to="/">
        <i className="bi bi-house-fill"></i>
        <span>gebiter9k</span>
      </Link>
      {isLoggedIn && <OriginBackButton />}
      {isLoggedIn && (
        <div className="header-session">
          <OnlineUsersCount />
          <OwnAccessRoleCollection />
          <UsersMenu />
        </div>
      )}
    </header>
  )
}
