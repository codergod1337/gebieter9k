/** Was nach dem Passwort kommt: der Code aus der Authenticator-App oder, ohne App, erst ihr Einrichten. */
export type UsersLogin2faSecondFactor = 'TOTP_CODE' | 'TOTP_SETUP'

/**
 * Antwort auf Schritt 1 des Logins (`POST /api/share/users-login-2fa`): der Anmeldeschein für dieses Fenster.
 * Doku: `docu/entities/UsersLogin2fa.md`
 */
export type CreatedUsersLogin2fa = {
  loginToken: string
  secondFactor: UsersLogin2faSecondFactor
}
