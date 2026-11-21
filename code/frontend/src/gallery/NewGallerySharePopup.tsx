import { type ChangeEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { CopyableLink, type CopyableLinkQrCode } from '../components/CopyableLink.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { GALLERY_SHARE_LABEL_MAX_LENGTH, type GalleryShare, type NewGalleryShare } from './GalleryShare.ts'
import { GalleryShareDurationFields } from './GalleryShareDurationFields.tsx'
import {
  createGalleryShareLimitsOfInput,
  type GalleryShareDurationInput,
  START_GALLERY_SHARE_DURATION_INPUT,
} from './galleryShareDurationInput.ts'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'
import { getGalleryShareLink } from './galleryShareUrls.ts'
import { useGalleryShare } from './useGalleryShare.ts'

/** Die Schritte des Ablaufs, in dieser Reihenfolge. */
type GalleryShareStep = 'LABEL' | 'DURATION' | 'LINK'

const GALLERY_SHARE_STEPS: GalleryShareStep[] = ['LABEL', 'DURATION', 'LINK']

type NewGallerySharePopupProps = {
  galleryId: number
  /** Eine Freigabe ist angelegt: Der Aufrufer lädt seine Liste neu. */
  onCreated: () => void
  onClose: () => void
}

/**
 * „Neue Freigabe“ einer eigenen Galerie als geführter Ablauf (ein eigener Knopf, Schritt für Schritt, Eingaben nur, wenn
 * die Wahl sie braucht):
 * 1. Bezeichnung, z. B. „für Oma“.
 * 2. Laufzeit: dauerhaft, bis zu einem Zeitpunkt oder für eine Zahl von Aufrufen; „Bis wann?“ bzw. „Wie viele
 *    Aufrufe?“ erscheint erst mit der Wahl ({@link GalleryShareDurationFields}). Dann „Freigabe anlegen“.
 * 3. Der Link zum Kopieren und als QR-Code. Er steht danach auch in der Liste der Freigaben
 *    ({@link GalleryShareBox}), jederzeit wieder abrufbar.
 */
export function NewGallerySharePopup({ galleryId, onCreated, onClose }: NewGallerySharePopupProps) {
  const galleryShareHook = useGalleryShare()
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [enteredLabel, setEnteredLabel] = useState<string>('')
  const [durationInput, setDurationInput] = useState<GalleryShareDurationInput>(START_GALLERY_SHARE_DURATION_INPUT)
  /** Was am aktuellen Schritt noch nicht passt; erscheint erst nach „Weiter“ bzw. „Freigabe anlegen“. */
  const [stepErrorMessage, setStepErrorMessage] = useState<string | null>(null)
  const [createdGalleryShare, setCreatedGalleryShare] = useState<GalleryShare | null>(null)
  const step = GALLERY_SHARE_STEPS[stepIndex]
  const isSaving = galleryShareHook.isLoading

  function handleLabelChange(event: ChangeEvent<HTMLInputElement>) {
    setEnteredLabel(event.target.value)
    setStepErrorMessage(null)
  }

  function handleDurationInputChange(changedDurationInput: GalleryShareDurationInput) {
    setDurationInput(changedDurationInput)
    setStepErrorMessage(null)
  }

  function handleBack() {
    setStepErrorMessage(null)
    setStepIndex(stepIndex - 1)
  }

  function handleNext() {
    const trimmedLabel = enteredLabel.trim()
    if (trimmedLabel === '') {
      setStepErrorMessage(getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.labelMissing))
      return
    }
    setStepErrorMessage(null)
    setStepIndex(stepIndex + 1)
  }

  /** Legt die Freigabe an und zeigt danach den Link. Scheitert es, bleibt der Schritt offen und zeigt den Fehler. */
  async function handleCreate() {
    // eine neue Freigabe hat noch keinen Ablauf: Jeder gewählte Zeitpunkt muss in der Zukunft liegen
    const limitsResult = createGalleryShareLimitsOfInput(durationInput, null)
    const limits = limitsResult.limits
    if (limits === null) {
      setStepErrorMessage(limitsResult.errorMessage)
      return
    }
    setStepErrorMessage(null)
    const newGalleryShare: NewGalleryShare = {
      galleryId,
      label: enteredLabel.trim(),
      expiresAt: limits.expiresAt,
      maxAccessCount: limits.maxAccessCount,
    }
    const createdShare = await galleryShareHook.createOwnGalleryShare(newGalleryShare)
    if (createdShare === null) {
      return
    }
    setCreatedGalleryShare(createdShare)
    setStepIndex(stepIndex + 1)
    onCreated()
  }

  let stepTitle = getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.stepLabelTitle)
  if (step === 'DURATION') {
    stepTitle = getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.stepDurationTitle)
  } else if (step === 'LINK') {
    stepTitle = getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.stepLinkTitle)
  }
  const stepProgress = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.stepProgress, {
    step: String(stepIndex + 1),
    stepCount: String(GALLERY_SHARE_STEPS.length),
  })
  let errorMessage: string | null = stepErrorMessage
  if (errorMessage === null && galleryShareHook.error !== null) {
    errorMessage = galleryShareHook.error.detail
  }

  const linkQrCode: CopyableLinkQrCode = {
    label: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.qrCodeLabel),
    title: getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.qrCodeOfShareTitle, { label: enteredLabel.trim() }),
    hint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.qrCodeHint),
  }
  let galleryShareLink = ''
  let linkCreatedText = ''
  if (createdGalleryShare !== null) {
    galleryShareLink = getGalleryShareLink(createdGalleryShare.shareToken)
    linkCreatedText = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.linkCreated, {
      label: createdGalleryShare.label,
      fileCount: String(createdGalleryShare.fileCount),
    })
  }

  return (
    <Modal show onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.newSharePopupTitle)}
          <span className="text-body-secondary fs-6 ms-3">{stepProgress}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h2 className="h5 mb-3">{stepTitle}</h2>
        <ErrorAlert message={errorMessage} />
        {step === 'LABEL' && (
          <Form.Group controlId="galleryShareLabel">
            <Form.Label>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.labelInputLabel)}</Form.Label>
            <Form.Control
              type="text"
              autoFocus
              maxLength={GALLERY_SHARE_LABEL_MAX_LENGTH}
              placeholder={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.labelPlaceholder)}
              value={enteredLabel}
              onChange={handleLabelChange}
            />
            <Form.Text>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.labelHint)}</Form.Text>
          </Form.Group>
        )}
        {step === 'DURATION' && (
          <GalleryShareDurationFields
            durationInput={durationInput}
            onDurationInputChange={handleDurationInputChange}
            disabled={isSaving}
          />
        )}
        {step === 'LINK' && (
          <>
            <p>{linkCreatedText}</p>
            <div className="form-label">{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.linkInputLabel)}</div>
            <CopyableLink
              href={galleryShareLink}
              copyLabel={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.copyLinkLabel)}
              qrCode={linkQrCode}
            />
            <p className="small text-body-secondary mt-3 mb-0">{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.linkStaysAvailable)}</p>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {step === 'LABEL' && (
          <>
            <Button variant="secondary" onClick={onClose}>
              {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.cancelButton)}
            </Button>
            <Button variant="primary" onClick={handleNext}>
              {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.nextButton)}
            </Button>
          </>
        )}
        {step === 'DURATION' && (
          <>
            <Button variant="secondary" onClick={handleBack} disabled={isSaving}>
              {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.backButton)}
            </Button>
            <Button variant="primary" onClick={() => void handleCreate()} disabled={isSaving}>
              {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.createButton)}
            </Button>
          </>
        )}
        {step === 'LINK' && (
          <Button variant="primary" onClick={onClose}>
            {getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.doneButton)}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
