import { useEffect, useState } from 'react'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { onlineUsersPollSeconds } from '../components/onlineUsersPollSeconds.ts'
import { useUsersOnline } from '../users/useUsersOnline.ts'

/**
 * Im Header links von der Position: „Online (N)“, wie viele User gerade da sind (Nutzer 2026-11-09). Online heißt: Login
 * oder Verlängerung der Sitzung in den letzten 17 Minuten, gemessen auf dem Server; wer sich abmeldet, ist sofort weg.
 * Fragt beim Anzeigen und alle {@link onlineUsersPollSeconds} Sekunden nach, aber nur, solange der Tab sichtbar ist. Die
 * Sprechblase geht nach unten auf, über dem Header wäre sie aus der Seite.
 */
export function OnlineUsersCount() {
  const usersOnlineHook = useUsersOnline()
  const getOnlineUsersCount = usersOnlineHook.getOnlineUsersCount
  const [onlineUsersCount, setOnlineUsersCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadOnlineUsersCount() {
      if (document.visibilityState !== 'visible') {
        return
      }
      const loadedOnlineUsersCount = await getOnlineUsersCount()
      if (!cancelled && loadedOnlineUsersCount !== null) {
        setOnlineUsersCount(loadedOnlineUsersCount.onlineUsersCount)
      }
    }
    void loadOnlineUsersCount()
    const pollIntervalMilliseconds = onlineUsersPollSeconds * 1000
    const pollTimer = setInterval(() => void loadOnlineUsersCount(), pollIntervalMilliseconds)
    function handleVisibilityChange() {
      void loadOnlineUsersCount()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      cancelled = true
      clearInterval(pollTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [getOnlineUsersCount])

  if (onlineUsersCount === null) {
    return null
  }
  return (
    <Hoverlay
      placement="bottom"
      text="So viele User sind gerade da: angemeldet oder Sitzung verlängert in den letzten 17 Minuten.">
      <span className="header-online-users" tabIndex={0}>
        <span className="header-online-users-dot" aria-hidden="true" />
        {'Online (' + onlineUsersCount.toLocaleString('de-DE') + ')'}
      </span>
    </Hoverlay>
  )
}
