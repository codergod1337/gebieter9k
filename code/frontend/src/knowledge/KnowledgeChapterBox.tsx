import type { ReactNode } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { Link } from 'react-router'
import { ContentBox } from '../components/ContentBox.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { useOrigin } from '../navigation/useOrigin.ts'
import { getKnowledgePagesOfChapter, type KnowledgeBase } from './KnowledgeBase.ts'
import { getKnowledgePagePath } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'
import { getKnowledgePageText, type KnowledgePageDocument } from './page/KnowledgePageDocument.ts'
import type { KnowledgeSection } from './section/KnowledgeSection.ts'
import { getKnowledgeSubChapters } from './section/knowledgeSectionTree.ts'

type KnowledgeChapterBoxProps = {
  knowledgeBase: KnowledgeBase
  /** Das Kapitel (ein Punkt der Gliederung mit `chapterKey`). */
  knowledgeChapter: KnowledgeSection
  /** Wie die Seite heißt, auf der der Kasten steht: Dorthin führt „Zurück zu …“ von einer geöffneten Seite. */
  originLabel: string
}

/**
 * Ein Kapitel der Wissensdatenbank als Kasten: seine veröffentlichten Seiten als Liste, je Seite der Titel und ein
 * Satz, worum es geht. Zuerst die Seiten, die direkt im Kapitel stehen, dann je Unterkapitel seine Seiten unter seinem
 * Namen. Ein Klick öffnet die Seite.
 */
export function KnowledgeChapterBox({ knowledgeBase, knowledgeChapter, originLabel }: KnowledgeChapterBoxProps) {
  const originNavigation = useOrigin()
  const originState = originNavigation.createOriginStateHere(originLabel)
  const fieldNames = knowledgeBase.fieldNames
  const rubricKey = knowledgeChapter.rubricKey
  const chapterKey = knowledgeChapter.chapterKey ?? ''
  const chapterTitle = getTextInCurrentLanguage(knowledgeChapter.displayName)
  const knowledgePagesOfChapter = getKnowledgePagesOfChapter(knowledgeBase, rubricKey, chapterKey)
  const knowledgeSubChapters = getKnowledgeSubChapters(knowledgeBase.knowledgeSections, rubricKey, chapterKey)
  const knownSubChapterKeys = knowledgeSubChapters.map((knowledgeSubChapter) => knowledgeSubChapter.subChapterKey)

  function renderPageEntry(knowledgePage: KnowledgePageDocument): ReactNode {
    const pageId = getKnowledgePageText(knowledgePage, fieldNames.id) ?? ''
    const pageKey = getKnowledgePageText(knowledgePage, fieldNames.pageKey) ?? ''
    const pageTitle = getKnowledgePageText(knowledgePage, fieldNames.title)
    const pageSummary = getKnowledgePageText(knowledgePage, fieldNames.summary)
    const pagePath = getKnowledgePagePath(rubricKey, chapterKey, pageKey)
    return (
      <ListGroup.Item key={pageId} action as={Link} to={pagePath} state={originState}>
        <div className="knowledge-page-entry-title">{pageTitle}</div>
        {pageSummary !== null && <div className="knowledge-page-entry-summary">{pageSummary}</div>}
      </ListGroup.Item>
    )
  }

  // direkt im Kapitel: Seiten ohne Unterkapitel (und solche, deren Unterkapitel die Gliederung nicht kennt)
  const pagesDirectlyInChapter = knowledgePagesOfChapter.filter((knowledgePage) => {
    const subChapterKey = getKnowledgePageText(knowledgePage, fieldNames.subChapterKey)
    return subChapterKey === null || !knownSubChapterKeys.includes(subChapterKey)
  })
  const pageGroups: ReactNode[] = []
  if (pagesDirectlyInChapter.length > 0) {
    pageGroups.push(
      <ListGroup key="chapter" variant="flush">
        {pagesDirectlyInChapter.map(renderPageEntry)}
      </ListGroup>,
    )
  }
  for (const knowledgeSubChapter of knowledgeSubChapters) {
    const pagesOfSubChapter = knowledgePagesOfChapter.filter((knowledgePage) => {
      const subChapterKey = getKnowledgePageText(knowledgePage, fieldNames.subChapterKey)
      return subChapterKey === knowledgeSubChapter.subChapterKey
    })
    if (pagesOfSubChapter.length === 0) {
      continue
    }
    pageGroups.push(
      <section key={knowledgeSubChapter.id} className="knowledge-sub-chapter">
        <h3 className="knowledge-sub-chapter-heading">{getTextInCurrentLanguage(knowledgeSubChapter.displayName)}</h3>
        <ListGroup variant="flush">{pagesOfSubChapter.map(renderPageEntry)}</ListGroup>
      </section>,
    )
  }

  const pageCount = knowledgePagesOfChapter.length
  let pageCountText = getTextInCurrentLanguageWithValues(KNOWLEDGE_TEXTS.pageCountMany, { pageCount: String(pageCount) })
  if (pageCount === 1) {
    pageCountText = getTextInCurrentLanguage(KNOWLEDGE_TEXTS.pageCountOne)
  }
  return (
    <ContentBox title={chapterTitle} footer={pageCountText}>
      {pageCount === 0 && <p className="text-body-secondary mb-0">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.noPage)}</p>}
      {pageGroups}
    </ContentBox>
  )
}
