import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { UsersContact, UsersContactForClient, UsersContactType } from './UsersContact.ts'
import type { Visibility } from './Users.ts'

/**
 * Was {@link useUsersContact} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von `/api/users-contact`
 * eine Funktion, benannt wie die Methode im Backend. Bei einem Fehler kommt `null` bzw. `false`, der Fehler steht dann in
 * `error`.
 */
export type UsersContactHook = ApiHookState & {
  getVisibleUsersContact: (usersGuid: string) => Promise<UsersContactForClient[] | null>
  getOwnUsersContact: () => Promise<UsersContact[] | null>
  saveOwnUsersContact: (
    contactType: UsersContactType,
    contactValue: string,
    visibility: Visibility,
  ) => Promise<UsersContact | null>
  deleteOwnUsersContact: (contactType: UsersContactType) => Promise<boolean>
}

/** Alle Endpunkte von `/api/users-contact`, die Requests gehen über das API-Modul. */
export function useUsersContact(): UsersContactHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** READ: Die Angaben eines Users, die man sehen darf (nur Art und Wert); `null` (404), wenn das Profil nicht sichtbar ist. */
  const getVisibleUsersContact = useCallback((usersGuid: string) => {
    const usersContactPath = '/api/users-contact/users/' + usersGuid
    return sendForData<UsersContactForClient[]>({ method: 'GET', path: usersContactPath })
  }, [sendForData])

  /** READ: Die eigenen Angaben samt Sichtbarkeit. */
  const getOwnUsersContact = useCallback(() => {
    return sendForData<UsersContact[]>({ method: 'GET', path: '/api/users-contact' })
  }, [sendForData])

  /** UPDATE: Setzt eine eigene Angabe mit ihrer Sichtbarkeit; sie entsteht beim ersten Setzen. */
  const saveOwnUsersContact = useCallback((contactType: UsersContactType, contactValue: string, visibility: Visibility) => {
    const saveRequest = { contactType, contactValue, visibility }
    return sendForData<UsersContact>({ method: 'PUT', path: '/api/users-contact', body: saveRequest })
  }, [sendForData])

  /** DELETE: Löscht eine eigene Angabe. */
  const deleteOwnUsersContact = useCallback((contactType: UsersContactType) => {
    const deleteRequest = { contactType }
    return sendForSuccess({ method: 'DELETE', path: '/api/users-contact', body: deleteRequest })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getVisibleUsersContact,
    getOwnUsersContact,
    saveOwnUsersContact,
    deleteOwnUsersContact,
  }
}
