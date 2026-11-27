/** Der Einstieg des Wissensmanagers (nur ADMIN); er springt zum Reiter „Gliederung“. */
export const KNOWLEDGE_MANAGER_PATH = '/knowledge-manager'

/** Der Reiter „Gliederung“: Rubriken, Kapitel und Unterkapitel der Wissensdatenbank. */
export const KNOWLEDGE_SECTION_TAB_PATH = '/knowledge-manager/section'

/** Der Reiter „Seiten“: alle Seiten der Wissensdatenbank, in jedem Status. */
export const KNOWLEDGE_PAGE_TAB_PATH = '/knowledge-manager/page'

/** Der Editor einer Seite, z. B. `/knowledge-manager/page/01a2…_de`. */
export function getKnowledgePageEditorPath(knowledgePageId: string): string {
  return KNOWLEDGE_PAGE_TAB_PATH + '/' + encodeURIComponent(knowledgePageId)
}
