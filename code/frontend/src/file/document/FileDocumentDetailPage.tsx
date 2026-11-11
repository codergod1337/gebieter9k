import { type ReactNode, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { Link } from 'react-router'
import { AccessRoleBadge } from '../../auth/access/AccessRoleBadge.tsx'
import { ConfirmDeletePopup } from '../../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { CopyButton } from '../../components/CopyButton.tsx'
import { DateTimeText } from '../../components/DateTimeText.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { formatByteCount } from '../../components/formatByteCount.ts'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { StatusLegendMark } from '../../components/StatusLegendMark.tsx'
import { showToast } from '../../components/toastStore.ts'
import { UsersGuidName } from '../../components/UsersGuidName.tsx'
import { VisibilityPicker } from '../../components/VisibilityPicker.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { getSolrFieldLabel } from '../../solr/solrFieldInputValue.ts'
import type { SolrField } from '../../solr/SolrField.ts'
import type { Visibility } from '../../users/Users.ts'
import { FileClassBadge } from '../FileClassBadge.tsx'
import { getFileAnalysisStatusLegend } from '../fileAnalysisStatusLook.ts'
import { type FileDocument, getFileDocumentText } from '../FileDocument.ts'
import { getFileDocumentViewerPath } from '../fileDocumentPaths.ts'
import type { FileSolrFieldNameSet } from '../FileSolrFieldNameSet.ts'
import { getFileStatusLegend } from '../fileStatusLook.ts'
import { getFileTypeIconClassName } from '../fileTypeIcon.ts'
import { getSymbolClassNameByPackAndName } from '../../symbol/symbolCatalog.ts'
import { formatTag, getFileDocumentHeading, getFileDocumentTags } from '../getFileDocumentHeading.ts'
import { useFileDocument } from '../useFileDocument.ts'
import { useFileManagerOrAdmin } from '../useFileManagerOrAdmin.ts'
import { useFileSolrFields } from '../useFileSolrFields.ts'
import { FileCheerBar } from '../cheer/FileCheerBar.tsx'
import { FileDocumentActionButtons } from './FileDocumentActionButtons.tsx'
import { FileDocumentFieldValue } from './FileDocumentFieldValue.tsx'
import { FileEditorsPopup } from './FileEditorsPopup.tsx'
import { adminAccessRoleKey } from '../../auth/access/adminAccessRoleKey.ts'
import { useCurrentSession } from '../../auth/login/useCurrentSession.ts'
import { FileFieldEditPopup } from './FileFieldEditPopup.tsx'
import { getFileDocumentViewerKind } from './fileDocumentViewerKind.ts'
import { useFileDocumentForClient } from './useFileDocumentForClient.ts'

/** Ohne Origin geht es nach dem Löschen hierher. */
const AFTER_DELETE_FALLBACK_PATH = '/'

/** Kantenlänge der Vorschau in der Kachel: die volle Vorschau aus Solr, wie die Bildkachel der Galerie. */
const PREVIEW_SIZE_PIXELS = 200

/**
 * Felder, die die Seite eigens zeigt oder die nur das Backend braucht (Pfad, Galerie-Platz, Freundes-GUID, Zeiger,
 * Volltext, Zähler). Was übrig bleibt, z. B. ein neues Feld aus dem Solr-Manager, steht unter „Weitere Angaben“.
 */
function getHandledFieldNames(fileSolrFieldNameSet: FileSolrFieldNameSet): Set<string> {
  return new Set<string>([
    fileSolrFieldNameSet.id,
    fileSolrFieldNameSet.sftpPath,
    fileSolrFieldNameSet.previewBase64Png,
    fileSolrFieldNameSet.readerAccessRoleKeys,
    fileSolrFieldNameSet.writerAccessRoleKeys,
    fileSolrFieldNameSet.status,
    fileSolrFieldNameSet.galleryIds,
    fileSolrFieldNameSet.galleryListingPosition,
    fileSolrFieldNameSet.readableForFriendsOfUsersGuid,
    fileSolrFieldNameSet.cursorDate,
    fileSolrFieldNameSet.searchableText,
    fileSolrFieldNameSet.cheerUpCount,
    fileSolrFieldNameSet.cheerDownCount,
    fileSolrFieldNameSet.visibility,
    fileSolrFieldNameSet.fileName,
    fileSolrFieldNameSet.fileExtension,
    fileSolrFieldNameSet.fileDescription,
    fileSolrFieldNameSet.tags,
    fileSolrFieldNameSet.fileClassKey,
    fileSolrFieldNameSet.authorUsersGuid,
    fileSolrFieldNameSet.uploadedAt,
    fileSolrFieldNameSet.lastChangedAt,
    fileSolrFieldNameSet.fileSizeBytes,
    fileSolrFieldNameSet.mimeType,
    fileSolrFieldNameSet.imageWidth,
    fileSolrFieldNameSet.imageHeight,
    fileSolrFieldNameSet.capturedAt,
    fileSolrFieldNameSet.cameraModel,
    fileSolrFieldNameSet.gpsLatitude,
    fileSolrFieldNameSet.gpsLongitude,
    fileSolrFieldNameSet.analysisStatus,
    fileSolrFieldNameSet.tikaFileDescription,
    fileSolrFieldNameSet.editorUsersGuids,
  ])
}

/** Ein Text aus dem Dokument, `null` wenn das Feld fehlt oder leer ist. */
function getOptionalText(fileDocument: FileDocument, fieldName: string): string | null {
  const fieldValue = fileDocument[fieldName]
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    return null
  }
  return String(fieldValue)
}

/** Eine Liste aus dem Dokument als Texte, leer ohne Feld. */
function getTextList(fileDocument: FileDocument, fieldName: string): string[] {
  const fieldValue = fileDocument[fieldName]
  if (!Array.isArray(fieldValue)) {
    return []
  }
  return fieldValue.map((singleValue) => String(singleValue))
}

/** Ein Abschnitt des Info-Panels: kleine Überschrift, darunter die Zeilen. */
function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="file-detail-section">
      <h3 className="file-detail-section-title">{title}</h3>
      {children}
    </section>
  )
}

/** Eine Zeile des Info-Panels: Symbol, Bezeichnung, Wert. */
function InfoRow({ iconClassName, label, children }: { iconClassName: string; label: string; children: ReactNode }) {
  return (
    <div className="file-detail-row">
      <span className="file-detail-row-icon">
        <i className={iconClassName} aria-hidden="true"></i>
      </span>
      <span className="file-detail-row-label">{label}</span>
      <span className="file-detail-row-value">{children}</span>
    </div>
  )
}

/** Ein Wert, der sich per Klick im Popup bearbeiten lässt: mit Stift für den, der darf; sonst nur der Wert. */
function EditableValue({ editable, label, onEdit, children }: { editable: boolean; label: string; onEdit: () => void; children: ReactNode }) {
  if (!editable) {
    return <>{children}</>
  }
  const editLabel = label + ' bearbeiten'
  return (
    <Hoverlay text={editLabel}>
      <button type="button" className="file-detail-editable" onClick={onEdit} aria-label={editLabel}>
        {children}
        <i className="bi bi-pencil file-detail-editable-icon" aria-hidden="true"></i>
      </button>
    </Hoverlay>
  )
}

/**
 * Die Seite einer Datei unter `/file/<id>`, nach der Dokumentseite der Vorlage (Nutzer 2026-11-09: Struktur statt
 * „lieblos“), aus jedem Modul erreichbar. Zwei Spalten, auf dem Handy untereinander (der Inhalt zuerst):
 * - Links, breit, die Details in Abschnitten (auf breiten Bildschirmen nebeneinander): FileClass (Kachel, Beschreibung in
 *   der Sprechblase); Status mit Autor („Von“) und den Ständen der Datei und der Auswertung, in der Sprechblase alle
 *   möglichen; Freigabe (Sichtbarkeit zum Umschalten, Zugriff als R, W und E: Lese-, Schreibrechte und wer bearbeiten
 *   darf); die Datei (Name und Typ als Code, Größe, Daten mit „vor X Tagen“); die Aufnahme bei Fotos; Markierungen
 *   (Referenzen wie `wtf`, setzen nur FILE_MANAGER und ADMIN); weitere Felder aus dem Solr-Manager; der erkannte Text.
 * - Rechts, so schmal wie eine Bildkachel der Galerie: oben die Tags, dann die Kachel mit dem Vorschaubild (ohne
 *   Vorschau das Symbol der FileClass; ein Klick öffnet den Viewer), darunter die Stimmen ({@link FileCheerBar}:
 *   begeistert und angewidert, getrennt vom Dokument geladen) und die Beschreibung, wenn es eine gibt.
 * Bearbeiten ohne eigene Seite (Nutzer 2026-11-09): Wer darf, klickt auf ein Feld (Tags, Beschreibung, Dateiname, …) und
 * ändert nur dieses im Popup ({@link FileFieldEditPopup}); das „E“ öffnet die Freigabe zum Bearbeiten
 * ({@link FileEditorsPopup}). Bearbeiten: Autor, freigegebene Bearbeiter, FILE_MANAGER, ADMIN (`changeable`);
 * Sichtbarkeit, Freigaben: Autor, FILE_MANAGER, ADMIN (`manageable`); weich löschen: Autor und ADMIN (`deletable`). Nach
 * dem Löschen zum Origin (z. B. die Galerie), ohne Origin zur Startseite.
 */
export function FileDocumentDetailPage() {
  const originNavigation = useOrigin()
  const masterDataHook = useMasterData()
  const fileSolrFieldNameSet = masterDataHook.fileSolrFieldNameSet
  const fileAnalysisStatusValueSet = masterDataHook.fileAnalysisStatusValueSet
  const fileStatusValueSet = masterDataHook.fileStatusValueSet
  const fileSolrFieldsHook = useFileSolrFields()
  const fileSolrFields = fileSolrFieldsHook.fileSolrFields
  const fileDocumentForClientHook = useFileDocumentForClient()
  const fileDocumentId = fileDocumentForClientHook.fileDocumentId
  const fileDocumentForClient = fileDocumentForClientHook.fileDocumentForClient
  const deleteFileDocumentHook = useFileDocument()
  const visibilityHook = useFileDocument()
  const fileManagerOrAdmin = useFileManagerOrAdmin()
  const { hasAccessRole } = useCurrentSession()
  const [deletePopupOpen, setDeletePopupOpen] = useState<boolean>(false)
  const [recognizedTextOpen, setRecognizedTextOpen] = useState<boolean>(false)
  /** Das Feld, dessen Popup offen ist, `null` wenn keins. */
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null)
  const [editorsPopupOpen, setEditorsPopupOpen] = useState<boolean>(false)

  let loadErrorMessage: string | null = fileDocumentForClientHook.errorMessage
  if (loadErrorMessage === null) {
    loadErrorMessage = fileSolrFieldsHook.errorMessage
  }
  if (loadErrorMessage !== null) {
    return <ErrorAlert message={loadErrorMessage} />
  }
  if (
    fileDocumentForClient === null ||
    fileSolrFields === null ||
    fileSolrFieldNameSet === null ||
    fileAnalysisStatusValueSet === null ||
    fileStatusValueSet === null
  ) {
    return <Spinner animation="border" />
  }

  const fileDocument = fileDocumentForClient.document
  const changeable = fileDocumentForClient.changeable
  const manageable = fileDocumentForClient.manageable
  const deletable = fileDocumentForClient.deletable
  const fileName = getFileDocumentText(fileDocument, fileSolrFieldNameSet.fileName)
  const heading = getFileDocumentHeading(fileDocument, fileSolrFieldNameSet)
  const tags = getFileDocumentTags(fileDocument, fileSolrFieldNameSet)
  const description = getOptionalText(fileDocument, fileSolrFieldNameSet.fileDescription)
  const recognizedText = getOptionalText(fileDocument, fileSolrFieldNameSet.tikaFileDescription)
  const visibility = fileDocument[fileSolrFieldNameSet.visibility] as Visibility | undefined
  const inGallery = Array.isArray(fileDocument[fileSolrFieldNameSet.galleryIds])
  const mimeType = fileDocument[fileSolrFieldNameSet.mimeType]
  const fileExtension = getOptionalText(fileDocument, fileSolrFieldNameSet.fileExtension)
  const viewerKind = getFileDocumentViewerKind(mimeType)
  const hasViewer = viewerKind !== 'NONE'
  const previewBase64Png = getOptionalText(fileDocument, fileSolrFieldNameSet.previewBase64Png)
  const fileTypeIconClassName = getFileTypeIconClassName(mimeType)

  // Bearbeiten, Viewer und Profile öffnen sich mit dieser Seite als Origin
  const originState = originNavigation.createOriginStateHere(heading)

  /** Die Bezeichnung eines Feldes aus dem Solr-Manager, sonst der Ersatz. */
  function labelOf(fieldName: string, fallbackLabel: string): string {
    const solrField = (fileSolrFields ?? []).find((candidate) => candidate.name === fieldName)
    if (solrField === undefined) {
      return fallbackLabel
    }
    const displayNameText = getTextInCurrentLanguage(solrField.displayName)
    return getSolrFieldLabel(solrField, displayNameText)
  }

  function findSolrField(fieldName: string): SolrField | null {
    return (fileSolrFields ?? []).find((candidate) => candidate.name === fieldName) ?? null
  }

  /**
   * Lässt sich das Feld hier bearbeiten? Nur wer die Metadaten bearbeiten darf, nur Felder „vom Client“, nie die
   * FileClass; Referenzen wie `wtf` nur FILE_MANAGER und ADMIN (prüft auch das Backend).
   */
  function isFieldEditable(solrField: SolrField | null): boolean {
    if (solrField === null || !changeable || !solrField.clientValueAccepted || fileSolrFieldNameSet === null) {
      return false
    }
    if (solrField.name === fileSolrFieldNameSet.fileClassKey) {
      return false
    }
    if (solrField.solrReferenceKey !== null && !fileManagerOrAdmin) {
      return false
    }
    return true
  }

  async function handleConfirmDelete() {
    let deleted: boolean
    // Admin über seinen Endpunkt (jede Datei), der Autor über den eigenen
    if (hasAccessRole(adminAccessRoleKey)) {
      deleted = await deleteFileDocumentHook.deleteFileDocument(fileDocumentId)
    } else {
      deleted = await deleteFileDocumentHook.deleteOwnFileDocument(fileDocumentId)
    }
    if (!deleted) {
      return
    }
    setDeletePopupOpen(false)
    showToast({ kind: 'success', title: 'Datei gelöscht', text: fileName + ' ist gelöscht (weich, der Admin kann sie endgültig löschen).' })
    originNavigation.goBackToOrigin(AFTER_DELETE_FALLBACK_PATH)
  }

  /** Eine Wahl im Sichtbarkeits-Pill speichert sofort, danach zeigt die Seite den neuen Stand. */
  async function handleVisibilityChange(changedVisibility: Visibility) {
    if (changedVisibility === visibility) {
      return
    }
    let changedFileDocument: FileDocument | null
    if (fileManagerOrAdmin) {
      changedFileDocument = await visibilityHook.changeFileDocumentVisibility(fileDocumentId, changedVisibility)
    } else {
      changedFileDocument = await visibilityHook.changeOwnFileDocumentVisibility(fileDocumentId, changedVisibility)
    }
    if (changedFileDocument !== null) {
      await fileDocumentForClientHook.reload()
    }
  }

  /** Wer bearbeiten darf, in der Sprechblase des „E“: der Autor und die freigegebenen User. */
  function renderEditors() {
    return (
      <span className="file-detail-access-legend">
        <span className="file-detail-access-legend-title">Bearbeiten</span>
        <span>Der Autor, File-Manager und Admin{editorUsersGuids.length > 0 ? ', dazu:' : '.'}</span>
        {editorUsersGuids.length > 0 && (
          <span className="file-detail-access-legend-users">
            {editorUsersGuids.map((editorUsersGuid) => (
              <UsersGuidName key={editorUsersGuid} usersGuid={editorUsersGuid} originLabel={heading} />
            ))}
          </span>
        )}
        {manageable && <span className="file-detail-access-legend-hint">Klick: freigeben</span>}
      </span>
    )
  }

  /** Die Rechte als Badges in der Sprechblase von R und W; fehlt ein Recht in den Stammdaten, steht sein Key. */
  function renderAccessRoles(title: string, accessRoleKeys: string[]) {
    return (
      <span className="file-detail-access-legend">
        <span className="file-detail-access-legend-title">{title}</span>
        <span className="file-detail-access-legend-roles">
          {accessRoleKeys.length === 0 && <span>niemand außer dem Admin</span>}
          {accessRoleKeys.map((accessRoleKey) => {
            const accessRole = (masterDataHook.accessRoles ?? []).find((candidate) => candidate.key === accessRoleKey)
            if (accessRole === undefined) {
              return <code key={accessRoleKey}>{accessRoleKey}</code>
            }
            return <AccessRoleBadge key={accessRoleKey} accessRole={accessRole} />
          })}
        </span>
      </span>
    )
  }

  const fileClassKey = fileDocument[fileSolrFieldNameSet.fileClassKey]
  const fileClass = (masterDataHook.fileClasses ?? []).find((candidate) => candidate.key === fileClassKey)
  // Ohne Vorschaubild steht in der Kachel das Symbol der FileClass, ohne Symbol das des Dateityps
  let tileSymbolClassName = fileTypeIconClassName
  const fileClassLook = fileClass?.badgeLook ?? null
  if (fileClassLook !== null && fileClassLook.symbolPack !== null && fileClassLook.symbolName !== null) {
    tileSymbolClassName = getSymbolClassNameByPackAndName(fileClassLook.symbolPack, fileClassLook.symbolName) ?? fileTypeIconClassName
  }
  const authorUsersGuid = getOptionalText(fileDocument, fileSolrFieldNameSet.authorUsersGuid)
  const uploadedAt = getOptionalText(fileDocument, fileSolrFieldNameSet.uploadedAt)
  const lastChangedAt = getOptionalText(fileDocument, fileSolrFieldNameSet.lastChangedAt)
  const capturedAt = getOptionalText(fileDocument, fileSolrFieldNameSet.capturedAt)
  const cameraModel = getOptionalText(fileDocument, fileSolrFieldNameSet.cameraModel)
  const fileSizeBytes = fileDocument[fileSolrFieldNameSet.fileSizeBytes]
  const imageWidth = fileDocument[fileSolrFieldNameSet.imageWidth]
  const imageHeight = fileDocument[fileSolrFieldNameSet.imageHeight]
  const gpsLatitude = fileDocument[fileSolrFieldNameSet.gpsLatitude]
  const gpsLongitude = fileDocument[fileSolrFieldNameSet.gpsLongitude]
  const readerAccessRoleKeys = getTextList(fileDocument, fileSolrFieldNameSet.readerAccessRoleKeys)
  const writerAccessRoleKeys = getTextList(fileDocument, fileSolrFieldNameSet.writerAccessRoleKeys)
  const hasImageSize = typeof imageWidth === 'number' && typeof imageHeight === 'number'
  const hasGps = typeof gpsLatitude === 'number' && typeof gpsLongitude === 'number'
  const hasCapture = capturedAt !== null || cameraModel !== null || hasImageSize || hasGps
  const editorUsersGuids = getTextList(fileDocument, fileSolrFieldNameSet.editorUsersGuids)
  const handledFieldNames = getHandledFieldNames(fileSolrFieldNameSet)
  // Felder, die die Seite nicht eigens zeigt: da, oder leer, aber bearbeitbar
  const remainingSolrFields = fileSolrFields.filter(
    (solrField) => !handledFieldNames.has(solrField.name) && (solrField.name in fileDocument || isFieldEditable(solrField)),
  )
  const referenceSolrFields = remainingSolrFields.filter((solrField) => solrField.solrReferenceKey !== null)
  const otherSolrFields = remainingSolrFields.filter((solrField) => solrField.solrReferenceKey === null)
  const tagsSolrField = findSolrField(fileSolrFieldNameSet.tags)
  const descriptionSolrField = findSolrField(fileSolrFieldNameSet.fileDescription)
  const fileNameSolrField = findSolrField(fileSolrFieldNameSet.fileName)
  const tagsEditable = isFieldEditable(tagsSolrField)
  const descriptionEditable = isFieldEditable(descriptionSolrField)
  const fileNameEditable = isFieldEditable(fileNameSolrField)
  let editingSolrField: SolrField | null = null
  if (editingFieldName !== null) {
    editingSolrField = findSolrField(editingFieldName)
  }
  let visibilityNote: string | null = null
  if (manageable && inGallery) {
    visibilityNote = 'Ändert sich die Sichtbarkeit der Galerie, bekommt das Bild wieder die der Galerie.'
  }
  let changeVisibility: ((changedVisibility: Visibility) => void) | undefined = undefined
  if (manageable) {
    changeVisibility = (changedVisibility: Visibility) => void handleVisibilityChange(changedVisibility)
  }

  let deleteErrorMessage: string | null = null
  if (deleteFileDocumentHook.error !== null) {
    deleteErrorMessage = deleteFileDocumentHook.error.detail
  }
  let visibilityErrorMessage: string | null = null
  if (visibilityHook.error !== null) {
    visibilityErrorMessage = visibilityHook.error.detail
  }
  const actionButtons = (
    <FileDocumentActionButtons
      fileDocumentId={fileDocumentId}
      fileName={fileName}
      hasViewer={hasViewer}
      changeable={deletable}
      onDelete={() => setDeletePopupOpen(true)}
      linkState={originState}
    />
  )
  const footer = (
    <span className="small d-inline-flex align-items-center gap-2">
      <span className="text-break">id {fileDocumentId}</span>
      <CopyButton value={fileDocumentId} label="id kopieren" />
    </span>
  )
  let recognizedTextToggleText = 'Erkannter Text (' + (recognizedText?.length ?? 0).toLocaleString('de-DE') + ' Zeichen)'
  if (recognizedTextOpen) {
    recognizedTextToggleText = 'Erkannten Text ausblenden'
  }
  const fileExtensionText = (fileExtension ?? '').toUpperCase()
  const viewerPath = getFileDocumentViewerPath(fileDocumentId)

  return (
    <>
      <ContentBox title={heading} actions={actionButtons} footer={footer}>
        <div className="file-detail">
          <div className="file-detail-info" role="region" aria-label="Angaben zur Datei">
            {fileClass !== undefined && (
              <div className="file-detail-file-class">
                <FileClassBadge fileClass={fileClass} showDescription />
              </div>
            )}

            <div className="file-detail-sections">
              <InfoSection title="Status">
                {authorUsersGuid !== null && (
                  <InfoRow iconClassName="bi bi-person" label="Von">
                    <UsersGuidName usersGuid={authorUsersGuid} originLabel={heading} />
                  </InfoRow>
                )}
                <InfoRow iconClassName="bi bi-flag" label="Datei">
                  <StatusLegendMark
                    title="Datei"
                    currentValue={fileDocument[fileSolrFieldNameSet.status]}
                    entries={getFileStatusLegend(fileStatusValueSet)}
                  />
                </InfoRow>
                <InfoRow iconClassName="bi bi-cpu" label="Auswertung">
                  <StatusLegendMark
                    title="Auswertung"
                    currentValue={fileDocument[fileSolrFieldNameSet.analysisStatus]}
                    entries={getFileAnalysisStatusLegend(fileAnalysisStatusValueSet)}
                  />
                </InfoRow>
              </InfoSection>

              <InfoSection title="Freigabe">
                {visibility !== undefined && (
                  <InfoRow iconClassName="bi bi-eye" label="Sichtbar für">
                    <VisibilityPicker
                      value={visibility}
                      onChange={changeVisibility}
                      disabled={visibilityHook.isLoading}
                      ariaLabel="Datei sichtbar für"
                      note={visibilityNote}
                    />
                  </InfoRow>
                )}
                <ErrorAlert message={visibilityErrorMessage} />
                <InfoRow iconClassName="bi bi-shield-lock" label="Zugriff">
                  <span className="file-detail-access">
                    <Hoverlay text={renderAccessRoles('Lesen', readerAccessRoleKeys)}>
                      <span className="file-detail-access-letter" tabIndex={0} aria-label="Lesezugriff">
                        R
                      </span>
                    </Hoverlay>
                    <Hoverlay text={renderAccessRoles('Schreiben (hochladen)', writerAccessRoleKeys)}>
                      <span className="file-detail-access-letter" tabIndex={0} aria-label="Schreibzugriff">
                        W
                      </span>
                    </Hoverlay>
                    <Hoverlay text={renderEditors()}>
                      {manageable ? (
                        <button
                          type="button"
                          className="file-detail-access-letter file-detail-access-letter-editable"
                          aria-label="Bearbeiten freigeben"
                          onClick={() => setEditorsPopupOpen(true)}>
                          E
                        </button>
                      ) : (
                        <span className="file-detail-access-letter" tabIndex={0} aria-label="Bearbeiten">
                          E
                        </span>
                      )}
                    </Hoverlay>
                  </span>
                </InfoRow>
              </InfoSection>

              <InfoSection title="Datei">
                <div className="file-detail-file-identity">
                  <i className={fileTypeIconClassName + ' file-detail-file-icon'} aria-hidden="true"></i>
                  <span className="file-detail-file-text">
                    <EditableValue
                      editable={fileNameEditable}
                      label="Dateiname"
                      onEdit={() => setEditingFieldName(fileSolrFieldNameSet.fileName)}>
                      <code className="file-detail-file-name">{fileName}</code>
                    </EditableValue>
                    <span className="file-detail-file-facts">
                      {typeof mimeType === 'string' && <code>{mimeType}</code>}
                      {typeof fileSizeBytes === 'number' && <span>{formatByteCount(fileSizeBytes)}</span>}
                    </span>
                  </span>
                </div>
                {uploadedAt !== null && (
                  <InfoRow iconClassName="bi bi-cloud-arrow-up" label="Hochgeladen">
                    <DateTimeText isoDateTime={uploadedAt} label={labelOf(fileSolrFieldNameSet.uploadedAt, 'Hochgeladen')} />
                  </InfoRow>
                )}
                {lastChangedAt !== null && (
                  <InfoRow iconClassName="bi bi-pencil" label="Geändert">
                    <DateTimeText isoDateTime={lastChangedAt} label={labelOf(fileSolrFieldNameSet.lastChangedAt, 'Zuletzt geändert')} />
                  </InfoRow>
                )}
              </InfoSection>

              {hasCapture && (
                <InfoSection title="Aufnahme">
                  {capturedAt !== null && (
                    <InfoRow iconClassName="bi bi-calendar-event" label="Aufgenommen">
                      <DateTimeText isoDateTime={capturedAt} label={labelOf(fileSolrFieldNameSet.capturedAt, 'Aufgenommen')} />
                    </InfoRow>
                  )}
                  {cameraModel !== null && (
                    <InfoRow iconClassName="bi bi-camera" label="Kamera">
                      {cameraModel}
                    </InfoRow>
                  )}
                  {hasImageSize && (
                    <InfoRow iconClassName="bi bi-aspect-ratio" label="Maße">
                      {String(imageWidth) + ' × ' + String(imageHeight) + ' px'}
                    </InfoRow>
                  )}
                  {hasGps && (
                    <InfoRow iconClassName="bi bi-geo-alt" label="Ort">
                      <code>{Number(gpsLatitude).toFixed(5) + ', ' + Number(gpsLongitude).toFixed(5)}</code>
                    </InfoRow>
                  )}
                </InfoSection>
              )}

              {referenceSolrFields.length > 0 && (
                <InfoSection title="Markierungen">
                  {referenceSolrFields.map((solrField) => {
                    const displayNameText = getTextInCurrentLanguage(solrField.displayName)
                    const fieldLabel = getSolrFieldLabel(solrField, displayNameText)
                    const markValues = getTextList(fileDocument, solrField.name)
                    return (
                      <InfoRow key={solrField.name} iconClassName="bi bi-bookmark" label={fieldLabel}>
                        <EditableValue editable={isFieldEditable(solrField)} label={fieldLabel} onEdit={() => setEditingFieldName(solrField.name)}>
                          <span className="file-detail-marks">
                            {markValues.length === 0 && <span className="file-detail-empty">keine</span>}
                            {markValues.map((markValue) => (
                              <span key={markValue} className="badge file-mark">
                                {markValue}
                              </span>
                            ))}
                          </span>
                        </EditableValue>
                      </InfoRow>
                    )
                  })}
                </InfoSection>
              )}

              {otherSolrFields.length > 0 && (
                <InfoSection title="Weitere Angaben">
                  {otherSolrFields.map((solrField) => {
                    const displayNameText = getTextInCurrentLanguage(solrField.displayName)
                    const fieldLabel = getSolrFieldLabel(solrField, displayNameText)
                    const hasValue = solrField.name in fileDocument
                    return (
                      <InfoRow key={solrField.name} iconClassName="bi bi-tag" label={fieldLabel}>
                        <EditableValue editable={isFieldEditable(solrField)} label={fieldLabel} onEdit={() => setEditingFieldName(solrField.name)}>
                          {hasValue ? (
                            <FileDocumentFieldValue
                              solrField={solrField}
                              value={fileDocument[solrField.name]}
                              fileSolrFieldNameSet={fileSolrFieldNameSet}
                              fileClasses={masterDataHook.fileClasses ?? []}
                            />
                          ) : (
                            <span className="file-detail-empty">leer</span>
                          )}
                        </EditableValue>
                      </InfoRow>
                    )
                  })}
                </InfoSection>
              )}
            </div>

            {recognizedText !== null && (
              <InfoSection title="Erkannter Text">
                <button
                  type="button"
                  className="file-detail-collapsible"
                  aria-expanded={recognizedTextOpen}
                  onClick={() => setRecognizedTextOpen(!recognizedTextOpen)}>
                  <i className={recognizedTextOpen ? 'bi bi-chevron-down' : 'bi bi-chevron-right'} aria-hidden="true"></i>
                  {recognizedTextToggleText}
                </button>
                {recognizedTextOpen && <div className="file-detail-recognized-text-body">{recognizedText}</div>}
              </InfoSection>
            )}
          </div>

          <div className="file-detail-content">
            {tags.length > 0 && (
              <EditableValue editable={tagsEditable} label="Tags" onEdit={() => setEditingFieldName(fileSolrFieldNameSet.tags)}>
                <span className="file-detail-tags">
                  {tags.map((tag) => (
                    <span key={tag} className="badge file-tag">
                      {formatTag(tag)}
                    </span>
                  ))}
                </span>
              </EditableValue>
            )}
            {tags.length === 0 && tagsEditable && (
              <button type="button" className="file-detail-add" onClick={() => setEditingFieldName(fileSolrFieldNameSet.tags)}>
                <i className="bi bi-hash" aria-hidden="true"></i>
                Tags hinzufügen
              </button>
            )}

            <div className="file-detail-tile">
              {previewBase64Png !== null && hasViewer && (
                <Link to={viewerPath} state={originState} className="file-detail-tile-link" aria-label={fileName + ' groß ansehen'}>
                  <img src={'data:image/png;base64,' + previewBase64Png} width={PREVIEW_SIZE_PIXELS} height={PREVIEW_SIZE_PIXELS} alt={fileName} />
                </Link>
              )}
              {previewBase64Png !== null && !hasViewer && (
                <img src={'data:image/png;base64,' + previewBase64Png} width={PREVIEW_SIZE_PIXELS} height={PREVIEW_SIZE_PIXELS} alt={fileName} />
              )}
              {previewBase64Png === null && (
                <span className="file-detail-tile-symbol">
                  <i className={tileSymbolClassName} aria-hidden="true"></i>
                  {fileExtensionText !== '' && <span className="file-detail-tile-extension">{fileExtensionText}</span>}
                </span>
              )}
            </div>

            <FileCheerBar fileDocumentId={fileDocumentId} originLabel={heading} />

            {description !== null && (
              <EditableValue
                editable={descriptionEditable}
                label="Beschreibung"
                onEdit={() => setEditingFieldName(fileSolrFieldNameSet.fileDescription)}>
                <span className="file-detail-description">{description}</span>
              </EditableValue>
            )}
            {description === null && descriptionEditable && (
              <button
                type="button"
                className="file-detail-add"
                onClick={() => setEditingFieldName(fileSolrFieldNameSet.fileDescription)}>
                <i className="bi bi-plus-circle" aria-hidden="true"></i>
                Beschreibung hinzufügen
              </button>
            )}
          </div>
        </div>
      </ContentBox>
      {editingSolrField !== null && (
        <FileFieldEditPopup
          fileDocumentId={fileDocumentId}
          solrField={editingSolrField}
          storedValue={fileDocument[editingSolrField.name]}
          onSaved={fileDocumentForClientHook.reload}
          onClose={() => setEditingFieldName(null)}
        />
      )}
      {editorsPopupOpen && (
        <FileEditorsPopup
          fileDocumentId={fileDocumentId}
          editorUsersGuids={editorUsersGuids}
          originLabel={heading}
          onSaved={fileDocumentForClientHook.reload}
          onClose={() => setEditorsPopupOpen(false)}
        />
      )}
      {deletePopupOpen && (
        <ConfirmDeletePopup
          title="Datei löschen"
          isDeleting={deleteFileDocumentHook.isLoading}
          errorMessage={deleteErrorMessage}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletePopupOpen(false)}>
          Soll <code>{fileName}</code> wirklich gelöscht werden? Sie ist danach für alle User weg; endgültig löschen kann
          sie nur der Admin.
        </ConfirmDeletePopup>
      )}
    </>
  )
}
