import { Navigate } from 'react-router'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useKnowledgeContext } from './Knowledge.tsx'
import { getKnowledgeRubricPath } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'
import { getKnowledgeRubrics } from './section/knowledgeSectionTree.ts'

/** Der Einstieg unter `/wissen`: springt zur ersten Rubrik. Ohne Rubrik steht dort, dass es noch keine Inhalte gibt. */
export function KnowledgeStartPage() {
  const knowledgeContext = useKnowledgeContext()
  const knowledgeBase = knowledgeContext.knowledgeBase
  if (knowledgeBase === null) {
    return <LoadStatus errorMessage={knowledgeContext.errorMessage} isLoading={knowledgeContext.errorMessage === null} />
  }
  const knowledgeRubrics = getKnowledgeRubrics(knowledgeBase.knowledgeSections)
  if (knowledgeRubrics.length === 0) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.noRubric)}</p>
  }
  const firstRubricPath = getKnowledgeRubricPath(knowledgeRubrics[0].rubricKey)
  return <Navigate to={firstRubricPath} replace />
}
