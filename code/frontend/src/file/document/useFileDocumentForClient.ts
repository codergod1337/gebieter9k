import { useCallback } from 'react'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import type { FileDocumentForClient } from '../FileDocument.ts'
import { useFileDocument } from '../useFileDocument.ts'

/** Was die Seiten einer Datei brauchen: ihre id aus der Route, das geladene Dokument, Fehler und Neuladen. */
export type FileDocumentForClientHook = {
  fileDocumentId: string
  fileDocumentForClient: FileDocumentForClient | null
  errorMessage: string | null
  reload: () => Promise<void>
}

/**
 * Lädt die Datei der Route (`:fileDocumentId`) mit den Feldern, die der User lesen darf, und ob er sie ändern darf. Für
 * Detailseite, Bearbeiten und Viewer, damit keine das Laden selbst baut.
 */
export function useFileDocumentForClient(): FileDocumentForClientHook {
  const { fileDocumentId } = useParams()
  const requestedFileDocumentId = fileDocumentId ?? ''
  const fileDocumentHook = useFileDocument()
  const getFileDocumentForClient = fileDocumentHook.getFileDocumentForClient
  const loadFileDocumentForClient = useCallback(
    () => getFileDocumentForClient(requestedFileDocumentId),
    [getFileDocumentForClient, requestedFileDocumentId],
  )
  const loadedFileDocumentForClient = useLoadedData(loadFileDocumentForClient)
  let errorMessage: string | null = null
  if (fileDocumentHook.error !== null) {
    errorMessage = fileDocumentHook.error.detail
  }
  return {
    fileDocumentId: requestedFileDocumentId,
    fileDocumentForClient: loadedFileDocumentForClient.data,
    errorMessage,
    reload: loadedFileDocumentForClient.reload,
  }
}
