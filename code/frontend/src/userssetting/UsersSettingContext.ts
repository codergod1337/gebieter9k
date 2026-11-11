import { createContext } from 'react'

/** Die eigenen Einstellungen für alle Module, gelesen über {@link useUsersSettings}. */
export type CurrentUsersSettings = {
  /** true, sobald die eigenen Einstellungen nach dem Login geladen sind. Ohne Anmeldung immer false. */
  loaded: boolean
  /** Der Wert einer Einstellung, `null` wenn es sie nicht gibt: dann gilt der Standard des Frontends. */
  settingValue: (settingKey: string) => string | null
  /** Setzt eine eigene Einstellung: sofort wirksam, dann gespeichert. Ohne Anmeldung passiert nichts. */
  changeSetting: (settingKey: string, settingValue: string) => void
  /** Löscht eine eigene Einstellung, danach gilt wieder der Standard. Ohne Anmeldung passiert nichts. */
  deleteSetting: (settingKey: string) => void
}

/** Wird vom `UsersSettingProvider` gefüllt. */
export const UsersSettingContext = createContext<CurrentUsersSettings | null>(null)
