import { Hoverlay } from './Hoverlay.tsx'
import { StatusMark, type StatusMarkLook } from './StatusMark.tsx'

/** Ein möglicher Stand eines Feldes: sein Wert, wie er aussieht und was er bedeutet. */
export type StatusLegendEntry = {
  value: string
  look: StatusMarkLook
  explanation: string
}

type StatusLegendMarkProps = {
  /** Wofür der Stand gilt, z. B. „Datei“ oder „Auswertung“; Überschrift in der Sprechblase. */
  title: string
  /** Der Wert im Dokument. */
  currentValue: unknown
  /** Alle möglichen Stände in ihrer Reihenfolge. */
  entries: StatusLegendEntry[]
}

/** Ein Wert, den die Zuordnung (noch) nicht kennt: nie den Rohwert zeigen. */
const UNKNOWN_LOOK: StatusMarkLook = { tone: 'NEUTRAL', iconClassName: 'bi bi-question-circle', label: 'unbekannt' }

/**
 * Ein Stand mit seiner Legende (Nutzer 2026-11-09): das Zeichen des aktuellen Stands ({@link StatusMark}), in der
 * Sprechblase alle möglichen Stände mit ihrer Bedeutung, der aktuelle hervorgehoben. So sieht man, was „ausgewertet“
 * heißt und was es sonst noch gibt.
 */
export function StatusLegendMark({ title, currentValue, entries }: StatusLegendMarkProps) {
  const currentEntry = entries.find((entry) => entry.value === currentValue)
  const currentLook = currentEntry?.look ?? UNKNOWN_LOOK
  const legend = (
    <span className="status-legend">
      <span className="status-legend-title">{title}</span>
      {entries.map((entry) => {
        let entryClassName = 'status-legend-entry'
        if (entry.value === currentValue) {
          entryClassName = 'status-legend-entry status-legend-entry-current'
        }
        return (
          <span key={entry.value} className={entryClassName}>
            <StatusMark look={entry.look} />
            <span className="status-legend-explanation">{entry.explanation}</span>
          </span>
        )
      })}
    </span>
  )
  return (
    <Hoverlay text={legend} placement="right">
      <span className="status-legend-mark" tabIndex={0} aria-label={title + ': ' + currentLook.label}>
        <StatusMark look={currentLook} />
      </span>
    </Hoverlay>
  )
}
