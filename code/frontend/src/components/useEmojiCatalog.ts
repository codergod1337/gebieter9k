import { useEffect, useState } from 'react'
import { type EmojiCatalogGroup, loadEmojiCatalog } from './emojiCatalog.ts'

/** Rückmeldung von {@link useEmojiCatalog}. */
export type EmojiCatalogState = {
  /** Die Gruppen, `null` solange sie laden oder nach einem Fehler. */
  emojiCatalogGroups: EmojiCatalogGroup[] | null
  /** Der Fehler beim Laden, sonst `null`. */
  errorMessage: string | null
}

/** Lädt beim Anzeigen den Emoji-Katalog ({@link loadEmojiCatalog}); beim zweiten Mal kommt er sofort aus dem Speicher. */
export function useEmojiCatalog(): EmojiCatalogState {
  const [emojiCatalogGroups, setEmojiCatalogGroups] = useState<EmojiCatalogGroup[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let stillShown = true
    loadEmojiCatalog()
      .then((loadedEmojiCatalogGroups) => {
        if (stillShown) {
          setEmojiCatalogGroups(loadedEmojiCatalogGroups)
        }
      })
      .catch(() => {
        if (stillShown) {
          setErrorMessage('Die Emojis konnten nicht geladen werden.')
        }
      })
    return () => {
      stillShown = false
    }
  }, [])

  return { emojiCatalogGroups, errorMessage }
}
