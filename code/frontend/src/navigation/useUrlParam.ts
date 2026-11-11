import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router'

/**
 * Wie eine Änderung in die Adresse geht:
 * - `PUSH`: ein neuer Eintrag im Verlauf, z. B. eine andere Seite, eine andere Dateiart, ein Filter. Zurück im Browser
 *   führt wieder auf den Stand davor.
 * - `REPLACE`: der Eintrag wird ersetzt, z. B. beim Tippen in ein Suchfeld. Zurück führt nicht durch jede Taste.
 */
export type UrlParamChange = 'PUSH' | 'REPLACE'

/**
 * Ändert mehrere Parameter der Adresse in einem Schritt, z. B. `{ fileClass: 'FOTO', page: null }`. `null` oder leer
 * nimmt einen Parameter heraus; alle anderen Parameter und der Router-State (also auch der Origin) bleiben.
 */
export type UrlParamsChanger = (changedValuesByName: Record<string, string | null>, change: UrlParamChange) => void

/** Rückmeldung von {@link useUrlParam}: der Wert aus der Adresse und die Funktion zum Ändern. */
export type UrlParam = {
  /** Der Wert, `null` wenn der Parameter fehlt. */
  value: string | null
  /** Setzt nur diesen Parameter, siehe {@link UrlParamsChanger}. */
  changeValue: (changedValue: string | null, change: UrlParamChange) => void
}

/**
 * Die Seite einer Liste in der Adresse (ab 1, wie man sie liest, z. B. `?page=2`) als Seite ab 0; fehlt sie oder ist
 * sie unbrauchbar, die erste.
 */
export function parseUrlPage(urlPageText: string | null): number {
  if (urlPageText === null) {
    return 0
  }
  const pageNumber = Number.parseInt(urlPageText, 10)
  if (!Number.isFinite(pageNumber) || pageNumber < 1) {
    return 0
  }
  return pageNumber - 1
}

/** Eine Seite ab 0 so, wie sie in der Adresse steht (ab 1); die erste Seite lässt den Parameter weg (`null`). */
export function formatUrlPage(page: number): string | null {
  if (page <= 0) {
    return null
  }
  const pageNumber = page + 1
  return String(pageNumber)
}

/**
 * Der Zustand einer Ansicht als Parameter in der Adresse, z. B. `?fileClass=FOTO&page=2`. So stellt jede Adresse ihren
 * Zustand sicher wieder her: Neuladen, Lesezeichen, Link weitergeben, vor und zurück im Browser. Anders als in der
 * Vorlage bleibt beim Ändern der Router-State erhalten, also auch der Origin der Seite.
 */
export function useUrlParamsChanger(): UrlParamsChanger {
  const [, setSearchParams] = useSearchParams()
  const location = useLocation()
  const currentRouterState: unknown = location.state

  return useCallback(
    (changedValuesByName: Record<string, string | null>, change: UrlParamChange) => {
      const replace = change === 'REPLACE'
      setSearchParams(
        (currentSearchParams) => {
          const changedSearchParams = new URLSearchParams(currentSearchParams)
          for (const [name, changedValue] of Object.entries(changedValuesByName)) {
            if (changedValue === null || changedValue === '') {
              changedSearchParams.delete(name)
            } else {
              changedSearchParams.set(name, changedValue)
            }
          }
          return changedSearchParams
        },
        { replace, state: currentRouterState },
      )
    },
    [setSearchParams, currentRouterState],
  )
}

/** Ein einzelner Parameter der Adresse, siehe {@link useUrlParamsChanger}. */
export function useUrlParam(name: string): UrlParam {
  const [searchParams] = useSearchParams()
  const changeUrlParams = useUrlParamsChanger()
  const value = searchParams.get(name)

  const changeValue = useCallback(
    (changedValue: string | null, change: UrlParamChange) => {
      changeUrlParams({ [name]: changedValue }, change)
    },
    [name, changeUrlParams],
  )

  return { value, changeValue }
}
