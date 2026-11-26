import type { MultilingualText } from '../language/MultilingualText.ts'
import type { KnowledgePage } from './KnowledgePage.ts'

/** Ein Kapitel der Wissensdatenbank: ein Reiter im Subheader mit seinen Seiten. */
export type KnowledgeChapter = {
  /** Das Stück der Adresse hinter `/wissen`, z. B. `grundlagen`. */
  pathSegment: string
  title: MultilingualText
  /** Bootstrap-Icon-Klassen für den Reiter, z. B. `bi bi-rulers`. */
  iconClassName: string
  /** Die Seiten in der Reihenfolge, in der die Übersicht sie zeigt. */
  pages: KnowledgePage[]
}
