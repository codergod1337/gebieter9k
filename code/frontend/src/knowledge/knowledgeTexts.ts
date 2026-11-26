import type { MultilingualText } from '../language/MultilingualText.ts'

/** Die Texte des Moduls „Wissensdatenbank“ selbst, mehrsprachig angelegt. Die Texte einer Seite stehen bei der Seite. */
export const KNOWLEDGE_TEXTS = {
  /** Name des Moduls im Subheader. */
  moduleTitle: { de: 'Wissensdatenbank' },
  /** Adresse eines Kapitels, das es nicht gibt. */
  unknownChapter: { de: 'Dieses Kapitel gibt es nicht.' },
  /** Adresse einer Seite, die es im Kapitel nicht gibt. */
  unknownPage: { de: 'Diese Seite gibt es in diesem Kapitel nicht.' },
  /** Fuß der Übersicht eines Kapitels: wie viele Seiten es hat. */
  pageCountOne: { de: '1 Seite' },
  pageCountMany: { de: '{pageCount} Seiten' },
} satisfies Record<string, MultilingualText>
