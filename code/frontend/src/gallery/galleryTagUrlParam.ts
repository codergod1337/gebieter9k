/**
 * Trennt die gewählten Hashtags im Parameter `tags` der Adresse. Ein Leerzeichen, weil die Adresse es als `+` zeigt und
 * so lesbar bleibt: `?tags=strand+safari`.
 */
const URL_TAG_SEPARATOR = ' '

/**
 * Die gewählten Hashtags aus dem Parameter der Adresse. Ein Tag darf jedes Zeichen enthalten, auch ein Leerzeichen:
 * Deshalb steht jeder Tag für sich kodiert da (`am meer` als `am%20meer`), getrennt wird nur an echten Leerzeichen.
 * Fehlt der Parameter oder ist er leer, eine leere Liste: Es ist kein Hashtag gewählt.
 */
export function parseUrlTags(urlTagsText: string | null): string[] {
  if (urlTagsText === null || urlTagsText === '') {
    return []
  }
  const tags: string[] = []
  for (const encodedTag of urlTagsText.split(URL_TAG_SEPARATOR)) {
    let tag = encodedTag
    try {
      tag = decodeURIComponent(encodedTag)
    } catch {
      // von Hand verstümmelte Adresse: den Text nehmen, wie er dasteht
    }
    if (tag !== '' && !tags.includes(tag)) {
      tags.push(tag)
    }
  }
  return tags
}

/** Die gewählten Hashtags so, wie sie in der Adresse stehen; ohne Hashtags `null` (der Parameter fällt weg). */
export function formatUrlTags(tags: string[]): string | null {
  if (tags.length === 0) {
    return null
  }
  const encodedTags = tags.map((tag) => encodeURIComponent(tag))
  return encodedTags.join(URL_TAG_SEPARATOR)
}
