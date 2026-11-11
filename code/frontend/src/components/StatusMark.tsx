/** Die Art eines Zustands, daraus kommt die Farbe (Signalfarben aus base.css, in jedem Theme gleich). */
export type StatusTone = 'SUCCESS' | 'RUNNING' | 'WARNING' | 'DANGER' | 'NEUTRAL'

/** Ein Zustand zum Anzeigen: Art, Symbol und Text in Worten. */
export type StatusMarkLook = {
  tone: StatusTone
  /** Bootstrap-Icon-Klassen */
  iconClassName: string
  label: string
}

type StatusMarkProps = {
  look: StatusMarkLook
}

/** Die Klasse je Art: base.css färbt sie. */
const STATUS_TONE_CLASS_NAMES: Record<StatusTone, string> = {
  SUCCESS: 'status-mark-success',
  RUNNING: 'status-mark-running',
  WARNING: 'status-mark-warning',
  DANGER: 'status-mark-danger',
  NEUTRAL: 'status-mark-neutral',
}

/**
 * Ein Zustand als kleines Zeichen, überall gleich (Nutzer 2026-11-09: nie ein Enum-Wert wie DONE oder ACTIVE im Klartext):
 * Symbol und Text in Worten in der Signalfarbe seiner Art, z. B. ein grüner Haken mit „ausgewertet“, eine laufende Uhr
 * mit „Auswertung läuft“. Was ein Wert bedeutet, legt je Feld eine kleine Zuordnung fest, die das Aussehen liefert.
 */
export function StatusMark({ look }: StatusMarkProps) {
  const toneClassName = STATUS_TONE_CLASS_NAMES[look.tone]
  const statusMarkClassName = 'status-mark ' + toneClassName
  return (
    <span className={statusMarkClassName}>
      <i className={look.iconClassName} aria-hidden="true"></i>
      {look.label}
    </span>
  )
}
