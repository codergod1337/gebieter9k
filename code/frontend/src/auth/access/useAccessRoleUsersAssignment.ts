import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { AccessRoleUsersAssignment, NewAccessRoleUsersAssignment } from './AccessRoleUsersAssignment.ts'

/**
 * Was {@link useAccessRoleUsersAssignment} anbietet: den einheitlichen {@link ApiHookState} und je
 * Endpunkt von `/api/admin/access-role-users-assignment` (nur ADMIN) eine Funktion, benannt wie die Methode im
 * `AccessRoleUsersAssignmentService` des Backends.
 *
 * Zuweisen liefert die Zuweisung, Lesen das Objekt bzw. die Liste, Entziehen `true` oder `false`.
 * Bei einem Fehler kommt `null` bzw. `false`, der Fehler steht dann in `error`. Ein UPDATE gibt es
 * im Backend nicht.
 */
export type AccessRoleUsersAssignmentHook = ApiHookState & {
  createAccessRoleUsersAssignment: (
    newAccessRoleUsersAssignment: NewAccessRoleUsersAssignment,
  ) => Promise<AccessRoleUsersAssignment | null>
  getAccessRoleUsersAssignment: (id: number) => Promise<AccessRoleUsersAssignment | null>
  getAccessRoleUsersAssignmentByUsersGuid: (usersGuid: string) => Promise<AccessRoleUsersAssignment[] | null>
  getAllAccessRoleUsersAssignment: () => Promise<AccessRoleUsersAssignment[] | null>
  deleteAccessRoleUsersAssignment: (id: number) => Promise<boolean>
}

/** Alle Endpunkte von `/api/admin/access-role-users-assignment`, die Requests gehen über das API-Modul. */
export function useAccessRoleUsersAssignment(): AccessRoleUsersAssignmentHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Weist einem User ein Recht zu und liefert die Zuweisung. */
  const createAccessRoleUsersAssignment = useCallback((newAccessRoleUsersAssignment: NewAccessRoleUsersAssignment) => {
    return sendForData<AccessRoleUsersAssignment>({
      method: 'POST',
      path: '/api/admin/access-role-users-assignment',
      body: newAccessRoleUsersAssignment,
    })
  }, [sendForData])

  /** READ: Eine Zuweisung über ihre `id`. */
  const getAccessRoleUsersAssignment = useCallback((id: number) => {
    const accessRoleUsersAssignmentPath = '/api/admin/access-role-users-assignment/' + id
    return sendForData<AccessRoleUsersAssignment>({ method: 'GET', path: accessRoleUsersAssignmentPath })
  }, [sendForData])

  /** READ: Alle Rechte, die einem User zugewiesen sind. */
  const getAccessRoleUsersAssignmentByUsersGuid = useCallback((usersGuid: string) => {
    const usersAssignmentPath = '/api/admin/access-role-users-assignment/users/' + usersGuid
    return sendForData<AccessRoleUsersAssignment[]>({ method: 'GET', path: usersAssignmentPath })
  }, [sendForData])

  /** READ: Alle Zuweisungen aller User. */
  const getAllAccessRoleUsersAssignment = useCallback(() => {
    return sendForData<AccessRoleUsersAssignment[]>({ method: 'GET', path: '/api/admin/access-role-users-assignment' })
  }, [sendForData])

  /** DELETE: Entzieht ein Recht. Liefert, ob es geklappt hat. */
  const deleteAccessRoleUsersAssignment = useCallback((id: number) => {
    const accessRoleUsersAssignmentToDelete = { id }
    return sendForSuccess({
      method: 'DELETE',
      path: '/api/admin/access-role-users-assignment',
      body: accessRoleUsersAssignmentToDelete,
    })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createAccessRoleUsersAssignment,
    getAccessRoleUsersAssignment,
    getAccessRoleUsersAssignmentByUsersGuid,
    getAllAccessRoleUsersAssignment,
    deleteAccessRoleUsersAssignment,
  }
}
