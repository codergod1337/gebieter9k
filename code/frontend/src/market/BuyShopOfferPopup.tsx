import { useCallback } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { showToast } from '../components/toastStore.ts'
import { FileDocumentPreviewImage } from '../file/document/FileDocumentPreviewImage.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { ShopOffer } from '../shop/ShopOffer.ts'
import type { UsersShopItem } from '../shop/UsersShopItem.ts'
import { useShopOrder } from '../shop/useShopOrder.ts'
import { useUsersPointBooking } from '../users/useUsersPointBooking.ts'
import { MARKET_TEXTS } from './marketTexts.ts'

/** Kantenlänge der Vorschau im Popup. */
const BUY_POPUP_PREVIEW_PIXELS = 120

type BuyShopOfferPopupProps = {
  /** Das Angebot, das gekauft werden soll. */
  shopOffer: ShopOffer
  /** Die Überschrift des Artikels (seine Tags bzw. sein Dateiname), wie an der Kachel. */
  heading: string
  /** Der Dateiname, als Ersatztext der Vorschau. */
  fileName: string
  /** Die Vorschau der Datei aus dem Dokument (`previewBase64Png`). */
  previewBase64Png: unknown
  /** Was der User von dem Artikel schon hat; `null`, wenn nichts. */
  ownUsersShopItem: UsersShopItem | null
  /** Nach dem Kauf: Der Aufrufer lädt die Artikel der Rubrik neu. */
  onBought: () => void
  onClose: () => void
}

function formatPoints(points: number): string {
  const pointsText = points.toLocaleString('de-DE')
  return getTextInCurrentLanguageWithValues(MARKET_TEXTS.buyPopupPoints, { points: pointsText })
}

/**
 * Das Popup, das einen Kauf im Gebietermarkt bestätigt (Knopf „Kaufen“ an der Kachel eines Artikels): was man bekommt,
 * der Preis, der eigene Punktestand jetzt und danach. Erst der Knopf „Für x Punkte kaufen“ kauft
 * (`POST /api/shop-order`); Preis und Form bestimmt das Backend aus dem Angebot. Reichen die Punkte nicht, bleibt der
 * Knopf gesperrt. Kommt der Kauf nicht zustande (z. B. gerade ausverkauft), bleibt das Popup offen und zeigt den Grund.
 */
export function BuyShopOfferPopup({
  shopOffer,
  heading,
  fileName,
  previewBase64Png,
  ownUsersShopItem,
  onBought,
  onClose,
}: BuyShopOfferPopupProps) {
  const shopOrderHook = useShopOrder()
  const usersPointBookingHook = useUsersPointBooking()
  const resolveOwnUsersPointBookingPage = usersPointBookingHook.resolveOwnUsersPointBookingPage
  // Der Punktestand kommt frisch vom Backend (erste Seite des Kontoauszugs), nicht aus der Anmeldung
  const loadPointBalance = useCallback(() => resolveOwnUsersPointBookingPage(0), [resolveOwnUsersPointBookingPage])
  const loadedPointBalance = useLoadedData(loadPointBalance)
  let pointBalance: number | null = null
  if (loadedPointBalance.data !== null) {
    pointBalance = loadedPointBalance.data.pointBalance
  }
  const pricePoints = shopOffer.pricePoints
  const isSaving = shopOrderHook.isLoading

  async function handleBuy() {
    const createdShopOrder = await shopOrderHook.createShopOrder(shopOffer.id)
    if (createdShopOrder === null) {
      return
    }
    showToast({
      kind: 'success',
      title: getTextInCurrentLanguage(MARKET_TEXTS.boughtTitle),
      text: getTextInCurrentLanguageWithValues(MARKET_TEXTS.boughtText, { heading }),
    })
    onBought()
    onClose()
  }

  // Was der Kauf bringt, und was mit dem geschieht, was man schon hat
  let getsText = getTextInCurrentLanguage(MARKET_TEXTS.buyPopupGetsPermanent)
  if (!shopOffer.permanent) {
    getsText = getTextInCurrentLanguageWithValues(MARKET_TEXTS.buyPopupGetsUsages, {
      count: shopOffer.grantedUsageCount.toLocaleString('de-DE'),
    })
  }
  let ownedText: string | null = null
  if (ownUsersShopItem !== null && ownUsersShopItem.remainingUsageCount > 0) {
    const ownedUsageCount = ownUsersShopItem.remainingUsageCount
    if (shopOffer.permanent) {
      ownedText = getTextInCurrentLanguageWithValues(MARKET_TEXTS.buyPopupOwnedUsagesReplaced, {
        owned: ownedUsageCount.toLocaleString('de-DE'),
      })
    } else {
      const usageCountAfter = ownedUsageCount + shopOffer.grantedUsageCount
      ownedText = getTextInCurrentLanguageWithValues(MARKET_TEXTS.buyPopupOwnedUsagesAfter, {
        owned: ownedUsageCount.toLocaleString('de-DE'),
        after: usageCountAfter.toLocaleString('de-DE'),
      })
    }
  }

  const notEnoughPoints = pointBalance !== null && pointBalance < pricePoints
  let errorMessage: string | null = null
  if (shopOrderHook.error !== null) {
    errorMessage = shopOrderHook.error.detail
  } else if (usersPointBookingHook.error !== null) {
    errorMessage = usersPointBookingHook.error.detail
  }
  let confirmLabel = getTextInCurrentLanguageWithValues(MARKET_TEXTS.buyPopupConfirm, {
    points: pricePoints.toLocaleString('de-DE'),
  })
  if (pricePoints === 0) {
    confirmLabel = getTextInCurrentLanguage(MARKET_TEXTS.buyPopupConfirmFree)
  }
  const confirmDisabled = isSaving || pointBalance === null || notEnoughPoints

  return (
    <Modal show onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{getTextInCurrentLanguage(MARKET_TEXTS.buyPopupTitle)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ErrorAlert message={errorMessage} />
        <div className="d-flex align-items-start gap-3">
          <FileDocumentPreviewImage
            previewBase64Png={previewBase64Png}
            sizePixels={BUY_POPUP_PREVIEW_PIXELS}
            alternativeText={fileName}
          />
          <div>
            <div className="fs-5 fw-semibold">{heading}</div>
            <div className="text-body-secondary small mt-2">{getTextInCurrentLanguage(MARKET_TEXTS.buyPopupWhatLabel)}</div>
            <div>{getsText}</div>
            {ownedText !== null && <div className="text-body-secondary small mt-1">{ownedText}</div>}
          </div>
        </div>
        <hr />
        <div className="d-flex justify-content-between">
          <span>{getTextInCurrentLanguage(MARKET_TEXTS.buyPopupPriceLabel)}</span>
          <span className="fw-semibold">{formatPoints(pricePoints)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>{getTextInCurrentLanguage(MARKET_TEXTS.buyPopupBalanceLabel)}</span>
          {pointBalance === null && <Spinner animation="border" size="sm" />}
          {pointBalance !== null && <span>{formatPoints(pointBalance)}</span>}
        </div>
        {pointBalance !== null && !notEnoughPoints && (
          <div className="d-flex justify-content-between">
            <span>{getTextInCurrentLanguage(MARKET_TEXTS.buyPopupBalanceAfterLabel)}</span>
            <span>{formatPoints(pointBalance - pricePoints)}</span>
          </div>
        )}
        {notEnoughPoints && (
          <div className="text-danger mt-2">{getTextInCurrentLanguage(MARKET_TEXTS.buyPopupNotEnoughPoints)}</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          {getTextInCurrentLanguage(MARKET_TEXTS.cancel)}
        </Button>
        <Button variant="primary" onClick={() => void handleBuy()} disabled={confirmDisabled}>
          {isSaving && <Spinner animation="border" size="sm" className="me-2" />}
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
