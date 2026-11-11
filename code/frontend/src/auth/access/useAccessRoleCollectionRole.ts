import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { AccessRoleCollectionRole, NewAccessRoleCollectionRole } from './AccessRoleCollectionRole.ts'

/**
 * Was {@link useAccessRoleCollectionRole} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/admin/access-role-collection-role` (nur ADMIN) eine Funktion, benannt wie die Methode im
 * `AccessRoleCollectionRoleService` des Backends.
 *
 * Aufnehmen liefert den Eintrag, Lesen die Liste, Entfernen `true` oder `false`. Bei einem Fehler kommt `null` bzw.
 * `false`, der Fehler steht dann in `error`. Ein UPDATE gibt es im Backend nicht.
 */
export type AccessRoleCollectionRoleHook = ApiHookState & {
  createAccessRoleCollectionRole: (
    newAccessRoleCollectionRole: NewAccessRoleCollectionRole,
  ) => Promise<AccessRoleCollectionRole | null>
  getAllAccessRoleCollectionRole: () => Promise<AccessRoleCollectionRole[] | null>
  deleteAccessRoleCollectionRole: (id: number) => Promise<boolean>
}

/** Alle Endpunkte von `/api/admin/access-role-collection-role`, die Requests gehen über das API-Modul. */
export function useAccessRoleCollectionRole(): AccessRoleCollectionRoleHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Nimmt ein Recht in eine Collection auf und liefert den Eintrag. */
  const createAccessRoleCollectionRole = useCallback((newAccessRoleCollectionRole: NewAccessRoleCollectionRole) => {
    return sendForData<AccessRoleCollectionRole>({
      method: 'POST',
      path: '/api/admin/access-role-collection-role',
      body: newAccessRoleCollectionRole,
    })
  }, [sendForData])

  /** READ: Alle Einträge aller Collections. */
  const getAllAccessRoleCollectionRole = useCallback(() => {
    return sendForData<AccessRoleCollectionRole[]>({ method: 'GET', path: '/api/admin/access-role-collection-role' })
  }, [sendForData])

  /** DELETE: Nimmt ein Recht aus einer Collection. Liefert, ob es geklappt hat. */
  const deleteAccessRoleCollectionRole = useCallback((id: number) => {
    const accessRoleCollectionRoleToDelete = { id }
    return sendForSuccess({
      method: 'DELETE',
      path: '/api/admin/access-role-collection-role',
      body: accessRoleCollectionRoleToDelete,
    })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createAccessRoleCollectionRole,
    getAllAccessRoleCollectionRole,
    deleteAccessRoleCollectionRole,
  }
}
