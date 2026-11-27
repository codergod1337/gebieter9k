import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte an den Elementen eines Inhalts, mehrsprachig angelegt. Platzhalter stehen in geschweiften Klammern. */
export const ELEMENT_TEXTS = {
  /** An der Nummer einer Gleichung (Hoverlay und Screenreader): Sie ist der Link auf diese Gleichung. */
  equationLink: { de: 'Link auf Gleichung ({number}): Die Adresse führt danach genau hierher.' },
  /** In einer Liste von Gleichungen zur Wahl. */
  noEquations: { de: 'Der Inhalt hat noch keine Gleichung.' },
} satisfies Record<string, MultilingualText>
