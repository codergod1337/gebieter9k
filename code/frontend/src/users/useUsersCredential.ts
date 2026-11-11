import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'

/** Das eigene Passwort ändern: beide Werte schon mit SHA-256 gehasht (`createSha256Hex`), nie im Klartext. */
export type OwnPasswordChangeRequest = {
  currentSha256HexPassword: string
  newSha256HexPassword: string
}

/**
 * Was {@link useUsersCredential} anbietet: den Endpunkt `/api/users-credential` (eigenes Passwort ändern), benannt wie die
 * Methode im `UsersCredentialService` des Backends.
 */
export type UsersCredentialHook = ApiHookState & {
  changeOwnUsersCredential: (passwordChangeRequest: OwnPasswordChangeRequest) => Promise<boolean>
}

/** Der Endpunkt `/api/users-credential`, der Request geht über das API-Modul. */
export function useUsersCredential(): UsersCredentialHook {
  const apiRequestHook = useApiRequest()
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** UPDATE: Ändert das eigene Passwort; das bisherige muss stimmen. */
  const changeOwnUsersCredential = useCallback((passwordChangeRequest: OwnPasswordChangeRequest) => {
    return sendForSuccess({ method: 'PUT', path: '/api/users-credential', body: passwordChangeRequest })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    changeOwnUsersCredential,
  }
}
