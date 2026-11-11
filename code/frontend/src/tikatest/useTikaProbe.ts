import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { TikaProbeResult } from './TikaProbe.ts'

/**
 * Was {@link useTikaProbe} anbietet: den einheitlichen {@link ApiHookState} und den Endpunkt `/api/admin/tika-probe`
 * (nur ADMIN), benannt wie die Methode im `TikaService` des Backends.
 */
export type TikaProbeHook = ApiHookState & {
  createTikaProbe: (file: Blob) => Promise<TikaProbeResult | null>
}

/** Der Tika-Test, der Request geht über das API-Modul. */
export function useTikaProbe(): TikaProbeHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /**
   * CREATE: Schickt die Datei roh an Tika, ohne Namen und ohne JSON, und liefert alles, was Tika findet. Das Backend
   * verwirft die Datei danach.
   */
  const createTikaProbe = useCallback((file: Blob) => {
    return sendForData<TikaProbeResult>({ method: 'POST', path: '/api/admin/tika-probe', fileBody: file })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createTikaProbe,
  }
}
