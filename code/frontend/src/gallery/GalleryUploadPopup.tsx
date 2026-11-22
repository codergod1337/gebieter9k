import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { GALLERY_TEXTS } from './galleryTexts.ts'
import { GalleryUploadBox } from './GalleryUploadBox.tsx'

type GalleryUploadPopupProps = {
  galleryId: number
  /** Der Titel der Galerie, für die Überschrift des Popups. */
  galleryTitle: string
  /** Nach jeder eingecheckten Datei: Der Aufrufer lädt die Galerie neu. */
  onUploaded: () => void
  /** Sobald die Auswertung einer Datei fertig ist: Der Aufrufer lädt die Bilder mit der Vorschau neu. */
  onAnalysisCompleted: () => void
  onClose: () => void
}

/**
 * „Neue Bilder“ einer Galerie, für ihren Besitzer und ihre Uploadberechtigten (Nutzer 2026-11-20: Der Upload steht
 * nicht mehr dauernd über den Kacheln, er öffnet sich über den Knopf rechts im Kopf der Galerie): ein Popup mit dem
 * einen Upload-Ablauf der Plattform ({@link GalleryUploadBox}), so wie „neues Angebot“ im Gebietermarkt seinen
 * Upload-Schritt zeigt.
 *
 * Schließen baut den Ablauf ab und bricht damit laufende Uploads ab. Lädt beim Schließen noch etwas hoch, fragt das
 * Popup deshalb erst nach: „Weiter hochladen“ oder „Abbrechen und schließen“. Fertig hochgeladene Bilder betrifft das
 * nicht, ihre Auswertung läuft im Backend weiter.
 */
export function GalleryUploadPopup({ galleryId, galleryTitle, onUploaded, onAnalysisCompleted, onClose }: GalleryUploadPopupProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false)
  /** Der User wollte schließen, während noch etwas hochlädt: Der Fuß zeigt die Nachfrage. */
  const [closeRequestedWhileUploading, setCloseRequestedWhileUploading] = useState<boolean>(false)

  function requestClose() {
    if (isUploading) {
      setCloseRequestedWhileUploading(true)
      return
    }
    onClose()
  }

  const popupTitle = getTextInCurrentLanguageWithValues(GALLERY_TEXTS.uploadPopupTitle, { title: galleryTitle })
  // Ist der letzte Upload inzwischen fertig, gibt es nichts mehr nachzufragen
  const closeQuestionShown = closeRequestedWhileUploading && isUploading

  return (
    <Modal show onHide={requestClose} size="xl" scrollable backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{popupTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <GalleryUploadBox
          galleryId={galleryId}
          onUploaded={onUploaded}
          onAnalysisCompleted={onAnalysisCompleted}
          onUploadingChange={setIsUploading}
        />
      </Modal.Body>
      <Modal.Footer>
        {closeQuestionShown && (
          <>
            <span className="me-auto">{getTextInCurrentLanguage(GALLERY_TEXTS.uploadPopupStillUploading)}</span>
            <Button variant="secondary" onClick={() => setCloseRequestedWhileUploading(false)}>
              {getTextInCurrentLanguage(GALLERY_TEXTS.uploadPopupKeepUploading)}
            </Button>
            <Button variant="danger" onClick={onClose}>
              {getTextInCurrentLanguage(GALLERY_TEXTS.uploadPopupCloseAnyway)}
            </Button>
          </>
        )}
        {!closeQuestionShown && (
          <Button variant="primary" onClick={requestClose}>
            {getTextInCurrentLanguage(GALLERY_TEXTS.uploadPopupDone)}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
