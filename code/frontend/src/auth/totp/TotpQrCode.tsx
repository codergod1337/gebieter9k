import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'

type TotpQrCodeProps = {
  /** `otpauth://totp/…` aus dem Backend */
  otpauthUri: string
}

/** Das gezeichnete Bild, zu welcher Adresse es gehört. */
type DrawnQrCode = {
  otpauthUri: string
  dataUrl: string
}

/**
 * Der QR-Code zum Einrichten der Authenticator-App: Er wird hier im Browser gezeichnet (npm `qrcode`, wie in der
 * Vorlage), nie bei einem fremden Dienst, denn er enthält das Geheimnis. Ein Code für jede App (Google, Microsoft …).
 * Immer schwarz auf weiß, sonst lesen ihn manche Kameras nicht.
 */
export function TotpQrCode({ otpauthUri }: TotpQrCodeProps) {
  const [drawnQrCode, setDrawnQrCode] = useState<DrawnQrCode | null>(null)

  useEffect(() => {
    let active = true
    const qrCodeOptions = { errorCorrectionLevel: 'M' as const, margin: 1, width: 240 }
    void QRCode.toDataURL(otpauthUri, qrCodeOptions).then((dataUrl) => {
      if (active) {
        setDrawnQrCode({ otpauthUri, dataUrl })
      }
    })
    return () => {
      active = false
    }
  }, [otpauthUri])

  if (drawnQrCode === null || drawnQrCode.otpauthUri !== otpauthUri) {
    return <Spinner animation="border" size="sm" />
  }
  return (
    <img
      className="totp-qr-code"
      src={drawnQrCode.dataUrl}
      alt="QR-Code zum Einrichten der Authenticator-App"
      width={240}
      height={240}
    />
  )
}
