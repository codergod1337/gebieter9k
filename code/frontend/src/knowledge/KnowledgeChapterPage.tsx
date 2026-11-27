import { useParams } from 'react-router'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useKnowledgeContext } from './Knowledge.tsx'
import { KnowledgeChapterBox } from './KnowledgeChapterBox.tsx'
import { findKnowledgeChapter, findKnowledgeRubric } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'

/**
 * Die Übersicht eines Kapitels unter `/wissen/<Rubrik>/<Kapitel>`, z. B. `/wissen/mathe/grundlagen`: die ContentBox des
 * Kapitels mit seinen Seiten. Das Kapitel geht als Origin mit, wenn man eine Seite öffnet.
 */
export function KnowledgeChapterPage() {
  const { rubricPathSegment, chapterPathSegment } = useParams()
  const knowledgeContext = useKnowledgeContext()
  const knowledgeBase = knowledgeContext.knowledgeBase
  if (knowledgeBase === null) {
    return <LoadStatus errorMessage={knowledgeContext.errorMessage} isLoading={knowledgeContext.errorMessage === null} />
  }
  const knowledgeRubric = findKnowledgeRubric(knowledgeBase.knowledgeSections, rubricPathSegment)
  if (knowledgeRubric === null) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownRubric)}</p>
  }
  const knowledgeChapter = findKnowledgeChapter(knowledgeBase.knowledgeSections, knowledgeRubric.rubricKey, chapterPathSegment)
  if (knowledgeChapter === null) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownChapter)}</p>
  }
  const chapterTitle = getTextInCurrentLanguage(knowledgeChapter.displayName)
  return <KnowledgeChapterBox knowledgeBase={knowledgeBase} knowledgeChapter={knowledgeChapter} originLabel={chapterTitle} />
}
