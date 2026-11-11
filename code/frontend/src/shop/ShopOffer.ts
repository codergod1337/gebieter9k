/**
 * Ein Angebot im Gebietermarkt (`ShopOffer` im Backend): zu welchem Preis, in welcher Form (dauerhaft oder Anzahl
 * Nutzungen) und wie lange (ohne Ende, bis zu einer Frist, bis eine Stückzahl verkauft ist) ein Artikel zu kaufen ist.
 * Doku: `docu/entities/ShopOffer.md`
 */
export type ShopOffer = {
  id: number
  shopItemId: number
  /** der Preis eines Kaufs in Punkten */
  pricePoints: number
  /** der Käufer darf den Artikel unbegrenzt nutzen */
  permanent: boolean
  /** so viele Nutzungen bringt ein Kauf; bei unbegrenzt 0 */
  grantedUsageCount: number
  /** ab wann es im Markt steht, ISO-Zeitpunkt */
  startsAt: string
  /** bis wann es im Markt steht (die Frist), ISO-Zeitpunkt; `null`: ohne Ende */
  endsAt: string | null
  /** so oft kann es höchstens gekauft werden (Stückzahl); `null`: unbegrenzt */
  maxPurchaseCount: number | null
  /** so oft wurde es schon gekauft */
  purchaseCount: number
}

/**
 * Ein neues Angebot zu einem eigenen Artikel (`NewShopOffer` im Backend, `POST /api/shop-offer`), aus dem geführten
 * Ablauf „neues Angebot“: erst die Datei hochladen, dann das Angebot. Es gilt ab dem Anlegen.
 * Doku: `docu/entities/ShopOffer.md`
 */
export type NewShopOffer = {
  /** die Datei des Artikels: ihre id im Kern FILE */
  fileDocumentId: string
  pricePoints: number
  /** der Käufer darf es unbegrenzt nutzen */
  permanent: boolean
  /** Nutzungen je Kauf, ab 1; bei unbegrenzt `null` */
  grantedUsageCount: number | null
  /** befristet: bis wann es im Markt steht, ISO-Zeitpunkt; `null`: dauerhaft */
  endsAt: string | null
  /** die Stückzahl, ab 1; `null`: unbegrenzt */
  maxPurchaseCount: number | null
}
