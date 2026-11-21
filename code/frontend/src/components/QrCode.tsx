import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'

type QrCodeProps = {
  /** Was im Code steht, z. B. eine Adresse (`https://…`) oder `otpauth://totp/…`. */
  value: string
  /** Der Text für Screenreader, z. B. „QR-Code des Links von „für Oma““. */
  altText: string
  /** Kantenlänge in Pixeln. */
  size?: number
}

/** Das gezeichnete Bild und zu welchem Wert es gehört. */
type DrawnQrCode = {
  value: string
  dataUrl: string
}

/**
 * Ein QR-Code, überall gleich: Er wird hier im Browser gezeichnet (npm `qrcode`, wie in der Vorlage), nie bei einem
 * fremden Dienst, denn sein Inhalt geht niemanden etwas an (das Geheimnis der Authenticator-App, der Link einer
 * Galerie-Freigabe). Immer schwarz auf weiß, sonst lesen ihn manche Kameras nicht. Global: das Einrichten der
 * Authenticator-App und der Link zum Weitergeben ({@link QrCodeButton}) nutzen ihn.
 */
export function QrCode({ value, altText, size = 240 }: QrCodeProps) {
  const [drawnQrCode, setDrawnQrCode] = useState<DrawnQrCode | null>(null)

  useEffect(() => {
    let active = true
    const qrCodeOptions = { errorCorrectionLevel: 'M' as const, margin: 1, width: size }
    void QRCode.toDataURL(value, qrCodeOptions).then((dataUrl) => {
      if (active) {
        setDrawnQrCode({ value, dataUrl })
      }
    })
    return () => {
      active = false
    }
  }, [value, size])

  if (drawnQrCode === null || drawnQrCode.value !== value) {
    return <Spinner animation="border" size="sm" />
  }
  return <img className="qr-code" src={drawnQrCode.dataUrl} alt={altText} width={size} height={size} />
}
