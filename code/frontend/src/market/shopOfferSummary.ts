import { formatDateTime } from '../components/formatDateTime.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { MARKET_TEXTS } from './marketTexts.ts'

/** Was die Zusammenfassung eines Angebots braucht; passt für ein gespeichertes und für ein gerade eingegebenes Angebot. */
export type ShopOfferSummaryInput = {
  pricePoints: number
  permanent: boolean
  grantedUsageCount: number | null
  /** ISO-Zeitpunkt; `null`: ohne Ende */
  endsAt: string | null
  maxPurchaseCount: number | null
  /** schon gekauft; bei einem neuen Angebot 0 */
  purchaseCount: number
}

/**
 * Ein Angebot in einer Zeile, überall gleich (Angebots-Box beim Hochladen, Kachel eines Artikels), z. B.
 * „80 Punkte · 10 Nutzungen · bis 01.12.2026, 00:00 · noch 7 von 10“ oder „500 Punkte · dauerhaft“.
 */
export function getShopOfferSummary(shopOffer: ShopOfferSummaryInput): string {
  const pricePointsText = shopOffer.pricePoints.toLocaleString('de-DE')
  const summaryParts: string[] = [
    getTextInCurrentLanguageWithValues(MARKET_TEXTS.offerSummaryPrice, { pricePoints: pricePointsText }),
  ]
  if (shopOffer.permanent) {
    summaryParts.push(getTextInCurrentLanguage(MARKET_TEXTS.offerSummaryPermanent))
  } else {
    const grantedUsageCount = shopOffer.grantedUsageCount ?? 0
    const countText = grantedUsageCount.toLocaleString('de-DE')
    summaryParts.push(getTextInCurrentLanguageWithValues(MARKET_TEXTS.offerSummaryUsages, { count: countText }))
  }
  if (shopOffer.endsAt !== null) {
    const dateTimeText = formatDateTime(shopOffer.endsAt)
    summaryParts.push(getTextInCurrentLanguageWithValues(MARKET_TEXTS.offerSummaryEndsAt, { dateTime: dateTimeText }))
  }
  if (shopOffer.maxPurchaseCount !== null) {
    const remainingCount = Math.max(0, shopOffer.maxPurchaseCount - shopOffer.purchaseCount)
    summaryParts.push(
      getTextInCurrentLanguageWithValues(MARKET_TEXTS.offerSummaryStock, {
        remaining: remainingCount.toLocaleString('de-DE'),
        max: shopOffer.maxPurchaseCount.toLocaleString('de-DE'),
      }),
    )
  }
  return summaryParts.join(' · ')
}
