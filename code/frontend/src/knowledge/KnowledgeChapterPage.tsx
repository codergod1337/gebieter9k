import ListGroup from 'react-bootstrap/ListGroup'
import { Link, useParams } from 'react-router'
import { ContentBox } from '../components/ContentBox.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { useOrigin } from '../navigation/useOrigin.ts'
import { findKnowledgeChapter } from './knowledgeChapters.ts'
import { getKnowledgePagePath } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'

/**
 * Die Übersicht eines Kapitels unter `/wissen/<Kapitel>`: seine Seiten als Liste, je Seite der Titel und ein Satz,
 * worum es geht. Ein Klick öffnet die Seite; das Kapitel geht als Origin mit („Zurück zu Grundlagen“ im Header).
 */
export function KnowledgeChapterPage() {
  const { chapterPathSegment } = useParams()
  const originNavigation = useOrigin()
  const knowledgeChapter = findKnowledgeChapter(chapterPathSegment)

  if (knowledgeChapter === null) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownChapter)}</p>
  }

  const chapterTitle = getTextInCurrentLanguage(knowledgeChapter.title)
  const originState = originNavigation.createOriginStateHere(chapterTitle)
  const pageCount = knowledgeChapter.pages.length
  let pageCountText = getTextInCurrentLanguageWithValues(KNOWLEDGE_TEXTS.pageCountMany, { pageCount: String(pageCount) })
  if (pageCount === 1) {
    pageCountText = getTextInCurrentLanguage(KNOWLEDGE_TEXTS.pageCountOne)
  }

  return (
    <ContentBox title={chapterTitle} footer={pageCountText}>
      <ListGroup variant="flush">
        {knowledgeChapter.pages.map((knowledgePage) => {
          const pagePath = getKnowledgePagePath(knowledgeChapter.pathSegment, knowledgePage.pathSegment)
          return (
            <ListGroup.Item key={knowledgePage.pathSegment} action as={Link} to={pagePath} state={originState}>
              <div className="knowledge-page-entry-title">{getTextInCurrentLanguage(knowledgePage.title)}</div>
              <div className="knowledge-page-entry-summary">{getTextInCurrentLanguage(knowledgePage.summary)}</div>
            </ListGroup.Item>
          )
        })}
      </ListGroup>
    </ContentBox>
  )
}
