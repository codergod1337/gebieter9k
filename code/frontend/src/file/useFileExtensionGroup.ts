import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { FileExtensionGroup } from './FileExtensionGroup.ts'

/**
 * Was {@link useFileExtensionGroup} anbietet: je Endpunkt von `/api/file-extension-group` (Liste für jeden) und
 * `/api/admin/file-extension-group` (Verwaltung, nur ADMIN) eine Funktion, benannt wie die Methode im
 * `FileExtensionGroupService` des Backends. Bei einem Fehler kommt `null` bzw. `false`, der Fehler steht in `error`.
 */
export type FileExtensionGroupHook = ApiHookState & {
  createFileExtensionGroup: (newFileExtensionGroup: FileExtensionGroup) => Promise<FileExtensionGroup | null>
  getFileExtensionGroup: (fileExtensionGroupKey: string) => Promise<FileExtensionGroup | null>
  getAllFileExtensionGroup: () => Promise<FileExtensionGroup[] | null>
  changeFileExtensionGroup: (changedFileExtensionGroup: FileExtensionGroup) => Promise<FileExtensionGroup | null>
  changeFileExtensionGroupListingPositions: (
    fileExtensionGroupKeysInOrder: string[],
  ) => Promise<FileExtensionGroup[] | null>
  deleteFileExtensionGroup: (fileExtensionGroupKey: string) => Promise<boolean>
}

/** Alle Endpunkte von `/api/file-extension-group` und `/api/admin/file-extension-group`, über das API-Modul. */
export function useFileExtensionGroup(): FileExtensionGroupHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const sendForSuccess = apiRequestHook.sendForSuccess

  /** CREATE: Legt eine Gruppe an und liefert sie. */
  const createFileExtensionGroup = useCallback((newFileExtensionGroup: FileExtensionGroup) => {
    return sendForData<FileExtensionGroup>({
      method: 'POST',
      path: '/api/admin/file-extension-group',
      body: newFileExtensionGroup,
    })
  }, [sendForData])

  /** READ: Eine Gruppe. */
  const getFileExtensionGroup = useCallback((fileExtensionGroupKey: string) => {
    const fileExtensionGroupPath = '/api/admin/file-extension-group/' + fileExtensionGroupKey
    return sendForData<FileExtensionGroup>({ method: 'GET', path: fileExtensionGroupPath })
  }, [sendForData])

  /** READ: Alle Gruppen in der Reihenfolge der Anzeige. Für Listen reichen sonst die Stammdaten. */
  const getAllFileExtensionGroup = useCallback(() => {
    return sendForData<FileExtensionGroup[]>({ method: 'GET', path: '/api/file-extension-group' })
  }, [sendForData])

  /** UPDATE: Ändert den Anzeigenamen einer Gruppe und liefert sie. Der Key ändert sich nie. */
  const changeFileExtensionGroup = useCallback((changedFileExtensionGroup: FileExtensionGroup) => {
    return sendForData<FileExtensionGroup>({
      method: 'PUT',
      path: '/api/admin/file-extension-group',
      body: changedFileExtensionGroup,
    })
  }, [sendForData])

  /** UPDATE: Neue Reihenfolge nach Drag and Drop, jeder Key genau einmal. Liefert alle Gruppen in neuer Reihenfolge. */
  const changeFileExtensionGroupListingPositions = useCallback((fileExtensionGroupKeysInOrder: string[]) => {
    const listingOrder = { keysInOrder: fileExtensionGroupKeysInOrder }
    return sendForData<FileExtensionGroup[]>({
      method: 'PUT',
      path: '/api/admin/file-extension-group/listing-position',
      body: listingOrder,
    })
  }, [sendForData])

  /** DELETE: Löscht eine Gruppe, ihre Endungen stehen danach ohne Gruppe. */
  const deleteFileExtensionGroup = useCallback((fileExtensionGroupKey: string) => {
    const fileExtensionGroupToDelete = { key: fileExtensionGroupKey }
    return sendForSuccess({ method: 'DELETE', path: '/api/admin/file-extension-group', body: fileExtensionGroupToDelete })
  }, [sendForSuccess])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createFileExtensionGroup,
    getFileExtensionGroup,
    getAllFileExtensionGroup,
    changeFileExtensionGroup,
    changeFileExtensionGroupListingPositions,
    deleteFileExtensionGroup,
  }
}
