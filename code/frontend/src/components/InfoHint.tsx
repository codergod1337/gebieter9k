import type { ReactNode } from 'react'
import { Hoverlay, type HoverlayPlacement } from './Hoverlay.tsx'

type InfoHintProps = {
  /** Was die Sprechblase zeigt: ein Text oder fertiger Inhalt, z. B. die Beschreibung einer Galerie. */
  text: ReactNode
  /** Für Screenreader, was hinter dem „i“ steht, z. B. „Beschreibung von Tansania 2026“. */
  label: string
  placement?: HoverlayPlacement
}

/**
 * Das kleine „i“ mit einer Erklärung im Hoverlay, überall gleich: an einer Kachel der Startseite (welche Rechte das
 * Modul öffnen), in einer Tabelle neben einem Namen (die Beschreibung). Ein Knopf, damit ein Tipp auf dem Handy die
 * Sprechblase öffnet und in einer Tabelle nicht zusätzlich die Zeile. Lage und Maße in base.css (`.info-hint`), die
 * Farbe im Theme.
 */
export function InfoHint({ text, label, placement }: InfoHintProps) {
  return (
    <Hoverlay text={text} placement={placement}>
      <button type="button" className="info-hint" aria-label={label}>
        <i className="bi bi-info-circle" aria-hidden="true"></i>
      </button>
    </Hoverlay>
  )
}
