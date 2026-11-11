/** Ein Tag in Millisekunden, für den Abstand zweier Kalendertage. */
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000

/** Mitternacht des Kalendertags in Ortszeit. */
function getLocalDayStart(dateTime: Date): number {
  const dayStart = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate())
  return dayStart.getTime()
}

/**
 * Wie viele Kalendertage ein Zeitpunkt (ISO-Text vom Backend) von heute entfernt ist, in Worten: „heute“, „gestern“,
 * „vor 3 Tagen“, „morgen“, „in 2 Tagen“. Unlesbar: `null`.
 */
export function formatRelativeDays(isoDateTimeText: string): string | null {
  const dateTime = new Date(isoDateTimeText)
  if (Number.isNaN(dateTime.getTime())) {
    return null
  }
  const now = new Date()
  const dayDifference = Math.round((getLocalDayStart(now) - getLocalDayStart(dateTime)) / DAY_MILLISECONDS)
  if (dayDifference === 0) {
    return 'heute'
  }
  if (dayDifference === 1) {
    return 'gestern'
  }
  if (dayDifference === -1) {
    return 'morgen'
  }
  if (dayDifference > 1) {
    return 'vor ' + dayDifference.toLocaleString('de-DE') + ' Tagen'
  }
  const daysAhead = -dayDifference
  return 'in ' + daysAhead.toLocaleString('de-DE') + ' Tagen'
}
