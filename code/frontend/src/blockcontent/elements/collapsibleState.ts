import { useUrlParam } from '../../navigation/useUrlParam.ts'
import type { ContentElement } from './ContentElement.ts'

/** Rückmeldung von {@link useCollapsibleOpenState}. */
export type CollapsibleOpenState = {
  /** Die Kennungen der Aufklapper, die gerade offen sind. */
  openCollapsibleGuids: string[]
  /** Öffnet einen geschlossenen Aufklapper und schließt einen offenen. */
  toggleCollapsible: (collapsibleGuid: string) => void
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
  let openCollapsibleGuids: string[] = []
  if (openUrlParam.value !== null && openUrlParam.value !== '') {
    openCollapsibleGuids = openUrlParam.value.split(ID_SEPARATOR)
  }

  function toggleCollapsible(collapsibleGuid: string) {
    let changedOpenGuids = [...openCollapsibleGuids, collapsibleGuid]
    if (openCollapsibleGuids.includes(collapsibleGuid)) {
      changedOpenGuids = openCollapsibleGuids.filter((openCollapsibleGuid) => openCollapsibleGuid !== collapsibleGuid)
    }
    let changedUrlValue: string | null = null
    if (changedOpenGuids.length > 0) {
      changedUrlValue = changedOpenGuids.join(ID_SEPARATOR)
    }
    openUrlParam.changeValue(changedUrlValue, 'REPLACE')
  }

  return { openCollapsibleGuids, toggleCollapsible }
}

/** Die Suchparameter einer Adresse, in denen genau diese Aufklapper offen sind; alle anderen Parameter bleiben. */
export function createSearchWithOpenCollapsibles(search: string, openCollapsibleGuids: string[]): string {
  const searchParams = new URLSearchParams(search)
  if (openCollapsibleGuids.length === 0) {
    searchParams.delete(OPEN_URL_PARAM)
  } else {
    searchParams.set(OPEN_URL_PARAM, openCollapsibleGuids.join(ID_SEPARATOR))
  }
  const searchText = searchParams.toString()
  if (searchText === '') {
    return ''
  }
  return '?' + searchText
}

/**
 * Die Kennungen der Aufklapper, in denen eine Gleichung steckt, von außen nach innen; leer, wenn sie in keinem steckt,
 * `null`, wenn es die Gleichung in diesen Elementen nicht gibt.
 */
export function findCollapsibleGuidsAroundEquation(elements: ContentElement[], equationGuid: string): string[] | null {
  for (const element of elements) {
    if (element.type === 'EQUATION' && element.guid === equationGuid) {
      return []
    }
    if (element.type === 'CONTENT_BOX' || element.type === 'COLLAPSIBLE') {
      const collapsibleGuidsInside = findCollapsibleGuidsAroundEquation(element.elements, equationGuid)
      if (collapsibleGuidsInside === null) {
        continue
      }
      if (element.type === 'COLLAPSIBLE') {
        return [element.guid, ...collapsibleGuidsInside]
      }
      return collapsibleGuidsInside
    }
  }
  return null
}

/** Die Kennungen der Gleichungen, die gerade zu sehen sind: alle außer denen in einem geschlossenen Aufklapper. */
export function getVisibleEquationGuids(elements: ContentElement[], openCollapsibleGuids: string[]): string[] {
  const visibleEquationGuids: string[] = []
  for (const element of elements) {
    if (element.type === 'EQUATION') {
      visibleEquationGuids.push(element.guid)
    } else if (element.type === 'CONTENT_BOX') {
      const nestedEquationGuids = getVisibleEquationGuids(element.elements, openCollapsibleGuids)
      visibleEquationGuids.push(...nestedEquationGuids)
    } else if (element.type === 'COLLAPSIBLE' && openCollapsibleGuids.includes(element.guid)) {
      const nestedEquationGuids = getVisibleEquationGuids(element.elements, openCollapsibleGuids)
      visibleEquationGuids.push(...nestedEquationGuids)
    }
  }
  return visibleEquationGuids
}
