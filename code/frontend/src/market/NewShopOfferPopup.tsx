import { type ChangeEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { showToast } from '../components/toastStore.ts'
import type { FileClass } from '../file/FileClass.ts'
import type { FileUploadResult } from '../file/FileDocument.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { useShopOffer } from '../shop/useShopOffer.ts'
import { MarketUploadBox } from './MarketUploadBox.tsx'
import { MARKET_TEXTS } from './marketTexts.ts'
import {
  createNewShopOfferOfInput,
  getDurationStepError,
  getPriceStepError,
  getUsageStepError,
  type ShopOfferInput,
  START_SHOP_OFFER_INPUT,
} from './shopOfferInput.ts'
import { getShopOfferSummary } from './shopOfferSummary.ts'

/** Die Schritte des Ablaufs, in dieser Reihenfolge. */
type ShopOfferStep = 'UPLOAD' | 'DURATION' | 'USAGE' | 'PRICE'

const STEPS_WITH_UPLOAD: ShopOfferStep[] = ['UPLOAD', 'DURATION', 'USAGE', 'PRICE']
const STEPS_WITHOUT_UPLOAD: ShopOfferStep[] = ['DURATION', 'USAGE', 'PRICE']

/** Je geöffnetem Ablauf eine eigene, leere Upload-Liste. */
const RECENT_FILE_UPLOADS_STATE_KEY_PREFIX = 'RECENT_FILE_UPLOADS_MARKET_'

type NewShopOfferPopupProps = {
  shopCategoryKey: string
  /** Der Name der Rubrik: für „Zurück zu …“, wenn man aus der Upload-Liste die Seite einer Datei öffnet. */
  shopCategoryTitle: string
  /** Die FileClass der Rubrik: Jede Datei aus dem Upload-Schritt bekommt sie, ohne Auswahl. */
  fileClass: FileClass
  /**
   * Dateien, die schon oben sind (eigene Artikel ohne Angebot): Dann beginnt der Ablauf bei der Laufzeit. `null`: Der
   * Ablauf beginnt mit dem Hochladen.
   */
  startFileDocumentIds: string[] | null
  /** Eine Datei ist oben oder ausgewertet: Der Aufrufer lädt die Artikel der Rubrik neu. */
  onShopItemsChanged: () => void
  onClose: () => void
}

/**
 * „Neues Angebot“ im Gebietermarkt als geführter Ablauf (Nutzer 2026-11-11: ein eigener Knopf, Schritt für Schritt,
 * Eingaben nur, wenn die Wahl sie braucht):
 * 1. Datei hochladen (der globale Upload-Ablauf, die FileClass ist die der Rubrik); weiter geht es, sobald mindestens
 *    eine Datei oben ist.
 * 2. Laufzeit: dauerhaft oder befristet; „Bis wann?“ erscheint nur bei befristet.
 * 3. Nutzung: der Haken „Unbegrenzt“; ohne Haken erscheint „So oft darf der Käufer es benutzen“.
 * 4. Preis; ohne „Unbegrenzt“ wahlweise eine Stückzahl. Dann „Angebot erstellen“.
 * Das Angebot gilt für jede Datei, die im ersten Schritt hochgeladen wurde. Wer das Popup nach dem Hochladen schließt,
 * hat Artikel ohne Angebot; an ihrer Kachel lässt sich der Ablauf ab Schritt 2 nachholen.
 */
export function NewShopOfferPopup({
  shopCategoryKey,
  shopCategoryTitle,
  fileClass,
  startFileDocumentIds,
  onShopItemsChanged,
  onClose,
}: NewShopOfferPopupProps) {
  const shopOfferHook = useShopOffer()
  let steps = STEPS_WITH_UPLOAD
  if (startFileDocumentIds !== null) {
    steps = STEPS_WITHOUT_UPLOAD
  }
  const [stepIndex, setStepIndex] = useState<number>(0)
  /** Die Dateien, die oben sind und noch kein Angebot aus diesem Ablauf haben. */
  const [pendingFileDocumentIds, setPendingFileDocumentIds] = useState<string[]>(startFileDocumentIds ?? [])
  const [shopOfferInput, setShopOfferInput] = useState<ShopOfferInput>(START_SHOP_OFFER_INPUT)
  /** Was am aktuellen Schritt noch nicht passt; erscheint erst nach „Weiter“ bzw. „Angebot erstellen“. */
  const [stepErrorMessage, setStepErrorMessage] = useState<string | null>(null)
  const [recentFileUploadsStateKey] = useState<string>(() => RECENT_FILE_UPLOADS_STATE_KEY_PREFIX + shopCategoryKey + '_' + Date.now())
  const step = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1
  const isSaving = shopOfferHook.isLoading

  function handleUploaded(uploadResult: FileUploadResult) {
    // Nur neu angelegte Dateien sind Artikel dieser Rubrik geworden; „gibt es schon“ zählt nicht
    if (uploadResult.status === 'CREATED') {
      setPendingFileDocumentIds((knownFileDocumentIds) => [...knownFileDocumentIds, uploadResult.id])
    }
    onShopItemsChanged()
  }

  function changeShopOfferInput(changedShopOfferInput: ShopOfferInput) {
    setShopOfferInput(changedShopOfferInput)
    setStepErrorMessage(null)
  }

  function handleEndsAtChange(event: ChangeEvent<HTMLInputElement>) {
    changeShopOfferInput({ ...shopOfferInput, endsAtLocalText: event.target.value })
  }

  function handleGrantedUsageCountChange(event: ChangeEvent<HTMLInputElement>) {
    changeShopOfferInput({ ...shopOfferInput, grantedUsageCountText: event.target.value })
  }

  function handlePricePointsChange(event: ChangeEvent<HTMLInputElement>) {
    changeShopOfferInput({ ...shopOfferInput, pricePointsText: event.target.value })
  }

  function handleMaxPurchaseCountChange(event: ChangeEvent<HTMLInputElement>) {
    changeShopOfferInput({ ...shopOfferInput, maxPurchaseCountText: event.target.value })
  }

  function handleBack() {
    setStepErrorMessage(null)
    setStepIndex(stepIndex - 1)
  }

  function handleNext() {
    let currentStepError: string | null = null
    if (step === 'DURATION') {
      currentStepError = getDurationStepError(shopOfferInput)
    } else if (step === 'USAGE') {
      currentStepError = getUsageStepError(shopOfferInput)
    }
    if (currentStepError !== null) {
      setStepErrorMessage(currentStepError)
      return
    }
    setStepErrorMessage(null)
    setStepIndex(stepIndex + 1)
  }

  /** Legt das Angebot zu jeder Datei an, die oben ist. Scheitert eine, bleibt das Popup offen und zeigt den Fehler. */
  async function handleCreate() {
    const priceStepError = getPriceStepError(shopOfferInput)
    if (priceStepError !== null) {
      setStepErrorMessage(priceStepError)
      return
    }
    setStepErrorMessage(null)
    let createdShopOfferSummary = ''
    for (const fileDocumentId of pendingFileDocumentIds) {
      const newShopOffer = createNewShopOfferOfInput(shopOfferInput, fileDocumentId)
      if (newShopOffer === null) {
        return
      }
      const createdShopOffer = await shopOfferHook.createShopOfferOfOwnShopItem(newShopOffer)
      if (createdShopOffer === null) {
        return
      }
      createdShopOfferSummary = getShopOfferSummary(createdShopOffer)
      setPendingFileDocumentIds((knownFileDocumentIds) =>
        knownFileDocumentIds.filter((knownFileDocumentId) => knownFileDocumentId !== fileDocumentId),
      )
    }
    showToast({
      kind: 'success',
      title: getTextInCurrentLanguage(MARKET_TEXTS.shopOfferCreatedTitle),
      text: getTextInCurrentLanguageWithValues(MARKET_TEXTS.shopOfferCreatedText, { summary: createdShopOfferSummary }),
    })
    onShopItemsChanged()
    onClose()
  }

  let stepTitle = getTextInCurrentLanguage(MARKET_TEXTS.stepUploadTitle)
  if (step === 'DURATION') {
    stepTitle = getTextInCurrentLanguage(MARKET_TEXTS.stepDurationTitle)
  } else if (step === 'USAGE') {
    stepTitle = getTextInCurrentLanguage(MARKET_TEXTS.stepUsageTitle)
  } else if (step === 'PRICE') {
    stepTitle = getTextInCurrentLanguage(MARKET_TEXTS.stepPriceTitle)
  }
  const stepProgress = getTextInCurrentLanguageWithValues(MARKET_TEXTS.stepProgress, {
    step: String(stepIndex + 1),
    stepCount: String(steps.length),
  })
  let errorMessage: string | null = stepErrorMessage
  if (errorMessage === null && shopOfferHook.error !== null) {
    errorMessage = shopOfferHook.error.detail
  }
  const nothingUploadedYet = pendingFileDocumentIds.length === 0
  const nextDisabled = step === 'UPLOAD' && nothingUploadedYet

  // Die Zusammenfassung im letzten Schritt, sobald alle Angaben passen
  let shopOfferSummary: string | null = null
  if (step === 'PRICE' && pendingFileDocumentIds.length > 0) {
    const previewShopOffer = createNewShopOfferOfInput(shopOfferInput, pendingFileDocumentIds[0])
    if (previewShopOffer !== null) {
      shopOfferSummary = getShopOfferSummary({ ...previewShopOffer, purchaseCount: 0 })
    }
  }

  return (
    <Modal show onHide={onClose} size="xl" scrollable backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {getTextInCurrentLanguage(MARKET_TEXTS.newShopOfferPopupTitle)}
          <span className="text-body-secondary fs-6 ms-3">{stepProgress}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h2 className="h5 mb-3">{stepTitle}</h2>
        <ErrorAlert message={errorMessage} />
        {step === 'UPLOAD' && (
          <>
            <p className="text-body-secondary">{getTextInCurrentLanguage(MARKET_TEXTS.stepUploadHint)}</p>
            <MarketUploadBox
              shopCategoryKey={shopCategoryKey}
              shopCategoryTitle={shopCategoryTitle}
              fileClass={fileClass}
              recentFileUploadsStateKey={recentFileUploadsStateKey}
              onUploaded={handleUploaded}
              onAnalysisCompleted={onShopItemsChanged}
            />
            {!nothingUploadedYet && (
              <p className="fw-semibold mt-3 mb-0">
                {getTextInCurrentLanguageWithValues(MARKET_TEXTS.stepUploadDone, {
                  count: String(pendingFileDocumentIds.length),
                })}
              </p>
            )}
          </>
        )}
        {step === 'DURATION' && (
          <>
            <Form.Check
              type="radio"
              id="newShopOfferDurationPermanent"
              name="newShopOfferDuration"
              className="mb-2"
              label={
                <>
                  <span className="fw-semibold">{getTextInCurrentLanguage(MARKET_TEXTS.durationPermanent)}</span>
                  <span className="d-block text-body-secondary">
                    {getTextInCurrentLanguage(MARKET_TEXTS.durationPermanentHint)}
                  </span>
                </>
              }
              checked={!shopOfferInput.limitedInTime}
              onChange={() => changeShopOfferInput({ ...shopOfferInput, limitedInTime: false })}
            />
            <Form.Check
              type="radio"
              id="newShopOfferDurationLimited"
              name="newShopOfferDuration"
              label={
                <>
                  <span className="fw-semibold">{getTextInCurrentLanguage(MARKET_TEXTS.durationLimited)}</span>
                  <span className="d-block text-body-secondary">
                    {getTextInCurrentLanguage(MARKET_TEXTS.durationLimitedHint)}
                  </span>
                </>
              }
              checked={shopOfferInput.limitedInTime}
              onChange={() => changeShopOfferInput({ ...shopOfferInput, limitedInTime: true })}
            />
            {shopOfferInput.limitedInTime && (
              <Form.Group controlId="newShopOfferEndsAt" className="mt-3">
                <Form.Label>{getTextInCurrentLanguage(MARKET_TEXTS.durationEndsAtLabel)}</Form.Label>
                <Form.Control
                  type="datetime-local"
                  autoFocus
                  value={shopOfferInput.endsAtLocalText}
                  onChange={handleEndsAtChange}
                />
              </Form.Group>
            )}
          </>
        )}
        {step === 'USAGE' && (
          <>
            <Form.Check
              type="checkbox"
              id="newShopOfferUsageUnlimited"
              label={
                <>
                  <span className="fw-semibold">{getTextInCurrentLanguage(MARKET_TEXTS.usageUnlimited)}</span>
                  <span className="d-block text-body-secondary">
                    {getTextInCurrentLanguage(MARKET_TEXTS.usageUnlimitedHint)}
                  </span>
                </>
              }
              checked={shopOfferInput.unlimitedUsage}
              onChange={(event) => changeShopOfferInput({ ...shopOfferInput, unlimitedUsage: event.target.checked })}
            />
            {!shopOfferInput.unlimitedUsage && (
              <Form.Group controlId="newShopOfferGrantedUsageCount" className="mt-3">
                <Form.Label>{getTextInCurrentLanguage(MARKET_TEXTS.usageCountLabel)}</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  autoFocus
                  value={shopOfferInput.grantedUsageCountText}
                  onChange={handleGrantedUsageCountChange}
                />
              </Form.Group>
            )}
          </>
        )}
        {step === 'PRICE' && (
          <>
            <Form.Group controlId="newShopOfferPricePoints">
              <Form.Label>{getTextInCurrentLanguage(MARKET_TEXTS.priceLabel)}</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                autoFocus
                value={shopOfferInput.pricePointsText}
                onChange={handlePricePointsChange}
              />
            </Form.Group>
            {!shopOfferInput.unlimitedUsage && (
              <Form.Check
                type="checkbox"
                id="newShopOfferStockLimited"
                className="mt-3"
                label={getTextInCurrentLanguage(MARKET_TEXTS.stockLimited)}
                checked={shopOfferInput.limitedStock}
                onChange={(event) => changeShopOfferInput({ ...shopOfferInput, limitedStock: event.target.checked })}
              />
            )}
            {!shopOfferInput.unlimitedUsage && shopOfferInput.limitedStock && (
              <Form.Group controlId="newShopOfferMaxPurchaseCount" className="mt-3">
                <Form.Label>{getTextInCurrentLanguage(MARKET_TEXTS.stockCountLabel)}</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={shopOfferInput.maxPurchaseCountText}
                  onChange={handleMaxPurchaseCountChange}
                />
              </Form.Group>
            )}
            {shopOfferSummary !== null && (
              <p className="mt-3 mb-0">
                {getTextInCurrentLanguage(MARKET_TEXTS.offerSummaryLabel)} <strong>{shopOfferSummary}</strong>
              </p>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          {getTextInCurrentLanguage(MARKET_TEXTS.cancel)}
        </Button>
        {stepIndex > 0 && (
          <Button variant="outline-secondary" onClick={handleBack} disabled={isSaving}>
            {getTextInCurrentLanguage(MARKET_TEXTS.stepBack)}
          </Button>
        )}
        {!isLastStep && (
          <Button variant="primary" onClick={handleNext} disabled={nextDisabled}>
            {getTextInCurrentLanguage(MARKET_TEXTS.stepNext)}
          </Button>
        )}
        {isLastStep && (
          <Button variant="primary" onClick={() => void handleCreate()} disabled={isSaving || nothingUploadedYet}>
            {getTextInCurrentLanguage(MARKET_TEXTS.createShopOffer)}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
