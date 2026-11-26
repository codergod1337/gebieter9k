import { Outlet } from 'react-router'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { KNOWLEDGE_CHAPTERS } from './knowledgeChapters.ts'
import { getKnowledgeChapterPath } from './knowledgePaths.ts'
import { KNOWLEDGE_TEXTS } from './knowledgeTexts.ts'

/**
 * Das Modul „Wissensdatenbank“ (Konzept `docu/konzept-wissensdatenbank.md`): ein interaktives Lernskript, OHNE
 * Anmeldung erreichbar unter `/wissen`. Im Subheader steht je Kapitel ein Reiter, darunter die Übersicht des Kapitels
 * oder eine seiner Seiten.
 *
 * Die Kapitel und ihre Seiten stehen vorerst im Code ({@link KNOWLEDGE_CHAPTERS}); später kommen die Seiten aus einem
 * eigenen Solr-Kern.
 */
export function Knowledge() {
  const tabs: SubheaderTab[] = []
  for (const knowledgeChapter of KNOWLEDGE_CHAPTERS) {
    const chapterLabel = getTextInCurrentLanguage(knowledgeChapter.title)
    const chapterPath = getKnowledgeChapterPath(knowledgeChapter.pathSegment)
    tabs.push({ label: chapterLabel, iconClassName: knowledgeChapter.iconClassName, to: chapterPath })
  }
  const subheaderStatus = (
    <>
      <i className="bi bi-mortarboard me-2"></i>
      {getTextInCurrentLanguage(KNOWLEDGE_TEXTS.moduleTitle)}
    </>
  )

  return (
    <>
      <Subheader status={subheaderStatus} tabs={tabs} />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  )
}
