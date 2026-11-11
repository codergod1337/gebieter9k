import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import { createSha256Hex } from '../createSha256Hex.ts'
import type { UsersTotpSetup } from '../totp/UsersTotp.ts'
import type { LoginRequest } from './SessionInfo.ts'
import type { CreatedUsersLogin2fa } from './UsersLogin2fa.ts'

/**
 * Was {@link useUsersLogin2fa} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/share/users-login-2fa` (ohne Token) eine Funktion, benannt wie die Methode im `UsersLogin2faService`.
 *
 * Anlegen liefert den Anmeldeschein und was als Zweites kommt; beim Einrichten liefert der Schein QR-Code und Schlüssel.
 * Bei einem Fehler kommt `null`, der Fehler steht dann in `error`.
 */
export type UsersLogin2faHook = ApiHookState & {
  createUsersLogin2fa: (email: string, plainPassword: string) => Promise<CreatedUsersLogin2fa | null>
  createUsersLogin2faTotpSetup: (loginToken: string) => Promise<UsersTotpSetup | null>
}

/** Schritt 1 und 2 des Logins mit Pflicht-2FA, die Requests gehen über das API-Modul. */
export function useUsersLogin2fa(): UsersLogin2faHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Schritt 1, E-Mail und Passwort. Das Passwort wird hier mit SHA-256 gehasht, der Klartext bleibt im Browser. */
  const createUsersLogin2fa = useCallback(async (email: string, plainPassword: string) => {
    const sha256HexPassword = await createSha256Hex(plainPassword)
    const loginRequest: LoginRequest = { email, sha256HexPassword }
    return sendForData<CreatedUsersLogin2fa>({ method: 'POST', path: '/api/share/users-login-2fa', body: loginRequest })
  }, [sendForData])

  /** CREATE: Schritt 2 beim Einrichten: mit dem Anmeldeschein QR-Code und Schlüssel für die Authenticator-App. */
  const createUsersLogin2faTotpSetup = useCallback((loginToken: string) => {
    const tokenRequest = { loginToken }
    return sendForData<UsersTotpSetup>({ method: 'POST', path: '/api/share/users-login-2fa/totp-setup', body: tokenRequest })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createUsersLogin2fa,
    createUsersLogin2faTotpSetup,
  }
}
