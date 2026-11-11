import { formatDateTime } from './formatDateTime.ts'
import { formatRelativeDays } from './formatRelativeDays.ts'
import { Hoverlay } from './Hoverlay.tsx'

type DateTimeTextProps = {
  /** Der Zeitpunkt als ISO-Text vom Backend. */
  isoDateTime: string
  /** Was der Zeitpunkt ist, z. B. „Hochgeladen“; steht in der Sprechblase vor dem Abstand. */
  label?: string
}

/**
 * Jedes Datum der Plattform, überall gleich (Nutzer 2026-11-09): lesbar in Ortszeit, in der Sprechblase, vor wie vielen
 * Tagen das war („Zuletzt geändert · vor 3 Tagen“). Wo keine Sprechblase geht (in einem Satz, in einem Hoverlay), gibt
 * es `formatDateTimeWithRelativeDays`.
 */
export function DateTimeText({ isoDateTime, label }: DateTimeTextProps) {
  const dateTimeText = formatDateTime(isoDateTime)
  const relativeDaysText = formatRelativeDays(isoDateTime)
  let hoverlayText: string | null = relativeDaysText
  if (label !== undefined && relativeDaysText !== null) {
    hoverlayText = label + ' · ' + relativeDaysText
  } else if (label !== undefined) {
    hoverlayText = label
  }
  return (
    <Hoverlay text={hoverlayText}>
      <span className="date-time-text" tabIndex={0}>
        {dateTimeText}
      </span>
    </Hoverlay>
  )
}
