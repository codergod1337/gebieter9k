/**
 * Die Seiten einer Datei, global wie die Dokumentseite der Vorlage: aus jedem Modul erreichbar (File-Manager, Galerie,
 * Upload-Liste), mit dem Origin des Aufrufers („Zurück zu …“). In der URL steht nur die id (SHA-256). Was der User dort
 * sieht und darf, entscheidet das Backend (Lesefilter, Schreibrecht).
 */
export const FILE_DOCUMENT_PATH = '/file'

/** Die Seite einer Datei: Metadaten, Vorschau, Aktionen; dort bearbeitet man jedes Feld im eigenen Popup. */
export function getFileDocumentPath(fileDocumentId: string): string {
  return FILE_DOCUMENT_PATH + '/' + fileDocumentId
}

/** Der Viewer einer Datei. */
export function getFileDocumentViewerPath(fileDocumentId: string): string {
  return FILE_DOCUMENT_PATH + '/' + fileDocumentId + '/viewer'
}
