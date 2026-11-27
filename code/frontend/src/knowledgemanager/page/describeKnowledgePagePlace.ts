import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { KnowledgeSection } from '../../knowledge/section/KnowledgeSection.ts'

/** Der Anzeigename eines Punkts der Gliederung; gibt es ihn nicht (mehr), sein Key. */
function getSectionName(
  knowledgeSections: KnowledgeSection[],
  rubricKey: string,
  chapterKey: string | null,
  subChapterKey: string | null,
  fallbackKey: string,
): string {
  const foundSection = knowledgeSections.find((knowledgeSection) => {
    return (
      knowledgeSection.rubricKey === rubricKey &&
      knowledgeSection.chapterKey === chapterKey &&
      knowledgeSection.subChapterKey === subChapterKey
    )
  })
  if (foundSection === undefined) {
    return fallbackKey
  }
  return getTextInCurrentLanguage(foundSection.displayName)
}

/** Wo eine Seite steht, in Worten: „Mathe › Grundlagen“ oder mit Unterkapitel „Mathe › Grundlagen › Vektoren“. */
export function describeKnowledgePagePlace(
  knowledgeSections: KnowledgeSection[],
  rubricKey: string | null,
  chapterKey: string | null,
  subChapterKey: string | null,
): string {
  if (rubricKey === null || chapterKey === null) {
    return ''
  }
  const rubricName = getSectionName(knowledgeSections, rubricKey, null, null, rubricKey)
  const chapterName = getSectionName(knowledgeSections, rubricKey, chapterKey, null, chapterKey)
  let place = rubricName + ' › ' + chapterName
  if (subChapterKey !== null) {
    const subChapterName = getSectionName(knowledgeSections, rubricKey, chapterKey, subChapterKey, subChapterKey)
    place = place + ' › ' + subChapterName
  }
  return place
}
