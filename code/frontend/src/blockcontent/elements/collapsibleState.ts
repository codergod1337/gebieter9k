import { useUrlParam } from '../../navigation/useUrlParam.ts'
import type { ContentElement } from './ContentElement.ts'

/** Rückmeldung von {@link useCollapsibleOpenState}. */
export type CollapsibleOpenState = {
  /** Die Kennungen der Aufklapper, die gerade offen sind. */
  openCollapsibleIds: string[]
  /** Öffnet einen geschlossenen Aufklapper und schließt einen offenen. */
  toggleCollapsible: (collapsibleId: string) => void
}

/** In der Adresse: die offenen Aufklapper, ihre Kennungen mit Komma getrennt, z. B. `open=c1,c3`. */
const OPEN_URL_PARAM = 'open'
const ID_SEPARATOR = ','

/**
 * Welche Aufklapper eines Inhalts offen sind. Der Zustand steht in der Adresse, damit Neuladen und ein weitergegebener
 * Link dieselbe Ansicht zeigen; sind alle zu, fehlt der Parameter. Auf- und Zuklappen ersetzen den Eintrag im Verlauf
 * (REPLACE): Es ist ein Aufklappen innerhalb der Seite, „Zurück“ im Browser soll die Seite verlassen.
 */
export function useCollapsibleOpenState(): CollapsibleOpenState {
  const openUrlParam = useUrlParam(OPEN_URL_PARAM)
  let openCollapsibleIds: string[] = []
  if (openUrlParam.value !== null && openUrlParam.value !== '') {
    openCollapsibleIds = openUrlParam.value.split(ID_SEPARATOR)
  }

  function toggleCollapsible(collapsibleId: string) {
    let changedOpenIds = [...openCollapsibleIds, collapsibleId]
    if (openCollapsibleIds.includes(collapsibleId)) {
      changedOpenIds = openCollapsibleIds.filter((openCollapsibleId) => openCollapsibleId !== collapsibleId)
    }
    let changedUrlValue: string | null = null
    if (changedOpenIds.length > 0) {
      changedUrlValue = changedOpenIds.join(ID_SEPARATOR)
    }
    openUrlParam.changeValue(changedUrlValue, 'REPLACE')
  }

  return { openCollapsibleIds, toggleCollapsible }
}

/** Die Kennungen der Gleichungen, die gerade zu sehen sind: alle außer denen in einem geschlossenen Aufklapper. */
export function getVisibleEquationIds(elements: ContentElement[], openCollapsibleIds: string[]): string[] {
  const visibleEquationIds: string[] = []
  for (const element of elements) {
    if (element.type === 'EQUATION') {
      visibleEquationIds.push(element.id)
    } else if (element.type === 'BOX') {
      const nestedEquationIds = getVisibleEquationIds(element.elements, openCollapsibleIds)
      visibleEquationIds.push(...nestedEquationIds)
    } else if (element.type === 'COLLAPSIBLE' && openCollapsibleIds.includes(element.id)) {
      const nestedEquationIds = getVisibleEquationIds(element.elements, openCollapsibleIds)
      visibleEquationIds.push(...nestedEquationIds)
    }
  }
  return visibleEquationIds
}
