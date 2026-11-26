import type { ComponentType } from 'react'
import type { MultilingualText } from '../language/MultilingualText.ts'

/** Eine Seite der Wissensdatenbank, so wie ihr Kapitel sie aufführt. */
export type KnowledgePage = {
  /** Das Stück der Adresse hinter dem Kapitel, z. B. `koordinatentransformation`. */
  pathSegment: string
  title: MultilingualText
  /** Ein Satz, worum es auf der Seite geht; steht in der Übersicht des Kapitels unter dem Titel. */
  summary: MultilingualText
  /** Die Komponente, die den Inhalt der Seite zeichnet. */
  ContentComponent: ComponentType
}
