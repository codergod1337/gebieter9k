import { useCallback, useState } from 'react'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { getSessionStateValue, rememberSessionStateValue } from './viewCache.ts'

/** Ein neuer Wert oder eine Funktion, die ihn aus dem aktuellen berechnet, wie bei `useState`. */
export type SessionStateUpdate<T> = T | ((currentValue: T) => T)

/**
 * Wie `useState`, aber der Wert übersteht das Verlassen der Seite bis zum Abmelden oder Neuladen: Wer zurückkommt, sieht
 * ihn wieder. Gemerkt je User unter einem festen Schlüssel (z. B. `RECENT_FILE_UPLOADS`), nur im Speicher.
 * Für Zustände, die man nicht aus der Adresse und dem Backend wiederherstellen kann.
 */
export function useSessionState<T>(stateKey: string, initialValue: T): [T, (update: SessionStateUpdate<T>) => void] {
  const { session } = useCurrentSession()
  let usersGuid = ''
  if (session !== null) {
    usersGuid = session.users.guid
  }
  const sessionStateKey = stateKey + ':' + usersGuid
  const [value, setValue] = useState<T>(() => {
    const rememberedValue = getSessionStateValue<T>(sessionStateKey)
    if (rememberedValue === undefined) {
      return initialValue
    }
    return rememberedValue
  })

  const changeValue = useCallback(
    (update: SessionStateUpdate<T>) => {
      setValue((currentValue) => {
        let changedValue: T
        if (typeof update === 'function') {
          const computeValue = update as (currentValue: T) => T
          changedValue = computeValue(currentValue)
        } else {
          changedValue = update
        }
        rememberSessionStateValue(sessionStateKey, changedValue)
        return changedValue
      })
    },
    [sessionStateKey],
  )

  return [value, changeValue]
}
