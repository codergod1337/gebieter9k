/**
 * Wie weit die eigene Authenticator-App ist: NONE (keine), PENDING (QR-Code erzeugt, der erste Code fehlt noch),
 * ACTIVE (bestätigt).
 */
export type UsersTotpState = 'NONE' | 'PENDING' | 'ACTIVE'

/**
 * Der Stand der eigenen App, wie das Backend ihn liefert.
 * Doku: `docu/entities/UsersTotp.md`
 */
export type UsersTotpStatus = {
  state: UsersTotpState
  /** seit wann aktiv (ISO), sonst `null` */
  confirmedAt: string | null
}

/**
 * Was das Einrichten braucht, nur in diesem einen Moment: QR-Adresse und dasselbe Geheimnis zum Abtippen.
 * Doku: `docu/entities/UsersTotp.md`
 */
export type UsersTotpSetup = {
  /** `otpauth://totp/…`, gilt für Google, Microsoft und jede andere TOTP-App */
  otpauthUri: string
  secretBase32: string
  issuer: string
  accountName: string
}

/**
 * Ergebnis des Tests eines Codes.
 * Doku: `docu/entities/UsersTotp.md`
 */
export type UsersTotpCodeCheck = {
  valid: boolean
  message: string
}
