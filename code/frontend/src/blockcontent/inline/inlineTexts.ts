import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte an einem Text mit Auszeichnung, mehrsprachig angelegt. */
export const INLINE_TEXTS = {
  equationReferenceMissing: { de: 'Diese Gleichung gibt es im Inhalt nicht (mehr).' },
  equationReferenceForeign: { de: 'Gleichung auf einer anderen Seite' },
} satisfies Record<string, MultilingualText>
