/** Die Test-Mail: Empfänger (leer = `MAIL_TEST_RECIPIENT` aus der .env), Betreff und Text. Senden darf nur der Admin. */
export type MailTestRequest = {
  recipient: string
  subject: string
  text: string
}

/** Nach dem Senden: an wen, über welchen Server, wie lange es dauerte. */
export type MailTestResult = {
  recipient: string
  smtpHost: string
  smtpPort: number
  durationMillis: number
}

/** Der SMTP-Zugang, der im Backend gerade gilt, ohne Passwort. */
export type MailTestSettings = {
  smtpHost: string
  smtpPort: number
  startTls: boolean
  ssl: boolean
  smtpUsername: string
  from: string
  testRecipient: string
  /** der SMTP-Server ist gesetzt, sonst geht nichts raus */
  configured: boolean
}
