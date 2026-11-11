import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import { FileCheerBar } from '../file/cheer/FileCheerBar.tsx'
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
}

/**
 * Ein Bild der Galerie groß, als Popup über der Galerie: das Original vom SFTP über den File-Endpunkt (wie jede Datei,
 * kein eigener Bild-Endpunkt), dazu die Stimmen ({@link FileCheerBar}), Herunterladen und Vor und Zurück innerhalb der
 * Seite.
 */
export function GalleryImageViewerPopup({
  image,
  previousImage,
  nextImage,
  originLabel,
  onShow,
  onClose,
}: GalleryImageViewerPopupProps) {
  const viewUrl = getFileDocumentViewUrl(image.fileDocumentId)
  const downloadUrl = getFileDocumentDownloadUrl(image.fileDocumentId)
  return (
    <Modal show onHide={onClose} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title className="text-break">{image.heading}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="gallery-viewer-body">
        <img className="gallery-viewer-image" src={viewUrl} alt={image.fileName} />
      </Modal.Body>
      <Modal.Footer className="gallery-viewer-footer">
        <Button
          variant="outline-secondary"
          disabled={previousImage === null}
          onClick={() => previousImage !== null && onShow(previousImage.fileDocumentId)}>
          <i className="bi bi-chevron-left" aria-hidden="true"></i> Voriges
        </Button>
        <FileCheerBar fileDocumentId={image.fileDocumentId} originLabel={originLabel} />
        <Button as="a" href={downloadUrl} variant="outline-secondary">
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
