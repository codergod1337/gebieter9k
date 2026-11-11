import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { createOriginState, type Origin, type OriginState, readHistoryIndex, readOrigin } from './origin.ts'

/** Rückmeldung von {@link useOrigin}. */
export type OriginNavigation = {
  /** Der mitgegebene Origin, `null` auf einem Tab oder nach direktem Aufruf der Adresse. */
  origin: Origin | null
  /** Der State für eine Unterseite, die man von dieser Seite aus öffnet, mit dieser Seite als Origin. */
  createOriginStateHere: (label: string) => OriginState
  /**
   * Zurück zum Origin: im Verlauf des Browsers dorthin springen, wenn er dort noch steht, sonst die Adresse des Origins
   * mit seinem State öffnen. Ohne Origin geht es zu `fallbackPath`, z. B. dem Tab, zu dem die Seite gehört.
   */
  goBackToOrigin: (fallbackPath: string) => void
  /** Ob der Origin genau diese Seite (Pfad ohne Parameter) ist, z. B. um ein „Details“ als Zurück zu nutzen. */
  isOriginPathname: (pathname: string) => boolean
}

/** Der Pfad einer Adresse ohne Parameter und Anker. */
function getPathnameOf(path: string): string {
  const pathWithoutHash = path.split('#')[0]
  const pathWithoutSearch = pathWithoutHash.split('?')[0]
  return pathWithoutSearch
}

/**
 * Alles zum Origin an einer Stelle: lesen, für eine Unterseite mitgeben und zurückspringen. Jede Seite mit Unterseiten
 * gibt beim Öffnen `createOriginStateHere('<Name der Seite>')` mit; jede Unterseite führt mit `goBackToOrigin` zurück
 * (Abbrechen, nach dem Speichern, nach dem Löschen). Tabs im Subheader geben keinen Origin mit.
 */
export function useOrigin(): OriginNavigation {
  const location = useLocation()
  const navigate = useNavigate()
  const origin = readOrigin(location.state)
  const currentPath = location.pathname + location.search
  const currentRouterState: unknown = location.state

  const createOriginStateHere = useCallback(
    (label: string) => createOriginState(currentPath, label, currentRouterState),
    [currentPath, currentRouterState],
  )

  const goBackToOrigin = useCallback(
    (fallbackPath: string) => {
      if (origin === null) {
        navigate(fallbackPath)
        return
      }
      const currentHistoryIndex = readHistoryIndex()
      // Steht der Origin vor uns im Verlauf, dorthin springen: Die Seite kommt mit ihrer Adresse, ihrem State und ihrer
      // Scrollhöhe zurück, und vor und zurück im Browser bleiben stimmig
      if (origin.historyIndex !== null && currentHistoryIndex !== null && origin.historyIndex < currentHistoryIndex) {
        const historyDelta = origin.historyIndex - currentHistoryIndex
        navigate(historyDelta)
        return
      }
      navigate(origin.path, { state: origin.state })
    },
    [origin, navigate],
  )

  const isOriginPathname = useCallback(
    (pathname: string) => {
      if (origin === null) {
        return false
      }
      const originPathname = getPathnameOf(origin.path)
      return originPathname === pathname
    },
    [origin],
  )

  return { origin, createOriginStateHere, goBackToOrigin, isOriginPathname }
}
