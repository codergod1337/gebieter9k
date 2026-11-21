import type { ReactNode } from 'react'
import { CopyButton } from './CopyButton.tsx'
import { QrCodeButton } from './QrCodeButton.tsx'

/** Der QR-Code zu einem Link: die Texte seines Knopfs und seines Popups. */
export type CopyableLinkQrCode = {
  /** Für Screenreader am Knopf, z. B. „QR-Code des Links von „für Oma“ zeigen“. */
  label: string
  /** Der Titel des Popups, z. B. „QR-Code von „für Oma““. */
  title: string
  /** Erklärung unter dem Code, z. B. was nach dem Scannen geschieht. */
  hint?: ReactNode
}

type CopyableLinkProps = {
  /** Die Adresse: Sie steht als Text da, öffnet sich beim Klick in einem neuen Tab und lässt sich kopieren. */
  href: string
  /** Für Screenreader am Kopierknopf, z. B. „Link von „für Oma“ kopieren“. */
  copyLabel: string
  /** Mit dieser Angabe steht neben dem Kopierknopf der Knopf, der die Adresse als QR-Code zeigt. */
  qrCode?: CopyableLinkQrCode
}

/**
 * Ein Link zum Weitergeben, überall gleich: die Adresse zum Anklicken (neuer Tab), daneben der {@link CopyButton} und
 * wahlweise der {@link QrCodeButton} (die Adresse als QR-Code im Popup, zum Scannen mit dem Handy). Für jede Stelle, an
 * der ein User eine Adresse sehen, ausprobieren und weitergeben soll, z. B. der Link einer Galerie-Freigabe in einer
 * Tabelle oder am Ende von „neue Freigabe“.
 */
export function CopyableLink({ href, copyLabel, qrCode }: CopyableLinkProps) {
  return (
    <span className="d-flex align-items-center">
      <a className="small text-break" href={href} target="_blank" rel="noopener noreferrer">
        {href}
      </a>
      <CopyButton label={copyLabel} value={href} />
      {qrCode !== undefined && (
        <QrCodeButton label={qrCode.label} title={qrCode.title} value={href} hint={qrCode.hint} />
      )}
    </span>
  )
}
