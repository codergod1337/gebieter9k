/**
 * Der Beleg eines Kaufs im Gebietermarkt (`ShopOrder` im Backend): wer, welches Angebot, welche Datei, zu welchem Preis,
 * in welcher Form, wann. Preis und Form sind beim Kauf festgeschrieben.
 * Doku: `docu/entities/ShopOrder.md`
 */
export type ShopOrder = {
  id: number
  /** wer gekauft hat */
  usersGuid: string
  shopOfferId: number
  /** id der gekauften Datei im Kern FILE */
  fileDocumentId: string
  /** der bezahlte Preis in Punkten */
  pricePoints: number
  /** der Kauf gilt dauerhaft */
  permanent: boolean
  /** so viele Nutzungen brachte der Kauf; bei einem dauerhaften Kauf 0 */
  grantedUsageCount: number
  /** wann gekauft wurde, ISO-Zeitpunkt */
  orderedAt: string
}

/**
 * Ein Kauf, wie das Frontend ihn schickt (`NewShopOrder` im Backend, `POST /api/shop-order`): nur das Angebot. Preis und
 * Form des Kaufs bestimmt das Backend aus dem Angebot.
 * Doku: `docu/entities/ShopOrder.md`
 */
export type NewShopOrder = {
  shopOfferId: number
}
