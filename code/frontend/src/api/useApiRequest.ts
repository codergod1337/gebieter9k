import { useCallback, useState } from 'react'
import { ApiError } from './ApiError.ts'
import type { ApiHookState } from './ApiHookState.ts'
import type { ApiRequest } from './ApiRequest.ts'
import { defaultApiClient } from './defaultApiClient.ts'

/** Rückmeldung von {@link useApiRequest}: der einheitliche {@link ApiHookState} plus die beiden Wege zum Senden. */
export type ApiRequestHook = ApiHookState & {
  /**
   * Für Anlegen, Ändern und Lesen: liefert die Antwort des Backends, also die Entity bzw. die
   * Liste. Bei einem Fehler `null`, der Fehler steht dann in `error`.
   */
  sendForData: <T>(apiRequest: ApiRequest) => Promise<T | null>

  /** Für Löschen: liefert nur, ob es geklappt hat. Bei einem Fehler `false`, der Fehler steht in `error`. */
  sendForSuccess: (apiRequest: ApiRequest) => Promise<boolean>

  /**
   * Für Listen, in denen jeder Request seinen eigenen Fehler zeigt (z. B. die Upload-Liste): liefert die Daten oder den
   * Fehler dieses einen Requests. Der Fehler steht zusätzlich in `error`.
   */
  sendForDataOrError: <T>(apiRequest: ApiRequest) => Promise<ApiDataOrError<T>>
}

/** Die Daten eines Requests oder sein Fehler. */
export type ApiDataOrError<T> = { succeeded: true; data: T } | { succeeded: false; error: ApiError }

/** Ergebnis eines Requests, nur innerhalb dieses Hooks. */
type RequestOutcome<T> = ApiDataOrError<T>

/**
 * Basis für JEDEN Entity-Hook (z. B. `useUsers`). Er schickt die Requests über das API-Modul und
 * führt `isLoading` und `error` überall gleich. So steht diese Logik nur einmal da, nicht in jedem
 * Entity-Hook neu.
 */
export function useApiRequest(): ApiRequestHook {
  const [runningRequestCount, setRunningRequestCount] = useState<number>(0)
  const [error, setError] = useState<ApiError | null>(null)

  const runRequest = useCallback(async <T,>(apiRequest: ApiRequest): Promise<RequestOutcome<T>> => {
    setRunningRequestCount((currentCount) => currentCount + 1)
    setError(null)
    try {
      const responseData = await defaultApiClient.send<T>(apiRequest)
      return { succeeded: true, data: responseData }
    } catch (caughtError) {
      const apiError = ApiError.from(caughtError)
      setError(apiError)
      return { succeeded: false, error: apiError }
    } finally {
      setRunningRequestCount((currentCount) => currentCount - 1)
    }
  }, [])

  const sendForData = useCallback(async <T,>(apiRequest: ApiRequest): Promise<T | null> => {
    const requestOutcome = await runRequest<T>(apiRequest)
    if (!requestOutcome.succeeded) {
      return null
    }
    return requestOutcome.data
  }, [runRequest])

  const sendForSuccess = useCallback(async (apiRequest: ApiRequest): Promise<boolean> => {
    const requestOutcome = await runRequest<unknown>(apiRequest)
    return requestOutcome.succeeded
  }, [runRequest])

  const sendForDataOrError = useCallback(async <T,>(apiRequest: ApiRequest): Promise<ApiDataOrError<T>> => {
    return runRequest<T>(apiRequest)
  }, [runRequest])

  const isLoading = runningRequestCount > 0
  return { isLoading, error, sendForData, sendForSuccess, sendForDataOrError }
}
