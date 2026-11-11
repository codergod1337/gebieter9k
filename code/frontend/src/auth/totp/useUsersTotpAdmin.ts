import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { UsersTotpStatus } from './UsersTotp.ts'

/**
 * Was {@link useUsersTotpAdmin} anbietet: die Endpunkte von `/api/admin/users-totp` (Authenticator-App jedes Users, nur
 * ADMIN), benannt wie die Methoden im `UsersTotpService` des Backends. Bei einem Fehler kommt `null` bzw. `false`, der
 * Fehler steht in `error`.
 */
export type UsersTotpAdminHook = ApiHookState & {
  getUsersTotpStatus: (usersGuid: string) => Promise<UsersTotpStatus | null>
  deleteUsersTotp: (usersGuid: string) => Promise<boolean>
}

/** Alle Endpunkte von `/api/admin/users-totp`, die Requests gehen über das API-Modul. */
export function useUsersTotpAdmin(): UsersTotpAdminHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** READ: Der Stand der App dieses Users. */
  const getUsersTotpStatus = useCallback(
    (usersGuid: string) => {
      const usersTotpStatusPath = '/api/admin/users-totp/' + usersGuid
      return sendForData<UsersTotpStatus>({ method: 'GET', path: usersTotpStatusPath })
    },
    [sendForData],
  )

  /** DELETE: Entfernt die App dieses Users, ohne Code (er hat Handy und Schlüssel verloren). */
  const deleteUsersTotp = useCallback(
    (usersGuid: string) => {
      return sendForSuccess({ method: 'DELETE', path: '/api/admin/users-totp', body: { usersGuid } })
    },
    [sendForSuccess],
  )

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getUsersTotpStatus,
    deleteUsersTotp,
  }
}
