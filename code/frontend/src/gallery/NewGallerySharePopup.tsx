import { type ChangeEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { CopyButton } from '../components/CopyButton.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { GALLERY_SHARE_LABEL_MAX_LENGTH, type GalleryShare, type NewGalleryShare } from './GalleryShare.ts'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'
import { getGalleryShareLink } from './galleryShareUrls.ts'
import { useGalleryShare } from './useGalleryShare.ts'

/** Die Schritte des Ablaufs, in dieser Reihenfolge. */
type GalleryShareStep = 'LABEL' | 'DURATION' | 'LINK'

const GALLERY_SHARE_STEPS: GalleryShareStep[] = ['LABEL', 'DURATION', 'LINK']

/** Wie lange der Link gilt: dauerhaft, bis zu einem Zeitpunkt oder für eine Zahl von Aufrufen. */
type DurationChoice = 'PERMANENT' | 'UNTIL' | 'ACCESS_LIMITED'

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
 *    Aufrufe?“ erscheint erst mit der Wahl. Dann „Freigabe anlegen“.
 * 3. Der Link zum Kopieren. Er steht danach auch in der Liste der Freigaben ({@link GalleryShareBox}), jederzeit wieder
 *    abrufbar.
 */
export function NewGallerySharePopup({ galleryId, onCreated, onClose }: NewGallerySharePopupProps) {
  const galleryShareHook = useGalleryShare()
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [enteredLabel, setEnteredLabel] = useState<string>('')
  const [durationChoice, setDurationChoice] = useState<DurationChoice>('PERMANENT')
  const [expiresAtLocalText, setExpiresAtLocalText] = useState<string>('')
  const [maxAccessCountText, setMaxAccessCountText] = useState<string>('')
  /** Was am aktuellen Schritt noch nicht passt; erscheint erst nach „Weiter“ bzw. „Freigabe anlegen“. */
  const [stepErrorMessage, setStepErrorMessage] = useState<string | null>(null)
  const [createdGalleryShare, setCreatedGalleryShare] = useState<GalleryShare | null>(null)
  const step = GALLERY_SHARE_STEPS[stepIndex]
  const isSaving = galleryShareHook.isLoading

  function handleLabelChange(event: ChangeEvent<HTMLInputElement>) {
    setEnteredLabel(event.target.value)
    setStepErrorMessage(null)
  }

  function handleExpiresAtChange(event: ChangeEvent<HTMLInputElement>) {
    setExpiresAtLocalText(event.target.value)
    setStepErrorMessage(null)
  }

  function handleMaxAccessCountChange(event: ChangeEvent<HTMLInputElement>) {
    setMaxAccessCountText(event.target.value)
    setStepErrorMessage(null)
  }

  function chooseDuration(chosenDuration: DurationChoice) {
    setDurationChoice(chosenDuration)
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
    let expiresAt: string | null = null
    let maxAccessCount: number | null = null
    if (durationChoice === 'UNTIL') {
      const expiresAtDate = new Date(expiresAtLocalText)
      const expiresAtMillis = expiresAtDate.getTime()
      if (expiresAtLocalText.trim() === '' || Number.isNaN(expiresAtMillis)) {
        setStepErrorMessage(getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.expiresAtMissing))
        return
      }
      if (expiresAtMillis <= Date.now()) {
        setStepErrorMessage(getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.expiresAtInPast))
        return
      }
      expiresAt = expiresAtDate.toISOString()
    }
    if (durationChoice === 'ACCESS_LIMITED') {
      const trimmedMaxAccessCountText = maxAccessCountText.trim()
      const enteredMaxAccessCount = Number(trimmedMaxAccessCountText)
      const validMaxAccessCount =
        /^\d+$/.test(trimmedMaxAccessCountText) && Number.isSafeInteger(enteredMaxAccessCount) && enteredMaxAccessCount >= 1
      if (!validMaxAccessCount) {
        setStepErrorMessage(getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.maxAccessCountInvalid))
        return
      }
      maxAccessCount = enteredMaxAccessCount
    }
    setStepErrorMessage(null)
    const newGalleryShare: NewGalleryShare = { galleryId, label: enteredLabel.trim(), expiresAt, maxAccessCount }
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
          <>
            <Form.Check
              type="radio"
              id="galleryShareDurationPermanent"
              name="galleryShareDuration"
              label={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.durationChoicePermanent)}
              checked={durationChoice === 'PERMANENT'}
              disabled={isSaving}
              onChange={() => chooseDuration('PERMANENT')}
            />
            <Form.Check
              type="radio"
              id="galleryShareDurationUntil"
              name="galleryShareDuration"
              label={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.durationChoiceUntil)}
              checked={durationChoice === 'UNTIL'}
              disabled={isSaving}
              onChange={() => chooseDuration('UNTIL')}
            />
            <Form.Check
              type="radio"
              id="galleryShareDurationAccessLimited"
              name="galleryShareDuration"
              label={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.durationChoiceAccessLimited)}
              checked={durationChoice === 'ACCESS_LIMITED'}
              disabled={isSaving}
              onChange={() => chooseDuration('ACCESS_LIMITED')}
            />
            {durationChoice === 'UNTIL' && (
              <Form.Group className="mt-3" controlId="galleryShareExpiresAt">
                <Form.Label>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.expiresAtInputLabel)}</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={expiresAtLocalText}
                  disabled={isSaving}
                  onChange={handleExpiresAtChange}
                />
              </Form.Group>
            )}
            {durationChoice === 'ACCESS_LIMITED' && (
              <Form.Group className="mt-3" controlId="galleryShareMaxAccessCount">
                <Form.Label>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.maxAccessCountInputLabel)}</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={maxAccessCountText}
                  disabled={isSaving}
                  onChange={handleMaxAccessCountChange}
                />
                <Form.Text>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.maxAccessCountHint)}</Form.Text>
              </Form.Group>
            )}
          </>
        )}
        {step === 'LINK' && (
          <>
            <p>{linkCreatedText}</p>
            <Form.Group controlId="galleryShareLink">
              <Form.Label>{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.linkInputLabel)}</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control type="text" readOnly value={galleryShareLink} onFocus={(event) => event.target.select()} />
                <CopyButton label={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.copyLinkLabel)} value={galleryShareLink} />
              </div>
            </Form.Group>
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
