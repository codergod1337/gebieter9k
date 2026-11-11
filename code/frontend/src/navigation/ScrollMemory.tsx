import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/** Unter diesem Namen liegen die Scrollhöhen im sessionStorage des Tabs. */
const SCROLL_MEMORY_STORAGE_KEY = 'gebiter9k-scroll-memory'

/** So viele Einträge des Verlaufs merkt es sich höchstens, die ältesten fallen raus. */
const SCROLL_MEMORY_MAX_ENTRIES = 200

/** So lange holt es einen Sprung nach, wenn die Seite beim Zurückkommen noch zu kurz ist (Daten laden nach). */
const SCROLL_RESTORE_WINDOW_MILLISECONDS = 2000

/** Ein noch offener Sprung: zu welchem Eintrag, wohin, bis wann. */
type PendingScrollRestore = {
  locationKey: string
  scrollTop: number
  until: number
}

/** Die gemerkten Höhen aus dem sessionStorage; leer, wenn es keine gibt oder der Speicher gesperrt ist. */
function readStoredScrollTops(): Map<string, number> {
  const storedScrollTops = new Map<string, number>()
  try {
    const storedText = window.sessionStorage.getItem(SCROLL_MEMORY_STORAGE_KEY)
    if (storedText === null) {
      return storedScrollTops
    }
    const storedEntries: unknown = JSON.parse(storedText)
    if (!Array.isArray(storedEntries)) {
      return storedScrollTops
    }
    for (const storedEntry of storedEntries) {
      if (Array.isArray(storedEntry) && typeof storedEntry[0] === 'string' && typeof storedEntry[1] === 'number') {
        storedScrollTops.set(storedEntry[0], storedEntry[1])
      }
    }
  } catch {
    // gesperrter oder kaputter Speicher: ohne gemerkte Höhen weiter
  }
  return storedScrollTops
}

/** Schreibt die Höhen in den sessionStorage, höchstens {@link SCROLL_MEMORY_MAX_ENTRIES}, die neuesten bleiben. */
function writeStoredScrollTops(scrollTops: Map<string, number>) {
  const allEntries = [...scrollTops.entries()]
  const newestEntries = allEntries.slice(-SCROLL_MEMORY_MAX_ENTRIES)
  try {
    const storedText = JSON.stringify(newestEntries)
    window.sessionStorage.setItem(SCROLL_MEMORY_STORAGE_KEY, storedText)
  } catch {
    // gesperrter oder voller Speicher: die Höhen gelten dann nur bis zum Neuladen
  }
}

/**
 * Die Scrollhöhe je Eintrag im Verlauf des Browsers, nach dem ScrollMemory der Vorlage, aber wie der Browser selbst:
 * - Zurück und Vor (auch über „Zurück zu …“ im Header) landen wieder an derselben Stelle.
 * - Ein neuer Link auf eine andere Seite fängt oben an, auch wenn man sie schon einmal weiter unten angesehen hat.
 * - Ändern sich nur die Parameter derselben Seite (Blättern, Filter), bleibt die Höhe; wohin es dann geht, entscheidet
 *   die Seite selbst (z. B. rollt das Gästebuch an seinen Anfang).
 * - Ein ersetzter Eintrag (z. B. Tippen in ein Suchfeld, das die Adresse nachführt) bleibt, wo er ist.
 *
 * Gemerkt wird je Eintrag (`location.key`) im sessionStorage des Tabs: Das übersteht ein Neuladen, aber nicht das
 * Schließen des Tabs. Lädt die Seite beim Zurückkommen noch nach, holt ein ResizeObserver den Sprung nach, längstens
 * zwei Sekunden. Die eigene Wiederherstellung des Browsers ist aus, sie würde dagegen arbeiten. Steht einmal im Layout.
 */
export function ScrollMemory() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const locationKey = location.key
  const pathname = location.pathname
  const scrollTops = useRef<Map<string, number> | null>(null)
  const currentLocationKey = useRef<string | null>(null)
  const currentPathname = useRef<string | null>(null)
  const pendingScrollRestore = useRef<PendingScrollRestore | null>(null)

  function getScrollTops(): Map<string, number> {
    if (scrollTops.current === null) {
      scrollTops.current = readStoredScrollTops()
    }
    return scrollTops.current
  }

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Jedes Scrollen merkt die Höhe unter dem aktuellen Eintrag, nicht erst beim Wechsel: dann hätte der Browser sie
  // womöglich schon geklemmt
  useEffect(() => {
    function rememberScrollTop() {
      const rememberedLocationKey = currentLocationKey.current
      if (rememberedLocationKey === null) {
        return
      }
      const knownScrollTops = getScrollTops()
      knownScrollTops.delete(rememberedLocationKey)
      knownScrollTops.set(rememberedLocationKey, window.scrollY)
    }
    function storeScrollTops() {
      const knownScrollTops = getScrollTops()
      writeStoredScrollTops(knownScrollTops)
    }
    window.addEventListener('scroll', rememberScrollTop, { passive: true })
    window.addEventListener('pagehide', storeScrollTops)
    return () => {
      window.removeEventListener('scroll', rememberScrollTop)
      window.removeEventListener('pagehide', storeScrollTops)
    }
  }, [])

  // Wechsel des Eintrags, vor dem Malen, damit der Sprung unsichtbar bleibt
  useLayoutEffect(() => {
    if (currentLocationKey.current === locationKey) {
      return
    }
    const knownScrollTops = getScrollTops()
    writeStoredScrollTops(knownScrollTops)
    const samePathname = currentPathname.current === pathname
    currentLocationKey.current = locationKey
    currentPathname.current = pathname
    pendingScrollRestore.current = null
    if (navigationType === 'REPLACE') {
      return
    }
    if (navigationType === 'PUSH' && samePathname) {
      return
    }
    let scrollTop = 0
    if (navigationType === 'POP') {
      const rememberedScrollTop = knownScrollTops.get(locationKey)
      if (rememberedScrollTop !== undefined) {
        scrollTop = rememberedScrollTop
      }
    }
    window.scrollTo({ top: scrollTop, behavior: 'auto' })
    if (scrollTop > 0) {
      const until = Date.now() + SCROLL_RESTORE_WINDOW_MILLISECONDS
      pendingScrollRestore.current = { locationKey, scrollTop, until }
    }
  }, [locationKey, pathname, navigationType])

  // Nachladender Inhalt: den geklemmten Sprung nachholen, sobald die Seite hoch genug ist
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined
    }
    const resizeObserver = new ResizeObserver(() => {
      const openScrollRestore = pendingScrollRestore.current
      if (openScrollRestore === null) {
        return
      }
      const expired = Date.now() > openScrollRestore.until
      if (openScrollRestore.locationKey !== currentLocationKey.current || expired) {
        pendingScrollRestore.current = null
        return
      }
      const maximumScrollTop = document.documentElement.scrollHeight - window.innerHeight
      if (maximumScrollTop >= openScrollRestore.scrollTop) {
        window.scrollTo({ top: openScrollRestore.scrollTop, behavior: 'auto' })
        pendingScrollRestore.current = null
      }
    })
    resizeObserver.observe(document.documentElement)
    return () => resizeObserver.disconnect()
  }, [])

  return null
}
