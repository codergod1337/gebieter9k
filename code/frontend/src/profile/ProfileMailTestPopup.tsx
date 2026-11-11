import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { MailTestForm } from '../mail/MailTestForm.tsx'
import { useMailTest } from '../mail/useMailTest.ts'

type ProfileMailTestPopupProps = {
  onClose: () => void
}

/**
 * Test-Mail aus dem Profil („Sicherheit“, nur Admin): Kommt über den SMTP-Zugang aus der .env eine Mail an? Vorstufe der
 * 2FA per E-Mail. Dasselbe Formular wie im Admin-Tab „Mail-Test“, darüber der Server, über den sie rausgeht.
 */
export function ProfileMailTestPopup({ onClose }: ProfileMailTestPopupProps) {
  const mailTestHook = useMailTest()
  const loadedMailTestSettings = useLoadedData(mailTestHook.getMailTestSettings)
  const mailTestSettings = loadedMailTestSettings.data

  let popupContent
  if (mailTestHook.error !== null && mailTestSettings === null) {
    popupContent = <ErrorAlert message={mailTestHook.error.detail} />
  } else if (mailTestSettings === null) {
    popupContent = <Spinner animation="border" size="sm" />
  } else if (!mailTestSettings.configured) {
    popupContent = (
      <Alert variant="warning" className="mb-0">
        SMTP ist noch nicht eingerichtet: In der <code>code/.env</code> <code>SMTP_HOST</code>, <code>SMTP_USERNAME</code>{' '}
        und <code>SMTP_PASSWORD</code> setzen, dann das Backend neu starten.
      </Alert>
    )
  } else {
    const serverText =
      'Geht raus über ' + mailTestSettings.smtpHost + ':' + mailTestSettings.smtpPort + ' als ' + mailTestSettings.from + '.'
    popupContent = (
      <>
        <p className="small text-body-secondary">{serverText}</p>
        <MailTestForm defaultRecipient={mailTestSettings.testRecipient} />
      </>
    )
  }

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Test-Mail senden</Modal.Title>
      </Modal.Header>
      <Modal.Body>{popupContent}</Modal.Body>
    </Modal>
  )
}
