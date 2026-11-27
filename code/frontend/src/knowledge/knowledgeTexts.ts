import type { MultilingualText } from '../language/MultilingualText.ts'

/** Die Texte des Moduls „Wissensdatenbank“ selbst, mehrsprachig angelegt. Die Texte einer Seite stehen in ihrem Dokument. */
export const KNOWLEDGE_TEXTS = {
  /** Name des Moduls im Subheader. */
  moduleTitle: { de: 'Wissensdatenbank' },
  /** Solange es keine Rubrik gibt. */
  noRubric: { de: 'Die Wissensdatenbank hat noch keine Inhalte.' },
  /** Adresse einer Rubrik, die es nicht gibt. */
  unknownRubric: { de: 'Diese Rubrik gibt es nicht.' },
  /** Adresse eines Kapitels, das es nicht gibt. */
  unknownChapter: { de: 'Dieses Kapitel gibt es nicht.' },
  /** Adresse einer Seite, die es im Kapitel nicht gibt (oder die nicht veröffentlicht ist). */
  unknownPage: { de: 'Diese Seite gibt es in diesem Kapitel nicht.' },
  /** Eine Rubrik ohne Kapitel. */
  noChapter: { de: 'In dieser Rubrik gibt es noch keine Kapitel.' },
  /** Ein Kapitel ohne veröffentlichte Seite. */
  noPage: { de: 'Noch keine Seiten.' },
  /** Fuß eines Kapitels: wie viele Seiten es hat. */
  pageCountOne: { de: '1 Seite' },
  pageCountMany: { de: '{pageCount} Seiten' },
  /** Nur für den Admin, oben auf jeder Seite: führt in den Editor der Seite im Wissensmanager. */
  editPage: { de: 'Seite bearbeiten' },
  /** Der Inhalt einer Seite ließ sich nicht lesen; dahinter steht die Stelle im Inhalt. */
  unreadableContent: { de: 'Der Inhalt dieser Seite lässt sich nicht anzeigen: {reason}' },
  /** Eine Seite in einer Fassung des Formats, die dieses Frontend noch nicht kennt. */
  unknownContentFormat: { de: 'Diese Seite ist in einem neueren Format geschrieben (Fassung {version}). Bitte die Anwendung neu laden.' },
  outdatedContentFormat: {
    de: 'Diese Seite ist noch in einem älteren Format gespeichert (Fassung {version}) und muss neu geschrieben werden.',
  },
} satisfies Record<string, MultilingualText>
