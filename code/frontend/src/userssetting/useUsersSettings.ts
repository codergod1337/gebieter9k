import { useContext } from 'react'
import { type CurrentUsersSettings, UsersSettingContext } from './UsersSettingContext.ts'

/** Die eigenen Einstellungen aus dem `UsersSettingProvider`, für jedes Modul (z. B. die Spaltenbreiten einer Tabelle). */
export function useUsersSettings(): CurrentUsersSettings {
  const currentUsersSettings = useContext(UsersSettingContext)
  if (currentUsersSettings === null) {
    throw new Error('useUsersSettings braucht den UsersSettingProvider außen um die Anwendung.')
  }
  return currentUsersSettings
}
