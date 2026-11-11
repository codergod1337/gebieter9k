/** Ein Emoji des Katalogs mit seinem deutschen Namen und den Suchwörtern. */
export type EmojiCatalogEntry = {
  emoji: string
  label: string
  /** Die Suchwörter, z. B. „lachen“, „lol“; klein geschrieben. */
  lowerCaseSearchWords: string[]
}

/** Eine Gruppe des Katalogs, z. B. „Smileys & Emotionen“, mit ihren Emojis in der Unicode-Reihenfolge. */
export type EmojiCatalogGroup = {
  groupKey: string
  groupName: string
  emojis: EmojiCatalogEntry[]
}

/** Ein Eintrag aus `emojibase-data/de/compact.json`, nur die Felder, die der Katalog nutzt. */
type CompactEmojiData = {
  unicode: string
  label: string
  /** Fehlt bei den einzelnen Buchstaben der Flaggen (regionale Indikatoren), die kein Emoji für sich sind. */
  group?: number
  order?: number
  tags?: string[]
}

/** Eine Gruppe aus `emojibase-data/de/messages.json`. */
type GroupMessageData = {
  key: string
  message: string
  order: number
}

/** Der Ausschnitt aus `emojibase-data/de/messages.json`, den der Katalog nutzt. */
type MessagesData = {
  groups: GroupMessageData[]
}

/** Die Gruppe der Bausteine (Hautfarben, Haare): keine Emojis für sich, deshalb nicht im Katalog. */
const COMPONENT_GROUP_KEY = 'component'

/** Einmal geladen, für alle Aufrufer derselbe Katalog. */
let emojiCatalogPromise: Promise<EmojiCatalogGroup[]> | null = null

/** Baut einen Eintrag: Name und Suchwörter klein geschrieben für die Suche. */
function createEmojiCatalogEntry(compactEmoji: CompactEmojiData): EmojiCatalogEntry {
  const lowerCaseSearchWords: string[] = []
  const lowerCaseLabel = compactEmoji.label.toLowerCase()
  lowerCaseSearchWords.push(lowerCaseLabel)
  for (const tag of compactEmoji.tags ?? []) {
    const lowerCaseTag = tag.toLowerCase()
    lowerCaseSearchWords.push(lowerCaseTag)
  }
  return { emoji: compactEmoji.unicode, label: compactEmoji.label, lowerCaseSearchWords }
}

/** Lädt die deutschen Daten von emojibase (eigene Datei, erst wenn sie gebraucht wird) und ordnet sie nach Gruppen. */
async function doLoadEmojiCatalog(): Promise<EmojiCatalogGroup[]> {
  const compactModule = await import('emojibase-data/de/compact.json')
  const messagesModule = await import('emojibase-data/de/messages.json')
  const compactEmojis = compactModule.default as CompactEmojiData[]
  const messages = messagesModule.default as MessagesData
  const sortedGroupMessages = [...messages.groups].sort((firstGroup, secondGroup) => firstGroup.order - secondGroup.order)

  const emojiCatalogGroups: EmojiCatalogGroup[] = []
  for (const groupMessage of sortedGroupMessages) {
    if (groupMessage.key === COMPONENT_GROUP_KEY) {
      continue
    }
    const groupEmojis = compactEmojis.filter((compactEmoji) => compactEmoji.group === groupMessage.order)
    const sortedGroupEmojis = [...groupEmojis].sort((firstEmoji, secondEmoji) => (firstEmoji.order ?? 0) - (secondEmoji.order ?? 0))
    const emojis = sortedGroupEmojis.map(createEmojiCatalogEntry)
    emojiCatalogGroups.push({ groupKey: groupMessage.key, groupName: groupMessage.message, emojis })
  }
  return emojiCatalogGroups
}

/**
 * Der Katalog der Standard-Emojis (Unicode, deutsche Namen und Suchwörter aus `emojibase-data`) nach Gruppen. Die Daten
 * (rund 90 kB gepackt) kommen als eigene Datei erst beim ersten Aufruf und bleiben danach im Speicher. Ohne die
 * Bausteine (Hautfarben) und ohne die einzelnen Flaggen-Buchstaben: Jedes Emoji im Katalog besteht die Prüfung im
 * Backend (`Helper.requireSingleEmoji`), geprüft 2026-11-09 mit allen 1923.
 */
export function loadEmojiCatalog(): Promise<EmojiCatalogGroup[]> {
  if (emojiCatalogPromise === null) {
    const loadingPromise = doLoadEmojiCatalog()
    // Schlägt das Laden fehl (z. B. Netz weg), versucht der nächste Aufruf es neu
    emojiCatalogPromise = loadingPromise.catch((error: unknown) => {
      emojiCatalogPromise = null
      throw error
    })
  }
  return emojiCatalogPromise
}
