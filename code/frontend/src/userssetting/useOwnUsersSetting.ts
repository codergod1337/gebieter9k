import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { UsersSetting } from './UsersSetting.ts'

/**
 * Was {@link useOwnUsersSetting} anbietet: die Endpunkte `/api/users-setting` für die eigenen Einstellungen, benannt
 * wie die Methoden im `UsersSettingService` des Backends. Die GUID kommt im Backend aus dem Token.
 */
export type OwnUsersSettingHook = ApiHookState & {
  getOwnUsersSetting: () => Promise<UsersSetting[] | null>
  saveOwnUsersSetting: (settingKey: string, settingValue: string) => Promise<UsersSetting | null>
  deleteOwnUsersSetting: (settingKey: string) => Promise<boolean>
}

/** Die eigenen Einstellungen lesen, setzen und löschen, die Requests gehen über das API-Modul. */
export function useOwnUsersSetting(): OwnUsersSettingHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** READ: Alle eigenen Einstellungen. */
  const getOwnUsersSetting = useCallback(() => {
    return sendForData<UsersSetting[]>({ method: 'GET', path: '/api/users-setting' })
  }, [sendForData])

  /** UPDATE: Setzt eine eigene Einstellung, neu oder geändert. */
  const saveOwnUsersSetting = useCallback((settingKey: string, settingValue: string) => {
    const ownUsersSettingToSave = { settingKey, settingValue }
    return sendForData<UsersSetting>({ method: 'PUT', path: '/api/users-setting', body: ownUsersSettingToSave })
  }, [sendForData])

  /** DELETE: Löscht eine eigene Einstellung. */
  const deleteOwnUsersSetting = useCallback((settingKey: string) => {
    const ownUsersSettingToDelete = { settingKey }
    return sendForSuccess({ method: 'DELETE', path: '/api/users-setting', body: ownUsersSettingToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getOwnUsersSetting,
    saveOwnUsersSetting,
    deleteOwnUsersSetting,
  }
}
