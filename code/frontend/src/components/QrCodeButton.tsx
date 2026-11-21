import { type ReactNode, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import { QrCode } from './QrCode.tsx'

type QrCodeButtonProps = {
  /** Für Screenreader am Knopf und am Bild, z. B. „QR-Code des Links von „für Oma“ zeigen“. */
  label: string
  /** Der Titel des Popups, z. B. „QR-Code von „für Oma““. */
  title: string
  /** Was im Code steht, z. B. die Adresse zum Weitergeben. */
  value: string
  /** Erklärung unter dem Code, z. B. was nach dem Scannen geschieht. */
  hint?: ReactNode
}

/** Kantenlänge des Codes im Popup: groß genug, um ihn vom Bildschirm zu scannen, passt auch auf ein Handy. */
const POPUP_QR_CODE_SIZE = 280

/**
 * Der Knopf mit dem QR-Symbol samt Popup in einem Stück, überall gleich: Ein Klick zeigt den Wert (z. B. einen Link zum
 * Weitergeben) groß als QR-Code, zum Scannen mit der Kamera eines Handys; darunter steht der Wert als Text. Gezeichnet
 * wird über {@link QrCode}. Global: Der {@link CopyableLink} bietet ihn neben dem Kopierknopf an.
 */
export function QrCodeButton({ label, title, value, hint }: QrCodeButtonProps) {
  const [popupOpen, setPopupOpen] = useState<boolean>(false)

  return (
    <>
      <Button
        variant="outline-secondary"
        size="sm"
        className="control-button control-button-qr ms-2 py-0"
        onClick={() => setPopupOpen(true)}
        aria-label={label}>
        <i className="bi bi-qr-code"></i>
      </Button>
      {popupOpen && (
        <Modal show onHide={() => setPopupOpen(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="qr-code-area">
              <QrCode value={value} altText={label} size={POPUP_QR_CODE_SIZE} />
            </div>
            {hint !== undefined && <p className="small text-body-secondary">{hint}</p>}
            <p className="small text-break mb-0">{value}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setPopupOpen(false)}>
              Schließen
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  )
}
