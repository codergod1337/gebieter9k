/** Diese Elemente fliegen samt Inhalt raus: Ihr Inhalt ist kein Text, sondern Code oder Fremdes. */
const DROPPED_TAG_NAMES = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH'])

/**
 * Bereinigt fremdes HTML nach einer Erlaubt-Liste, die EINE Stelle dafür im Frontend (Rich-Text, Tabellen-Viewer):
 *
 * - Erlaubte Tags bleiben, mit nur den erlaubten Attributen. Alles andere an Attributen fällt weg, also auch jedes
 *   `onclick`, `onerror`, `style` und `src`.
 * - Nicht erlaubte Tags werden durch ihren Inhalt ersetzt, ihr Text bleibt.
 * - Code-Elemente (`script`, `iframe`, `svg` …) fliegen samt Inhalt raus, ebenso Kommentare.
 *
 * Der Parser (`DOMParser`) führt nichts aus und lädt nichts. Was immer hereinkommt: Mehr als die erlaubten Tags und
 * Attribute erreicht den DOM der Seite nie.
 *
 * @param allowedTagNames in Großbuchstaben, z. B. `P`, `TD`
 * @param allowedAttributeNames in Kleinbuchstaben, z. B. `colspan`; leer heißt: kein einziges Attribut
 */
export function sanitizeHtml(
  html: string,
  allowedTagNames: ReadonlySet<string>,
  allowedAttributeNames: ReadonlySet<string>,
): string {
  if (html === '') {
    return ''
  }
  const parsedDocument = new DOMParser().parseFromString(html, 'text/html')
  const body = parsedDocument.body
  sanitizeChildNodes(body, allowedTagNames, allowedAttributeNames)
  return body.innerHTML
}

function sanitizeChildNodes(
  parentNode: Node,
  allowedTagNames: ReadonlySet<string>,
  allowedAttributeNames: ReadonlySet<string>,
) {
  const childNodes = [...parentNode.childNodes]
  for (const childNode of childNodes) {
    if (childNode.nodeType === Node.TEXT_NODE) {
      continue
    }
    if (!(childNode instanceof Element)) {
      childNode.remove()
      continue
    }
    const tagName = childNode.tagName.toUpperCase()
    if (DROPPED_TAG_NAMES.has(tagName)) {
      childNode.remove()
      continue
    }
    sanitizeChildNodes(childNode, allowedTagNames, allowedAttributeNames)
    if (!allowedTagNames.has(tagName)) {
      const grandChildNodes = [...childNode.childNodes]
      childNode.replaceWith(...grandChildNodes)
      continue
    }
    const attributeNames = childNode.getAttributeNames()
    for (const attributeName of attributeNames) {
      const lowerCaseAttributeName = attributeName.toLowerCase()
      if (!allowedAttributeNames.has(lowerCaseAttributeName)) {
        childNode.removeAttribute(attributeName)
      }
    }
  }
}
