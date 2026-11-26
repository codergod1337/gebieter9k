import { BASICS_CHAPTER } from './basics/basicsChapter.ts'
import type { KnowledgeChapter } from './KnowledgeChapter.ts'
import type { KnowledgePage } from './KnowledgePage.ts'

/**
 * Alle Kapitel der Wissensdatenbank in der Reihenfolge ihrer Reiter. Ein neues Kapitel ist ein neuer Ordner mit seiner
 * Kapitel-Datei und ein Eintrag hier; Routen und Reiter entstehen daraus von selbst.
 */
export const KNOWLEDGE_CHAPTERS: KnowledgeChapter[] = [BASICS_CHAPTER]

/** Das Kapitel zu einem Stück der Adresse; `null`, wenn es keins gibt (z. B. alte oder vertippte Adresse). */
export function findKnowledgeChapter(chapterPathSegment: string | undefined): KnowledgeChapter | null {
  for (const knowledgeChapter of KNOWLEDGE_CHAPTERS) {
    if (knowledgeChapter.pathSegment === chapterPathSegment) {
      return knowledgeChapter
    }
  }
  return null
}

/** Die Seite eines Kapitels zu einem Stück der Adresse; `null`, wenn das Kapitel keine solche Seite hat. */
export function findKnowledgePage(knowledgeChapter: KnowledgeChapter, pagePathSegment: string | undefined): KnowledgePage | null {
  for (const knowledgePage of knowledgeChapter.pages) {
    if (knowledgePage.pathSegment === pagePathSegment) {
      return knowledgePage
    }
  }
  return null
}
