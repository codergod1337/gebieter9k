import { useContext } from 'react'
import { type CurrentSession, SessionContext } from './SessionContext.ts'

/** Die eigene Sitzung aus dem `SessionProvider`, für jedes Modul. */
export function useCurrentSession(): CurrentSession {
  const currentSession = useContext(SessionContext)
  if (currentSession === null) {
    throw new Error('useCurrentSession braucht den SessionProvider außen um die Anwendung.')
  }
  return currentSession
}
