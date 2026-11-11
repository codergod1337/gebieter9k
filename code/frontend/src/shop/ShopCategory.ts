import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Eine Rubrik im Gebietermarkt (`ShopCategory` im Backend), z. B. „Sticker“. Der Admin legt sie an und sortiert sie;
 * jeder Artikel steht in genau einer Rubrik. Jede Rubrik hat genau eine FileClass: Was in die Rubrik hochgeladen wird,
 * bekommt sie, der Upload wählt sie nicht.
 * Doku: `docu/entities/ShopCategory.md`
 */
export type ShopCategory = {
  key: string
  /** Mehrsprachig, z. B. `{"de": "Sticker"}`. */
  displayName: MultilingualText
  /** Pflicht: der Key der FileClass, die jede Datei bekommt, die in diese Rubrik hochgeladen wird, z. B. `MEME`. */
  fileClassKey: string
  /** Platz unter den Rubriken ab 1, per Drag and Drop; beim Anlegen und Ändern zählt er nicht */
  listingPosition: number
}
