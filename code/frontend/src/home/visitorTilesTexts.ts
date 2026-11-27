import type { MultilingualText } from '../language/MultilingualText.ts'

/** Die Texte zu den Kacheln für Besucher ohne Konto ({@link VisitorTiles}), mehrsprachig angelegt. */
export const VISITOR_TILES_TEXTS = {
  /** Die Zeile über den Kacheln auf der Login-Seite. */
  heading: { de: 'Ohne Anmeldung ansehen' },
} satisfies Record<string, MultilingualText>
