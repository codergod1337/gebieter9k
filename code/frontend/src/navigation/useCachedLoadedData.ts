import { useCallback, useEffect, useState } from 'react'
import type { LoadedData } from '../api/useLoadedData.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { createViewCacheKey, getCachedView, rememberView } from './viewCache.ts'

/** Die zuletzt geladenen Daten samt dem Schlüssel, zu dem sie gehören. */
type LoadedView<T> = {
  viewCacheKey: string
  data: T | null
}

/**
 * Wie `useLoadedData`, aber mit dem Zwischenspeicher der Ansichten ({@link getCachedView}): Kennt er die Anfrage schon
 * (z. B. Zurück aus einer Unterseite), stehen die Daten im ersten Bild da, ohne Request. Sonst lädt er und merkt sich
 * das Ergebnis. `reload` fragt immer das Backend, z. B. nach dem Speichern.
 *
 * Antworten auf eine ältere Anfrage überschreiben nie die aktuelle: Die Daten gehören immer zum aktuellen Schlüssel.
 *
 * @param scope der Bereich, z. B. `FILE_DOCUMENT`; Schreibvorgänge leeren ihn mit `clearViewCacheScope`
 * @param request alles, was die Daten bestimmt (z. B. `{ fileClassKey, page }`), als JSON-fähiger Wert
 * @param loadData eine stabile Lese-Funktion, die genau zu `request` passt; `null` als Ergebnis heißt Fehler
 */
export function useCachedLoadedData<T>(scope: string, request: unknown, loadData: () => Promise<T | null>): LoadedData<T> {
  const { session } = useCurrentSession()
  let usersGuid = ''
  if (session !== null) {
    usersGuid = session.users.guid
  }
  const viewCacheKey = createViewCacheKey(scope, usersGuid, request)
  const [loadedView, setLoadedView] = useState<LoadedView<T> | null>(null)

  const reload = useCallback(async () => {
    const loadedData = await loadData()
    if (loadedData !== null) {
      rememberView(scope, viewCacheKey, loadedData)
    }
    setLoadedView({ viewCacheKey, data: loadedData })
  }, [loadData, scope, viewCacheKey])

  useEffect(() => {
    const cachedData = getCachedView<T>(viewCacheKey)
    if (cachedData !== undefined) {
      return
    }
    void reload()
  }, [viewCacheKey, reload])

  // Zum aktuellen Schlüssel: erst die frisch geladenen Daten, sonst der Zwischenspeicher, sonst nichts
  let data: T | null = null
  if (loadedView !== null && loadedView.viewCacheKey === viewCacheKey) {
    data = loadedView.data
  } else {
    const cachedData = getCachedView<T>(viewCacheKey)
    if (cachedData !== undefined) {
      data = cachedData
    }
  }
  return { data, reload }
}
