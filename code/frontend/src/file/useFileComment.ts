import { useCallback } from 'react'
import type { ApiHookState } from '../api/ApiHookState.ts'
import { useApiRequest } from '../api/useApiRequest.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import type { FileCommentCount, FileCommentThread } from './FileComment.ts'

/**
 * Was {@link useFileComment} anbietet: je Endpunkt von `/api/file-comment` eine Funktion, benannt wie die Methode im
 * `FileCommentService` des Backends. Schreiben, Lesen und Löschen liefern den Verlauf der Kommentare danach, das
 * Zählen die Zahl; bei einem Fehler `null`, er steht dann in `error`.
 */
export type FileCommentHook = ApiHookState & {
  createOwnFileComment: (fileDocumentId: string, commentText: MultilingualText) => Promise<FileCommentThread | null>
  getFileCommentThread: (fileDocumentId: string) => Promise<FileCommentThread | null>
  getFileCommentCount: (fileDocumentId: string) => Promise<FileCommentCount | null>
  deleteOwnFileComment: (fileCommentId: number) => Promise<FileCommentThread | null>
}

/** Die Endpunkte von `/api/file-comment`: die Kommentare zu einer Datei. */
export function useFileComment(): FileCommentHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Eine Datei kommentieren. */
  const createOwnFileComment = useCallback((fileDocumentId: string, commentText: MultilingualText) => {
    const newFileComment = { fileDocumentId, commentText }
    return sendForData<FileCommentThread>({ method: 'POST', path: '/api/file-comment', body: newFileComment })
  }, [sendForData])

  /** READ: Der Verlauf der Kommentare einer Datei, die ältesten zuerst, mit ihren Autoren. */
  const getFileCommentThread = useCallback((fileDocumentId: string) => {
    const fileCommentThreadPath = '/api/file-comment/' + fileDocumentId
    return sendForData<FileCommentThread>({ method: 'GET', path: fileCommentThreadPath })
  }, [sendForData])

  /** READ: Wie viele Kommentare eine Datei hat, für die Sprechblase an ihrer Kachel. */
  const getFileCommentCount = useCallback((fileDocumentId: string) => {
    const fileCommentCountPath = '/api/file-comment/count/' + fileDocumentId
    return sendForData<FileCommentCount>({ method: 'GET', path: fileCommentCountPath })
  }, [sendForData])

  /** DELETE: Einen Kommentar löschen, als sein Autor oder als Autor der Datei. */
  const deleteOwnFileComment = useCallback((fileCommentId: number) => {
    const deleteRequest = { id: fileCommentId }
    return sendForData<FileCommentThread>({ method: 'DELETE', path: '/api/file-comment', body: deleteRequest })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createOwnFileComment,
    getFileCommentThread,
    getFileCommentCount,
    deleteOwnFileComment,
  }
}
