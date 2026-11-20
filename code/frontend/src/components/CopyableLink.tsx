import { CopyButton } from './CopyButton.tsx'

type CopyableLinkProps = {
  /** Die Adresse: Sie steht als Text da, öffnet sich beim Klick in einem neuen Tab und lässt sich kopieren. */
  href: string
  /** Für Screenreader am Kopierknopf, z. B. „Link von „für Oma“ kopieren“. */
  copyLabel: string
}

/**
 * Ein Link zum Weitergeben, überall gleich: die Adresse zum Anklicken (neuer Tab) und daneben der {@link CopyButton}.
 * Für jede Stelle, an der ein User eine Adresse sehen, ausprobieren und kopieren soll, z. B. der Link einer
 * Galerie-Freigabe in einer Tabelle oder am Ende von „neue Freigabe“.
 */
export function CopyableLink({ href, copyLabel }: CopyableLinkProps) {
  return (
    <span className="d-flex align-items-center">
      <a className="small text-break" href={href} target="_blank" rel="noopener noreferrer">
        {href}
      </a>
      <CopyButton label={copyLabel} value={href} />
    </span>
  )
}
