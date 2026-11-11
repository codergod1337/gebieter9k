import { useEffect, useState } from 'react'
import { useApiRequest } from '../api/useApiRequest.ts'
import { getFileDocumentDownloadPath } from './fileDocumentUrls.ts'

/** Die geladenen Bytes einer Datei, zu welcher id sie gehören. */
type LoadedFileDocumentBlob = {
  fileDocumentId: string
  blob: Blob
}

/** Wie weit das Laden einer Datei ist. */
type FileDocumentBlobProgress = {
  fileDocumentId: string
  receivedBytes: number
  totalBytes: number
}

/** Was {@link useFileDocumentBlob} liefert. */
export type FileDocumentBlobHook = {
  /** die Bytes, `null` solange sie laden oder bei einem Fehler */
  blob: Blob | null
  receivedBytes: number
  /** 0, wenn das Backend die Länge nicht nennt */
  totalBytes: number
  /** Fehler des Ladens, `null` wenn keiner */
  errorMessage: string | null
}

/**
 * Die Bytes einer Datei für einen Viewer im Browser (Word, Tabelle, Text), wie `useDmsFileBlob` der Vorlage: über den
 * Download mit der Leseprüfung des Users, nur in den Speicher, mit Fortschritt. Eine andere id lädt neu.
 */
export function useFileDocumentBlob(fileDocumentId: string): FileDocumentBlobHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData
  const [loadedFileDocumentBlob, setLoadedFileDocumentBlob] = useState<LoadedFileDocumentBlob | null>(null)
  const [fileDocumentBlobProgress, setFileDocumentBlobProgress] = useState<FileDocumentBlobProgress | null>(null)

  useEffect(() => {
    let active = true
    const downloadPath = getFileDocumentDownloadPath(fileDocumentId)
    function handleDownloadProgress(receivedBytes: number, totalBytes: number) {
      if (active) {
        setFileDocumentBlobProgress({ fileDocumentId, receivedBytes, totalBytes })
      }
    }
    void sendForData<Blob>({
      method: 'GET',
      path: downloadPath,
      responseAsBlob: true,
      onDownloadProgress: handleDownloadProgress,
    }).then((loadedBlob) => {
      if (active && loadedBlob !== null) {
        setLoadedFileDocumentBlob({ fileDocumentId, blob: loadedBlob })
      }
    })
    return () => {
      active = false
    }
  }, [fileDocumentId, sendForData])

  let blob: Blob | null = null
  if (loadedFileDocumentBlob !== null && loadedFileDocumentBlob.fileDocumentId === fileDocumentId) {
    blob = loadedFileDocumentBlob.blob
  }
  let receivedBytes = 0
  let totalBytes = 0
  if (fileDocumentBlobProgress !== null && fileDocumentBlobProgress.fileDocumentId === fileDocumentId) {
    receivedBytes = fileDocumentBlobProgress.receivedBytes
    totalBytes = fileDocumentBlobProgress.totalBytes
  }
  let errorMessage: string | null = null
  if (apiRequestHook.error !== null) {
    errorMessage = apiRequestHook.error.detail
  }
  return { blob, receivedBytes, totalBytes, errorMessage }
}
