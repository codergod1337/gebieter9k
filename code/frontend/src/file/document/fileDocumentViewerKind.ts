/**
 * Wie der Viewer eine Datei zeigt: als Bild, als Video, als Word-Dokument, als Tabelle, als Text, oder gar nicht (dann
 * nur Download).
 */
export type FileDocumentViewerKind = 'IMAGE' | 'VIDEO' | 'WORD' | 'SPREADSHEET' | 'TEXT' | 'NONE'

/**
 * Dokumente mit eigenem Viewer im Browser, nach dem Typ laut Tika (die einzige Stelle dafür, wie die viewerRegistry der
 * Vorlage): Word nur als docx (docx-preview), Tabellen als xlsx und ods (SheetJS), Text roh. Ein odt kann keine dieser
 * Bibliotheken, es bekommt nur den Download.
 */
const DOCUMENT_VIEWER_KIND_BY_MIME_TYPE: Readonly<Record<string, FileDocumentViewerKind>> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'WORD',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'SPREADSHEET',
  'application/vnd.oasis.opendocument.spreadsheet': 'SPREADSHEET',
  'text/plain': 'TEXT',
}

/**
 * Der Viewer nach dem Typ laut Tika. Bilder und Videos zeigt der Browser selbst; ob er sie inline bekommt, entscheidet das
 * Backend (`gebiter.file.inline-mime-types`, HEIC als JPEG). Word, Tabellen und Text holen sich die Bytes und zeigen sie
 * mit einer Bibliothek. Ohne Typ kein Viewer.
 */
export function getFileDocumentViewerKind(mimeType: unknown): FileDocumentViewerKind {
  if (typeof mimeType !== 'string') {
    return 'NONE'
  }
  if (mimeType.startsWith('image/')) {
    return 'IMAGE'
  }
  if (mimeType.startsWith('video/')) {
    return 'VIDEO'
  }
  return DOCUMENT_VIEWER_KIND_BY_MIME_TYPE[mimeType] ?? 'NONE'
}
