import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { type CurrentUsersSettings, UsersSettingContext } from './UsersSettingContext.ts'
import { useOwnUsersSetting } from './useOwnUsersSetting.ts'

type UsersSettingProviderProps = {
  children: ReactNode
}

/** Die eigenen Einstellungen samt der GUID, für die sie geladen wurden: nach Abmelden oder Userwechsel gelten sie nicht. */
type LoadedUsersSettings = {
  usersGuid: string
  settingValuesByKey: Map<string, string>
}

/**
 * Hält die eigenen Einstellungen für die ganze Anwendung, nach dem UsersSettingsProvider der Vorlage. Steht innerhalb
 * des `SessionProvider`: Nach dem Login oder beim Start mit Sitzung lädt er die eigenen Einträge
 * (`GET /api/users-setting`). Ohne Anmeldung gibt es keine Einstellungen, es gilt der Standard des Frontends. Eine
 * Änderung wirkt sofort und wird dann gespeichert.
 */
export function UsersSettingProvider({ children }: UsersSettingProviderProps) {
  const { session } = useCurrentSession()
  const { getOwnUsersSetting, saveOwnUsersSetting, deleteOwnUsersSetting } = useOwnUsersSetting()
  const [loadedUsersSettings, setLoadedUsersSettings] = useState<LoadedUsersSettings | null>(null)

  let sessionUsersGuid: string | null = null
  if (session !== null) {
    sessionUsersGuid = session.users.guid
  }
  let settingValuesByKey: Map<string, string> | null = null
  if (loadedUsersSettings !== null && loadedUsersSettings.usersGuid === sessionUsersGuid) {
    settingValuesByKey = loadedUsersSettings.settingValuesByKey
  }

  // Nach Login oder Start mit Sitzung die eigenen Einträge holen. Verschwindet die Sitzung vorher, fällt die Antwort weg.
  useEffect(() => {
    if (sessionUsersGuid === null) {
      return undefined
    }
    const loadingUsersGuid = sessionUsersGuid
    let current = true
    async function loadOwnUsersSetting() {
      const ownUsersSettings = await getOwnUsersSetting()
      if (!current) {
        return
      }
      const loadedSettingValuesByKey = new Map<string, string>()
      if (ownUsersSettings !== null) {
        for (const ownUsersSetting of ownUsersSettings) {
          let settingValue = ''
          if (ownUsersSetting.settingValue !== null) {
            settingValue = ownUsersSetting.settingValue
          }
          loadedSettingValuesByKey.set(ownUsersSetting.settingKey, settingValue)
        }
      }
      setLoadedUsersSettings({ usersGuid: loadingUsersGuid, settingValuesByKey: loadedSettingValuesByKey })
    }
    void loadOwnUsersSetting()
    return () => {
      current = false
    }
  }, [sessionUsersGuid, getOwnUsersSetting])

  const settingValue = useCallback(
    (settingKey: string) => {
      if (settingValuesByKey === null) {
        return null
      }
      const foundSettingValue = settingValuesByKey.get(settingKey)
      if (foundSettingValue === undefined) {
        return null
      }
      return foundSettingValue
    },
    [settingValuesByKey],
  )

  /** Ändert die Einträge des angemeldeten Users im Speicher, damit es sofort gilt. */
  const changeLoadedSettingValues = useCallback(
    (usersGuid: string, changeSettingValues: (settingValues: Map<string, string>) => void) => {
      setLoadedUsersSettings((currentLoadedUsersSettings) => {
        let currentSettingValuesByKey = new Map<string, string>()
        if (currentLoadedUsersSettings !== null && currentLoadedUsersSettings.usersGuid === usersGuid) {
          currentSettingValuesByKey = currentLoadedUsersSettings.settingValuesByKey
        }
        const changedSettingValuesByKey = new Map(currentSettingValuesByKey)
        changeSettingValues(changedSettingValuesByKey)
        return { usersGuid, settingValuesByKey: changedSettingValuesByKey }
      })
    },
    [],
  )

  const changeSetting = useCallback(
    (settingKey: string, changedSettingValue: string) => {
      if (sessionUsersGuid === null) {
        return
      }
      changeLoadedSettingValues(sessionUsersGuid, (settingValues) => settingValues.set(settingKey, changedSettingValue))
      void saveOwnUsersSetting(settingKey, changedSettingValue)
    },
    [sessionUsersGuid, changeLoadedSettingValues, saveOwnUsersSetting],
  )

  const deleteSetting = useCallback(
    (settingKey: string) => {
      if (sessionUsersGuid === null) {
        return
      }
      changeLoadedSettingValues(sessionUsersGuid, (settingValues) => settingValues.delete(settingKey))
      void deleteOwnUsersSetting(settingKey)
    },
    [sessionUsersGuid, changeLoadedSettingValues, deleteOwnUsersSetting],
  )

  const loaded = settingValuesByKey !== null
  const currentUsersSettings: CurrentUsersSettings = useMemo(
    () => ({ loaded, settingValue, changeSetting, deleteSetting }),
    [loaded, settingValue, changeSetting, deleteSetting],
  )
  return <UsersSettingContext.Provider value={currentUsersSettings}>{children}</UsersSettingContext.Provider>
}
