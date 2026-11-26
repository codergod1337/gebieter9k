/** Der Einstieg der Wissensdatenbank, ohne Anmeldung erreichbar; er springt zum ersten Kapitel. */
export const KNOWLEDGE_PATH = '/wissen'

/** Die Übersicht eines Kapitels, z. B. `/wissen/grundlagen`. */
export function getKnowledgeChapterPath(chapterPathSegment: string): string {
  return KNOWLEDGE_PATH + '/' + chapterPathSegment
}

/** Eine Seite eines Kapitels, z. B. `/wissen/grundlagen/koordinatentransformation`. */
export function getKnowledgePagePath(chapterPathSegment: string, pagePathSegment: string): string {
  const chapterPath = getKnowledgeChapterPath(chapterPathSegment)
  return chapterPath + '/' + pagePathSegment
}
