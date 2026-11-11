import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { FileCheerDirection, FileCheerState, FileCheerUsersPage } from './FileCheer.ts'

/**
 * Was {@link useFileCheer} anbietet: je Endpunkt von `/api/file-cheer` eine Funktion, benannt wie die Methode im
 * `FileCheerService` des Backends. Stimmen, Lesen und Zurücknehmen liefern den Stand der Stimmen danach, das Auflösen
 * eine Seite User; bei einem Fehler `null`, er steht dann in `error`.
 */
export type FileCheerHook = ApiHookState & {
  createOwnFileCheer: (fileDocumentId: string, direction: FileCheerDirection) => Promise<FileCheerState | null>
  getFileCheerState: (fileDocumentId: string) => Promise<FileCheerState | null>
  /** Eine Seite der User einer Richtung, der neueste zuerst; Seiten ab 0. */
  resolveFileCheerUsersGuids: (
    fileDocumentId: string,
    direction: FileCheerDirection,
    page: number,
  ) => Promise<FileCheerUsersPage | null>
  deleteOwnFileCheer: (fileDocumentId: string) => Promise<FileCheerState | null>
}

/** Die Endpunkte von `/api/file-cheer`: die Stimmen zu einer Datei (begeistert, angewidert). */
export function useFileCheer(): FileCheerHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Für eine Datei stimmen; eine frühere eigene Stimme wird ersetzt. */
  const createOwnFileCheer = useCallback((fileDocumentId: string, direction: FileCheerDirection) => {
    const newFileCheer = { fileDocumentId, direction }
    return sendForData<FileCheerState>({ method: 'POST', path: '/api/file-cheer', body: newFileCheer })
  }, [sendForData])

  /** READ: Wer die Datei wie bewertet hat und wie der angemeldete User selbst gestimmt hat. */
  const getFileCheerState = useCallback((fileDocumentId: string) => {
    const fileCheerStatePath = '/api/file-cheer/' + fileDocumentId
    return sendForData<FileCheerState>({ method: 'GET', path: fileCheerStatePath })
  }, [sendForData])

  /** READ (Auflösen): Eine Seite der User, die in einer Richtung gestimmt haben, für „Alle laden“. */
  const resolveFileCheerUsersGuids = useCallback((fileDocumentId: string, direction: FileCheerDirection, page: number) => {
    const resolveRequest = { fileDocumentId, direction, page }
    return sendForData<FileCheerUsersPage>({ method: 'POST', path: '/api/file-cheer/users/resolve', body: resolveRequest })
  }, [sendForData])

  /** DELETE: Die eigene Stimme zu einer Datei zurücknehmen. */
  const deleteOwnFileCheer = useCallback((fileDocumentId: string) => {
    const deleteRequest = { fileDocumentId }
    return sendForData<FileCheerState>({ method: 'DELETE', path: '/api/file-cheer', body: deleteRequest })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createOwnFileCheer,
    getFileCheerState,
    resolveFileCheerUsersGuids,
    deleteOwnFileCheer,
  }
}
