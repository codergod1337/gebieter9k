import type { KnowledgeSection } from './KnowledgeSection.ts'

/**
 * Die Gliederung als Baum lesen: Das Backend liefert alle Punkte in einer Liste, nach ihrem Platz unter den
 * Geschwistern; hier wird sie je Ebene herausgesucht. Die Reihenfolge der Liste bleibt dabei erhalten.
 */

/** Alle Rubriken, in ihrer Reihenfolge. */
export function getKnowledgeRubrics(knowledgeSections: KnowledgeSection[]): KnowledgeSection[] {
  return knowledgeSections.filter((knowledgeSection) => knowledgeSection.chapterKey === null)
}

/** Die Kapitel einer Rubrik, in ihrer Reihenfolge. */
export function getKnowledgeChapters(knowledgeSections: KnowledgeSection[], rubricKey: string): KnowledgeSection[] {
  return knowledgeSections.filter((knowledgeSection) => {
    const inRubric = knowledgeSection.rubricKey === rubricKey
    const isChapter = knowledgeSection.chapterKey !== null && knowledgeSection.subChapterKey === null
    return inRubric && isChapter
  })
}

/** Die Unterkapitel eines Kapitels, in ihrer Reihenfolge. */
export function getKnowledgeSubChapters(
  knowledgeSections: KnowledgeSection[],
  rubricKey: string,
  chapterKey: string,
): KnowledgeSection[] {
  return knowledgeSections.filter((knowledgeSection) => {
    const inChapter = knowledgeSection.rubricKey === rubricKey && knowledgeSection.chapterKey === chapterKey
    const isSubChapter = knowledgeSection.subChapterKey !== null
    return inChapter && isSubChapter
  })
}
