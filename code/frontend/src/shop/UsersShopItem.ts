/**
 * Was ein User von einem Artikel des Gebietermarkts hat (`UsersShopItem` im Backend): dauerhaft oder noch eine Anzahl
 * Nutzungen. Die Zeile entsteht durch einen Kauf und hängt an der Datei, nicht am Angebot.
 * Doku: `docu/entities/UsersShopItem.md`
 */
export type UsersShopItem = {
  id: number
  usersGuid: string
  /** id der Datei im Kern FILE: der SHA-256 ihrer Bytes */
  fileDocumentId: string
  /** der User hat den Artikel dauerhaft; die restlichen Nutzungen zählen dann nicht */
  permanent: boolean
  /** so viele Nutzungen hat der User noch */
  remainingUsageCount: number
}
