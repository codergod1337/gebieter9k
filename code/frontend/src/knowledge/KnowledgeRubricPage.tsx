import { useParams } from 'react-router'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useKnowledgeContext } from './Knowledge.tsx'
import { KnowledgeChapterBox } from './KnowledgeChapterBox.tsx'
import { findKnowledgeRubric } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'
import { getKnowledgeChapters } from './section/knowledgeSectionTree.ts'

/**
 * Die Übersicht einer Rubrik unter `/wissen/<Rubrik>`, z. B. `/wissen/mathe`: je Kapitel ein Kasten mit seinen Seiten.
 * Die Rubrik geht als Origin mit, wenn man eine Seite öffnet („Zurück zu Mathe“ im Header).
 */
export function KnowledgeRubricPage() {
  const { rubricPathSegment } = useParams()
  const knowledgeContext = useKnowledgeContext()
  const knowledgeBase = knowledgeContext.knowledgeBase
  if (knowledgeBase === null) {
    return <LoadStatus errorMessage={knowledgeContext.errorMessage} isLoading={knowledgeContext.errorMessage === null} />
  }
  const knowledgeRubric = findKnowledgeRubric(knowledgeBase.knowledgeSections, rubricPathSegment)
  if (knowledgeRubric === null) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownRubric)}</p>
  }
  const rubricTitle = getTextInCurrentLanguage(knowledgeRubric.displayName)
  const knowledgeChapters = getKnowledgeChapters(knowledgeBase.knowledgeSections, knowledgeRubric.rubricKey)
  if (knowledgeChapters.length === 0) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.noChapter)}</p>
  }
  return (
    <>
      {knowledgeChapters.map((knowledgeChapter) => (
        <KnowledgeChapterBox
          key={knowledgeChapter.id}
          knowledgeBase={knowledgeBase}
          knowledgeChapter={knowledgeChapter}
          originLabel={rubricTitle}
        />
      ))}
    </>
  )
}
