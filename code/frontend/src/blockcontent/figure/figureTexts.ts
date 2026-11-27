import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte an einer Figur, mehrsprachig angelegt. Platzhalter stehen in geschweiften Klammern. */
export const FIGURE_TEXTS = {
  loadFailed: { de: 'Die Zeichenbibliothek ließ sich nicht laden: {reason}' },
  codeProblem: { de: 'So lässt sich die Figur nicht zeichnen: {reason}' },
} satisfies Record<string, MultilingualText>
