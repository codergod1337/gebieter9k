import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { FileClassFileExtension, NewFileClassFileExtension } from './FileClassFileExtension.ts'

/**
 * Was {@link useFileClassFileExtension} anbietet: je Endpunkt von `/api/file-class-file-extension` (Liste für jeden) und
 * `/api/admin/file-class-file-extension` (Verwaltung, nur ADMIN) eine Funktion, benannt wie die Methode im
 * `FileClassFileExtensionService` des Backends. Entfernen liefert `true` oder `false`. Ein UPDATE gibt es nicht.
 */
export type FileClassFileExtensionHook = ApiHookState & {
  createFileClassFileExtension: (
    newFileClassFileExtension: NewFileClassFileExtension,
  ) => Promise<FileClassFileExtension | null>
  getAllFileClassFileExtension: () => Promise<FileClassFileExtension[] | null>
  deleteFileClassFileExtension: (id: number) => Promise<boolean>
}

/** Alle Endpunkte von `/api/file-class-file-extension` und `/api/admin/file-class-file-extension`. */
export function useFileClassFileExtension(): FileClassFileExtensionHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Schaltet eine Endung für eine FileClass frei. */
  const createFileClassFileExtension = useCallback((newFileClassFileExtension: NewFileClassFileExtension) => {
    return sendForData<FileClassFileExtension>({
      method: 'POST',
      path: '/api/admin/file-class-file-extension',
      body: newFileClassFileExtension,
    })
  }, [sendForData])

  /** READ: Alle Freischaltungen aller FileClasses. */
  const getAllFileClassFileExtension = useCallback(() => {
    return sendForData<FileClassFileExtension[]>({ method: 'GET', path: '/api/file-class-file-extension' })
  }, [sendForData])

  /** DELETE: Nimmt die Freischaltung zurück. Liefert, ob es geklappt hat. */
  const deleteFileClassFileExtension = useCallback((id: number) => {
    const fileClassFileExtensionToDelete = { id }
    return sendForSuccess({
      method: 'DELETE',
      path: '/api/admin/file-class-file-extension',
      body: fileClassFileExtensionToDelete,
    })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createFileClassFileExtension,
    getAllFileClassFileExtension,
    deleteFileClassFileExtension,
  }
}
