import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { FileExtension } from './FileExtension.ts'

/**
 * Was {@link useFileExtension} anbietet: je Endpunkt von `/api/file-extension` (Liste für jeden) und
 * `/api/admin/file-extension` (Verwaltung, nur ADMIN) eine Funktion, benannt wie die Methode im `FileExtensionService`
 * des Backends. Bei einem Fehler kommt `null` bzw. `false`, der Fehler steht in `error`.
 */
export type FileExtensionHook = ApiHookState & {
  createFileExtension: (newFileExtension: FileExtension) => Promise<FileExtension | null>
  getFileExtension: (fileExtension: string) => Promise<FileExtension | null>
  getAllFileExtension: () => Promise<FileExtension[] | null>
  changeFileExtension: (changedFileExtension: FileExtension) => Promise<FileExtension | null>
  changeFileExtensionListingPositions: (fileExtensionsInOrder: string[]) => Promise<FileExtension[] | null>
  deleteFileExtension: (fileExtension: string) => Promise<boolean>
}

/** Alle Endpunkte von `/api/file-extension` und `/api/admin/file-extension`, die Requests gehen über das API-Modul. */
export function useFileExtension(): FileExtensionHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Legt eine Endung an und liefert sie. */
  const createFileExtension = useCallback((newFileExtension: FileExtension) => {
    return sendForData<FileExtension>({ method: 'POST', path: '/api/admin/file-extension', body: newFileExtension })
  }, [sendForData])

  /** READ: Eine Endung. */
  const getFileExtension = useCallback((fileExtension: string) => {
    const fileExtensionPath = '/api/admin/file-extension/' + fileExtension
    return sendForData<FileExtension>({ method: 'GET', path: fileExtensionPath })
  }, [sendForData])

  /** READ: Alle Endungen in der Reihenfolge der Anzeige. Für Listen reichen sonst die Stammdaten. */
  const getAllFileExtension = useCallback(() => {
    return sendForData<FileExtension[]>({ method: 'GET', path: '/api/file-extension' })
  }, [sendForData])

  /** UPDATE: Ändert eine Endung und liefert sie. Die Endung selbst ändert sich nie. */
  const changeFileExtension = useCallback((changedFileExtension: FileExtension) => {
    return sendForData<FileExtension>({ method: 'PUT', path: '/api/admin/file-extension', body: changedFileExtension })
  }, [sendForData])

  /** UPDATE: Neue Reihenfolge nach Drag and Drop, jede Endung genau einmal. Liefert alle Endungen in neuer Reihenfolge. */
  const changeFileExtensionListingPositions = useCallback((fileExtensionsInOrder: string[]) => {
    const listingOrder = { keysInOrder: fileExtensionsInOrder }
    return sendForData<FileExtension[]>({
      method: 'PUT',
      path: '/api/admin/file-extension/listing-position',
      body: listingOrder,
    })
  }, [sendForData])

  /** DELETE: Löscht eine Endung samt ihrer Freischaltungen an den FileClasses. */
  const deleteFileExtension = useCallback((fileExtension: string) => {
    const fileExtensionToDelete = { extension: fileExtension }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/file-extension', body: fileExtensionToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createFileExtension,
    getFileExtension,
    getAllFileExtension,
    changeFileExtension,
    changeFileExtensionListingPositions,
    deleteFileExtension,
  }
}
