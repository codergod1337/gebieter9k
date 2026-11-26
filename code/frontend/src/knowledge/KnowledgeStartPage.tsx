import { Navigate } from 'react-router'
import { KNOWLEDGE_CHAPTERS } from './knowledgeChapters.ts'
import { getKnowledgeChapterPath } from './knowledgePaths.ts'

/** Der Einstieg unter `/wissen`: springt zur Übersicht des ersten Kapitels. */
export function KnowledgeStartPage() {
  const firstKnowledgeChapter = KNOWLEDGE_CHAPTERS[0]
  const firstChapterPath = getKnowledgeChapterPath(firstKnowledgeChapter.pathSegment)
  return <Navigate to={firstChapterPath} replace />
}
