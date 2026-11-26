import type { MultilingualText } from '../../language/MultilingualText.ts'

/** Die Texte des Kapitels „Grundlagen“ selbst, mehrsprachig angelegt. Die Texte einer Seite stehen bei der Seite. */
export const BASICS_CHAPTER_TEXTS = {
  /** Titel des Kapitels: der Reiter im Subheader und die Überschrift der Übersicht. */
  chapterTitle: { de: 'Grundlagen' },
} satisfies Record<string, MultilingualText>
