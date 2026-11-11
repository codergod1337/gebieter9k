import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { NewSolrField, SolrField } from './SolrField.ts'

/**
 * Was {@link useSolrField} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von `/api/admin/solr-field`
 * (nur ADMIN) eine Funktion, benannt wie die Methode im `SolrFieldService` des Backends.
 *
 * Anlegen und Ändern liefern das Feld, Lesen das Objekt bzw. die Liste, Löschen `true` oder `false`. Bei einem Fehler
 * kommt `null` bzw. `false`, der Fehler steht dann in `error`.
 */
export type SolrFieldHook = ApiHookState & {
  createSolrField: (newSolrField: NewSolrField) => Promise<SolrField | null>
  getSolrField: (id: number) => Promise<SolrField | null>
  getSolrFieldBySolrCoreKey: (solrCoreKey: string) => Promise<SolrField[] | null>
  getAllSolrField: () => Promise<SolrField[] | null>
  changeSolrField: (changedSolrField: SolrField) => Promise<SolrField | null>
  changeSolrFieldListingPositions: (solrCoreKey: string, solrFieldNamesInOrder: string[]) => Promise<SolrField[] | null>
  deleteSolrField: (id: number) => Promise<boolean>
}

/** Alle Endpunkte von `/api/admin/solr-field`, die Requests gehen über das API-Modul. */
export function useSolrField(): SolrFieldHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Legt ein Feld an und liefert es. */
  const createSolrField = useCallback((newSolrField: NewSolrField) => {
    return sendForData<SolrField>({ method: 'POST', path: '/api/admin/solr-field', body: newSolrField })
  }, [sendForData])

  /** READ: Ein Feld über seine `id`. */
  const getSolrField = useCallback((id: number) => {
    const solrFieldPath = '/api/admin/solr-field/' + id
    return sendForData<SolrField>({ method: 'GET', path: solrFieldPath })
  }, [sendForData])

  /** READ: Alle Felder eines Kerns, in der Reihenfolge der Feldtabelle. Über den User-Endpunkt, auch für Masken. */
  const getSolrFieldBySolrCoreKey = useCallback((solrCoreKey: string) => {
    const solrCoreFieldsPath = '/api/solr-field/solr-core/' + solrCoreKey
    return sendForData<SolrField[]>({ method: 'GET', path: solrCoreFieldsPath })
  }, [sendForData])

  /** READ: Alle Felder aller Kerne. */
  const getAllSolrField = useCallback(() => {
    return sendForData<SolrField[]>({ method: 'GET', path: '/api/admin/solr-field' })
  }, [sendForData])

  /** UPDATE: Ändert ein Feld und liefert es. Der Body ist das volle Objekt samt `id`. */
  const changeSolrField = useCallback((changedSolrField: SolrField) => {
    return sendForData<SolrField>({ method: 'PUT', path: '/api/admin/solr-field', body: changedSolrField })
  }, [sendForData])

  /** UPDATE: Die neue Reihenfolge der Felder eines Kerns nach Drag and Drop, jedes Feld genau einmal. */
  const changeSolrFieldListingPositions = useCallback((solrCoreKey: string, solrFieldNamesInOrder: string[]) => {
    const solrFieldListingOrder = { solrCoreKey, solrFieldNamesInOrder }
    return sendForData<SolrField[]>({
      method: 'PUT',
      path: '/api/admin/solr-field/listing-position',
      body: solrFieldListingOrder,
    })
  }, [sendForData])

  /** DELETE: Löscht ein Feld aus der Definition. Liefert, ob es geklappt hat. */
  const deleteSolrField = useCallback((id: number) => {
    const solrFieldToDelete = { id }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/solr-field', body: solrFieldToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createSolrField,
    getSolrField,
    getSolrFieldBySolrCoreKey,
    getAllSolrField,
    changeSolrField,
    changeSolrFieldListingPositions,
    deleteSolrField,
  }
}
