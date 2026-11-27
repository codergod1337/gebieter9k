import { useCallback } from 'react'
import { Outlet, useOutletContext } from 'react-router'
import { useLoadedData } from '../api/useLoadedData.ts'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { DEFAULT_LANGUAGE } from '../language/activeLanguages.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { KnowledgeBase } from './KnowledgeBase.ts'
import { KNOWLEDGE_ICON_CLASS_NAME } from './knowledgeIcon.ts'
import { getKnowledgeRubricPath } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'
import { useKnowledgePage } from './page/useKnowledgePage.ts'
import { getKnowledgeRubrics } from './section/knowledgeSectionTree.ts'
import { useKnowledgeSection } from './section/useKnowledgeSection.ts'

/** Was die Wissensdatenbank ihren Seiten mitgibt. */
export type KnowledgeContext = {
  /** Gliederung, Feldnamen und die Liste der Seiten; `null`, solange sie laden oder nach einem Fehler. */
  knowledgeBase: KnowledgeBase | null
  /** Fehler beim Laden, `null` wenn keiner. */
  errorMessage: string | null
}

/** Für die Seiten der Wissensdatenbank: was das Modul geladen hat. */
export function useKnowledgeContext(): KnowledgeContext {
  return useOutletContext<KnowledgeContext>()
}

/**
 * Das Modul „Wissensdatenbank“ (Konzept `docu/konzept-wissensdatenbank.md`): ein interaktives Lernskript, OHNE
 * Anmeldung erreichbar unter `/wissen`. Im Subheader steht je Rubrik ein Reiter (Mathe, Physik, …), darunter die
 * Übersicht der Rubrik, eines Kapitels oder eine Seite. Hinein führt die Kachel „Wissensdatenbank“: auf der Startseite
 * und, für Besucher ohne Konto, auf der Login-Seite (`home/homeTiles.ts`).
 *
 * Alles kommt vom Backend, ohne Token: die Gliederung aus Postgres (`/api/share/knowledge-section`) und die Seiten aus
 * dem Solr-Kern `KNOWLEDGE` (`/api/share/knowledge-page/…`), je Seite ein Dokument. Das Modul lädt einmal die
 * Gliederung, die Namen der Felder und die Liste der veröffentlichten Seiten ohne Inhalt.
 */
export function Knowledge() {
  const knowledgeSectionHook = useKnowledgeSection()
  const knowledgePageHook = useKnowledgePage()
  const resolvePublishedKnowledgePages = knowledgePageHook.resolvePublishedKnowledgePages
  const resolveAllPublishedKnowledgePages = useCallback(() => {
    return resolvePublishedKnowledgePages({ language: DEFAULT_LANGUAGE.code })
  }, [resolvePublishedKnowledgePages])
  const loadedKnowledgeSections = useLoadedData(knowledgeSectionHook.getAllKnowledgeSection)
  const loadedFieldNames = useLoadedData(knowledgePageHook.getKnowledgeSolrFieldNameSet)
  const loadedKnowledgePages = useLoadedData(resolveAllPublishedKnowledgePages)
  const knowledgeSections = loadedKnowledgeSections.data
  const fieldNames = loadedFieldNames.data
  const knowledgePages = loadedKnowledgePages.data

  let knowledgeBase: KnowledgeBase | null = null
  if (knowledgeSections !== null && fieldNames !== null && knowledgePages !== null) {
    knowledgeBase = { knowledgeSections, fieldNames, knowledgePages }
  }
  let errorMessage: string | null = null
  if (knowledgeSectionHook.error !== null) {
    errorMessage = knowledgeSectionHook.error.detail
  } else if (knowledgePageHook.error !== null) {
    errorMessage = knowledgePageHook.error.detail
  }

  const tabs: SubheaderTab[] = []
  const knowledgeRubrics = getKnowledgeRubrics(knowledgeSections ?? [])
  for (const knowledgeRubric of knowledgeRubrics) {
    const rubricLabel = getTextInCurrentLanguage(knowledgeRubric.displayName)
    const rubricPath = getKnowledgeRubricPath(knowledgeRubric.rubricKey)
    tabs.push({ label: rubricLabel, iconClassName: 'bi bi-journal-text', to: rubricPath })
  }
  const subheaderIconClasses = KNOWLEDGE_ICON_CLASS_NAME + ' me-2'
  const subheaderStatus = (
    <>
      <i className={subheaderIconClasses}></i>
      {getTextInCurrentLanguage(KNOWLEDGE_TEXTS.moduleTitle)}
    </>
  )
  const knowledgeContext: KnowledgeContext = { knowledgeBase, errorMessage }
  return (
    <>
      <Subheader status={subheaderStatus} tabs={tabs} />
      <div className="main-content">
        <Outlet context={knowledgeContext} />
      </div>
    </>
  )
}
