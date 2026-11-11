import { useSyncExternalStore } from 'react'

/** Unter dieser Breite gilt die Ansicht als mobil (Bootstraps Grenze md = 768 px). */
const MOBILE_QUERY = '(max-width: 767.98px)'

function subscribe(onChange: () => void): () => void {
  const mobileQuery = window.matchMedia(MOBILE_QUERY)
  mobileQuery.addEventListener('change', onChange)
  return () => mobileQuery.removeEventListener('change', onChange)
}

function isMobileNow(): boolean {
  const mobileQuery = window.matchMedia(MOBILE_QUERY)
  return mobileQuery.matches
}

/** true in der mobilen Auflösung, wie in der Vorlage. Die Komponente rendert neu, sobald sich das ändert. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, isMobileNow)
}
