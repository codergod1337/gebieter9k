import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { NewShopOffer } from '../shop/ShopOffer.ts'
import { MARKET_TEXTS } from './marketTexts.ts'

/** Was im geführten Ablauf „neues Angebot“ gewählt und getippt ist. */
export type ShopOfferInput = {
  /** Laufzeit: befristet; sonst dauerhaft */
  limitedInTime: boolean
  /** nur bei befristet: der Wert des Felds `datetime-local` (Ortszeit) */
  endsAtLocalText: string
  /** Nutzung: der Haken „Unbegrenzt“ */
  unlimitedUsage: boolean
  /** nur ohne „Unbegrenzt“: wie oft der Käufer es benutzen darf */
  grantedUsageCountText: string
  pricePointsText: string
  /** nur ohne „Unbegrenzt“: der Haken „Nur eine bestimmte Stückzahl verkaufen“ */
  limitedStock: boolean
  /** nur mit begrenzter Stückzahl: wie viele Stück es gibt */
  maxPurchaseCountText: string
}

/** Der Anfangszustand: dauerhaft im Markt, unbegrenzt nutzbar, ohne Stückzahl; den Preis gibt der User an. */
export const START_SHOP_OFFER_INPUT: ShopOfferInput = {
  limitedInTime: false,
  endsAtLocalText: '',
  unlimitedUsage: true,
  grantedUsageCountText: '',
  pricePointsText: '',
  limitedStock: false,
  maxPurchaseCountText: '',
}

const WHOLE_NUMBER_PATTERN = /^\d+$/

/** Eine ganze Zahl ab 0 aus einem Feld, `null` wenn dort etwas anderes steht. */
function parseWholeNumber(numberText: string): number | null {
  const trimmedNumberText = numberText.trim()
  if (!WHOLE_NUMBER_PATTERN.test(trimmedNumberText)) {
    return null
  }
  return Number(trimmedNumberText)
}

/** Der Zeitpunkt aus dem Feld „Bis wann?“, `null` wenn er fehlt, ungültig ist oder nicht in der Zukunft liegt. */
function parseFutureEndsAt(endsAtLocalText: string): string | null {
  const trimmedEndsAtLocalText = endsAtLocalText.trim()
  if (trimmedEndsAtLocalText === '') {
    return null
  }
  const endsAtDate = new Date(trimmedEndsAtLocalText)
  const endsAtMilliseconds = endsAtDate.getTime()
  const endsInFuture = !Number.isNaN(endsAtMilliseconds) && endsAtMilliseconds > Date.now()
  if (!endsInFuture) {
    return null
  }
  return endsAtDate.toISOString()
}

/** Schritt „Laufzeit“: was noch nicht passt, `null` wenn alles passt. Dauerhaft passt immer. */
export function getDurationStepError(shopOfferInput: ShopOfferInput): string | null {
  if (!shopOfferInput.limitedInTime) {
    return null
  }
  const endsAt = parseFutureEndsAt(shopOfferInput.endsAtLocalText)
  if (endsAt === null) {
    return getTextInCurrentLanguage(MARKET_TEXTS.offerEndsAtInvalid)
  }
  return null
}

/** Schritt „Nutzung“: was noch nicht passt, `null` wenn alles passt. Unbegrenzt passt immer. */
export function getUsageStepError(shopOfferInput: ShopOfferInput): string | null {
  if (shopOfferInput.unlimitedUsage) {
    return null
  }
  const grantedUsageCount = parseWholeNumber(shopOfferInput.grantedUsageCountText)
  if (grantedUsageCount === null || grantedUsageCount < 1) {
    return getTextInCurrentLanguage(MARKET_TEXTS.offerUsageCountMissing)
  }
  return null
}

/** Schritt „Preis“: was noch nicht passt, `null` wenn alles passt. Eine Stückzahl gibt es nur ohne „Unbegrenzt“. */
export function getPriceStepError(shopOfferInput: ShopOfferInput): string | null {
  const pricePoints = parseWholeNumber(shopOfferInput.pricePointsText)
  if (pricePoints === null) {
    return getTextInCurrentLanguage(MARKET_TEXTS.offerPriceMissing)
  }
  const stockApplies = !shopOfferInput.unlimitedUsage && shopOfferInput.limitedStock
  if (stockApplies) {
    const maxPurchaseCount = parseWholeNumber(shopOfferInput.maxPurchaseCountText)
    if (maxPurchaseCount === null || maxPurchaseCount < 1) {
      return getTextInCurrentLanguage(MARKET_TEXTS.offerMaxPurchaseCountInvalid)
    }
  }
  return null
}

/**
 * Macht aus den Angaben aller Schritte das Angebot zu einer Datei, mit denselben Regeln wie das Backend
 * (`ShopOfferService.requireValidNewShopOffer`). `null`, solange ein Schritt noch nicht passt. Was eine Wahl ausblendet,
 * zählt nicht: ohne „befristet“ kein Ende, mit „Unbegrenzt“ weder Anzahl noch Stückzahl.
 */
export function createNewShopOfferOfInput(shopOfferInput: ShopOfferInput, fileDocumentId: string): NewShopOffer | null {
  const durationStepError = getDurationStepError(shopOfferInput)
  const usageStepError = getUsageStepError(shopOfferInput)
  const priceStepError = getPriceStepError(shopOfferInput)
  if (durationStepError !== null || usageStepError !== null || priceStepError !== null) {
    return null
  }
  const pricePoints = parseWholeNumber(shopOfferInput.pricePointsText)
  if (pricePoints === null) {
    return null
  }
  let endsAt: string | null = null
  if (shopOfferInput.limitedInTime) {
    endsAt = parseFutureEndsAt(shopOfferInput.endsAtLocalText)
  }
  let grantedUsageCount: number | null = null
  let maxPurchaseCount: number | null = null
  if (!shopOfferInput.unlimitedUsage) {
    grantedUsageCount = parseWholeNumber(shopOfferInput.grantedUsageCountText)
    if (shopOfferInput.limitedStock) {
      maxPurchaseCount = parseWholeNumber(shopOfferInput.maxPurchaseCountText)
    }
  }
  return {
    fileDocumentId,
    pricePoints,
    permanent: shopOfferInput.unlimitedUsage,
    grantedUsageCount,
    endsAt,
    maxPurchaseCount,
  }
}
