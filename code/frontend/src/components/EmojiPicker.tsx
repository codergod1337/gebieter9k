import { type ChangeEvent, type KeyboardEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import { ErrorAlert } from './ErrorAlert.tsx'
import { Hoverlay } from './Hoverlay.tsx'
import type { EmojiCatalogEntry, EmojiCatalogGroup } from './emojiCatalog.ts'
import { useEmojiCatalog } from './useEmojiCatalog.ts'

type EmojiPickerProps = {
  onPick: (emoji: string) => void
  disabled: boolean
}

/** Ob ein Emoji zum Suchtext passt: Teilstring im Namen oder in einem Suchwort, ohne Groß- und Kleinschreibung. */
function matchesSearchText(emojiCatalogEntry: EmojiCatalogEntry, lowerCaseSearchText: string): boolean {
  for (const lowerCaseSearchWord of emojiCatalogEntry.lowerCaseSearchWords) {
    if (lowerCaseSearchWord.includes(lowerCaseSearchText)) {
      return true
    }
  }
  return false
}

/** Alle Emojis aller Gruppen, die zum Suchtext passen, in der Reihenfolge des Katalogs. */
function findMatchingEmojis(emojiCatalogGroups: EmojiCatalogGroup[], lowerCaseSearchText: string): EmojiCatalogEntry[] {
  const matchingEmojis: EmojiCatalogEntry[] = []
  for (const emojiCatalogGroup of emojiCatalogGroups) {
    for (const emojiCatalogEntry of emojiCatalogGroup.emojis) {
      if (matchesSearchText(emojiCatalogEntry, lowerCaseSearchText)) {
        matchingEmojis.push(emojiCatalogEntry)
      }
    }
  }
  return matchingEmojis
}

/**
 * Die Auswahl eines Emojis nach demselben Muster wie die anderen Auswahlen: oben ein kleines Suchfeld, der Fokus sitzt
 * sofort darin, darunter die Gruppen als Reiter (je Gruppe ihr erstes Emoji, der Name im Hoverlay) und das Raster.
 * Tippen sucht live über alle Gruppen in Namen und Suchwörtern (deutsch, z. B. „lachen“), Enter nimmt den ersten
 * Treffer, ein Klick wählt. Unter dem Raster steht das Emoji, auf das man gerade zeigt, groß mit seinem Namen. Die
 * Auswahl speichert nichts, das macht der Aufrufer. Global: für jede Stelle, die Emojis braucht.
 */
export function EmojiPicker({ onPick, disabled }: EmojiPickerProps) {
  const emojiCatalog = useEmojiCatalog()
  const [searchText, setSearchText] = useState<string>('')
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const [shownEmoji, setShownEmoji] = useState<EmojiCatalogEntry | null>(null)

  const emojiCatalogGroups = emojiCatalog.emojiCatalogGroups
  if (emojiCatalogGroups === null) {
    if (emojiCatalog.errorMessage !== null) {
      return <ErrorAlert message={emojiCatalog.errorMessage} />
    }
    return <Spinner animation="border" size="sm" />
  }

  const lowerCaseSearchText = searchText.trim().toLowerCase()
  const searching = lowerCaseSearchText !== ''
  // Ohne gewählte Gruppe gilt die erste
  let selectedGroup: EmojiCatalogGroup | undefined = emojiCatalogGroups.find(
    (emojiCatalogGroup) => emojiCatalogGroup.groupKey === selectedGroupKey,
  )
  if (selectedGroup === undefined) {
    selectedGroup = emojiCatalogGroups[0]
  }
  let shownEmojis: EmojiCatalogEntry[] = []
  let headingText = ''
  if (searching) {
    shownEmojis = findMatchingEmojis(emojiCatalogGroups, lowerCaseSearchText)
    headingText = 'Treffer: ' + shownEmojis.length
  } else if (selectedGroup !== undefined) {
    shownEmojis = selectedGroup.emojis
    headingText = selectedGroup.groupName
  }

  function pickEmoji(emojiCatalogEntry: EmojiCatalogEntry) {
    onPick(emojiCatalogEntry.emoji)
  }

  function handleSearchTextChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredSearchText = event.target.value
    setSearchText(enteredSearchText)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return
    }
    event.preventDefault()
    const firstShownEmoji = shownEmojis[0]
    if (firstShownEmoji !== undefined && !disabled) {
      pickEmoji(firstShownEmoji)
    }
  }

  function selectGroup(emojiCatalogGroup: EmojiCatalogGroup) {
    setSelectedGroupKey(emojiCatalogGroup.groupKey)
    setSearchText('')
  }

  return (
    <div>
      <Form.Control
        type="search"
        size="sm"
        autoFocus
        placeholder="Emoji suchen, z. B. lachen …"
        aria-label="Emoji suchen"
        value={searchText}
        onChange={handleSearchTextChange}
        onKeyDown={handleSearchKeyDown}
      />
      <div className="emoji-picker-groups" role="tablist">
        {emojiCatalogGroups.map((emojiCatalogGroup) => {
          const firstEmojiOfGroup = emojiCatalogGroup.emojis[0]
          let groupClassName = 'emoji-picker-group emoji-text'
          const groupSelected = !searching && emojiCatalogGroup === selectedGroup
          if (groupSelected) {
            groupClassName = groupClassName + ' active'
          }
          return (
            <Hoverlay key={emojiCatalogGroup.groupKey} text={emojiCatalogGroup.groupName}>
              <button
                type="button"
                role="tab"
                aria-selected={groupSelected}
                aria-label={emojiCatalogGroup.groupName}
                className={groupClassName}
                onClick={() => selectGroup(emojiCatalogGroup)}>
                {firstEmojiOfGroup?.emoji}
              </button>
            </Hoverlay>
          )
        })}
      </div>
      <div className="emoji-picker-heading">{headingText}</div>
      <div className="emoji-picker-grid">
        {searching && shownEmojis.length === 0 && <span className="small text-body-secondary">Kein Emoji passt zur Suche.</span>}
        {shownEmojis.map((emojiCatalogEntry) => (
          <button
            key={emojiCatalogEntry.emoji}
            type="button"
            className="emoji-picker-emoji emoji-text"
            aria-label={emojiCatalogEntry.label}
            disabled={disabled}
            onMouseEnter={() => setShownEmoji(emojiCatalogEntry)}
            onFocus={() => setShownEmoji(emojiCatalogEntry)}
            onClick={() => pickEmoji(emojiCatalogEntry)}>
            {emojiCatalogEntry.emoji}
          </button>
        ))}
      </div>
      <div className="emoji-picker-preview">
        {shownEmoji !== null && (
          <>
            <span className="emoji-picker-preview-emoji emoji-text">{shownEmoji.emoji}</span>
            <span>{shownEmoji.label}</span>
          </>
        )}
      </div>
    </div>
  )
}
