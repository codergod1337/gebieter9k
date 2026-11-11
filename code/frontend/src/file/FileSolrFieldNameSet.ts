/**
 * Die Namen der Felder im File-Kern, mit denen Backend und Frontend rechnen, wie das Backend sie aus
 * `gebiter.file.field.*` liefert (Stammdaten). So steht kein Feldname fest im Frontend.
 * Doku: `docu/entities/SolrField.md`
 */
export type FileSolrFieldNameSet = {
  id: string
  sftpPath: string
  authorUsersGuid: string
  fileClassKey: string
  readerAccessRoleKeys: string
  writerAccessRoleKeys: string
  status: string
  fileName: string
  fileExtension: string
  mimeType: string
  fileSizeBytes: string
  uploadedAt: string
  lastChangedAt: string
  cheerUpCount: string
  cheerDownCount: string
  previewBase64Png: string
  searchableText: string
  imageWidth: string
  imageHeight: string
  capturedAt: string
  cameraModel: string
  gpsLatitude: string
  gpsLongitude: string
  /** der Text, den Tika gelesen hat: Texterkennung eines Bildes oder Inhalt eines Dokuments, ohne Leerzeilen */
  tikaFileDescription: string
  /** Stand der Auswertung im Hintergrund, Werte in {@link FileAnalysisStatusValueSet} */
  analysisStatus: string
  /** wann ein Durchlauf über alle Dateien die Datei zuletzt angefasst hat (setzt nur das Backend) */
  cursorDate: string
  /** wer die Datei sieht: NONE, FRIENDS, AUTHENTICATED oder ANY (setzt nur das Backend) */
  visibility: string
  /** bei FRIENDS die GUID des Autors, seine Freunde dürfen lesen (setzt nur das Backend) */
  readableForFriendsOfUsersGuid: string
  /** Die Galerie der Datei (genau eine id). */
  galleryIds: string
  /** Der Platz der Datei in ihrer Galerie. */
  galleryListingPosition: string
  /** Die Beschreibung des Users. */
  fileDescription: string
  /** Die Tags des Users, mehrwertig, mit Vervollständigung. */
  tags: string
  /** Wen der Autor zum Bearbeiten der Metadaten freigegeben hat (GUIDs); setzt nur das Backend. */
  editorUsersGuids: string
}
