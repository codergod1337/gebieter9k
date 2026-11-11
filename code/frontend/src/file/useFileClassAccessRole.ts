import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { FileClassAccessRole, NewFileClassAccessRole } from './FileClassAccessRole.ts'

/**
 * Was {@link useFileClassAccessRole} anbietet: je Endpunkt von `/api/file-class-access-role` (Liste für jeden) und
 * `/api/admin/file-class-access-role` (Verwaltung, nur ADMIN) eine Funktion, benannt wie die Methode im
 * `FileClassAccessRoleService` des Backends. Entfernen liefert `true` oder `false`.
 */
export type FileClassAccessRoleHook = ApiHookState & {
  createFileClassAccessRole: (newFileClassAccessRole: NewFileClassAccessRole) => Promise<FileClassAccessRole | null>
  getAllFileClassAccessRole: () => Promise<FileClassAccessRole[] | null>
  changeFileClassAccessRole: (changedFileClassAccessRole: FileClassAccessRole) => Promise<FileClassAccessRole | null>
  deleteFileClassAccessRole: (id: number) => Promise<boolean>
}

/** Alle Endpunkte von `/api/file-class-access-role` und `/api/admin/file-class-access-role`. */
export function useFileClassAccessRole(): FileClassAccessRoleHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Gibt einem Recht Zugriff auf eine FileClass: lesen, bearbeiten, hochladen, je ein eigener Schalter. */
  const createFileClassAccessRole = useCallback((newFileClassAccessRole: NewFileClassAccessRole) => {
    return sendForData<FileClassAccessRole>({
      method: 'POST',
      path: '/api/admin/file-class-access-role',
      body: newFileClassAccessRole,
    })
  }, [sendForData])

  /** READ: Alle Einträge aller FileClasses. */
  const getAllFileClassAccessRole = useCallback(() => {
    return sendForData<FileClassAccessRole[]>({ method: 'GET', path: '/api/file-class-access-role' })
  }, [sendForData])

  /** UPDATE: Setzt die drei Schalter eines Eintrags neu. Der Body ist das volle Objekt, maßgeblich ist `id`. */
  const changeFileClassAccessRole = useCallback((changedFileClassAccessRole: FileClassAccessRole) => {
    return sendForData<FileClassAccessRole>({
      method: 'PUT',
      path: '/api/admin/file-class-access-role',
      body: changedFileClassAccessRole,
    })
  }, [sendForData])

  /** DELETE: Nimmt dem Recht den Zugriff auf die FileClass. Liefert, ob es geklappt hat. */
  const deleteFileClassAccessRole = useCallback((id: number) => {
    const fileClassAccessRoleToDelete = { id }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/file-class-access-role', body: fileClassAccessRoleToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createFileClassAccessRole,
    getAllFileClassAccessRole,
    changeFileClassAccessRole,
    deleteFileClassAccessRole,
  }
}
