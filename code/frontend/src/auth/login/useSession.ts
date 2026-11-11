import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { type ApiDataOrError, useApiRequest } from '../../api/useApiRequest.ts'
import type { SessionInfo } from './SessionInfo.ts'

/**
 * Was {@link useSession} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von `/api/session` (eigene
 * Sitzung) und `/api/share/session` (ohne Token: einlösen, erneuern, abmelden) eine Funktion, benannt wie die Methode im
 * `SessionService` bzw. in den Controllern.
 *
 * Einlösen und Lesen liefern die Sitzung, Logout `true` oder `false`. Bei einem Fehler kommt `null` bzw. `false`, der
 * Fehler steht dann in `error`. Erneuern liefert die Sitzung oder den Fehler genau dieses Requests: Der
 * `SessionProvider` muss unterscheiden, ob das Backend den Refresh-Token abgelehnt hat (401) oder gar nicht erreichbar
 * war.
 */
export type SessionHook = ApiHookState & {
  createSession: (loginToken: string, code: string) => Promise<SessionInfo | null>
  refreshSession: () => Promise<ApiDataOrError<SessionInfo>>
  getSession: () => Promise<SessionInfo | null>
  deleteSession: () => Promise<boolean>
}

/** Alle Endpunkte der Sitzung, die Requests gehen über das API-Modul. */
export function useSession(): SessionHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess
  const sendForDataOrError = apiRequestHook.sendForDataOrError

  /** CREATE: Schritt 3 des Logins: Anmeldeschein plus Code aus der Authenticator-App ergeben die Sitzung (Cookies). */
  const createSession = useCallback((loginToken: string, code: string) => {
    const sessionClaimRequest = { loginToken, code }
    return sendForData<SessionInfo>({ method: 'POST', path: '/api/share/session', body: sessionClaimRequest })
  }, [sendForData])

  /**
   * CREATE: Erneuert die Sitzung mit dem Refresh-Token-Cookie, ohne Body: neues JWT und neuer Refresh-Token als Cookies.
   * Ohne gültigen Refresh-Token der Fehler 401. Nie blind wiederholen: Hat das Backend den Token schon getauscht, sähe
   * ein zweiter Versuch mit dem alten für das Backend wie Diebstahl aus. Wann ein späterer Versuch erlaubt ist,
   * entscheidet allein der `SessionProvider` (nur wenn das Backend gar nicht geantwortet oder einen Serverfehler
   * gemeldet hat).
   */
  const refreshSession = useCallback(() => {
    return sendForDataOrError<SessionInfo>({ method: 'POST', path: '/api/share/session/refresh' })
  }, [sendForDataOrError])

  /** READ: Die eigene Sitzung. Ohne Anmeldung `null` (401). */
  const getSession = useCallback(() => {
    return sendForData<SessionInfo>({ method: 'GET', path: '/api/session' })
  }, [sendForData])

  /** DELETE: Logout, beendet die Sitzung dieses Geräts und löscht beide Cookies. Liefert, ob es geklappt hat. */
  const deleteSession = useCallback(() => {
    return sendForSuccess({ method: 'DELETE', path: '/api/share/session' })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createSession,
    refreshSession,
    getSession,
    deleteSession,
  }
}
