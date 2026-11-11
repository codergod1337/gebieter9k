/** Diese Ziele darf ein Link in einem angezeigten Dokument haben, alles andere (z. B. `javascript:`) fällt weg. */
const SAFE_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:']

/**
 * Nach dem Anzeigen eines fremden Dokuments (Word, Tabelle): Jeder Link behält sein Ziel nur, wenn es eine Webseite oder
 * eine E-Mail-Adresse ist; ein `javascript:`-Link aus einer präparierten Datei liefe sonst mit den Rechten des Users.
 * Erlaubte Links öffnen in einem neuen Tab, ohne Zugriff zurück auf diese Seite.
 */
export function removeUnsafeLinks(documentContainer: HTMLElement): void {
  const links = documentContainer.querySelectorAll('a[href]')
  for (const link of links) {
    const linkTarget = link.getAttribute('href') ?? ''
    // Sprungmarke im Dokument selbst, z. B. aus dem Inhaltsverzeichnis: bleibt, wie sie ist
    const isJumpWithinDocument = linkTarget.startsWith('#')
    if (isJumpWithinDocument) {
      continue
    }
    let safeLink = false
    try {
      const linkUrl = new URL(linkTarget, window.location.href)
      safeLink = SAFE_LINK_PROTOCOLS.includes(linkUrl.protocol)
    } catch {
      safeLink = false
    }
    if (!safeLink) {
      link.removeAttribute('href')
      continue
    }
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  }
}
