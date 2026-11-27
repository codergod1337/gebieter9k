import type { MultilingualText } from '../../language/MultilingualText.ts'

/**
 * Ein Punkt der Gliederung der Wissensdatenbank (`KnowledgeSection` im Backend): eine Rubrik, ein Kapitel in einer
 * Rubrik oder ein Unterkapitel in einem Kapitel, mit seinem Anzeigenamen und seinem Platz. Welche Ebene er ist, sagen
 * seine Keys: nur `rubricKey` = Rubrik; dazu `chapterKey` = Kapitel; dazu `subChapterKey` = Unterkapitel. Die Seiten im
 * Solr-Kern tragen nur diese Keys.
 * Doku: `docu/entities/KnowledgeSection.md`
 */
export type KnowledgeSection = {
  id: number
  /** Key der Rubrik, z. B. `MATHE`; bei einer Rubrik ihr eigener. */
  rubricKey: string
  /** Key des Kapitels, z. B. `GRUNDLAGEN`, eindeutig in seiner Rubrik; `null` bei einer Rubrik. */
  chapterKey: string | null
  /** Key des Unterkapitels, z. B. `KOORDINATEN`, eindeutig in seinem Kapitel; `null` bei Rubrik und Kapitel. */
  subChapterKey: string | null
  /** Mehrsprachig, z. B. `{"de": "Grundlagen"}`. */
  displayName: MultilingualText
  /** Platz unter den Geschwistern ab 1, per Drag and Drop; beim Anlegen und Ändern zählt er nicht. */
  listingPosition: number
}

/** Was man zum Anlegen schickt: die Keys der Ebene und der Anzeigename; id und Platz vergibt das Backend. */
export type NewKnowledgeSection = {
  rubricKey: string
  chapterKey: string | null
  subChapterKey: string | null
  displayName: MultilingualText
}

/** Die drei Ebenen der Gliederung. */
export type KnowledgeSectionLevel = 'RUBRIC' | 'CHAPTER' | 'SUB_CHAPTER'
