import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { Users } from '../../users/Users.ts'
import { createSha256Hex } from '../createSha256Hex.ts'
import type { RegistrationRequest } from './RegistrationRequest.ts'

/**
 * Was {@link useRegistration} anbietet: den einheitlichen {@link ApiHookState} und den Endpunkt
 * `/api/share/registration` (ohne Token), benannt wie die Methode im `RegistrationService` des Backends.
 *
 * Liefert den neuen User, bei einem Fehler `null`. Der Fehler steht dann in `error`, z. B.
 * „Der Username … ist schon vergeben.“
 */
export type RegistrationHook = ApiHookState & {
  createRegistration: (username: string, email: string, plainPassword: string) => Promise<Users | null>
}

/** Die Registrierung, der Request geht über das API-Modul. */
export function useRegistration(): RegistrationHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Registriert einen User. Das Passwort wird hier mit SHA-256 gehasht. */
  const createRegistration = useCallback(async (username: string, email: string, plainPassword: string) => {
    const sha256HexPassword = await createSha256Hex(plainPassword)
    const registrationRequest: RegistrationRequest = { username, email, sha256HexPassword }
    return sendForData<Users>({ method: 'POST', path: '/api/share/registration', body: registrationRequest })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createRegistration,
  }
}
