import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Eine Dateiendung, die das System kennt, so wie das Backend sie als JSON liefert.
 * Doku: `docu/entities/FileExtension.md`
 */
export type FileExtension = {
  /** Die Endung selbst, klein, ohne Punkt, z. B. `jpg`. */
  extension: string
  /** Mehrsprachig, optional, z. B. `{"de": "JPEG-Bild"}`. */
  description: MultilingualText | null
  /** Die Übergruppe, z. B. `BILD`; `null` ohne Gruppe. */
  fileExtensionGroupKey: string | null
  /** Platz in der Anzeige ab 1, über alle Endungen; innerhalb einer Gruppe die Reihenfolge. Beim Anlegen zählt er nicht. */
  listingPosition: number
  /** Rechnet das Backend beim Upload ein Vorschaubild (PNG 200 × 200)? */
  imagePreview: boolean
}

/** Die Endung eines Dateinamens, klein und ohne Punkt; ohne Punkt im Namen ein leerer Text. Wie im Backend. */
export function getFileExtensionOfFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex < 0) {
    return ''
  }
  const extensionAfterLastDot = fileName.slice(lastDotIndex + 1)
  return extensionAfterLastDot.toLowerCase()
}
