import { type ReactNode, useLayoutEffect } from 'react'
import Button from 'react-bootstrap/Button'
import { InfoHint } from '../components/InfoHint.tsx'
import { ZoomableImage } from '../components/ZoomableImage.tsx'
import { ZOOMABLE_IMAGE_TEXTS } from '../components/zoomableImageTexts.ts'
import { FileCheerBar } from '../file/cheer/FileCheerBar.tsx'
import { FileCommentSection } from '../file/comment/FileCommentSection.tsx'
import { getFileDocumentDownloadUrl, getFileDocumentViewUrl } from '../file/fileDocumentUrls.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { GALLERY_TEXTS } from './galleryTexts.ts'

/** Ein Bild, so wie der Betrachter es braucht. */
export type GalleryViewerImage = {
  fileDocumentId: string
  fileName: string
  /** Die Überschrift: die Tags, ohne Tags der Dateiname. */
  heading: string
}

type GalleryImageViewerProps = {
  image: GalleryViewerImage
  /** Das vorige und das nächste Bild der Seite, `null` am Rand. */
  previousImage: GalleryViewerImage | null
  nextImage: GalleryViewerImage | null
  /** Der Name der Galerie: für „Zurück zu …“, wenn man aus den Stimmen ein Profil öffnet. */
  originLabel: string
  onShow: (fileDocumentId: string) => void
  onClose: () => void
  /**
   * Optional: woher das Bild und sein Download kommen, wenn nicht vom File-Endpunkt des angemeldeten Users, z. B. auf der
   * Besucherseite einer Freigabe die Adressen unter ihrem Token.
   */
  viewUrl?: string
  downloadUrl?: string
  /** Optional statt der Stimmen des angemeldeten Users ({@link FileCheerBar}), z. B. die Zahlen ohne Abstimmen. */
  cheers?: ReactNode
  /**
   * Optional statt der Kommentare des angemeldeten Users ({@link FileCommentSection}), z. B. auf der Besucherseite
   * einer Freigabe der Verlauf nur zum Lesen.
   */
  comments?: ReactNode
  /** Meldet die Zahl der Kommentare des Bildes, sobald sie da ist und nach jedem Schreiben oder Löschen. */
  onCommentCountChange?: (fileDocumentId: string, commentCount: number) => void
}

/**
 * Ein Bild der Galerie groß, KEIN Popup (Nutzer 2026-11-26): Es steht anstelle der Kacheln direkt unter dem Subheader
 * und hat die ganze Breite der Seite (`.main-content:has(> .gallery-viewer)` in base.css). Oben eine Leiste, die beim
 * Rollen stehen bleibt: zurück zu den Bildern, Voriges und Nächstes innerhalb der Seite, die Überschrift, die Stimmen
 * ({@link FileCheerBar}) und Herunterladen. Darunter das Bild ({@link ZoomableImage}: eingepasst, Klick für die
 * Originalgröße, Mausrad zoomt, rechte Maustaste verschiebt), darunter seine Kommentare ({@link FileCommentSection}).
 *
 * Das Bild ist das Original vom SFTP über den File-Endpunkt, wie jede Datei, kein eigener Bild-Endpunkt.
 */
export function GalleryImageViewer({
  image,
  previousImage,
  nextImage,
  originLabel,
  onShow,
  onClose,
  viewUrl,
  downloadUrl,
  cheers,
  comments,
  onCommentCountChange,
}: GalleryImageViewerProps) {
  const shownFileDocumentId = image.fileDocumentId

  // Jedes Bild beginnt oben: Beim Öffnen steht die Seite noch dort, wo seine Kachel war
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [shownFileDocumentId])

  let shownViewUrl = getFileDocumentViewUrl(shownFileDocumentId)
  if (viewUrl !== undefined) {
    shownViewUrl = viewUrl
  }
  let shownDownloadUrl = getFileDocumentDownloadUrl(shownFileDocumentId)
  if (downloadUrl !== undefined) {
    shownDownloadUrl = downloadUrl
  }
  let shownCheers = cheers
  if (shownCheers === undefined) {
    shownCheers = <FileCheerBar fileDocumentId={shownFileDocumentId} originLabel={originLabel} />
  }
  let shownComments = comments
  if (shownComments === undefined) {
    shownComments = (
      <FileCommentSection
        fileDocumentId={shownFileDocumentId}
        originLabel={originLabel}
        onCommentCountChange={onCommentCountChange}
      />
    )
  }

  function showPreviousImage() {
    if (previousImage !== null) {
      onShow(previousImage.fileDocumentId)
    }
  }

  function showNextImage() {
    if (nextImage !== null) {
      onShow(nextImage.fileDocumentId)
    }
  }

  return (
    <div className="gallery-viewer">
      <div className="gallery-viewer-toolbar">
        <Button size="sm" variant="outline-secondary" onClick={onClose}>
          <i className="bi bi-grid-3x3-gap me-1" aria-hidden="true"></i>
          {getTextInCurrentLanguage(GALLERY_TEXTS.viewerBackToImages)}
        </Button>
        <Button size="sm" variant="outline-secondary" disabled={previousImage === null} onClick={showPreviousImage}>
          <i className="bi bi-chevron-left" aria-hidden="true"></i> {getTextInCurrentLanguage(GALLERY_TEXTS.viewerPrevious)}
        </Button>
        <Button size="sm" variant="outline-secondary" disabled={nextImage === null} onClick={showNextImage}>
          {getTextInCurrentLanguage(GALLERY_TEXTS.viewerNext)} <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </Button>
        <span className="gallery-viewer-heading">{image.heading}</span>
        <InfoHint
          text={getTextInCurrentLanguage(ZOOMABLE_IMAGE_TEXTS.usageHint)}
          label={getTextInCurrentLanguage(ZOOMABLE_IMAGE_TEXTS.usageHintLabel)}
          placement="bottom"
        />
        {shownCheers}
        <Button as="a" href={shownDownloadUrl} size="sm" variant="outline-secondary">
          <i className="bi bi-download me-1" aria-hidden="true"></i>
          {getTextInCurrentLanguage(GALLERY_TEXTS.viewerDownload)}
        </Button>
      </div>
      {/* Der key: Ein anderes Bild beginnt wieder eingepasst */}
      <ZoomableImage key={shownFileDocumentId} src={shownViewUrl} alt={image.fileName} />
      <div className="gallery-viewer-comments">{shownComments}</div>
    </div>
  )
}
