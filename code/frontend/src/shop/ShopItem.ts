import type { FileDocument } from '../file/FileDocument.ts'
import type { ShopOffer } from './ShopOffer.ts'
import type { UsersShopItem } from './UsersShopItem.ts'

/**
 * Ein Artikel des Gebietermarkts (`ShopItem` im Backend): eine Datei aus dem Kern FILE, die in einer Rubrik zum Kauf
 * steht. Er entsteht durch das Hochladen in die Rubrik.
 * Doku: `docu/entities/ShopItem.md`
 */
export type ShopItem = {
  id: number
  /** id der Datei im Kern FILE: der SHA-256 ihrer Bytes */
  fileDocumentId: string
  shopCategoryKey: string
  /** wer den Artikel eingestellt hat und beim Verkauf die Punkte bekommt; `null` ist für Artikel des Servers vorgesehen */
  sellerUsersGuid: string | null
}

/**
 * Ein Artikel für die Anzeige (`ShopItemForClient` im Backend): der Artikel und das Dokument seiner Datei mit den
 * Feldern, die der Betrachter lesen darf (darunter die Vorschau), seine laufenden Angebote und das, was der Betrachter
 * selbst schon davon hat.
 * Doku: `docu/entities/ShopItem.md`
 */
export type ShopItemForClient = {
  shopItem: ShopItem
  fileDocument: FileDocument
  /** die Angebote, die gerade im Markt stehen, das älteste zuerst; leer, wenn keins läuft */
  runningShopOffers: ShopOffer[]
  /** was der Betrachter von dieser Datei hat (dauerhaft oder restliche Nutzungen); `null`, wenn nichts */
  ownUsersShopItem: UsersShopItem | null
}
