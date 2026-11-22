import { useCallback, useMemo, useRef, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useNavigate, useParams } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { NewEntityButton } from '../components/NewEntityButton.tsx'
import { PageNavigation } from '../components/PageNavigation.tsx'
import { SortableArea } from '../components/SortableArea.tsx'
import { RichTextView } from '../components/RichTextView.tsx'
import { UsersUploadFrameLegend } from '../components/UsersUploadFrameLegend.tsx'
import { type FileDocument, type FileDocumentPage, getFileDocumentText } from '../file/FileDocument.ts'
import type { FileSolrFieldNameSet } from '../file/FileSolrFieldNameSet.ts'
import { getFileDocumentHeading } from '../file/getFileDocumentHeading.ts'
import { FILE_DOCUMENT_VIEW_CACHE_SCOPE } from '../file/fileDocumentViewCacheScope.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'
import { useCachedLoadedData } from '../navigation/useCachedLoadedData.ts'
import { formatUrlPage, parseUrlPage, useUrlParam, useUrlParamsChanger } from '../navigation/useUrlParam.ts'
import { useOrigin } from '../navigation/useOrigin.ts'
import { isFileDocumentChangeableByCurrentUsers } from '../file/isFileDocumentChangeableByCurrentUsers.ts'
import { useFileManagerOrAdmin } from '../file/useFileManagerOrAdmin.ts'
import { getUsersUploadFrameColor } from '../users/getUsersUploadFrameColor.ts'
import { useUsersAvatarsForClient } from '../users/useUsersAvatarForClient.ts'
import { VISIBILITY_LABELS } from '../users/visibilityLabels.ts'
import type { GalleryForClient } from './Gallery.ts'
import { GalleryImageTile } from './GalleryImageTile.tsx'
import { GalleryImageViewerPopup, type GalleryViewerImage } from './GalleryImageViewerPopup.tsx'
import { GalleryTagFilter } from './GalleryTagFilter.tsx'
import { formatUrlTags, parseUrlTags } from './galleryTagUrlParam.ts'
import { GALLERY_TEXTS } from './galleryTexts.ts'
import type { GalleryUploader } from './GalleryUploader.ts'
import { GALLERY_UPLOADER_TEXTS } from './galleryUploaderTexts.ts'
import { GalleryUploadPopup } from './GalleryUploadPopup.tsx'
import { useGallery } from './useGallery.ts'
import { useGalleryUploader } from './useGalleryUploader.ts'

/** Die Parameter der Adresse: die Seite der Bilder (ab 1), das groß geöffnete Bild und die gewählten Hashtags. */
const PAGE_URL_PARAM = 'page'
const IMAGE_URL_PARAM = 'image'
const TAGS_URL_PARAM = 'tags'

/** Der Zwischenspeicher der Ansichten hält die Hashtags einer Galerie unter dieser Art von Anfrage. */
const GALLERY_TAGS_VIEW_CACHE_KIND = 'GALLERY_TAGS'

/** Wer ein Bild hochgeladen hat (GUID), oder `null`, wenn der Betrachter das Feld nicht lesen darf. */
function getAuthorUsersGuid(fileDocument: FileDocument, fileSolrFieldNameSet: FileSolrFieldNameSet): string | null {
  const authorUsersGuid = fileDocument[fileSolrFieldNameSet.authorUsersGuid]
  if (typeof authorUsersGuid !== 'string' || authorUsersGuid === '') {
    return null
  }
  return authorUsersGuid
}

/**
 * Wer an einer Galerie beteiligt ist, jeder einmal, in dieser Reihenfolge: ihr Besitzer, ihre Uploadberechtigten, dann
 * wer sonst ein Bild der gezeigten Seite hochgeladen hat (z. B. ein inzwischen ausgetragener Uploader). Für die Legende
 * und die Rahmen einer gemeinsamen Galerie. Leer, solange die Galerie noch lädt.
 */
function collectInvolvedUsersGuids(
  gallery: GalleryForClient | null,
  galleryUploaders: GalleryUploader[],
  galleryFilePage: FileDocumentPage | null,
  fileSolrFieldNameSet: FileSolrFieldNameSet | null,
): string[] {
  if (gallery === null) {
    return []
  }
  const involvedUsersGuids: string[] = [gallery.ownerUsersGuid]
  for (const galleryUploader of galleryUploaders) {
    if (!involvedUsersGuids.includes(galleryUploader.uploaderUsersGuid)) {
      involvedUsersGuids.push(galleryUploader.uploaderUsersGuid)
    }
  }
  if (galleryFilePage === null || fileSolrFieldNameSet === null) {
    return involvedUsersGuids
  }
  for (const fileDocument of galleryFilePage.documents) {
    const authorUsersGuid = getAuthorUsersGuid(fileDocument, fileSolrFieldNameSet)
    if (authorUsersGuid !== null && !involvedUsersGuids.includes(authorUsersGuid)) {
      involvedUsersGuids.push(authorUsersGuid)
    }
  }
  return involvedUsersGuids
}

/**
 * Eine Galerie unter `/profile/<guid>/galleries/<id>` (Konzept `docu/konzept-galerie.md`), der Reiter „Bilder“: Titel,
 * Beschreibung und Sichtbarkeit, darunter die Bilder als Kacheln in ihrer Reihenfolge, seitenweise. Ein Klick öffnet
 * ein Bild groß. Seit 2026-11-20 (Nutzer):
 * - Über den Kacheln stehen die Hashtags der Galerie als Schalter ({@link GalleryTagFilter}): Ein gewählter Hashtag
 *   zeigt nur seine Bilder, mehrere die Bilder mit mindestens einem davon, keiner alle.
 * - In der eigenen Galerie öffnet der Knopf „neue Bilder“ rechts im Kopf das Hochladen als Popup
 *   ({@link GalleryUploadPopup}, der globale Upload-Ablauf); es steht nicht mehr dauernd über den Kacheln.
 * - Die Freigabe über einen Link ist ein eigener Reiter im Subheader des Profils (`GallerySharePage`).
 * In der eigenen Galerie lassen sich die Bilder per Drag and Drop sortieren, solange kein Hashtag gewählt ist (die
 * Plätze gelten für die ganze Galerie, nicht für eine gefilterte Auswahl).
 *
 * Gemeinsame Galerie (Nutzer 2026-11-22, `docu/entities/GalleryUploader.md`): Hat die Galerie Uploadberechtigte, oder
 * zeigt die Seite ein Bild, das nicht der Besitzer hochgeladen hat, trägt jede Bildkachel den Rahmen in der Farbe
 * ihres Uploaders, und über den Kacheln steht die Legende, welche Farbe wem gehört (`UsersUploadFrameLegend`). Den
 * Knopf „neue Bilder“ haben der Besitzer und jeder Uploadberechtigte; den Stift an jedem Bild hat der Besitzer, ein
 * Uploadberechtigter an seinen eigenen.
 *
 * Nach dem Muster aller Module stehen Seite, gewählte Hashtags und geöffnetes Bild in der Adresse
 * (`?tags=strand,safari&page=2&image=…`): Filtern, Blättern und Öffnen sind Einträge im Verlauf, Zurück schließt das
 * Bild wieder; Vor und Zurück im Bild ersetzen den Eintrag. Die Seiten kommen aus dem Zwischenspeicher der Ansichten.
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
  const tagsHook = useGallery()
  const sortHook = useGallery()
  const galleryUploaderHook = useGalleryUploader()
  const getGalleryForClient = galleryHook.getGalleryForClient
  const resolveGalleryFiles = filesHook.resolveGalleryFiles
  const resolveGalleryTags = tagsHook.resolveGalleryTags
  const resolveGalleryUploaders = galleryUploaderHook.resolveGalleryUploaders
  const galleryIdNumber = Number(galleryId)
  const pageUrlParam = useUrlParam(PAGE_URL_PARAM)
  const imageUrlParam = useUrlParam(IMAGE_URL_PARAM)
  const tagsUrlParam = useUrlParam(TAGS_URL_PARAM)
  const changeUrlParams = useUrlParamsChanger()
  const page = parseUrlPage(pageUrlParam.value)
  const openImageId = imageUrlParam.value
  /** Die gewählten Hashtags, wie sie in der Adresse stehen; als Text, damit sich die Lese-Funktion nur mit ihnen ändert. */
  const selectedTagsUrlText = tagsUrlParam.value
  const selectedTags = useMemo(() => parseUrlTags(selectedTagsUrlText), [selectedTagsUrlText])
  /** Ob das Hochladen offen ist (Popup hinter dem Knopf „neue Bilder“). */
  const [uploadOpen, setUploadOpen] = useState<boolean>(false)
  /**
   * Die Zahl der Kommentare je Bild, sobald das große Bild sie gemeldet hat: So zeigt die Sprechblase der Kachel nach
   * dem Kommentieren gleich die neue Zahl. Für alle anderen Bilder lädt die Sprechblase selbst.
   */
  const [commentCountsByFileDocumentId, setCommentCountsByFileDocumentId] = useState<Record<string, number>>({})
  /** Ob das Bild hier per Klick geöffnet wurde: Dann schließt Zurück im Verlauf, sonst wird der Parameter entfernt. */
  const imageOpenedHereRef = useRef<boolean>(false)
  /** Die Reihenfolge nach dem Ziehen, bis das Backend sie bestätigt; `null`: die geladene. */
  const [reorderedFiles, setReorderedFiles] = useState<FileDocument[] | null>(null)

  const loadGallery = useCallback(() => getGalleryForClient(galleryIdNumber), [getGalleryForClient, galleryIdNumber])
  const loadedGallery = useLoadedData(loadGallery)
  const loadGalleryFiles = useCallback(
    () => resolveGalleryFiles(galleryIdNumber, page, selectedTags),
    [resolveGalleryFiles, galleryIdNumber, page, selectedTags],
  )
  const viewCacheRequest = { galleryId: galleryIdNumber, page, tags: selectedTags }
  const loadedGalleryFiles = useCachedLoadedData(FILE_DOCUMENT_VIEW_CACHE_SCOPE, viewCacheRequest, loadGalleryFiles)
  // Die Hashtags der ganzen Galerie, unabhängig von Seite und Wahl: Die Schalter bleiben beim Filtern alle stehen
  const loadGalleryTags = useCallback(() => resolveGalleryTags(galleryIdNumber), [resolveGalleryTags, galleryIdNumber])
  const tagsViewCacheRequest = { galleryId: galleryIdNumber, kind: GALLERY_TAGS_VIEW_CACHE_KIND }
  const loadedGalleryTags = useCachedLoadedData(FILE_DOCUMENT_VIEW_CACHE_SCOPE, tagsViewCacheRequest, loadGalleryTags)
  const reloadGallery = loadedGallery.reload
  const reloadGalleryFiles = loadedGalleryFiles.reload
  const reloadGalleryTags = loadedGalleryTags.reload

  // Die Uploadberechtigten der Galerie: wer außer dem Besitzer hochladen darf, und wessen Farben die Legende zeigt
  const loadGalleryUploaders = useCallback(
    () => resolveGalleryUploaders(galleryIdNumber),
    [resolveGalleryUploaders, galleryIdNumber],
  )
  const loadedGalleryUploaders = useLoadedData(loadGalleryUploaders)

  const gallery = loadedGallery.data
  const galleryFilePage = loadedGalleryFiles.data
  const galleryTagCounts = loadedGalleryTags.data ?? []
  const galleryUploaders = loadedGalleryUploaders.data ?? []
  // Wer beteiligt ist und wie er dargestellt wird (Rahmenfarbe): vor dem ersten return, dahinter darf kein Hook stehen
  const involvedUsersGuids = collectInvolvedUsersGuids(gallery, galleryUploaders, galleryFilePage, fileSolrFieldNameSet)
  const involvedUsersAvatarsByGuid = useUsersAvatarsForClient(involvedUsersGuids)

  /**
   * Nach jedem eingecheckten Bild und noch einmal, wenn seine Auswertung fertig ist: Galerie (Zahl, Titelbild), Bilder
   * und Hashtags neu, dann erscheinen auch die Vorschau und die Hashtags des neuen Bildes.
   */
  const reloadGalleryAndFiles = useCallback(() => {
    void reloadGallery()
    void reloadGalleryFiles()
    void reloadGalleryTags()
  }, [reloadGallery, reloadGalleryFiles, reloadGalleryTags])

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
  // Hochladen dürfen der Besitzer und die Uploadberechtigten
  const galleryUploader = galleryUploaders.some((uploader) => uploader.uploaderUsersGuid === currentUsersGuid)
  const uploadAllowed = ownGallery || galleryUploader
  // Gemeinsame Galerie: Sobald außer dem Besitzer noch jemand beteiligt ist, zeigen Rahmen und Legende, wer hochlud
  const sharedGallery = involvedUsersGuids.length > 1

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

  /** Die Rahmenfarbe einer Bildkachel: in einer gemeinsamen Galerie die ihres Uploaders, sonst keine. */
  function getFrameColor(fileDocument: FileDocument): string | undefined {
    if (!sharedGallery) {
      return undefined
    }
    const authorUsersGuid = getAuthorUsersGuid(fileDocument, nameSet)
    if (authorUsersGuid === null) {
      return undefined
    }
    const authorUsersAvatar = involvedUsersAvatarsByGuid.get(authorUsersGuid) ?? null
    return getUsersUploadFrameColor(authorUsersGuid, authorUsersAvatar)
  }

  function toViewerImage(fileDocument: FileDocument): GalleryViewerImage {
    const fileDocumentId = getFileDocumentText(fileDocument, idFieldName)
    const fileName = getFileDocumentText(fileDocument, fileNameFieldName)
    const heading = getFileDocumentHeading(fileDocument, nameSet)
    return { fileDocumentId, fileName, heading }
  }

  /** Die Wahl der Hashtags ändern: neuer Eintrag im Verlauf, zurück auf die erste Seite, ein offenes Bild schließt. */
  function changeSelectedTags(changedTags: string[]) {
    const urlTagsText = formatUrlTags(changedTags)
    changeUrlParams({ [TAGS_URL_PARAM]: urlTagsText, [PAGE_URL_PARAM]: null, [IMAGE_URL_PARAM]: null }, 'PUSH')
  }

  /** Ein Klick auf einen Hashtag: an, wenn er aus war, sonst aus. */
  function toggleTag(tag: string) {
    const tagSelected = selectedTags.includes(tag)
    if (tagSelected) {
      const remainingTags = selectedTags.filter((selectedTag) => selectedTag !== tag)
      changeSelectedTags(remainingTags)
      return
    }
    const extendedTags = [...selectedTags, tag]
    changeSelectedTags(extendedTags)
  }

  function resetSelectedTags() {
    changeSelectedTags([])
  }

  /** Blättern: neuer Eintrag im Verlauf, ein offenes Bild schließt. */
  function changePage(changedPage: number) {
    const urlPageText = formatUrlPage(changedPage)
    changeUrlParams({ [PAGE_URL_PARAM]: urlPageText, [IMAGE_URL_PARAM]: null }, 'PUSH')
  }

  /** Das große Bild meldet die Zahl seiner Kommentare: Die Sprechblase seiner Kachel zeigt sie ab jetzt. */
  function rememberCommentCount(fileDocumentId: string, commentCount: number) {
    setCommentCountsByFileDocumentId((knownCommentCounts) => {
      if (knownCommentCounts[fileDocumentId] === commentCount) {
        return knownCommentCounts
      }
      return { ...knownCommentCounts, [fileDocumentId]: commentCount }
    })
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
  const tagFilterActive = selectedTags.length > 0
  // Sortiert wird nur die ganze Galerie: Die Plätze einer gefilterten Auswahl sagen nichts über die Bilder dazwischen
  const sortable = ownGallery && !tagFilterActive
  let newImagesButton = null
  if (uploadAllowed) {
    newImagesButton = (
      <NewEntityButton label={getTextInCurrentLanguage(GALLERY_TEXTS.newImagesButton)} onClick={() => setUploadOpen(true)} />
    )
  }
  let noImagesText = 'Noch keine Bilder in dieser Galerie.'
  if (tagFilterActive) {
    noImagesText = getTextInCurrentLanguage(GALLERY_TEXTS.noImagesWithSelectedTags)
  }

  return (
    <>
      <ContentBox title={gallery.title} actions={newImagesButton} footer={<span className="small">{footerText}</span>}>
        {gallery.description !== null && <RichTextView richText={gallery.description} className="gallery-description" />}
        <GalleryTagFilter
          galleryTagCounts={galleryTagCounts}
          selectedTags={selectedTags}
          onToggle={toggleTag}
          onReset={resetSelectedTags}
          disabled={filesHook.isLoading}
        />
        {sharedGallery && (
          <UsersUploadFrameLegend
            usersGuids={involvedUsersGuids}
            label={getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.legendLabel)}
            originLabel={gallery.title}
          />
        )}
        {ownGallery && tagFilterActive && shownFiles.length > 1 && (
          <p className="small text-body-secondary">{getTextInCurrentLanguage(GALLERY_TEXTS.sortingPausedWhileFiltered)}</p>
        )}
        <ErrorAlert message={sortErrorMessage} />
        {galleryFilePage === null && <Spinner animation="border" />}
        {galleryFilePage !== null && shownFiles.length === 0 && <p className="text-body-secondary mb-0">{noImagesText}</p>}
        {shownFiles.length > 0 && (
          <SortableArea items={shownFiles} itemKey={getFileDocumentId} onReorder={(changed) => void reorderFiles(changed)} layout="grid">
            <div className="gallery-images">
              {shownFiles.map((fileDocument) => {
                const fileDocumentId = getFileDocumentId(fileDocument)
                const fileName = getFileDocumentText(fileDocument, fileNameFieldName)
                const heading = getFileDocumentHeading(fileDocument, nameSet)
                const previewBase64Png = fileDocument[previewFieldName]
                // Der Besitzer bearbeitet jedes Bild seiner Galerie, auch das eines anderen Uploaders
                const changeableAsAuthorOrEditor = isFileDocumentChangeableByCurrentUsers(
                  fileDocument,
                  fileSolrFieldNameSet,
                  currentUsersGuid,
                  fileManagerOrAdmin,
                  hasAccessRole,
                )
                const changeable = ownGallery || changeableAsAuthorOrEditor
                const frameColor = getFrameColor(fileDocument)
                return (
                  <GalleryImageTile
                    key={fileDocumentId}
                    fileDocumentId={fileDocumentId}
                    fileName={fileName}
                    heading={heading}
                    previewBase64Png={previewBase64Png}
                    sortable={sortable}
                    sortingDisabled={sortHook.isLoading}
                    changeable={changeable}
                    frameColor={frameColor}
                    originState={imageOriginState}
                    onOpen={openImage}
                    commentCount={commentCountsByFileDocumentId[fileDocumentId]}
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
      {uploadAllowed && uploadOpen && (
        <GalleryUploadPopup
          galleryId={gallery.id}
          galleryTitle={gallery.title}
          onUploaded={reloadGalleryAndFiles}
          onAnalysisCompleted={reloadGalleryAndFiles}
          onClose={() => setUploadOpen(false)}
        />
      )}
      {openViewerImage !== null && (
        <GalleryImageViewerPopup
          image={openViewerImage}
          previousImage={previousViewerImage}
          nextImage={nextViewerImage}
          originLabel={gallery.title}
          onShow={showImage}
          onClose={closeImage}
          onCommentCountChange={rememberCommentCount}
        />
      )}
    </>
  )
}
