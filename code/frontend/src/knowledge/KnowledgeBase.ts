import type { KnowledgePageDocument, KnowledgeSolrFieldNameSet } from './page/KnowledgePageDocument.ts'
import { getKnowledgePageText } from './page/KnowledgePageDocument.ts'
import type { KnowledgeSection } from './section/KnowledgeSection.ts'

/**
 * Was die Wissensdatenbank zum Anzeigen ihrer Übersichten braucht, einmal geladen: die Gliederung (Rubriken, Kapitel,
 * Unterkapitel aus Postgres), die Namen der Felder einer Seite und alle veröffentlichten Seiten der Sprache OHNE ihren
 * Inhalt, nach ihrem Platz sortiert. Den Inhalt holt erst die Seite selbst.
 */
export type KnowledgeBase = {
  knowledgeSections: KnowledgeSection[]
  fieldNames: KnowledgeSolrFieldNameSet
  knowledgePages: KnowledgePageDocument[]
}

/** Die Seiten eines Kapitels in ihrer Reihenfolge, gleich in welchem Unterkapitel sie stehen. */
export function getKnowledgePagesOfChapter(knowledgeBase: KnowledgeBase, rubricKey: string, chapterKey: string): KnowledgePageDocument[] {
  const fieldNames = knowledgeBase.fieldNames
  return knowledgeBase.knowledgePages.filter((knowledgePage) => {
    const pageRubricKey = getKnowledgePageText(knowledgePage, fieldNames.rubricKey)
    const pageChapterKey = getKnowledgePageText(knowledgePage, fieldNames.chapterKey)
    return pageRubricKey === rubricKey && pageChapterKey === chapterKey
  })
}
