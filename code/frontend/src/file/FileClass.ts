import type { BadgeLook } from '../badge/BadgeLook.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Eine Dateiart (FileClass), so wie das Backend sie als JSON liefert, z. B. `FOTO_URLAUB`.
 * Doku: `docu/entities/FileClass.md`
 */
export type FileClass = {
  key: string
  /** Mehrsprachig, z. B. `{"de": "Urlaubsbilder"}`. */
  displayName: MultilingualText
  /** Mehrsprachig, optional: was in diese Dateiart gehört. */
  description: MultilingualText | null
  /** Platz in der Anzeige ab 1. Beim Anlegen zählt er nicht. */
  listingPosition: number
  /** Das Aussehen als Kachel samt Symbol; `null`: Standard aus base.css. */
  badgeLook: BadgeLook | null
}
