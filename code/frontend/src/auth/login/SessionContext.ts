import { createContext } from 'react'
import type { Users } from '../../users/Users.ts'
import type { SessionInfo } from './SessionInfo.ts'

/** Die Sitzung, die alle Module über {@link SessionContext} bekommen. */
export type CurrentSession = {
  /** Die eigene Sitzung, `null` wenn niemand angemeldet ist. */
  session: SessionInfo | null
  /** Beim Laden der Seite wird geprüft, ob noch eine Sitzung da ist (JWT oder Refresh-Token). Solange `true`. */
  isRestoring: boolean
  /** Wann die Sitzung das nächste Mal erneuert wird (ISO-Text), `null` ohne Anmeldung. Für die Anzeige im Menü. */
  nextSessionRenewalAt: string | null
  /** Übernimmt die Sitzung, die das Login-Fenster nach der 2FA abgeholt hat (die Cookies sind dann schon gesetzt). */
  acceptSession: (sessionInfo: SessionInfo) => void
  /** Liefert, ob der Logout geklappt hat. */
  logout: () => Promise<boolean>
  /** Übernimmt den eigenen User nach einer Änderung (z. B. der Sichtbarkeit), damit alle Module den neuen Stand zeigen. */
  acceptOwnUsers: (changedOwnUsers: Users) => void
  /**
   * Hat der angemeldete User dieses Recht, z. B. `ADMIN`? Nur für die Anzeige, die echte Prüfung
   * macht das Backend. Ohne Anmeldung immer `false`.
   */
  hasAccessRole: (accessRoleKey: string) => boolean
}

/** Wird vom `SessionProvider` gefüllt, gelesen über `useCurrentSession`. */
export const SessionContext = createContext<CurrentSession | null>(null)
