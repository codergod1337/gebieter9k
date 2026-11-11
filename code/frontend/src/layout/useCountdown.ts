import { useEffect, useState } from 'react'

/** Restzeit bis `untilMilliseconds` als `mm:ss`, nie negativ. */
function formatCountdown(untilMilliseconds: number, nowMilliseconds: number): string {
  const remainingMilliseconds = untilMilliseconds - nowMilliseconds
  const remainingSeconds = Math.max(0, Math.floor(remainingMilliseconds / 1000))
  const remainingMinutesText = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const remainingSecondsText = String(remainingSeconds % 60).padStart(2, '0')
  return remainingMinutesText + ':' + remainingSecondsText
}

/**
 * Die Restzeit bis zu einem Zeitpunkt als `mm:ss`, im Sekundentakt neu, z. B. bis das Token der Sitzung abläuft. Ohne
 * Zeitpunkt `null`, dann läuft auch kein Takt.
 *
 * @param untilIsoTimestamp der Zeitpunkt als ISO-Text, so wie das Backend ihn liefert
 */
export function useCountdown(untilIsoTimestamp: string | null): string | null {
  const [nowMilliseconds, setNowMilliseconds] = useState<number>(() => Date.now())

  useEffect(() => {
    if (untilIsoTimestamp === null) {
      return
    }
    const interval = setInterval(() => setNowMilliseconds(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [untilIsoTimestamp])

  if (untilIsoTimestamp === null) {
    return null
  }
  const untilMilliseconds = new Date(untilIsoTimestamp).getTime()
  return formatCountdown(untilMilliseconds, nowMilliseconds)
}
