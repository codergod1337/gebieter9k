import { useEffect, useState } from 'react'
import { formatDateTime } from '../components/formatDateTime.ts'

type ProfileOnlineSinceProps = {
  /** Seit wann am Stück online, vom Server. */
  onlineSince: string
}

/** Wie lange schon, in Worten: „12 min“, „1 h 12 min“, „2 Tage 3 h“. */
function formatOnlineDuration(onlineSince: string, nowMilliseconds: number): string {
  const onlineSinceMilliseconds = new Date(onlineSince).getTime()
  const elapsedMilliseconds = Math.max(0, nowMilliseconds - onlineSinceMilliseconds)
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000)
  const days = Math.floor(elapsedMinutes / 1440)
  const hours = Math.floor((elapsedMinutes % 1440) / 60)
  const minutes = elapsedMinutes % 60
  if (days > 0) {
    let dayWord = ' Tage '
    if (days === 1) {
      dayWord = ' Tag '
    }
    return days + dayWord + hours + ' h'
  }
  if (hours > 0) {
    return hours + ' h ' + minutes + ' min'
  }
  return minutes + ' min'
}

/**
 * Im Profil eines anderen Users, solange er online ist: „online seit 14:32 · 1 h 12 min“ (Nutzer 2026-11-09). Seit wann,
 * weiß nur der Server (Beginn der Serie, nicht der Login); die Dauer zählt hier jede halbe Minute weiter.
 */
export function ProfileOnlineSince({ onlineSince }: ProfileOnlineSinceProps) {
  const [nowMilliseconds, setNowMilliseconds] = useState<number>(() => Date.now())

  useEffect(() => {
    const tickTimer = setInterval(() => setNowMilliseconds(Date.now()), 30000)
    return () => clearInterval(tickTimer)
  }, [])

  const onlineSinceText = formatDateTime(onlineSince)
  const durationText = formatOnlineDuration(onlineSince, nowMilliseconds)
  return (
    <span className="profile-online">
      <span className="profile-online-dot" />
      {'online seit ' + onlineSinceText + ' · ' + durationText}
    </span>
  )
}
