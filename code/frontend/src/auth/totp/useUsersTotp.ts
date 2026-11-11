import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { UsersTotpCodeCheck, UsersTotpSetup, UsersTotpStatus } from './UsersTotp.ts'

/**
 * Was {@link useUsersTotp} anbietet: die Endpunkte von `/api/users-totp` (die eigene Authenticator-App), benannt wie die
 * Methoden im `UsersTotpService` des Backends. Bei einem Fehler kommt `null` bzw. `false`, der Fehler steht in `error`.
 */
export type UsersTotpHook = ApiHookState & {
  createOwnUsersTotpSetup: () => Promise<UsersTotpSetup | null>
  getOwnUsersTotpStatus: () => Promise<UsersTotpStatus | null>
  checkOwnUsersTotpCode: (code: string) => Promise<UsersTotpCodeCheck | null>
  confirmOwnUsersTotp: (code: string) => Promise<UsersTotpStatus | null>
  deleteOwnUsersTotp: (code: string | null, secretBase32: string | null) => Promise<boolean>
}

/** Alle Endpunkte von `/api/users-totp`, die Requests gehen über das API-Modul. */
export function useUsersTotp(): UsersTotpHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Neues Geheimnis, liefert QR-Adresse und Text zum Abtippen. */
  const createOwnUsersTotpSetup = useCallback(() => {
    return sendForData<UsersTotpSetup>({ method: 'POST', path: '/api/users-totp/setup' })
  }, [sendForData])

  /** READ: Der Stand der eigenen App. */
  const getOwnUsersTotpStatus = useCallback(() => {
    return sendForData<UsersTotpStatus>({ method: 'GET', path: '/api/users-totp' })
  }, [sendForData])

  /** READ: Testet einen Code gegen die aktive App. */
  const checkOwnUsersTotpCode = useCallback((code: string) => {
    return sendForData<UsersTotpCodeCheck>({ method: 'POST', path: '/api/users-totp/check', body: { code } })
  }, [sendForData])

  /** UPDATE: Bestätigt das Einrichten mit dem ersten Code. */
  const confirmOwnUsersTotp = useCallback((code: string) => {
    return sendForData<UsersTotpStatus>({ method: 'PUT', path: '/api/users-totp/confirm', body: { code } })
  }, [sendForData])

  /** DELETE: Schaltet die eigene App ab; ist sie aktiv, mit gültigem Code oder dem Schlüssel von der Einrichtung. */
  const deleteOwnUsersTotp = useCallback((code: string | null, secretBase32: string | null) => {
    return sendForSuccess({ method: 'DELETE', path: '/api/users-totp', body: { code, secretBase32 } })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createOwnUsersTotpSetup,
    getOwnUsersTotpStatus,
    checkOwnUsersTotpCode,
    confirmOwnUsersTotp,
    deleteOwnUsersTotp,
  }
}
