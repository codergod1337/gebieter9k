import type { ReactNode } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import { FileCheerBar } from '../file/cheer/FileCheerBar.tsx'
import { FileCommentSection } from '../file/comment/FileCommentSection.tsx'
import { getFileDocumentDownloadUrl, getFileDocumentViewUrl } from '../file/fileDocumentUrls.ts'

/** Ein Bild, so wie der Betrachter es braucht. */
export type GalleryViewerImage = {
  fileDocumentId: string
  fileName: string
  /** Die Überschrift: die Tags, ohne Tags der Dateiname. */
  heading: string
}

type GalleryImageViewerPopupProps = {
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
 * Ein Bild der Galerie groß, als Popup über der Galerie: das Original vom SFTP über den File-Endpunkt (wie jede Datei,
 * kein eigener Bild-Endpunkt), daneben seine Kommentare ({@link FileCommentSection}, Nutzer 2026-11-20; auf einem
 * schmalen Bildschirm darunter), dazu die Stimmen ({@link FileCheerBar}), Herunterladen und Vor und Zurück innerhalb
 * der Seite.
 */
export function GalleryImageViewerPopup({
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
}: GalleryImageViewerPopupProps) {
  let shownViewUrl = getFileDocumentViewUrl(image.fileDocumentId)
  if (viewUrl !== undefined) {
    shownViewUrl = viewUrl
  }
  let shownDownloadUrl = getFileDocumentDownloadUrl(image.fileDocumentId)
  if (downloadUrl !== undefined) {
    shownDownloadUrl = downloadUrl
  }
  let shownCheers = cheers
  if (shownCheers === undefined) {
    shownCheers = <FileCheerBar fileDocumentId={image.fileDocumentId} originLabel={originLabel} />
  }
  let shownComments = comments
  if (shownComments === undefined) {
    shownComments = (
      <FileCommentSection
        fileDocumentId={image.fileDocumentId}
        originLabel={originLabel}
        onCommentCountChange={onCommentCountChange}
      />
    )
  }
  return (
    <Modal show onHide={onClose} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title className="text-break">{image.heading}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="gallery-viewer-body">
        <div className="gallery-viewer-picture">
          <img className="gallery-viewer-image" src={shownViewUrl} alt={image.fileName} />
        </div>
        <div className="gallery-viewer-comments">{shownComments}</div>
      </Modal.Body>
      <Modal.Footer className="gallery-viewer-footer">
        <Button
          variant="outline-secondary"
          disabled={previousImage === null}
          onClick={() => previousImage !== null && onShow(previousImage.fileDocumentId)}>
          <i className="bi bi-chevron-left" aria-hidden="true"></i> Voriges
        </Button>
        {shownCheers}
        <Button as="a" href={shownDownloadUrl} variant="outline-secondary">
          <i className="bi bi-download me-1" aria-hidden="true"></i>
          Herunterladen
        </Button>
        <Button
          variant="outline-secondary"
          disabled={nextImage === null}
          onClick={() => nextImage !== null && onShow(nextImage.fileDocumentId)}>
          Nächstes <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
