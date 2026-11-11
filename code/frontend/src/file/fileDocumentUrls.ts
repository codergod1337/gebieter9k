import { defaultApiClient } from '../api/defaultApiClient.ts'

/** Die Adresse für den Viewer (`<img>`, `<video>`): inline, nur erlaubte Typen, Byte-Bereiche gehen. */
export function getFileDocumentViewUrl(fileDocumentId: string): string {
  const viewPath = '/api/file-document/view/' + fileDocumentId
  return defaultApiClient.createUrl(viewPath)
}

/** Der Pfad des Downloads, für Requests über das API-Modul (z. B. die Bytes für einen Viewer im Browser). */
export function getFileDocumentDownloadPath(fileDocumentId: string): string {
  return '/api/file-document/download/' + fileDocumentId
}

/** Die Adresse für den Download (als Anhang, mit dem gespeicherten Dateinamen). */
export function getFileDocumentDownloadUrl(fileDocumentId: string): string {
  const downloadPath = getFileDocumentDownloadPath(fileDocumentId)
  return defaultApiClient.createUrl(downloadPath)
}
