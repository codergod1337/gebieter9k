import { useCallback } from 'react'
import type { ApiHookState } from '../../api/ApiHookState.ts'
import { useApiRequest } from '../../api/useApiRequest.ts'
import type { KnowledgeSection, NewKnowledgeSection } from './KnowledgeSection.ts'

/**
 * Was {@link useKnowledgeSection} anbietet: den einheitlichen {@link ApiHookState} und je Endpunkt von
 * `/api/share/knowledge-section` (die Liste, ohne Anmeldung) und `/api/admin/knowledge-section` (Pflege, nur ADMIN)
 * eine Funktion, benannt wie die Methode im `KnowledgeSectionService` des Backends.
 *
 * Anlegen und Umbenennen liefern den Punkt, Lesen das Objekt bzw. die Liste, das Ändern eines Keys und der Reihenfolge
 * die ganze Gliederung. Bei einem Fehler kommt `null`, der Fehler
 * steht dann in `error`. Ein DELETE gibt es im Backend noch nicht.
 */
export type KnowledgeSectionHook = ApiHookState & {
  createKnowledgeSection: (newKnowledgeSection: NewKnowledgeSection) => Promise<KnowledgeSection | null>
  getKnowledgeSection: (knowledgeSectionId: number) => Promise<KnowledgeSection | null>
  getAllKnowledgeSection: () => Promise<KnowledgeSection[] | null>
  changeKnowledgeSection: (changedKnowledgeSection: KnowledgeSection) => Promise<KnowledgeSection | null>
  changeKnowledgeSectionKey: (knowledgeSectionId: number, changedKey: string) => Promise<KnowledgeSection[] | null>
  changeKnowledgeSectionListingPositions: (knowledgeSectionIdsInOrder: number[]) => Promise<KnowledgeSection[] | null>
}

/** Alle Endpunkte der Gliederung der Wissensdatenbank, die Requests gehen über das API-Modul. */
export function useKnowledgeSection(): KnowledgeSectionHook {
  const apiRequestHook = useApiRequest()
  const sendForData = apiRequestHook.sendForData

  /** CREATE: Legt eine Rubrik, ein Kapitel oder ein Unterkapitel am Ende seiner Geschwister an und liefert den Punkt. */
  const createKnowledgeSection = useCallback((newKnowledgeSection: NewKnowledgeSection) => {
    return sendForData<KnowledgeSection>({ method: 'POST', path: '/api/admin/knowledge-section', body: newKnowledgeSection })
  }, [sendForData])

  /** READ: Ein Punkt über seine id. */
  const getKnowledgeSection = useCallback((knowledgeSectionId: number) => {
    const knowledgeSectionPath = '/api/admin/knowledge-section/' + knowledgeSectionId
    return sendForData<KnowledgeSection>({ method: 'GET', path: knowledgeSectionPath })
  }, [sendForData])

  /** READ: Die ganze Gliederung, nach dem Platz unter den Geschwistern; geht ohne Anmeldung. */
  const getAllKnowledgeSection = useCallback(() => {
    return sendForData<KnowledgeSection[]>({ method: 'GET', path: '/api/share/knowledge-section' })
  }, [sendForData])

  /** UPDATE: Ändert den Anzeigenamen und liefert den Punkt. Der Body ist das volle Objekt, Keys und Platz bleiben. */
  const changeKnowledgeSection = useCallback((changedKnowledgeSection: KnowledgeSection) => {
    return sendForData<KnowledgeSection>({ method: 'PUT', path: '/api/admin/knowledge-section', body: changedKnowledgeSection })
  }, [sendForData])

  /**
   * UPDATE: Ändert den Key eines Punkts; alles darunter bekommt ihn mit. Liefert die ganze Gliederung.
   */
  const changeKnowledgeSectionKey = useCallback((knowledgeSectionId: number, changedKey: string) => {
    const knowledgeSectionKeyChange = { knowledgeSectionId, key: changedKey }
    return sendForData<KnowledgeSection[]>({
      method: 'PUT',
      path: '/api/admin/knowledge-section/key',
      body: knowledgeSectionKeyChange,
    })
  }, [sendForData])

  /** UPDATE: Die neue Reihenfolge von Geschwistern, jede id genau einmal. Liefert die ganze Gliederung. */
  const changeKnowledgeSectionListingPositions = useCallback((knowledgeSectionIdsInOrder: number[]) => {
    const knowledgeSectionListingOrder = { knowledgeSectionIdsInOrder }
    return sendForData<KnowledgeSection[]>({
      method: 'PUT',
      path: '/api/admin/knowledge-section/listing-position',
      body: knowledgeSectionListingOrder,
    })
  }, [sendForData])

  return {
    isLoading: apiRequestHook.isLoading,
    error: apiRequestHook.error,
    createKnowledgeSection,
    getKnowledgeSection,
    getAllKnowledgeSection,
    changeKnowledgeSection,
    changeKnowledgeSectionKey,
    changeKnowledgeSectionListingPositions,
  }
}
