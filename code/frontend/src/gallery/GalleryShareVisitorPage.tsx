import { useCallback, useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import { useNavigate, useParams } from 'react-router'
import { useLoadedData } from '../api/useLoadedData.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { formatDateTime } from '../components/formatDateTime.ts'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { PageNavigation } from '../components/PageNavigation.tsx'
import { RichTextView } from '../components/RichTextView.tsx'
import { SortableArea } from '../components/SortableArea.tsx'
import { type FileDocument, getFileDocumentText } from '../file/FileDocument.ts'
import { getFileDocumentHeading } from '../file/getFileDocumentHeading.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { formatUrlPage, parseUrlPage, useUrlParam, useUrlParamsChanger } from '../navigation/useUrlParam.ts'
import { GalleryImageTile } from './GalleryImageTile.tsx'
import { GalleryImageViewerPopup, type GalleryViewerImage } from './GalleryImageViewerPopup.tsx'
import { GALLERY_SHARE_SELECTION_MAX_FILE_COUNT } from './GalleryShare.ts'
import { GalleryShareCheerCounts } from './GalleryShareCheerCounts.tsx'
import { FileCommentBubble } from '../file/comment/FileCommentBubble.tsx'
import { FileCommentSection } from '../file/comment/FileCommentSection.tsx'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'
import {
  getSharedAllFilesDownloadUrl,
  getSharedFileDownloadUrl,
  getSharedFileViewUrl,
  getSharedSelectionDownloadUrl,
} from './galleryShareUrls.ts'
import { useGalleryShare } from './useGalleryShare.ts'

/** Die Parameter der Adresse: die Seite der Bilder (ab 1) und das groß geöffnete Bild, wie in der Galerie. */
const PAGE_URL_PARAM = 'page'
const IMAGE_URL_PARAM = 'image'

/** Die Kacheln stehen in einem Sortierbereich, weil die Bildkachel ihn braucht; verschoben wird hier nie. */
function ignoreReorder() {
  // Besucher sortieren nicht
}

/**
 * Die Besucherseite einer Galerie-Freigabe unter `/share/galerie/<token>` (Konzept `docu/konzept-galerie-freigabe.md`),
 * OHNE Anmeldung: Wer den Link hat, sieht Titel, Beschreibung und die Bilder der Galerie als Kacheln, öffnet ein Bild
 * groß und lädt herunter: ein Bild, eine Auswahl (beliebig viele Kacheln ankreuzen, auch über mehrere Seiten) oder
 * alle. Auswahl und „alle“ kommen als eine ZIP-Datei, die der Browser direkt auf die Platte schreibt.
 *
 * Dieselbe Bildkachel und derselbe Viewer wie in der Galerie, nur mit den Adressen unter dem Token. Die Stimmen sind
 * für alle zu sehen; abstimmen kann nur ein angemeldeter User, ein Klick zeigt den Hinweis „melde dich kostenlos an“.
 * Seite und geöffnetes Bild stehen in der Adresse, wie in jedem Modul.
 */
export function GalleryShareVisitorPage() {
  const { shareToken } = useParams()
  const navigate = useNavigate()
  const { session } = useCurrentSession()
  const galleryShareHook = useGalleryShare()
  const resolveSharedGallery = galleryShareHook.resolveSharedGallery
  const commentHook = useGalleryShare()
  const getSharedFileCommentThread = commentHook.getSharedFileCommentThread
  const pageUrlParam = useUrlParam(PAGE_URL_PARAM)
  const imageUrlParam = useUrlParam(IMAGE_URL_PARAM)
  const changeUrlParams = useUrlParamsChanger()
  const page = parseUrlPage(pageUrlParam.value)
  const openImageId = imageUrlParam.value
  /** Ob das Bild hier per Klick geöffnet wurde: Dann schließt Zurück im Verlauf, sonst wird der Parameter entfernt. */
  const imageOpenedHereRef = useRef<boolean>(false)
  /** Die angekreuzten Bilder, über alle Seiten hinweg, in der Reihenfolge des Ankreuzens. */
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [signUpHintOpen, setSignUpHintOpen] = useState<boolean>(false)
  const visitorShareToken = shareToken ?? ''

  const loadSharedGallery = useCallback(
    () => resolveSharedGallery(visitorShareToken, page),
    [resolveSharedGallery, visitorShareToken, page],
  )
  const loadedSharedGallery = useLoadedData(loadSharedGallery)
  const sharedGallery = loadedSharedGallery.data

  /**
   * So lädt der Kommentar-Bereich des großen Bildes seinen Verlauf: über die Adresse unter dem Token, nur zum Lesen.
   * Steht VOR dem vorzeitigen `return` der Ladeanzeige: Ein Hook dahinter läuft erst, wenn die Galerie da ist, und
   * React bricht dann die ganze Seite ab (weiße Seite, Fehler 310 am 2026-11-21).
   */
  const loadSharedFileCommentThread = useCallback(
    (fileDocumentId: string) => getSharedFileCommentThread(visitorShareToken, fileDocumentId),
    [getSharedFileCommentThread, visitorShareToken],
  )

  if (sharedGallery === null) {
    if (galleryShareHook.error !== null) {
      return (
        <div className="main-content">
          <ErrorAlert message={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorInvalid)} />
        </div>
      )
    }
    return (
      <div className="main-content">
        <Spinner animation="border" />
      </div>
    )
  }

  const nameSet = sharedGallery.fileSolrFieldNameSet
  const filePage = sharedGallery.filePage
  const shownFiles = filePage.documents
  let pageCount = 1
  if (filePage.pageSize > 0) {
    pageCount = Math.max(1, Math.ceil(filePage.totalCount / filePage.pageSize))
  }

  function getFileDocumentId(fileDocument: FileDocument): string {
    return getFileDocumentText(fileDocument, nameSet.id)
  }

  function toViewerImage(fileDocument: FileDocument): GalleryViewerImage {
    const fileDocumentId = getFileDocumentText(fileDocument, nameSet.id)
    const fileName = getFileDocumentText(fileDocument, nameSet.fileName)
    const heading = getFileDocumentHeading(fileDocument, nameSet)
    return { fileDocumentId, fileName, heading }
  }

  /** Blättern: neuer Eintrag im Verlauf, ein offenes Bild schließt. Die Auswahl bleibt. */
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

  function toggleSelected(fileDocumentId: string) {
    setSelectedFileIds((knownSelectedFileIds) => {
      const alreadySelected = knownSelectedFileIds.includes(fileDocumentId)
      if (alreadySelected) {
        return knownSelectedFileIds.filter((knownSelectedFileId) => knownSelectedFileId !== fileDocumentId)
      }
      return [...knownSelectedFileIds, fileDocumentId]
    })
  }

  /** Kreuzt alle Bilder der gezeigten Seite an, zusätzlich zu dem, was schon gewählt ist. */
  function selectShownFiles() {
    const shownFileIds = shownFiles.map(getFileDocumentId)
    setSelectedFileIds((knownSelectedFileIds) => {
      const addedFileIds = shownFileIds.filter((shownFileId) => !knownSelectedFileIds.includes(shownFileId))
      return [...knownSelectedFileIds, ...addedFileIds]
    })
  }

  /** Abstimmen wollen: Ohne Anmeldung kommt der Hinweis, angemeldet geschieht hier nichts. */
  function requestCheer() {
    if (session === null) {
      setSignUpHintOpen(true)
    }
  }

  // das geöffnete Bild und seine Nachbarn auf dieser Seite
  let openImageIndex = -1
  if (openImageId !== null) {
    openImageIndex = shownFiles.findIndex((fileDocument) => getFileDocumentId(fileDocument) === openImageId)
  }
  let openViewerImage: GalleryViewerImage | null = null
  let previousViewerImage: GalleryViewerImage | null = null
  let nextViewerImage: GalleryViewerImage | null = null
  let openFileDocument: FileDocument | null = null
  if (openImageIndex >= 0) {
    openFileDocument = shownFiles[openImageIndex]
    openViewerImage = toViewerImage(openFileDocument)
    if (openImageIndex > 0) {
      previousViewerImage = toViewerImage(shownFiles[openImageIndex - 1])
    }
    if (openImageIndex < shownFiles.length - 1) {
      nextViewerImage = toViewerImage(shownFiles[openImageIndex + 1])
    }
  }

  // der Fuß: Zahl der Bilder und wie lange der Link noch gilt
  let fileCountText = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.visitorFileCountMany, {
    fileCount: String(filePage.totalCount),
  })
  if (filePage.totalCount === 1) {
    fileCountText = getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorFileCountOne)
  }
  const footerParts: string[] = [fileCountText]
  if (sharedGallery.expiresAt !== null) {
    const dateTime = formatDateTime(sharedGallery.expiresAt)
    footerParts.push(getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.visitorValidUntil, { dateTime }))
  }
  if (sharedGallery.remainingAccessCount !== null) {
    const remainingAccessCount = String(sharedGallery.remainingAccessCount)
    footerParts.push(getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.visitorRemainingAccesses, { remainingAccessCount }))
  }
  const footerText = footerParts.join(' · ')

  const selectedCount = selectedFileIds.length
  const selectionTooLarge = selectedCount > GALLERY_SHARE_SELECTION_MAX_FILE_COUNT
  const joinedSelectedFileIds = selectedFileIds.join(',')
  const selectionDownloadUrl = getSharedSelectionDownloadUrl(visitorShareToken)
  const allFilesDownloadUrl = getSharedAllFilesDownloadUrl(visitorShareToken)
  const downloadSelectionText = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.visitorDownloadSelection, {
    selectedCount: String(selectedCount),
  })
  let selectionTooLargeMessage: string | null = null
  if (selectionTooLarge) {
    selectionTooLargeMessage = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.visitorSelectionTooLarge, {
      maxFileCount: String(GALLERY_SHARE_SELECTION_MAX_FILE_COUNT),
    })
  }

  let downloadAllButton = null
  if (filePage.totalCount > 0) {
    downloadAllButton = (
      <Hoverlay text={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorDownloadAllHint)} placement="bottom">
        <Button as="a" href={allFilesDownloadUrl} size="sm" variant="outline-secondary">
          <i className="bi bi-download me-1" aria-hidden="true"></i>
          {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorDownloadAll)}
        </Button>
      </Hoverlay>
    )
  }

  let viewerViewUrl = ''
  let viewerDownloadUrl = ''
  let viewerCheers = null
  let viewerComments = null
  if (openViewerImage !== null && openFileDocument !== null) {
    // Kommentare nur zum Lesen; wer nicht angemeldet ist, bekommt darunter den Knopf zur Anmeldung
    let commentSignUpHint = null
    if (session === null) {
      commentSignUpHint = (
        <Button size="sm" variant="outline-secondary" onClick={() => setSignUpHintOpen(true)}>
          {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorCommentSignUp)}
        </Button>
      )
    }
    viewerComments = (
      <FileCommentSection
        fileDocumentId={openViewerImage.fileDocumentId}
        originLabel={sharedGallery.title}
        loadReadOnlyThread={loadSharedFileCommentThread}
        readOnlyHint={commentSignUpHint}
      />
    )
    viewerViewUrl = getSharedFileViewUrl(visitorShareToken, openViewerImage.fileDocumentId)
    viewerDownloadUrl = getSharedFileDownloadUrl(visitorShareToken, openViewerImage.fileDocumentId)
    viewerCheers = (
      <GalleryShareCheerCounts
        cheerUpCount={openFileDocument[nameSet.cheerUpCount]}
        cheerDownCount={openFileDocument[nameSet.cheerDownCount]}
        onCheerRequested={requestCheer}
      />
    )
  }

  return (
    <div className="main-content">
      <ContentBox title={sharedGallery.title} actions={downloadAllButton} footer={<span className="small">{footerText}</span>}>
        {sharedGallery.description !== null && (
          <RichTextView richText={sharedGallery.description} className="gallery-description" />
        )}
        {shownFiles.length === 0 && (
          <p className="text-body-secondary mb-0">{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorNoFiles)}</p>
        )}
        {shownFiles.length > 0 && (
          <>
            <div className="gallery-share-toolbar">
              <Button size="sm" variant="outline-secondary" onClick={selectShownFiles}>
                {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorSelectPage)}
              </Button>
              <Button size="sm" variant="outline-secondary" disabled={selectedCount === 0} onClick={() => setSelectedFileIds([])}>
                {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorUnselectAll)}
              </Button>
              {/* Ein Formular, kein Request aus dem Skript: Nur so schreibt der Browser das ZIP direkt auf die Platte. */}
              <form method="post" action={selectionDownloadUrl}>
                <input type="hidden" name="fileIds" value={joinedSelectedFileIds} />
                <Button type="submit" size="sm" variant="primary" disabled={selectedCount === 0 || selectionTooLarge}>
                  <i className="bi bi-download me-1" aria-hidden="true"></i>
                  {downloadSelectionText}
                </Button>
              </form>
            </div>
            <ErrorAlert message={selectionTooLargeMessage} />
            <SortableArea items={shownFiles} itemKey={getFileDocumentId} onReorder={ignoreReorder} layout="grid">
              <div className="gallery-images">
                {shownFiles.map((fileDocument) => {
                  const fileDocumentId = getFileDocumentId(fileDocument)
                  const fileName = getFileDocumentText(fileDocument, nameSet.fileName)
                  const heading = getFileDocumentHeading(fileDocument, nameSet)
                  const previewBase64Png = fileDocument[nameSet.previewBase64Png]
                  const selected = selectedFileIds.includes(fileDocumentId)
                  const selectLabel = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.visitorSelectLabel, { heading })
                  const downloadLabel = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.visitorDownloadLabel, { heading })
                  const downloadUrl = getSharedFileDownloadUrl(visitorShareToken, fileDocumentId)
                  // Die Zahl der Kommentare kommt mit der Seite; ein Bild ohne Kommentar fehlt dort
                  let commentCount = 0
                  const knownCommentCount = sharedGallery.commentCountsByFileDocumentId[fileDocumentId]
                  if (knownCommentCount !== undefined) {
                    commentCount = knownCommentCount
                  }
                  return (
                    <GalleryImageTile
                      key={fileDocumentId}
                      fileDocumentId={fileDocumentId}
                      fileName={fileName}
                      heading={heading}
                      previewBase64Png={previewBase64Png}
                      sortable={false}
                      sortingDisabled
                      changeable={false}
                      onOpen={openImage}
                      headStart={
                        <Form.Check
                          type="checkbox"
                          className="gallery-share-select"
                          id={'galleryShareSelect' + fileDocumentId}
                          checked={selected}
                          onChange={() => toggleSelected(fileDocumentId)}
                          aria-label={selectLabel}
                        />
                      }
                      cheers={
                        <>
                          <GalleryShareCheerCounts
                            cheerUpCount={fileDocument[nameSet.cheerUpCount]}
                            cheerDownCount={fileDocument[nameSet.cheerDownCount]}
                            onCheerRequested={requestCheer}
                          />
                          <FileCommentBubble
                            fileDocumentId={fileDocumentId}
                            commentCount={commentCount}
                            onOpen={() => openImage(fileDocumentId)}
                          />
                        </>
                      }
                      actions={
                        <Button as="a" href={downloadUrl} size="sm" variant="outline-secondary" aria-label={downloadLabel}>
                          <i className="bi bi-download"></i>
                        </Button>
                      }
                    />
                  )
                })}
              </div>
            </SortableArea>
          </>
        )}
        {pageCount > 1 && (
          <div className="gallery-pager">
            <PageNavigation
              page={page}
              pageCount={pageCount}
              disabled={galleryShareHook.isLoading}
              onPageChange={changePage}
              ariaLabel={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.visitorPagerLabel)}
            />
          </div>
        )}
      </ContentBox>
      {openViewerImage !== null && (
        <GalleryImageViewerPopup
          image={openViewerImage}
          previousImage={previousViewerImage}
          nextImage={nextViewerImage}
          originLabel={sharedGallery.title}
          onShow={showImage}
          onClose={closeImage}
          viewUrl={viewerViewUrl}
          downloadUrl={viewerDownloadUrl}
          cheers={viewerCheers}
          comments={viewerComments}
        />
      )}
      {signUpHintOpen && (
        <Modal show onHide={() => setSignUpHintOpen(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.signUpTitle)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.signUpText)}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSignUpHintOpen(false)}>
              {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.signUpClose)}
            </Button>
            <Button as="a" href="/" variant="primary">
              {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.signUpButton)}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}
