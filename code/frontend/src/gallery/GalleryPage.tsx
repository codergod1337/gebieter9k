import { useCallback, useRef, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useNavigate, useParams } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { PageNavigation } from '../components/PageNavigation.tsx'
import { SortableArea } from '../components/SortableArea.tsx'
import { RichTextView } from '../components/RichTextView.tsx'
import { type FileDocument, getFileDocumentText } from '../file/FileDocument.ts'
import { getFileDocumentHeading } from '../file/getFileDocumentHeading.ts'
import { FILE_DOCUMENT_VIEW_CACHE_SCOPE } from '../file/fileDocumentViewCacheScope.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'
import { useCachedLoadedData } from '../navigation/useCachedLoadedData.ts'
import { formatUrlPage, parseUrlPage, useUrlParam, useUrlParamsChanger } from '../navigation/useUrlParam.ts'
import { useOrigin } from '../navigation/useOrigin.ts'
import { isFileDocumentChangeableByCurrentUsers } from '../file/isFileDocumentChangeableByCurrentUsers.ts'
import { useFileManagerOrAdmin } from '../file/useFileManagerOrAdmin.ts'
import { VISIBILITY_LABELS } from '../users/visibilityLabels.ts'
import { GalleryImageTile } from './GalleryImageTile.tsx'
import { GalleryImageViewerPopup, type GalleryViewerImage } from './GalleryImageViewerPopup.tsx'
import { GalleryUploadBox } from './GalleryUploadBox.tsx'
import { useGallery } from './useGallery.ts'

/** Die Parameter der Adresse: die Seite der Bilder (ab 1) und das groß geöffnete Bild. */
const PAGE_URL_PARAM = 'page'
const IMAGE_URL_PARAM = 'image'

/**
 * Eine Galerie unter `/profile/<guid>/galleries/<id>` (Konzept `docu/konzept-galerie.md`): Titel, Beschreibung und
 * Sichtbarkeit, darunter die Bilder als Kacheln in ihrer Reihenfolge, seitenweise. Ein Klick öffnet ein Bild groß.
 * In der eigenen Galerie oben das Hochladen (der globale Upload-Ablauf) und das Sortieren per Drag and Drop.
 *
 * Nach dem Muster aller Module stehen Seite und geöffnetes Bild in der Adresse (`?page=2&image=…`): Öffnen ist ein
 * Eintrag im Verlauf, Zurück schließt das Bild wieder; Vor und Zurück im Bild ersetzen den Eintrag. Die Seiten kommen
 * aus dem Zwischenspeicher der Ansichten.
 */
export function GalleryPage() {
  const { galleryId } = useParams()
  const navigate = useNavigate()
  const { session, hasAccessRole } = useCurrentSession()
  const originNavigation = useOrigin()
  const fileManagerOrAdmin = useFileManagerOrAdmin()
  const { fileSolrFieldNameSet } = useMasterData()
  const galleryHook = useGallery()
  const filesHook = useGallery()
  const sortHook = useGallery()
  const getGalleryForClient = galleryHook.getGalleryForClient
  const resolveGalleryFiles = filesHook.resolveGalleryFiles
  const galleryIdNumber = Number(galleryId)
  const pageUrlParam = useUrlParam(PAGE_URL_PARAM)
  const imageUrlParam = useUrlParam(IMAGE_URL_PARAM)
  const changeUrlParams = useUrlParamsChanger()
  const page = parseUrlPage(pageUrlParam.value)
  const openImageId = imageUrlParam.value
  /** Ob das Bild hier per Klick geöffnet wurde: Dann schließt Zurück im Verlauf, sonst wird der Parameter entfernt. */
  const imageOpenedHereRef = useRef<boolean>(false)
  /** Die Reihenfolge nach dem Ziehen, bis das Backend sie bestätigt; `null`: die geladene. */
  const [reorderedFiles, setReorderedFiles] = useState<FileDocument[] | null>(null)

  const loadGallery = useCallback(() => getGalleryForClient(galleryIdNumber), [getGalleryForClient, galleryIdNumber])
  const loadedGallery = useLoadedData(loadGallery)
  const loadGalleryFiles = useCallback(() => resolveGalleryFiles(galleryIdNumber, page), [resolveGalleryFiles, galleryIdNumber, page])
  const viewCacheRequest = { galleryId: galleryIdNumber, page }
  const loadedGalleryFiles = useCachedLoadedData(FILE_DOCUMENT_VIEW_CACHE_SCOPE, viewCacheRequest, loadGalleryFiles)
  const reloadGallery = loadedGallery.reload
  const reloadGalleryFiles = loadedGalleryFiles.reload

  const gallery = loadedGallery.data
  const galleryFilePage = loadedGalleryFiles.data

  /**
   * Nach jedem eingecheckten Bild und noch einmal, wenn seine Auswertung fertig ist: Galerie (Zahl, Titelbild) und Bilder
   * neu, dann erscheint auch die Vorschau.
   */
  const reloadGalleryAndFiles = useCallback(() => {
    void reloadGallery()
    void reloadGalleryFiles()
  }, [reloadGallery, reloadGalleryFiles])

  if (galleryHook.error !== null && gallery === null) {
    return <ErrorAlert message="Diese Galerie gibt es nicht, oder du darfst sie nicht sehen." />
  }
  if (gallery === null || fileSolrFieldNameSet === null) {
    return <Spinner animation="border" />
  }
  const ownGallery = session !== null && session.users.guid === gallery.ownerUsersGuid
  // Details und Bearbeiten öffnen sich mit der Galerie als Origin („Zurück zu <Titel>“)
  const imageOriginState = originNavigation.createOriginStateHere(gallery.title)
  let currentUsersGuid = ''
  if (session !== null) {
    currentUsersGuid = session.users.guid
  }
  const idFieldName = fileSolrFieldNameSet.id
  const fileNameFieldName = fileSolrFieldNameSet.fileName
  const previewFieldName = fileSolrFieldNameSet.previewBase64Png
  const nameSet = fileSolrFieldNameSet

  let shownFiles: FileDocument[] = []
  if (reorderedFiles !== null) {
    shownFiles = reorderedFiles
  } else if (galleryFilePage !== null) {
    shownFiles = galleryFilePage.documents
  }
  let pageCount = 1
  if (galleryFilePage !== null && galleryFilePage.pageSize > 0) {
    pageCount = Math.max(1, Math.ceil(galleryFilePage.totalCount / galleryFilePage.pageSize))
  }

  function getFileDocumentId(fileDocument: FileDocument): string {
    return getFileDocumentText(fileDocument, idFieldName)
  }

  function toViewerImage(fileDocument: FileDocument): GalleryViewerImage {
    const fileDocumentId = getFileDocumentText(fileDocument, idFieldName)
    const fileName = getFileDocumentText(fileDocument, fileNameFieldName)
    const heading = getFileDocumentHeading(fileDocument, nameSet)
    return { fileDocumentId, fileName, heading }
  }

  /** Blättern: neuer Eintrag im Verlauf, ein offenes Bild schließt. */
  function changePage(changedPage: number) {
    const urlPageText = formatUrlPage(changedPage)
    changeUrlParams({ [PAGE_URL_PARAM]: urlPageText, [IMAGE_URL_PARAM]: null }, 'PUSH')
  }

  function openImage(fileDocumentId: string) {
    imageOpenedHereRef.current = true
    imageUrlParam.changeValue(fileDocumentId, 'PUSH')
  }

  function showImage(fileDocumentId: string) {
    imageUrlParam.changeValue(fileDocumentId, 'REPLACE')
  }

  function closeImage() {
    if (imageOpenedHereRef.current) {
      imageOpenedHereRef.current = false
      navigate(-1)
      return
    }
    imageUrlParam.changeValue(null, 'REPLACE')
  }

  /** Nach dem Ziehen: gleich so zeigen, speichern, dann neu laden. */
  async function reorderFiles(changedFiles: FileDocument[]) {
    setReorderedFiles(changedFiles)
    const fileDocumentIdsInOrder = changedFiles.map(getFileDocumentId)
    await sortHook.changeOwnGalleryFileListingPositions(galleryIdNumber, page, fileDocumentIdsInOrder)
    await reloadGalleryFiles()
    setReorderedFiles(null)
  }

  // das geöffnete Bild und seine Nachbarn auf dieser Seite
  let openImageIndex = -1
  if (openImageId !== null) {
    openImageIndex = shownFiles.findIndex((fileDocument) => getFileDocumentId(fileDocument) === openImageId)
  }
  let openViewerImage: GalleryViewerImage | null = null
  let previousViewerImage: GalleryViewerImage | null = null
  let nextViewerImage: GalleryViewerImage | null = null
  if (openImageIndex >= 0) {
    openViewerImage = toViewerImage(shownFiles[openImageIndex])
    if (openImageIndex > 0) {
      previousViewerImage = toViewerImage(shownFiles[openImageIndex - 1])
    }
    if (openImageIndex < shownFiles.length - 1) {
      nextViewerImage = toViewerImage(shownFiles[openImageIndex + 1])
    }
  }

  let fileCountText = gallery.fileCount + ' Bilder'
  if (gallery.fileCount === 1) {
    fileCountText = '1 Bild'
  }
  const footerText = fileCountText + ' · sichtbar für: ' + VISIBILITY_LABELS[gallery.visibility]
  let sortErrorMessage: string | null = null
  if (sortHook.error !== null) {
    sortErrorMessage = sortHook.error.detail
  }

  return (
    <>
      {ownGallery && (
        <GalleryUploadBox
          galleryId={gallery.id}
          onUploaded={reloadGalleryAndFiles}
          onAnalysisCompleted={reloadGalleryAndFiles}
        />
      )}
      <ContentBox title={gallery.title} footer={<span className="small">{footerText}</span>}>
        {gallery.description !== null && <RichTextView richText={gallery.description} className="gallery-description" />}
        <ErrorAlert message={sortErrorMessage} />
        {galleryFilePage === null && <Spinner animation="border" />}
        {galleryFilePage !== null && shownFiles.length === 0 && (
          <p className="text-body-secondary mb-0">Noch keine Bilder in dieser Galerie.</p>
        )}
        {shownFiles.length > 0 && (
          <SortableArea items={shownFiles} itemKey={getFileDocumentId} onReorder={(changed) => void reorderFiles(changed)} layout="grid">
            <div className="gallery-images">
              {shownFiles.map((fileDocument) => {
                const fileDocumentId = getFileDocumentId(fileDocument)
                const fileName = getFileDocumentText(fileDocument, fileNameFieldName)
                const heading = getFileDocumentHeading(fileDocument, nameSet)
                const previewBase64Png = fileDocument[previewFieldName]
                const changeable = isFileDocumentChangeableByCurrentUsers(
                  fileDocument,
                  fileSolrFieldNameSet,
                  currentUsersGuid,
                  fileManagerOrAdmin,
                  hasAccessRole,
                )
                return (
                  <GalleryImageTile
                    key={fileDocumentId}
                    fileDocumentId={fileDocumentId}
                    fileName={fileName}
                    heading={heading}
                    previewBase64Png={previewBase64Png}
                    sortable={ownGallery}
                    sortingDisabled={sortHook.isLoading}
                    changeable={changeable}
                    originState={imageOriginState}
                    onOpen={openImage}
                  />
                )
              })}
            </div>
          </SortableArea>
        )}
        {pageCount > 1 && (
          <div className="gallery-pager">
            <PageNavigation
              page={page}
              pageCount={pageCount}
              disabled={filesHook.isLoading}
              onPageChange={changePage}
              ariaLabel="Seiten der Galerie"
            />
          </div>
        )}
      </ContentBox>
      {openViewerImage !== null && (
        <GalleryImageViewerPopup
          image={openViewerImage}
          previousImage={previousViewerImage}
          nextImage={nextViewerImage}
          originLabel={gallery.title}
          onShow={showImage}
          onClose={closeImage}
        />
      )}
    </>
  )
}
