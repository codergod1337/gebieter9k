import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { NewUsers, Users, UsersForClient, Visibility } from './Users.ts'

/**
 * Was {@link useUsers} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/users` (einen User nach seiner Sichtbarkeit lesen, die eigene Sichtbarkeit ändern) und `/api/admin/users`
 * (alles ganz lesen, anlegen, ändern, löschen, nur ADMIN) eine Funktion, benannt wie die Methode im `UsersService` des Backends.
 *
 * Anlegen und Ändern liefern die Entity, Lesen das Objekt bzw. die Liste, Löschen `true` oder
 * `false`. Bei einem Fehler kommt `null` bzw. `false`, der Fehler steht dann in `error`.
 */
export type UsersHook = ApiHookState & {
  createUsers: (newUsers: NewUsers) => Promise<Users | null>
  getUsersForClient: (usersGuid: string) => Promise<UsersForClient | null>
  getUsers: (usersGuid: string) => Promise<Users | null>
  getAllUsers: () => Promise<Users[] | null>
  getDeletedUsers: () => Promise<Users[] | null>
  changeUsers: (changedUsers: Users) => Promise<Users | null>
  changeOwnUsersVisibility: (profileVisibility: Visibility, friendListVisibility: Visibility) => Promise<Users | null>
  deleteUsers: (usersGuid: string) => Promise<boolean>
}

/** Alle Endpunkte von `/api/users` und `/api/admin/users`, die Requests gehen über das API-Modul. */
export function useUsers(): UsersHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Legt einen User an und liefert ihn. */
  const createUsers = useCallback((newUsers: NewUsers) => {
    return sendForData<Users>({ method: 'POST', path: '/api/admin/users', body: newUsers })
  }, [sendForData])

  /**
   * READ: Ein User nach seiner Sichtbarkeit: ganz, wenn man sein Profil sehen darf, sonst nur die GUID
   * (`profileVisible: false`). Ein gelöschter User ergibt `null` (404).
   */
  const getUsersForClient = useCallback((usersGuid: string) => {
    const usersPath = '/api/users/' + usersGuid
    return sendForData<UsersForClient>({ method: 'GET', path: usersPath })
  }, [sendForData])

  /** READ (Admin): Ein User über seine GUID, ganz. Ein gelöschter User ergibt `null` (404). */
  const getUsers = useCallback((usersGuid: string) => {
    const usersPath = '/api/admin/users/' + usersGuid
    return sendForData<Users>({ method: 'GET', path: usersPath })
  }, [sendForData])

  /** READ (Admin): Alle User außer den gelöschten, ganz. */
  const getAllUsers = useCallback(() => {
    return sendForData<Users[]>({ method: 'GET', path: '/api/admin/users' })
  }, [sendForData])

  /** READ: Alle gelöschten User (Admin). */
  const getDeletedUsers = useCallback(() => {
    return sendForData<Users[]>({ method: 'GET', path: '/api/admin/users/deleted' })
  }, [sendForData])

  /** UPDATE: Ändert einen User und liefert ihn. Der Body ist das volle Objekt samt `guid`. */
  const changeUsers = useCallback((changedUsers: Users) => {
    return sendForData<Users>({ method: 'PUT', path: '/api/admin/users', body: changedUsers })
  }, [sendForData])

  /** UPDATE: Die eigene Sichtbarkeit (Profil und Freundesliste); liefert den eigenen User mit dem neuen Stand. */
  const changeOwnUsersVisibility = useCallback((profileVisibility: Visibility, friendListVisibility: Visibility) => {
    const visibilityRequest = { profileVisibility, friendListVisibility }
    return sendForData<Users>({ method: 'PUT', path: '/api/users/visibility', body: visibilityRequest })
  }, [sendForData])

  /** DELETE: Setzt den Status auf DELETED. Liefert, ob es geklappt hat. */
  const deleteUsers = useCallback((usersGuid: string) => {
    const usersToDelete = { guid: usersGuid }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/users', body: usersToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createUsers,
    getUsersForClient,
    getUsers,
    getAllUsers,
    getDeletedUsers,
    changeUsers,
    changeOwnUsersVisibility,
    deleteUsers,
  }
}
