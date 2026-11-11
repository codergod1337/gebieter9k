import { type ChangeEvent, type FormEvent, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Form from 'react-bootstrap/Form'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { SubmitButton } from '../components/SubmitButton.tsx'
import { showToast } from '../components/toastStore.ts'
import type { MailTestResult } from './MailTest.ts'
import { useMailTest } from './useMailTest.ts'

/** Vorbelegt: Umlaute und Euro zeigen gleich, ob der Zeichensatz stimmt. */
const DEFAULT_SUBJECT = 'gebiter9k: Test-Mail'
const DEFAULT_TEXT = 'Hallo,\n\ndiese Mail kommt aus dem Backend von gebiter9k.\nUmlaute: äöü ÄÖÜ ß, Euro: €\n\nGrüße'

type MailTestFormProps = {
  /** Vorbelegung des Empfängers, z. B. `MAIL_TEST_RECIPIENT` aus der .env; leer geht auch */
  defaultRecipient: string
}

/**
 * Das Formular der Test-Mail, für den Admin-Tab „Mail-Test“ und das Profil („Sicherheit“): Empfänger, Betreff, Text,
 * Senden. Danach steht da, ob der SMTP-Server sie angenommen hat, oder seine Antwort als Fehler (z. B. falsches
 * Passwort). Senden darf nur der Admin.
 */
export function MailTestForm({ defaultRecipient }: MailTestFormProps) {
  const mailTestHook = useMailTest()
  const [recipient, setRecipient] = useState<string>(defaultRecipient)
  const [subject, setSubject] = useState<string>(DEFAULT_SUBJECT)
  const [text, setText] = useState<string>(DEFAULT_TEXT)
  const [lastMailTestResult, setLastMailTestResult] = useState<MailTestResult | null>(null)

  function handleRecipientChange(event: ChangeEvent<HTMLInputElement>) {
    setRecipient(event.target.value)
  }

  function handleSubjectChange(event: ChangeEvent<HTMLInputElement>) {
    setSubject(event.target.value)
  }

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.target.value)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLastMailTestResult(null)
    const mailTestResult = await mailTestHook.sendTestMail({ recipient, subject, text })
    if (mailTestResult === null) {
      return
    }
    setLastMailTestResult(mailTestResult)
    showToast({ kind: 'success', title: 'Test-Mail raus', text: 'Der Server hat sie angenommen, jetzt das Postfach prüfen.' })
  }

  let sendErrorMessage: string | null = null
  if (mailTestHook.error !== null) {
    sendErrorMessage = mailTestHook.error.detail
  }
  let resultText = ''
  if (lastMailTestResult !== null) {
    resultText =
      'Angenommen von ' + lastMailTestResult.smtpHost + ':' + lastMailTestResult.smtpPort + ' in ' +
      lastMailTestResult.durationMillis + ' ms, an ' + lastMailTestResult.recipient + '. Kommt sie nicht an: Spam-Ordner.'
  }

  return (
    <Form onSubmit={handleSubmit}>
      <ErrorAlert message={sendErrorMessage} />
      {lastMailTestResult !== null && <Alert variant="success">{resultText}</Alert>}
      <Form.Group className="mb-3" controlId="mailTestRecipient">
        <Form.Label>Empfänger</Form.Label>
        <Form.Control type="email" value={recipient} onChange={handleRecipientChange} placeholder="name@example.org" />
        <Form.Text>Leer: die Adresse aus MAIL_TEST_RECIPIENT in der .env.</Form.Text>
      </Form.Group>
      <Form.Group className="mb-3" controlId="mailTestSubject">
        <Form.Label>Betreff</Form.Label>
        <Form.Control value={subject} onChange={handleSubjectChange} required />
      </Form.Group>
      <Form.Group className="mb-3" controlId="mailTestText">
        <Form.Label>Text</Form.Label>
        <Form.Control as="textarea" rows={6} value={text} onChange={handleTextChange} required />
      </Form.Group>
      <div className="d-flex justify-content-end">
        <SubmitButton isSubmitting={mailTestHook.isLoading} fullWidth={false}>
          <i className="bi bi-send me-1"></i>Test-Mail senden
        </SubmitButton>
      </div>
    </Form>
  )
}
