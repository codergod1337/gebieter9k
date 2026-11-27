import type { KnowledgeSection } from './section/KnowledgeSection.ts'

/** Der Einstieg der Wissensdatenbank, ohne Anmeldung erreichbar; er springt zur ersten Rubrik. */
export const KNOWLEDGE_PATH = '/wissen'

/**
 * Ein Key in der Adresse: klein geschrieben, der Unterstrich als Bindestrich, z. B. `ANALYSIS_1` → `analysis-1`. Ein Key
 * hat nur Großbuchstaben, Ziffern und Unterstriche, die Abbildung ist also eindeutig.
 */
export function getKnowledgePathSegment(key: string): string {
  const lowerCaseKey = key.toLowerCase()
  return lowerCaseKey.replaceAll('_', '-')
}

/** Die Übersicht einer Rubrik, z. B. `/wissen/mathe`. */
export function getKnowledgeRubricPath(rubricKey: string): string {
  const rubricPathSegment = getKnowledgePathSegment(rubricKey)
  return KNOWLEDGE_PATH + '/' + rubricPathSegment
}

/** Die Übersicht eines Kapitels, z. B. `/wissen/mathe/grundlagen`. */
export function getKnowledgeChapterPath(rubricKey: string, chapterKey: string): string {
  const rubricPath = getKnowledgeRubricPath(rubricKey)
  const chapterPathSegment = getKnowledgePathSegment(chapterKey)
  return rubricPath + '/' + chapterPathSegment
}

/**
 * Eine Seite, z. B. `/wissen/mathe/grundlagen/koordinatentransformation`. Das Unterkapitel steht nicht in der Adresse:
 * Der Key einer Seite ist in ihrem Kapitel eindeutig.
 */
export function getKnowledgePagePath(rubricKey: string, chapterKey: string, pageKey: string): string {
  const chapterPath = getKnowledgeChapterPath(rubricKey, chapterKey)
  const pagePathSegment = getKnowledgePathSegment(pageKey)
  return chapterPath + '/' + pagePathSegment
}

/** Die Rubrik zu ihrem Stück der Adresse; `null`, wenn es keine gibt. */
export function findKnowledgeRubric(knowledgeSections: KnowledgeSection[], rubricPathSegment: string | undefined): KnowledgeSection | null {
  const foundRubric = knowledgeSections.find((knowledgeSection) => {
    const isRubric = knowledgeSection.chapterKey === null
    return isRubric && getKnowledgePathSegment(knowledgeSection.rubricKey) === rubricPathSegment
  })
  if (foundRubric === undefined) {
    return null
  }
  return foundRubric
}

/** Das Kapitel einer Rubrik zu seinem Stück der Adresse; `null`, wenn es keins gibt. */
export function findKnowledgeChapter(
  knowledgeSections: KnowledgeSection[],
  rubricKey: string,
  chapterPathSegment: string | undefined,
): KnowledgeSection | null {
  const foundChapter = knowledgeSections.find((knowledgeSection) => {
    const isChapterOfRubric =
      knowledgeSection.rubricKey === rubricKey && knowledgeSection.chapterKey !== null && knowledgeSection.subChapterKey === null
    if (!isChapterOfRubric || knowledgeSection.chapterKey === null) {
      return false
    }
    return getKnowledgePathSegment(knowledgeSection.chapterKey) === chapterPathSegment
  })
  if (foundChapter === undefined) {
    return null
  }
  return foundChapter
}
