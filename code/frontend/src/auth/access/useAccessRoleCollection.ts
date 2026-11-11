import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { AccessRoleCollection } from './AccessRoleCollection.ts'

/**
 * Was {@link useAccessRoleCollection} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/admin/access-role-collection` (nur ADMIN) eine Funktion, benannt wie die Methode im
 * `AccessRoleCollectionService` des Backends. Die Liste für alle kommt aus den Stammdaten.
 */
export type AccessRoleCollectionHook = ApiHookState & {
  getAccessRoleCollection: (accessRoleCollectionKey: string) => Promise<AccessRoleCollection | null>
  changeAccessRoleCollection: (
    changedAccessRoleCollection: AccessRoleCollection,
  ) => Promise<AccessRoleCollection | null>
  changeAccessRoleCollectionListingPositions: (
    accessRoleCollectionKeysInOrder: string[],
  ) => Promise<AccessRoleCollection[] | null>
}

/** Die Admin-Endpunkte der Positionen, die Requests gehen über das API-Modul. */
export function useAccessRoleCollection(): AccessRoleCollectionHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** READ: Eine Position über ihren Key. */
  const getAccessRoleCollection = useCallback((accessRoleCollectionKey: string) => {
    const accessRoleCollectionPath = '/api/admin/access-role-collection/' + accessRoleCollectionKey
    return sendForData<AccessRoleCollection>({ method: 'GET', path: accessRoleCollectionPath })
  }, [sendForData])

  /** UPDATE: Ändert Anzeigename und Aussehen einer Position und liefert sie. */
  const changeAccessRoleCollection = useCallback((changedAccessRoleCollection: AccessRoleCollection) => {
    return sendForData<AccessRoleCollection>({
      method: 'PUT',
      path: '/api/admin/access-role-collection',
      body: changedAccessRoleCollection,
    })
  }, [sendForData])

  /** UPDATE: Die neue Reihenfolge nach Drag and Drop, jeder Key genau einmal. Liefert alle Positionen neu sortiert. */
  const changeAccessRoleCollectionListingPositions = useCallback((accessRoleCollectionKeysInOrder: string[]) => {
    const listingOrder = { keysInOrder: accessRoleCollectionKeysInOrder }
    return sendForData<AccessRoleCollection[]>({
      method: 'PUT',
      path: '/api/admin/access-role-collection/listing-position',
      body: listingOrder,
    })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getAccessRoleCollection,
    changeAccessRoleCollection,
    changeAccessRoleCollectionListingPositions,
  }
}
