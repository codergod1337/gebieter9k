import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { AccessRole } from './AccessRole.ts'

/**
 * Was {@link useAccessRole} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/access-role` (Liste für jeden) und `/api/admin/access-role` (Verwaltung, nur ADMIN) eine Funktion,
 * benannt wie die Methode im `AccessRoleService` des Backends.
 *
 * Anlegen und Ändern liefern das Recht, Lesen das Objekt bzw. die Liste. Bei einem Fehler kommt
 * `null`, der Fehler steht dann in `error`. Ein DELETE gibt es im Backend noch nicht.
 */
export type AccessRoleHook = ApiHookState & {
  createAccessRole: (newAccessRole: AccessRole) => Promise<AccessRole | null>
  getAccessRole: (accessRoleKey: string) => Promise<AccessRole | null>
  getAllAccessRole: () => Promise<AccessRole[] | null>
  changeAccessRole: (changedAccessRole: AccessRole) => Promise<AccessRole | null>
  changeAccessRoleListingPositions: (accessRoleKeysInOrder: string[]) => Promise<AccessRole[] | null>
}

/** Alle Endpunkte von `/api/access-role` und `/api/admin/access-role`, die Requests gehen über das API-Modul. */
export function useAccessRole(): AccessRoleHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Legt ein Recht an und liefert es. */
  const createAccessRole = useCallback((newAccessRole: AccessRole) => {
    return sendForData<AccessRole>({ method: 'POST', path: '/api/admin/access-role', body: newAccessRole })
  }, [sendForData])

  /** READ: Ein Recht über seinen Key. */
  const getAccessRole = useCallback((accessRoleKey: string) => {
    const accessRolePath = '/api/admin/access-role/' + accessRoleKey
    return sendForData<AccessRole>({ method: 'GET', path: accessRolePath })
  }, [sendForData])

  /** READ: Alle Rechte in der Reihenfolge der Anzeige. Für Listen reichen sonst die Stammdaten. */
  const getAllAccessRole = useCallback(() => {
    return sendForData<AccessRole[]>({ method: 'GET', path: '/api/access-role' })
  }, [sendForData])

  /** UPDATE: Ändert ein Recht und liefert es. Der Body ist das volle Objekt, der Key ändert sich nie. */
  const changeAccessRole = useCallback((changedAccessRole: AccessRole) => {
    return sendForData<AccessRole>({ method: 'PUT', path: '/api/admin/access-role', body: changedAccessRole })
  }, [sendForData])

  /** UPDATE: Die neue Reihenfolge nach Drag and Drop, jeder Key genau einmal. Liefert alle Rechte neu sortiert. */
  const changeAccessRoleListingPositions = useCallback((accessRoleKeysInOrder: string[]) => {
    const listingOrder = { keysInOrder: accessRoleKeysInOrder }
    return sendForData<AccessRole[]>({
      method: 'PUT',
      path: '/api/admin/access-role/listing-position',
      body: listingOrder,
    })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createAccessRole,
    getAccessRole,
    getAllAccessRole,
    changeAccessRole,
    changeAccessRoleListingPositions,
  }
}
