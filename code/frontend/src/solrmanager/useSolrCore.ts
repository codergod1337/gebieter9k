import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'

/**
 * Was {@link useSolrCore} anbietet: den einheitlichen {@link ApiHookState} und den Endpunkt von `/api/admin/solr-core`
 * (nur ADMIN), benannt wie die Methode im `SolrCoreService` des Backends. Die Kerne stehen im Backend in der
 * `application.yaml`, deshalb gibt es nur das Lesen.
 */
export type SolrCoreHook = ApiHookState & {
  getAllSolrCoreKey: () => Promise<string[] | null>
}

/** Der Endpunkt von `/api/admin/solr-core`, der Request geht über das API-Modul. */
export function useSolrCore(): SolrCoreHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** READ: Die Keys aller Kerne, z. B. `["FILE"]`. */
  const getAllSolrCoreKey = useCallback(() => {
    return sendForData<string[]>({ method: 'GET', path: '/api/admin/solr-core' })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getAllSolrCoreKey,
  }
}
