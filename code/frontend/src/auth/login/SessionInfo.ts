import type { Users } from '../../users/Users.ts'

/** Wer angemeldet ist und was er darf, so wie `/api/session` es liefert. */
export type SessionInfo = {
  users: Users
  accessRoleKeys: string[]
  /** Wann das JWT abläuft. */
  tokenExpiresAt: string
  /**
   * Wann der `SessionProvider` die Sitzung erneuert: Ausstellung plus `gebiter.jwt.renewal-interval` (15 Minuten), vom
   * Server, nach F5 derselbe Termin. Nur ein Termin: Die Online-Zeit misst der Server mit seiner eigenen Uhr.
   */
  tokenRenewalDueAt: string
  /** Der Platz der Sitzung, z. B. `2` für „Sitzung #2“. */
  sessionNumber: number
}

/** Body für Schritt 1 des Logins. Das Passwort ist schon mit SHA-256 gehasht. */
export type LoginRequest = {
  email: string
  sha256HexPassword: string
}
