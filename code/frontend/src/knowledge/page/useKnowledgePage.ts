import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { KnowledgePageDocument, KnowledgePageResolveRequest, KnowledgeSolrFieldNameSet } from './KnowledgePageDocument.ts'

/**
 * Was {@link useKnowledgePage} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/share/knowledge-page` (Lesen ohne Anmeldung, nur veröffentlichte Seiten) und `/api/admin/knowledge-page` (Pflege,
 * nur ADMIN, jeder Status) eine Funktion, benannt wie die Methode im `KnowledgePageService`. Bei einem Fehler kommt
 * `null`, der Fehler steht dann in `error`.
 */
export type KnowledgePageHook = ApiHookState & {
  getKnowledgeSolrFieldNameSet: () => Promise<KnowledgeSolrFieldNameSet | null>
  getPublishedKnowledgePage: (knowledgePageId: string) => Promise<KnowledgePageDocument | null>
  resolvePublishedKnowledgePages: (resolveRequest: KnowledgePageResolveRequest) => Promise<KnowledgePageDocument[] | null>
  getKnowledgePage: (knowledgePageId: string) => Promise<KnowledgePageDocument | null>
  resolveKnowledgePages: (resolveRequest: KnowledgePageResolveRequest) => Promise<KnowledgePageDocument[] | null>
  changeKnowledgePage: (knowledgePageId: string, fieldValuesByFieldName: KnowledgePageDocument) => Promise<KnowledgePageDocument | null>
}

/** Die Seiten der Wissensdatenbank zum Lesen, die Requests gehen über das API-Modul. */
export function useKnowledgePage(): KnowledgePageHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** READ: Wie die Felder einer Seite im Kern heißen. */
  const getKnowledgeSolrFieldNameSet = useCallback(() => {
    return sendForData<KnowledgeSolrFieldNameSet>({ method: 'GET', path: '/api/share/knowledge-page/field-name-set' })
  }, [sendForData])

  /** READ: Eine veröffentlichte Seite samt Inhalt über ihre id. */
  const getPublishedKnowledgePage = useCallback((knowledgePageId: string) => {
    const knowledgePagePath = '/api/share/knowledge-page/' + encodeURIComponent(knowledgePageId)
    return sendForData<KnowledgePageDocument>({ method: 'GET', path: knowledgePagePath })
  }, [sendForData])

  /** READ: Löst veröffentlichte Seiten auf, ohne Inhalt, nach ihrem Platz sortiert. */
  const resolvePublishedKnowledgePages = useCallback((resolveRequest: KnowledgePageResolveRequest) => {
    return sendForData<KnowledgePageDocument[]>({
      method: 'POST',
      path: '/api/share/knowledge-page/resolve',
      body: resolveRequest,
    })
  }, [sendForData])

  /** READ (ADMIN): Eine Seite samt Inhalt über ihre id, in jedem Status. */
  const getKnowledgePage = useCallback((knowledgePageId: string) => {
    const knowledgePagePath = '/api/admin/knowledge-page/' + encodeURIComponent(knowledgePageId)
    return sendForData<KnowledgePageDocument>({ method: 'GET', path: knowledgePagePath })
  }, [sendForData])

  /** READ (ADMIN): Löst Seiten auf, in jedem Status, ohne Inhalt, nach ihrem Platz sortiert. */
  const resolveKnowledgePages = useCallback((resolveRequest: KnowledgePageResolveRequest) => {
    return sendForData<KnowledgePageDocument[]>({
      method: 'POST',
      path: '/api/admin/knowledge-page/resolve',
      body: resolveRequest,
    })
  }, [sendForData])

  /**
   * UPDATE (ADMIN): Ändert eine Seite: nur die genannten Felder, ein leerer Wert nimmt das Feld heraus. Liefert die
   * Seite nach der Änderung.
   */
  const changeKnowledgePage = useCallback((knowledgePageId: string, fieldValuesByFieldName: KnowledgePageDocument) => {
    const knowledgePageChangeRequest = { id: knowledgePageId, fieldValuesByFieldName }
    return sendForData<KnowledgePageDocument>({
      method: 'PUT',
      path: '/api/admin/knowledge-page',
      body: knowledgePageChangeRequest,
    })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    getKnowledgeSolrFieldNameSet,
    getPublishedKnowledgePage,
    resolvePublishedKnowledgePages,
    getKnowledgePage,
    resolveKnowledgePages,
    changeKnowledgePage,
  }
}
