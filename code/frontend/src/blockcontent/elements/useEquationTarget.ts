import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { getEquationAnchorId, readEquationGuidFromHash } from '../equationAnchor.ts'
import { createSearchWithOpenCollapsibles, findCollapsibleGuidsAroundEquation, useCollapsibleOpenState } from './collapsibleState.ts'
import type { ContentElement, EquationElement } from './ContentElement.ts'

/**
 * Macht aus dem Anker der Adresse (`#eq-<guid>`) das Ziel im Inhalt: Steckt die gemeinte Gleichung in geschlossenen
 * Aufklappern, werden sie geöffnet (die Adresse behält dabei ihren Anker); steht sie da, rollt die Seite zu ihr.
 * Zurück kommt die Kennung der gemeinten Gleichung, damit ihre Anzeige sich hervorhebt; `null`, wenn die Adresse keine
 * Gleichung dieses Inhalts meint.
 *
 * @param contentDrawn ob die Elemente schon gezeichnet sind (erst dann gibt es etwas, zu dem die Seite rollen kann)
 */
export function useEquationTarget(elements: ContentElement[], equations: EquationElement[], contentDrawn: boolean): string | null {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsibleOpenState = useCollapsibleOpenState()
  const openCollapsibleGuids = collapsibleOpenState.openCollapsibleGuids
  const hash = location.hash
  const search = location.search
  const routerState: unknown = location.state

  let targetedEquationGuid: string | null = null
  const equationGuidOfHash = readEquationGuidFromHash(hash)
  if (equationGuidOfHash !== null && equations.some((equation) => equation.guid === equationGuidOfHash)) {
    targetedEquationGuid = equationGuidOfHash
  }
  let closedCollapsibleGuids: string[] = []
  if (targetedEquationGuid !== null) {
    const collapsibleGuidsAround = findCollapsibleGuidsAroundEquation(elements, targetedEquationGuid) ?? []
    closedCollapsibleGuids = collapsibleGuidsAround.filter((collapsibleGuid) => !openCollapsibleGuids.includes(collapsibleGuid))
  }
  const closedCollapsibleGuidsText = closedCollapsibleGuids.join(',')
  const openCollapsibleGuidsText = openCollapsibleGuids.join(',')

  useEffect(() => {
    if (targetedEquationGuid === null || !contentDrawn) {
      return
    }
    if (closedCollapsibleGuidsText !== '') {
      // erst aufklappen, was die Gleichung verbirgt; der Anker bleibt in der Adresse
      const guidsToOpen = closedCollapsibleGuidsText.split(',')
      const alreadyOpenGuids = openCollapsibleGuidsText === '' ? [] : openCollapsibleGuidsText.split(',')
      const searchWithOpenCollapsibles = createSearchWithOpenCollapsibles(search, [...alreadyOpenGuids, ...guidsToOpen])
      void navigate({ search: searchWithOpenCollapsibles, hash }, { replace: true, state: routerState })
      return
    }
    const equationAnchorId = getEquationAnchorId(targetedEquationGuid)
    const equationRow = document.getElementById(equationAnchorId)
    if (equationRow !== null) {
      equationRow.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [targetedEquationGuid, contentDrawn, closedCollapsibleGuidsText, openCollapsibleGuidsText, search, hash, routerState, navigate])

  return targetedEquationGuid
}
