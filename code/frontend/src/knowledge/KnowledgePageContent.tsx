import { useParams } from 'react-router'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { findKnowledgeChapter, findKnowledgePage } from './knowledgeChapters.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'

/**
 * Eine Seite der Wissensdatenbank unter `/wissen/<Kapitel>/<Seite>`: sucht Kapitel und Seite zur Adresse und zeichnet
 * den Inhalt der Seite. Gibt es das Kapitel oder die Seite nicht, steht dort ein Hinweis.
 */
export function KnowledgePageContent() {
  const { chapterPathSegment, pagePathSegment } = useParams()
  const knowledgeChapter = findKnowledgeChapter(chapterPathSegment)

  if (knowledgeChapter === null) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownChapter)}</p>
  }
  const knowledgePage = findKnowledgePage(knowledgeChapter, pagePathSegment)
  if (knowledgePage === null) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownPage)}</p>
  }
  const ContentComponent = knowledgePage.ContentComponent
  return <ContentComponent />
}
