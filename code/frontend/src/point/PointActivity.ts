import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Eine Tätigkeit, für die es Punkte gibt (`PointActivity` im Backend), z. B. einen Gästebucheintrag schreiben. Wie viele
 * Punkte, pflegt der Admin; neue Punkte gelten nie rückwirkend.
 * Doku: `docu/entities/PointActivity.md`
 */
export type PointActivity = {
  key: string
  displayName: MultilingualText
  /** wann es die Punkte gibt; darf fehlen */
  description: MultilingualText | null
  /** so viele Punkte ab jetzt, ab 0 */
  rewardPoints: number
  /** Platz in der Anzeige ab 1, per Drag and Drop; beim Anlegen und Ändern zählt er nicht */
  listingPosition: number
}
