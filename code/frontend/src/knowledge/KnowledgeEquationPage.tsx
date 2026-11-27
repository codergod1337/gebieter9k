import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { getEquationHash } from '../blockcontent/equationAnchor.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useKnowledgeContext } from './Knowledge.tsx'
import { getKnowledgePagePath } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'
import { getKnowledgePageText } from './page/KnowledgePageDocument.ts'
import { useKnowledgePage } from './page/useKnowledgePage.ts'

/**
 * Der Sprung zu einer Gleichung über ihre GUID, unter `/wissen/gleichung/<guid>` (Nutzer 2026-11-27: „wenn ich eine
 * gleichung habe, kann ich die seite mit der gleichungsguid auflösen und dann direkt zu der jeweiligen gleichung
 * springen“): Die Seite fragt das Backend, in welcher veröffentlichten Wissensseite die Gleichung steht
 * (`POST /api/share/knowledge-page/resolve` mit `equationGuid`), und geht ohne eigenen Eintrag im Verlauf dorthin, mit
 * dem Anker der Gleichung in der Adresse. Gibt es keine solche Seite, steht das da.
 */
export function KnowledgeEquationPage() {
  const { equationGuid } = useParams()
  const knowledgeContext = useKnowledgeContext()
  const knowledgePageHook = useKnowledgePage()
  const navigate = useNavigate()
  const resolvePublishedKnowledgePages = knowledgePageHook.resolvePublishedKnowledgePages
  const knowledgeBase = knowledgeContext.knowledgeBase
  /** Die GUID, für die das Backend keine Seite gefunden hat; solange sie zur Adresse passt, steht der Hinweis da. */
  const [notFoundEquationGuid, setNotFoundEquationGuid] = useState<string | null>(null)

  useEffect(() => {
    if (equationGuid === undefined || knowledgeBase === null) {
      return
    }
    const fieldNames = knowledgeBase.fieldNames
    let stillShown = true
    void resolvePublishedKnowledgePages({ equationGuid }).then((knowledgePages) => {
      if (!stillShown) {
        return
      }
      const knowledgePage = knowledgePages !== null && knowledgePages.length > 0 ? knowledgePages[0] : null
      let pagePath: string | null = null
      if (knowledgePage !== null) {
        const rubricKey = getKnowledgePageText(knowledgePage, fieldNames.rubricKey)
        const chapterKey = getKnowledgePageText(knowledgePage, fieldNames.chapterKey)
        const pageKey = getKnowledgePageText(knowledgePage, fieldNames.pageKey)
        if (rubricKey !== null && chapterKey !== null && pageKey !== null) {
          pagePath = getKnowledgePagePath(rubricKey, chapterKey, pageKey)
        }
      }
      if (pagePath === null) {
        setNotFoundEquationGuid(equationGuid)
        return
      }
      void navigate({ pathname: pagePath, hash: getEquationHash(equationGuid) }, { replace: true })
    })
    return () => {
      stillShown = false
    }
  }, [equationGuid, knowledgeBase, resolvePublishedKnowledgePages, navigate])

  if (knowledgeBase === null) {
    return <LoadStatus errorMessage={knowledgeContext.errorMessage} isLoading={knowledgeContext.errorMessage === null} />
  }
  if (equationGuid !== undefined && notFoundEquationGuid === equationGuid) {
    return <p className="text-body-secondary">{getTextInCurrentLanguage(KNOWLEDGE_TEXTS.unknownEquation)}</p>
  }
  let resolveErrorMessage: string | null = null
  if (knowledgePageHook.error !== null) {
    resolveErrorMessage = knowledgePageHook.error.detail
  }
  return <LoadStatus errorMessage={resolveErrorMessage} isLoading={resolveErrorMessage === null} />
}
