import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import type { MailTestSettings } from '../../mail/MailTest.ts'
import { MailTestForm } from '../../mail/MailTestForm.tsx'
import { useMailTest } from '../../mail/useMailTest.ts'

/** „STARTTLS“, „SSL“ oder „keine“, wie der Server angesprochen wird. */
function getEncryptionText(mailTestSettings: MailTestSettings): string {
  if (mailTestSettings.ssl) {
    return 'SSL'
  }
  if (mailTestSettings.startTls) {
    return 'STARTTLS'
  }
  return 'keine'
}

/** Ein Wert der Einstellungen, leer als Hinweis „fehlt“. */
function getSettingText(settingValue: string): string {
  if (settingValue.trim() === '') {
    return '– fehlt –'
  }
  return settingValue
}

/**
 * Tab „Mail-Test“ der Administration: Geht über den SMTP-Zugang aus der .env wirklich eine Mail raus? Oben steht, welcher
 * Zugang gerade gilt (ohne Passwort), darunter das Formular der Test-Mail (dasselbe wie im Profil). Zum Wechseln des
 * Anbieters: .env ändern, Backend neu starten, hier neu laden.
 */
export function MailTestTab() {
  const mailTestHook = useMailTest()
  const loadedMailTestSettings = useLoadedData(mailTestHook.getMailTestSettings)
  const mailTestSettings = loadedMailTestSettings.data

  if (mailTestHook.error !== null) {
    return <ErrorAlert message={mailTestHook.error.detail} />
  }
  if (mailTestSettings === null) {
    return <Spinner animation="border" />
  }
  const encryptionText = getEncryptionText(mailTestSettings)
  const smtpServerText = getSettingText(mailTestSettings.smtpHost) + ' : ' + mailTestSettings.smtpPort
  const smtpUsernameText = getSettingText(mailTestSettings.smtpUsername)
  const fromText = getSettingText(mailTestSettings.from)
  const testRecipientText = getSettingText(mailTestSettings.testRecipient)

  return (
    <>
      <ContentBox title="SMTP-Zugang (aus der .env)">
        {!mailTestSettings.configured && (
          <Alert variant="warning">
            Noch nicht eingerichtet: In der <code>code/.env</code> mindestens <code>SMTP_HOST</code>,{' '}
            <code>SMTP_USERNAME</code> und <code>SMTP_PASSWORD</code> setzen, dann das Backend neu starten.
          </Alert>
        )}
        <Table size="sm" className="mb-0">
          <tbody>
            <tr>
              <th>Server</th>
              <td>{smtpServerText}</td>
            </tr>
            <tr>
              <th>Verschlüsselung</th>
              <td>{encryptionText}</td>
            </tr>
            <tr>
              <th>Konto</th>
              <td>{smtpUsernameText}</td>
            </tr>
            <tr>
              <th>Absender</th>
              <td>{fromText}</td>
            </tr>
            <tr>
              <th>Empfänger (Vorbelegung)</th>
              <td>{testRecipientText}</td>
            </tr>
          </tbody>
        </Table>
      </ContentBox>
      <ContentBox title="Test-Mail">
        <MailTestForm defaultRecipient={mailTestSettings.testRecipient} />
      </ContentBox>
    </>
  )
}
