import { Outlet } from 'react-router'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { KNOWLEDGE_MANAGER_ICON_CLASS_NAME } from './knowledgeManagerIcon.ts'
import { KNOWLEDGE_SECTION_TAB_PATH } from './knowledgeManagerPaths.ts'
import { KNOWLEDGE_MANAGER_TEXTS } from './knowledgeManagerTexts.ts'
import { KNOWLEDGE_SECTION_TEXTS } from './section/knowledgeSectionTexts.ts'

/** Die Reiter des Moduls. Bisher die Gliederung; die Seiten und ihr Editor kommen dazu. */
const KNOWLEDGE_MANAGER_TABS: SubheaderTab[] = [
  {
    label: getTextInCurrentLanguage(KNOWLEDGE_SECTION_TEXTS.tabLabel),
    iconClassName: 'bi bi-diagram-3',
    to: KNOWLEDGE_SECTION_TAB_PATH,
  },
]

/**
 * Das Modul „Wissensmanager“ (Nutzer 2026-11-27), nur ADMIN: Hier pflegt der Admin die Wissensdatenbank, so wie ein
 * kleines Wikipedia, in dem nur er schreibt und alle lesen. Subheader mit den Reitern, darunter der gewählte Reiter.
 * Gelesen wird die Wissensdatenbank im Modul `knowledge` (`/wissen`), auch ohne Anmeldung.
 */
export function KnowledgeManager() {
  const subheaderIconClasses = KNOWLEDGE_MANAGER_ICON_CLASS_NAME + ' me-2'
  const subheaderStatus = (
    <>
      <i className={subheaderIconClasses}></i>
      {getTextInCurrentLanguage(KNOWLEDGE_MANAGER_TEXTS.moduleTitle)}
    </>
  )
  return (
    <>
      <Subheader status={subheaderStatus} tabs={KNOWLEDGE_MANAGER_TABS} />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  )
}
