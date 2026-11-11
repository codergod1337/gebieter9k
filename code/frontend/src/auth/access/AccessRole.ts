import type { MultilingualText } from '../../language/MultilingualText.ts'

/**
 * Ein Recht, so wie das Backend es als JSON liefert.
 * Doku: `docu/entities/AccessRole.md`
 */
export type AccessRole = {
  key: string
  /** Mehrsprachig, z. B. `{"de": "Admin"}`. */
  displayName: MultilingualText
  /** Platz in der Anzeige ab 1, gesetzt per Drag and Drop im Tab „AR“. Beim Anlegen zählt er nicht. */
  listingPosition: number
}
