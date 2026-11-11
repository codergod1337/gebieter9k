/**
 * Ein Dokument des File-Kerns, so wie das Backend es liefert: jedes Feld unter seinem Solr-Namen, nur die Felder, die der
 * User lesen darf. Welche es gibt, steht in den Felddefinitionen (SolrManager), deshalb kein fester Typ je Feld.
 */
export type FileDocument = Record<string, unknown>

/** Wie ein Upload ausging, wie `FileUploadStatus` im Backend. */
export type FileUploadStatus = 'CREATED' | 'EXISTS'

/** Die Antwort auf einen Upload. `document` fehlt, wenn der User die vorhandene Datei nicht lesen darf. */
export type FileUploadResult = {
  status: FileUploadStatus
  id: string
  document: FileDocument | null
}

/** Gibt es diese Bytes schon? Mit Dokument, wenn der User es lesen darf. */
export type FileDocumentExistence = {
  exists: boolean
  document: FileDocument | null
}

/** Ein Feld als Text, z. B. `fileName`; fehlt es oder ist es kein Text, ein leerer Text. */
export function getFileDocumentText(fileDocument: FileDocument, fieldName: string): string {
  const fieldValue = fileDocument[fieldName]
  if (typeof fieldValue === 'string') {
    return fieldValue
  }
  return ''
}

/** Die Seite einer Datei: das Dokument und ob der User es ändern darf (nur Anzeige). */
export type FileDocumentForClient = {
  document: FileDocument
  /** die Metadaten bearbeiten: Autor, freigegebener Bearbeiter, FILE_MANAGER, ADMIN */
  changeable: boolean
  /** über die Datei bestimmen (Sichtbarkeit, Bearbeiter): Autor, FILE_MANAGER, ADMIN */
  manageable: boolean
  /** weich löschen: Autor oder ADMIN, nicht der FILE_MANAGER (Nutzer 2026-11-09) */
  deletable: boolean
}

/** Eine Seite Dateien aus dem Auflösen, neueste zuerst. */
export type FileDocumentPage = {
  documents: FileDocument[]
  totalCount: number
  page: number
  pageSize: number
}
