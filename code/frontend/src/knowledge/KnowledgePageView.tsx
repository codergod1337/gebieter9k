import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { KnowledgeContent } from './content/KnowledgeContent.ts'
import { KnowledgeContentError } from './content/KnowledgeContentError.ts'
import { KNOWLEDGE_CONTENT_FORMAT_VERSION } from './content/knowledgeContentFormat.ts'
import { KnowledgeContentReader } from './content/KnowledgeContentReader.ts'
import { KnowledgeContentView } from './content/KnowledgeContentView.tsx'
import { useKnowledgeContext } from './Knowledge.tsx'
import { getKnowledgePagesOfChapter } from './KnowledgeBase.ts'
import { findKnowledgeChapter, findKnowledgeRubric, getKnowledgePathSegment } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'
import { getKnowledgePageText, type KnowledgePageDocument } from './page/KnowledgePageDocument.ts'
import { useKnowledgePage } from './page/useKnowledgePage.ts'

/** Eine geladene Seite samt der id, für die sie geladen wurde: So zeigt die Anzeige nie den Inhalt einer anderen Seite. */
type LoadedKnowledgePage = {
  knowledgePageId: string
  knowledgePageDocument: KnowledgePageDocument
}

/** Was aus dem Inhalt einer Seite geworden ist: die Bausteine zum Zeichnen oder der Grund, warum er sich nicht lesen ließ. */
type ReadKnowledgeContent = {
  content: KnowledgeContent | null
  problem: string | null
}

/**
 * Eine Seite der Wissensdatenbank unter `/wissen/<Rubrik>/<Kapitel>/<Seite>`, z. B.
 * `/wissen/mathe/grundlagen/koordinatentransformation`. Die Adresse nennt die Keys; welche Seite das ist, steht in der
 * Liste, die das Modul geladen hat. Den Inhalt holt die Seite selbst (ein Dokument des Solr-Kerns `KNOWLEDGE`) und
 * zeichnet ihn aus seinen Bausteinen. Gibt es Rubrik, Kapitel oder Seite nicht, steht dort ein Hinweis.
 */
export function KnowledgePageView() {
  const { rubricPathSegment, chapterPathSegment, pagePathSegment } = useParams()
  const knowledgeContext = useKnowledgeContext()
  const knowledgePageHook = useKnowledgePage()
  const getPublishedKnowledgePage = knowledgePageHook.getPublishedKnowledgePage
  const knowledgeBase = knowledgeContext.knowledgeBase
  const [loadedKnowledgePage, setLoadedKnowledgePage] = useState<LoadedKnowledgePage | null>(null)

  // welche Seite die Adresse meint: aus der Liste des Moduls, ohne Request
  let rubricFound = false
  let chapterFound = false
  let knowledgePageId: string | null = null
  if (knowledgeBase !== null) {
    const fieldNames = knowledgeBase.fieldNames
    const knowledgeRubric = findKnowledgeRubric(knowledgeBase.knowledgeSections, rubricPathSegment)
    if (knowledgeRubric !== null) {
      rubricFound = true
      const knowledgeChapter = findKnowledgeChapter(knowledgeBase.knowledgeSections, knowledgeRubric.rubricKey, chapterPathSegment)
      if (knowledgeChapter !== null && knowledgeChapter.chapterKey !== null) {
        chapterFound = true
        const knowledgePagesOfChapter = getKnowledgePagesOfChapter(knowledgeBase, knowledgeRubric.rubricKey, knowledgeChapter.chapterKey)
        const knowledgePageOfAddress = knowledgePagesOfChapter.find((knowledgePage) => {
          const pageKey = getKnowledgePageText(knowledgePage, fieldNames.pageKey)
          return pageKey !== null && getKnowledgePathSegment(pageKey) === pagePathSegment
        })
        if (knowledgePageOfAddress !== undefined) {
          knowledgePageId = getKnowledgePageText(knowledgePageOfAddress, fieldNames.id)
        }
      }
    }
  }

  useEffect(() => {
    if (knowledgePageId === null) {
      return
    }
    const requestedKnowledgePageId = knowledgePageId
    let stillShown = true
    void getPublishedKnowledgePage(requestedKnowledgePageId).then((knowledgePageDocument) => {
      if (stillShown && knowledgePageDocument !== null) {
        setLoadedKnowledgePage({ knowledgePageId: requestedKnowledgePageId, knowledgePageDocument })
      }
    })
    return () => {
      stillShown = false
    }
  }, [knowledgePageId, getPublishedKnowledgePage])

  let shownKnowledgePageDocument: KnowledgePageDocument | null = null
  if (loadedKnowledgePage !== null && loadedKnowledgePage.knowledgePageId === knowledgePageId) {
    shownKnowledgePageDocument = loadedKnowledgePage.knowledgePageDocument
  }
  let contentFieldName: string | null = null
  let contentFormatVersionFieldName: string | null = null
  if (knowledgeBase !== null) {
    contentFieldName = knowledgeBase.fieldNames.content
    contentFormatVersionFieldName = knowledgeBase.fieldNames.contentFormatVersion
  }

  const readKnowledgeContent = useMemo((): ReadKnowledgeContent | null => {
    if (shownKnowledgePageDocument === null || contentFieldName === null || contentFormatVersionFieldName === null) {
      return null
    }
    const contentFormatVersion = shownKnowledgePageDocument[contentFormatVersionFieldName]
    if (typeof contentFormatVersion === 'number' && contentFormatVersion > KNOWLEDGE_CONTENT_FORMAT_VERSION) {
      const problem = getTextInCurrentLanguageWithValues(KNOWLEDGE_TEXTS.unknownContentFormat, {
        version: String(contentFormatVersion),
      })
      return { content: null, problem }
    }
    const contentText = getKnowledgePageText(shownKnowledgePageDocument, contentFieldName) ?? ''
    const knowledgeContentReader = new KnowledgeContentReader()
    try {
      const content = knowledgeContentReader.readContent(contentText)
      return { content, problem: null }
    } catch (caughtError) {
      let reason = String(caughtError)
      if (caughtError instanceof KnowledgeContentError) {
        reason = caughtError.message
      }
      const problem = getTextInCurrentLanguageWithValues(KNOWLEDGE_TEXTS.unreadableContent, { reason })
      return { content: null, problem }
    }
  }, [shownKnowledgePageDocument, contentFieldName, contentFormatVersionFieldName])

  if (knowledgeBase === null) {
    return <LoadStatus errorMessage={knowledgeContext.errorMessage} isLoading={knowledgeContext.errorMessage === null} />
  }
  if (!rubricFound) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownRubric)}</p>
  }
  if (!chapterFound) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownChapter)}</p>
  }
  if (knowledgePageId === null) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownPage)}</p>
  }
  if (readKnowledgeContent === null) {
    let pageErrorMessage: string | null = null
    if (knowledgePageHook.error !== null) {
      pageErrorMessage = knowledgePageHook.error.detail
    }
    return <LoadStatus errorMessage={pageErrorMessage} isLoading={pageErrorMessage === null} />
  }
  if (readKnowledgeContent.content === null) {
    return <p className="text-danger">{readKnowledgeContent.problem}</p>
  }
  return <KnowledgeContentView content={readKnowledgeContent.content} />
}
