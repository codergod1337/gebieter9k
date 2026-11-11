import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { FileClassDestinationAssignment, NewFileClassDestinationAssignment } from './FileClassDestination.ts'

/**
 * Was {@link useFileClassDestinationAssignment} anbietet: je Endpunkt von `/api/file-class-destination-assignment`
 * (Liste für jeden) und `/api/admin/file-class-destination-assignment` (Verwaltung, nur ADMIN) eine Funktion, benannt
 * wie die Methode im `FileClassDestinationAssignmentService`. Entfernen liefert `true` oder `false`. Kein UPDATE.
 */
export type FileClassDestinationAssignmentHook = ApiHookState & {
  createFileClassDestinationAssignment: (
    newAssignment: NewFileClassDestinationAssignment,
  ) => Promise<FileClassDestinationAssignment | null>
  getAllFileClassDestinationAssignment: () => Promise<FileClassDestinationAssignment[] | null>
  deleteFileClassDestinationAssignment: (id: number) => Promise<boolean>
}

/** Alle Endpunkte der Ziele der FileClasses, die Requests gehen über das API-Modul. */
export function useFileClassDestinationAssignment(): FileClassDestinationAssignmentHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Bietet eine FileClass an einem Ziel an. */
  const createFileClassDestinationAssignment = useCallback((newAssignment: NewFileClassDestinationAssignment) => {
    return sendForData<FileClassDestinationAssignment>({
      method: 'POST',
      path: '/api/admin/file-class-destination-assignment',
      body: newAssignment,
    })
  }, [sendForData])

  /** READ: Alle Zuordnungen. */
  const getAllFileClassDestinationAssignment = useCallback(() => {
    return sendForData<FileClassDestinationAssignment[]>({ method: 'GET', path: '/api/file-class-destination-assignment' })
  }, [sendForData])

  /** DELETE: Nimmt die Zuordnung zurück. Liefert, ob es geklappt hat. */
  const deleteFileClassDestinationAssignment = useCallback((id: number) => {
    const assignmentToDelete = { id }
    return sendForSuccess({
      method: 'DELETE',
      path: '/api/admin/file-class-destination-assignment',
      body: assignmentToDelete,
    })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createFileClassDestinationAssignment,
    getAllFileClassDestinationAssignment,
    deleteFileClassDestinationAssignment,
  }
}
