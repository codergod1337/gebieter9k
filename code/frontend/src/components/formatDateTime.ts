import { formatRelativeDays } from './formatRelativeDays.ts'

/** Ein Zeitpunkt (ISO-Text vom Backend) lesbar in deutscher Ortszeit, z. B. `08.11.2026, 02:51`. Unlesbar: der Text selbst. */
export function formatDateTime(isoDateTimeText: string): string {
  const dateTime = new Date(isoDateTimeText)
  if (Number.isNaN(dateTime.getTime())) {
    return isoDateTimeText
  }
  return dateTime.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * Ein Zeitpunkt lesbar samt Abstand in Tagen, für Stellen ohne Sprechblase (in einem Satz, in einem Hoverlay), z. B.
 * `08.11.2026, 02:51 (vor 1 Tag)`. Sonst immer die Komponente `DateTimeText`.
 */
export function formatDateTimeWithRelativeDays(isoDateTimeText: string): string {
  const dateTimeText = formatDateTime(isoDateTimeText)
  const relativeDaysText = formatRelativeDays(isoDateTimeText)
  if (relativeDaysText === null) {
    return dateTimeText
  }
  return dateTimeText + ' (' + relativeDaysText + ')'
}
