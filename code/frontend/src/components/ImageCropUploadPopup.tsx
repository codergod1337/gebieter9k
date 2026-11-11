import { type ReactNode, useEffect, useRef, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import { fittedPngBase64, imageUrlOf, insideCrop, insideFreeCrop, isImageFile, rotatedImageUrl } from './base64Image.ts'
import { ErrorAlert } from './ErrorAlert.tsx'
import { FileDropzone } from './FileDropzone.tsx'
import { ImageCropper } from './ImageCropper.tsx'
import type { ImageCrop } from './imageCrop.ts'
import { useAvailableSize } from './useAvailableSize.ts'
import { useImageNaturalSize } from './useImageNaturalSize.ts'

type ImageCropUploadPopupProps = {
  title: ReactNode
  /** Breite zu Höhe des Ausschnitts, 1 für ein Quadrat; `null`: frei, das Seitenverhältnis des Bildes bleibt. */
  aspectRatio: number | null
  /** Die Maße des fertigen PNG in Pixeln; der Ausschnitt wird eingepasst, der Rest bleibt transparent. */
  targetWidth: number
  targetHeight: number
  /** Die kürzere Kante des Ausschnitts in Bildpixeln; kleiner geht die Auswahl nicht. */
  minCropPixels: number
  /** Bekommt das fertige PNG als Base64 ohne Präfix und speichert es; liefert, ob es geklappt hat. */
  onConfirm: (base64Png: string) => Promise<boolean>
  /** Fehlt: kein Knopf zum Entfernen; sonst entfernt er das gespeicherte Bild. Liefert, ob es geklappt hat. */
  onRemove?: () => Promise<boolean>
  /** Fehler des Speicherns aus dem Aufrufer, `null` wenn keiner. */
  saveErrorMessage: string | null
  onClose: () => void
}

/** Höhe der Werkzeugzeile über der Bühne, damit die Bühne in den gemessenen Körper passt. */
const TOOLBAR_HEIGHT_PIXELS = 48

/**
 * DER Zuschnitt für jedes Bild im Browser, eine Komponente für alle Aufrufer: Jeder stellt beim Aufruf ein, was er
 * braucht, und baut keinen eigenen Zuschnitt.
 * - `aspectRatio`: festes Verhältnis (1 = Quadrat, z. B. Profilbild) oder `null` für frei.
 * - `targetWidth` × `targetHeight`: die Maße des fertigen PNG.
 * - `minCropPixels`: die kürzeste erlaubte Kante des Ausschnitts.
 * - `title`, `onConfirm`, optional `onRemove`.
 * <p>
 * Ein Bild wählen, drehen, zuschneiden und als Base64-PNG abgeben, aus der Vorlage übernommen, ohne Fachlogik: JPG oder PNG über die FileDropzone, in voller Größe, nie vorab verkleinert. Der Ausschnitt im
 * verlangten oder freien Verhältnis (ImageCropper) mit Mindestkante, ein Knopf dreht um 90°. Übernehmen passt den
 * Ausschnitt in ein PNG der Zielmaße ein, nach der Regel der Dateivorschau: Seitenverhältnis bleibt, mittig, Rest
 * transparent, nie vergrößert (base64Image.ts). Das PNG geht an onConfirm; das Backend prüft nur noch. Browser richten ein JPEG nach
 * seiner EXIF-Ausrichtung schon beim Laden aus, der Drehknopf ist für den Rest.
 */
export function ImageCropUploadPopup({
  title,
  aspectRatio,
  targetWidth,
  targetHeight,
  minCropPixels,
  onConfirm,
  onRemove,
  saveErrorMessage,
  onClose,
}: ImageCropUploadPopupProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<ImageCrop | null>(null)
  const [busy, setBusy] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const naturalSize = useImageNaturalSize(imageUrl)
  const { ref: stageRef, size: stageSize } = useAvailableSize()
  // die aktuelle Blob-Adresse, um sie beim Wechsel und beim Schließen freizugeben
  const imageUrlRef = useRef<string | null>(null)

  /** Eine neue Arbeitskopie zeigen; die alte Adresse wird frei. */
  function showImage(nextImageUrl: string | null) {
    if (imageUrlRef.current !== null) {
      URL.revokeObjectURL(imageUrlRef.current)
    }
    imageUrlRef.current = nextImageUrl
    setImageUrl(nextImageUrl)
    setCrop(null)
  }

  useEffect(() => {
    return () => {
      if (imageUrlRef.current !== null) {
        URL.revokeObjectURL(imageUrlRef.current)
        imageUrlRef.current = null
      }
    }
  }, [])

  function showError(error: unknown) {
    let message = 'Das Bild ließ sich nicht verarbeiten.'
    if (error instanceof Error && error.message !== '') {
      message = error.message
    }
    setErrorMessage(message)
  }

  async function handleSelectedFilesChange(changedFiles: File[]) {
    const chosenFile = changedFiles[0]
    if (chosenFile === undefined) {
      return
    }
    if (!isImageFile(chosenFile)) {
      setErrorMessage(chosenFile.name + ' ist kein JPG oder PNG.')
      return
    }
    setErrorMessage(null)
    setBusy(true)
    try {
      const chosenImageUrl = await imageUrlOf(chosenFile)
      showImage(chosenImageUrl)
    } catch (error) {
      showError(error)
    } finally {
      setBusy(false)
    }
  }

  async function handleRotate() {
    if (imageUrl === null) {
      return
    }
    setBusy(true)
    try {
      const rotatedUrl = await rotatedImageUrl(imageUrl)
      showImage(rotatedUrl)
    } catch (error) {
      showError(error)
    } finally {
      setBusy(false)
    }
  }

  /** Jeder Kandidat des Zuschnitts landet ganz im Bild und nicht unter der Mindestkante. */
  function handleCropChange(candidateCrop: ImageCrop) {
    if (naturalSize === null) {
      setCrop(candidateCrop)
      return
    }
    if (aspectRatio === null) {
      const insideImageFreeCrop = insideFreeCrop(candidateCrop, naturalSize.width, naturalSize.height, minCropPixels)
      setCrop(insideImageFreeCrop)
      return
    }
    const insideImageCrop = insideCrop(candidateCrop, naturalSize.width, naturalSize.height, aspectRatio, minCropPixels)
    setCrop(insideImageCrop)
  }

  async function handleConfirm() {
    if (imageUrl === null || crop === null) {
      return
    }
    setBusy(true)
    setErrorMessage(null)
    try {
      const base64Png = await fittedPngBase64(imageUrl, crop, targetWidth, targetHeight)
      const saved = await onConfirm(base64Png)
      if (saved) {
        showImage(null)
        onClose()
      }
    } catch (error) {
      showError(error)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (onRemove === undefined) {
      return
    }
    setBusy(true)
    setErrorMessage(null)
    try {
      const removed = await onRemove()
      if (removed) {
        showImage(null)
        onClose()
      }
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    showImage(null)
    onClose()
  }

  let shownErrorMessage = errorMessage
  if (shownErrorMessage === null) {
    shownErrorMessage = saveErrorMessage
  }
  let stageMaxWidth = 0
  let stageMaxHeight = 0
  if (stageSize !== null) {
    stageMaxWidth = stageSize.width
    stageMaxHeight = Math.max(0, stageSize.height - TOOLBAR_HEIGHT_PIXELS)
  }
  const targetSizeText = targetWidth + ' × ' + targetHeight + ' Pixel'
  let cropHint =
    'Übernehmen nimmt das ganze Bild. Für einen Ausschnitt ein Rechteck aufziehen, verschieben oder an den Ecken ziehen ' +
    '(mindestens ' +
    minCropPixels +
    ' Pixel). Das Ergebnis wird in ' +
    targetSizeText +
    ' eingepasst, das Seitenverhältnis bleibt, der Rest ist transparent.'
  if (aspectRatio !== null) {
    cropHint =
      'Den Ausschnitt aufziehen, verschieben oder an den Ecken ziehen, das Verhältnis steht fest (mindestens ' +
      minCropPixels +
      ' Pixel). Das Ergebnis hat ' +
      targetSizeText +
      '.'
  }
  const confirmDisabled = imageUrl === null || crop === null || busy

  return (
    <Modal show onHide={handleClose} centered size="lg" fullscreen="sm-down">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorAlert message={shownErrorMessage} />
        <div className="image-upload-body">
          {imageUrl === null && (
            <>
              <FileDropzone selectedFiles={[]} onSelectedFilesChange={handleSelectedFilesChange} multiple={false} disabled={busy} />
              {busy && <span className="text-body-secondary small">Das Bild wird vorbereitet …</span>}
            </>
          )}
          {imageUrl !== null && (
            <>
              <div className="image-upload-toolbar">
                <Button variant="outline-secondary" size="sm" disabled={busy} onClick={handleRotate}>
                  <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
                  Drehen
                </Button>
                <Button variant="outline-secondary" size="sm" disabled={busy} onClick={() => showImage(null)}>
                  Anderes Bild
                </Button>
              </div>
              <div ref={stageRef} className="image-upload-stage">
                {stageSize !== null && (
                  <ImageCropper
                    src={imageUrl}
                    naturalSize={naturalSize}
                    aspectRatio={aspectRatio}
                    value={crop}
                    onChange={handleCropChange}
                    maxWidth={stageMaxWidth}
                    maxHeight={stageMaxHeight}
                    hint={cropHint}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        {onRemove !== undefined && imageUrl === null && (
          <Button variant="outline-danger" className="me-auto" disabled={busy} onClick={handleRemove}>
            Bild entfernen
          </Button>
        )}
        <Button variant="secondary" disabled={busy} onClick={handleClose}>
          Abbrechen
        </Button>
        <Button variant="primary" disabled={confirmDisabled} onClick={handleConfirm}>
          {busy && <Spinner animation="border" size="sm" className="me-2" />}
          Übernehmen
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
