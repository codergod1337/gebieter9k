import { defaultApiClient } from '../api/defaultApiClient.ts'

/** Die Seite einer Galerie-Freigabe im Frontend, ohne Anmeldung erreichbar: `/share/galerie/<token>`. */
export function getGalleryShareVisitorPath(shareToken: string): string {
  return '/share/galerie/' + shareToken
}

/** Der Link zum Weitergeben: die Adresse dieser Seite mit der Besucherseite der Freigabe. */
export function getGalleryShareLink(shareToken: string): string {
  const visitorPath = getGalleryShareVisitorPath(shareToken)
  return window.location.origin + visitorPath
}

/** Der Pfad der Standardansicht im Backend; alles Weitere der Freigabe hängt darunter. */
export function getSharedGalleryApiPath(shareToken: string): string {
  return '/api/share/token/' + shareToken
}

/** Die Adresse eines Bildes der Freigabe für den Viewer (`<img>`). */
export function getSharedFileViewUrl(shareToken: string, fileDocumentId: string): string {
  const viewPath = getSharedGalleryApiPath(shareToken) + '/view/' + fileDocumentId
  return defaultApiClient.createUrl(viewPath)
}

/** Die Adresse eines Bildes der Freigabe als Download (das Original). */
export function getSharedFileDownloadUrl(shareToken: string, fileDocumentId: string): string {
  const downloadPath = getSharedGalleryApiPath(shareToken) + '/download/' + fileDocumentId
  return defaultApiClient.createUrl(downloadPath)
}

/** Die Adresse für „alle herunterladen“: alle Bilder der Freigabe als eine ZIP-Datei. */
export function getSharedAllFilesDownloadUrl(shareToken: string): string {
  const downloadAllPath = getSharedGalleryApiPath(shareToken) + '/download/all'
  return defaultApiClient.createUrl(downloadAllPath)
}

/** Die Adresse, an die das Formular der Auswahl geht (POST, Feld `fileIds`): die gewählten Bilder als ZIP. */
export function getSharedSelectionDownloadUrl(shareToken: string): string {
  const selectionPath = getSharedGalleryApiPath(shareToken) + '/selection'
  return defaultApiClient.createUrl(selectionPath)
}
