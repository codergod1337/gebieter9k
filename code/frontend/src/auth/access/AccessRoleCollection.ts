import type { BadgeLook } from '../../badge/BadgeLook.ts'
import type { MultilingualText } from '../../language/MultilingualText.ts'

/**
 * Eine Position: eine Bündelung von Rechten, so wie das Backend sie als JSON liefert.
 * Doku: `docu/entities/AccessRoleCollection.md`
 */
export type AccessRoleCollection = {
  key: string
  /** Mehrsprachig, z. B. `{"de": "Bürger"}`. */
  displayName: MultilingualText
  /** Platz in der Anzeige ab 1, gesetzt per Drag and Drop. Beim Ändern zählt er nicht. */
  listingPosition: number
  /** Das Aussehen der Pille, `null`: Standard aus base.css. */
  badgeLook: BadgeLook | null
}
