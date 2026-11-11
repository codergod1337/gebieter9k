import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { FileClass } from './FileClass.ts'

/**
 * Was {@link useFileClass} anbietet: je Endpunkt von `/api/file-class` (Liste für jeden) und `/api/admin/file-class`
 * (Verwaltung, nur ADMIN) eine Funktion, benannt wie die Methode im `FileClassService` des Backends. Ein DELETE gibt es
 * im Backend noch nicht.
 */
export type FileClassHook = ApiHookState & {
  createFileClass: (newFileClass: FileClass) => Promise<FileClass | null>
  getFileClass: (fileClassKey: string) => Promise<FileClass | null>
  getAllFileClass: () => Promise<FileClass[] | null>
  changeFileClass: (changedFileClass: FileClass) => Promise<FileClass | null>
}

/** Alle Endpunkte von `/api/file-class` und `/api/admin/file-class`, die Requests gehen über das API-Modul. */
export function useFileClass(): FileClassHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Legt eine FileClass an und liefert sie. */
  const createFileClass = useCallback((newFileClass: FileClass) => {
    return sendForData<FileClass>({ method: 'POST', path: '/api/admin/file-class', body: newFileClass })
  }, [sendForData])

  /** READ: Eine FileClass über ihren Key. */
  const getFileClass = useCallback((fileClassKey: string) => {
    const fileClassPath = '/api/admin/file-class/' + fileClassKey
    return sendForData<FileClass>({ method: 'GET', path: fileClassPath })
  }, [sendForData])

  /** READ: Alle FileClasses in der Reihenfolge der Anzeige. Für Listen reichen sonst die Stammdaten. */
  const getAllFileClass = useCallback(() => {
    return sendForData<FileClass[]>({ method: 'GET', path: '/api/file-class' })
  }, [sendForData])

  /** UPDATE: Ändert eine FileClass und liefert sie. Der Body ist das volle Objekt, der Key ändert sich nie. */
  const changeFileClass = useCallback((changedFileClass: FileClass) => {
    return sendForData<FileClass>({ method: 'PUT', path: '/api/admin/file-class', body: changedFileClass })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createFileClass,
    getFileClass,
    getAllFileClass,
    changeFileClass,
  }
}
