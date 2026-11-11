import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Eine Übergruppe der Endungen, z. B. Bilder oder Dokumente, so wie das Backend sie als JSON liefert. Dient der
 * Verwaltung: Katalog und Matrix zeigen die Endungen danach gruppiert.
 * Doku: `docu/entities/FileExtensionGroup.md`
 */
export type FileExtensionGroup = {
  /** fester Key nach der Key-Regel, z. B. `BILD` */
  key: string
  /** mehrsprachig, z. B. `{"de": "Bilder"}` */
  displayName: MultilingualText
  /** Platz der Gruppe ab 1. Beim Anlegen zählt er nicht. */
  listingPosition: number
}
