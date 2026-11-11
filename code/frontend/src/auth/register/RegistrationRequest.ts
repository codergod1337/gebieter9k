/** Body für die Registrierung. Das Passwort ist schon mit SHA-256 gehasht. */
export type RegistrationRequest = {
  username: string
  email: string
  sha256HexPassword: string
}
