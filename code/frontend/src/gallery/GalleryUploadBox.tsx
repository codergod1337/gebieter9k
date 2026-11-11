import { useCallback, useMemo } from 'react'
import type { UploadProgressListener } from '../api/ApiRequest.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { useLoadedData } from '../api/useLoadedData.ts'
import { getUploadableFileClassKeys } from '../file/FileClassAccessRole.ts'
import { FileUploadForm } from '../file/upload/FileUploadForm.tsx'
import { useFileClassDestinationAssignment } from '../file/useFileClassDestinationAssignment.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'
import { useGallery } from './useGallery.ts'

type GalleryUploadBoxProps = {
  galleryId: number
  /** Nach jeder eingecheckten Datei: Der Aufrufer lädt die Galerie neu. */
  onUploaded: () => void
  /** Sobald die Auswertung einer Datei fertig ist: Der Aufrufer lädt die Bilder mit der Vorschau neu. */
  onAnalysisCompleted: () => void
}

/** Je Galerie eigene gemerkte fertige Uploads, getrennt vom File-Manager. */
const RECENT_FILE_UPLOADS_STATE_KEY_PREFIX = 'RECENT_FILE_UPLOADS_GALLERY_'

/**
 * Hochladen in eine eigene Galerie: derselbe Ablauf wie überall ({@link FileUploadForm}), eine Liste je Bild von der
 * Prüfung bis „ausgewertet“. Anders sind nur die FileClasses (die der Admin am Ziel „Galerie“ anbietet und in die der
 * User schreiben darf), die Felder je Bild (Beschreibung und Tags mit Vervollständigung, kein Titel, kein Dateiname) und
 * der Endpunkt (`/api/gallery/upload`, das Backend hängt das Bild an die Galerie).
 */
export function GalleryUploadBox({ galleryId, onUploaded, onAnalysisCompleted }: GalleryUploadBoxProps) {
  const { fileClasses, fileClassAccessRoles, fileSolrFieldNameSet } = useMasterData()
  const { hasAccessRole } = useCurrentSession()
  const destinationHook = useFileClassDestinationAssignment()
  const galleryHook = useGallery()
  const uploadFileIntoGallery = galleryHook.uploadFileIntoGallery
  const loadedAssignments = useLoadedData(destinationHook.getAllFileClassDestinationAssignment)

  const uploadFileIntoThisGallery = useCallback(
    (
      file: File,
      clientFieldValues: Record<string, unknown>,
      onUploadProgress: UploadProgressListener,
      abortSignal: AbortSignal,
    ) => uploadFileIntoGallery(file, galleryId, clientFieldValues, onUploadProgress, abortSignal),
    [uploadFileIntoGallery, galleryId],
  )

  // Die FileClasses zur Wahl: am Ziel GALLERY und mit Schreibrecht
  const galleryFileClassKeys = new Set<string>()
  for (const assignment of loadedAssignments.data ?? []) {
    if (assignment.destination === 'GALLERY') {
      galleryFileClassKeys.add(assignment.fileClassKey)
    }
  }
  const uploadableFileClassKeys = getUploadableFileClassKeys(fileClassAccessRoles ?? [], hasAccessRole)
  const offeredFileClasses = (fileClasses ?? []).filter(
    (fileClass) => galleryFileClassKeys.has(fileClass.key) && uploadableFileClassKeys.has(fileClass.key),
  )
  const recentFileUploadsStateKey = RECENT_FILE_UPLOADS_STATE_KEY_PREFIX + galleryId
  // Je Bild nur Beschreibung und Tags (Nutzer 2026-11-09): Die Tags ersetzen den Titel, wie bei Instagram
  const uploadFieldNames = useMemo(() => {
    if (fileSolrFieldNameSet === null) {
      return []
    }
    return [fileSolrFieldNameSet.fileDescription, fileSolrFieldNameSet.tags]
  }, [fileSolrFieldNameSet])

  return (
    <FileUploadForm
      title="Bilder hochladen"
      offeredFileClasses={offeredFileClasses}
      noFileClassText="Für Galerien ist noch keine FileClass freigegeben, in die du hochladen darfst. Das legt der Admin im Tab „FileClass-Ziel“ fest."
      uploadFieldNames={uploadFieldNames}
      uploadFile={uploadFileIntoThisGallery}
      recentFileUploadsStateKey={recentFileUploadsStateKey}
      fileDocumentOriginLabel="Galerie"
      onUploaded={onUploaded}
      onAnalysisCompleted={onAnalysisCompleted}
    />
  )
}
