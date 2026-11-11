/**
 * Der Zwischenspeicher der Ansichten für die Sitzung, nach dem Such-Zwischenspeicher der Vorlage: Wer aus einer Liste
 * auf einen Eintrag geht und zurückkommt, sieht dieselbe Liste sofort, ohne Request und ohne Ladeanzeige; die Seite
 * hat damit gleich ihre volle Höhe, und das Scroll-Gedächtnis landet an derselben Stelle.
 *
 * - Lebt nur im Speicher, nie im Browser abgelegt; Neuladen der Seite leert ihn.
 * - Der Schlüssel trägt die GUID des Users: Ein anderer User im selben Fenster sieht nie fremde Daten. Abmelden leert
 *   ihn ganz.
 * - Je Bereich (`scope`, z. B. `FILE_DOCUMENT`) leert ihn jeder Schreibvorgang in diesem Bereich
 *   ({@link clearViewCacheScope}), sonst zeigte die Liste nach dem Bearbeiten den alten Stand.
 * - Höchstens {@link VIEW_CACHE_MAX_ENTRIES} Einträge, die ältesten fallen raus.
 */
const VIEW_CACHE_MAX_ENTRIES = 100

/** Ein Eintrag: der Bereich (zum gezielten Leeren) und die Daten. */
type ViewCacheEntry = {
  scope: string
  data: unknown
}

const viewCacheEntries = new Map<string, ViewCacheEntry>()

/** Der Schlüssel einer Ansicht: Bereich, User und die Anfrage (alles, was die Daten bestimmt, z. B. Dateiart und Seite). */
export function createViewCacheKey(scope: string, usersGuid: string, request: unknown): string {
  const keyParts = [scope, usersGuid, request]
  return JSON.stringify(keyParts)
}

/** Die gemerkten Daten einer Ansicht, `undefined` wenn es keine gibt. */
export function getCachedView<T>(viewCacheKey: string): T | undefined {
  const viewCacheEntry = viewCacheEntries.get(viewCacheKey)
  if (viewCacheEntry === undefined) {
    return undefined
  }
  return viewCacheEntry.data as T
}

/** Merkt die Daten einer Ansicht; sie rücken damit ans Ende, die ältesten fallen über der Grenze raus. */
export function rememberView(scope: string, viewCacheKey: string, data: unknown) {
  viewCacheEntries.delete(viewCacheKey)
  viewCacheEntries.set(viewCacheKey, { scope, data })
  while (viewCacheEntries.size > VIEW_CACHE_MAX_ENTRIES) {
    const oldestKeys = viewCacheEntries.keys()
    const oldestKey = oldestKeys.next().value
    if (oldestKey === undefined) {
      break
    }
    viewCacheEntries.delete(oldestKey)
  }
}

/** Nach jedem Schreibvorgang in einem Bereich (Upload, Bearbeiten, Löschen): Die nächste Ansicht fragt wieder das Backend. */
export function clearViewCacheScope(scope: string) {
  for (const [viewCacheKey, viewCacheEntry] of viewCacheEntries) {
    if (viewCacheEntry.scope === scope) {
      viewCacheEntries.delete(viewCacheKey)
    }
  }
}

/**
 * Zustände einer Ansicht, die das Verlassen der Seite überstehen sollen (`useSessionState`), z. B. die Liste
 * die fertigen Dateien der Upload-Liste. Nur im Speicher, ohne Grenze: Es sind wenige, feste Schlüssel.
 */
const sessionStateValues = new Map<string, unknown>()

/** Der gemerkte Zustand, `undefined` wenn es keinen gibt. */
export function getSessionStateValue<T>(sessionStateKey: string): T | undefined {
  if (!sessionStateValues.has(sessionStateKey)) {
    return undefined
  }
  return sessionStateValues.get(sessionStateKey) as T
}

/** Merkt einen Zustand bis zum Abmelden oder Neuladen. */
export function rememberSessionStateValue(sessionStateKey: string, value: unknown) {
  sessionStateValues.set(sessionStateKey, value)
}

/** Beim Abmelden: alles weg, Ansichten und Zustände. */
export function clearViewCache() {
  viewCacheEntries.clear()
  sessionStateValues.clear()
}
