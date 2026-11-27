import type { MultilingualText } from '../language/MultilingualText.ts'

/** Die Texte des Moduls „Wissensmanager“ selbst, mehrsprachig angelegt. Die Texte eines Reiters stehen beim Reiter. */
export const KNOWLEDGE_MANAGER_TEXTS = {
  /** Name des Moduls: auf der Kachel der Startseite und im Subheader. */
  moduleTitle: { de: 'Wissensmanager' },
} satisfies Record<string, MultilingualText>
