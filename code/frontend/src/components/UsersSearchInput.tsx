import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'
import { USERS_SEARCH_EMAIL_MIN_LENGTH, type UsersForSearch } from '../users/UsersForSearch.ts'
import { useUsers } from '../users/useUsers.ts'
import { HighlightedText } from './HighlightedText.tsx'
import { UsersAvatar } from './UsersAvatar.tsx'

type UsersSearchInputProps = {
  /** Für das Label (`htmlFor`). */
  controlId: string
  /** Wen die Liste nicht anbietet, z. B. sich selbst und wer schon eingetragen ist. */
  excludedUsersGuids?: string[]
  disabled?: boolean
  autoFocus?: boolean
  /** Ein Treffer ist gewählt: Der Aufrufer nimmt seine GUID (`pickedUsers.usersGuid`). Das Feld leert sich danach. */
  onPick: (pickedUsers: UsersForSearch) => void
}

/** Die Texte des Felds, mehrsprachig angelegt: je Sprachkürzel der Text, eine weitere Sprache kommt hier dazu. */
const USERS_SEARCH_INPUT_TEXTS = {
  placeholder: { de: 'Username oder E-Mail-Adresse tippen …' },
  hint: {
    de: 'Der Username findet jeden User. Ab {emailMinLength} Zeichen passt auch der Anfang der E-Mail-Adresse, wenn du das Profil sehen darfst; die Adresse selbst zeigt die Liste nie.',
  },
  matchesLabel: { de: 'Gefundene User' },
  noMatch: { de: 'Kein User passt.' },
} satisfies Record<string, MultilingualText>

/** So lange nach dem letzten Tastendruck wird gesucht, wie bei den Vorschlägen des `ValuesInput`. */
const USERS_SEARCH_DELAY_MILLISECONDS = 250

/**
 * Die Vervollständigung von Usern, überall gleich (Nutzer 2026-11-22: „eine globale User-Vervollständigungskomponente“):
 * ein Feld, in das man einen Usernamen oder den Anfang einer E-Mail-Adresse tippt; darunter stehen die passenden User
 * mit Avatar und Name (`POST /api/users/search`). Pfeil hoch und runter wählen, Enter oder Klick übernimmt den Treffer,
 * Escape leert das Feld. Der Aufrufer bekommt den Treffer und speichert dessen GUID.
 *
 * - Über den Username ist jeder User findbar, die Fundstelle im Namen ist markiert.
 * - Ab {@link USERS_SEARCH_EMAIL_MIN_LENGTH} Zeichen trifft auch der Anfang der E-Mail-Adresse, aber nur bei Usern, deren
 *   Profil der Suchende sehen darf. Die Liste zeigt nie eine Adresse: Ein Treffer über die Adresse steht mit seinem
 *   Username da, ohne Markierung.
 *
 * Die Liste der Treffer steht unter dem Feld im Fluss und sieht aus wie jede Vorschlagsliste (`.suggestion-list`).
 * Gedacht für jede Stelle, an der man einen User auswählt: Uploadberechtigte einer Galerie, später Nachrichten,
 * Einladungen und Ähnliches.
 */
export function UsersSearchInput({
  controlId,
  excludedUsersGuids = [],
  disabled = false,
  autoFocus = false,
  onPick,
}: UsersSearchInputProps) {
  const usersHook = useUsers()
  const searchUsers = usersHook.searchUsers
  const [typedText, setTypedText] = useState<string>('')
  /** Die Treffer zur letzten Suche; `null`, solange zum getippten Text noch keine Antwort da ist. */
  const [foundUsers, setFoundUsers] = useState<UsersForSearch[] | null>(null)
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(-1)
  /** Zählt die Suchen: Kommt eine alte Antwort nach einer neueren an, wird sie verworfen. */
  const searchRequestNumberRef = useRef<number>(0)

  // Beim Tippen: kurz warten, dann im Backend suchen
  useEffect(() => {
    const trimmedText = typedText.trim()
    searchRequestNumberRef.current = searchRequestNumberRef.current + 1
    const searchRequestNumber = searchRequestNumberRef.current
    if (trimmedText === '') {
      setFoundUsers(null)
      setActiveMatchIndex(-1)
      return
    }
    const searchTimer = window.setTimeout(() => {
      void searchUsers(trimmedText).then((matchingUsers) => {
        if (searchRequestNumber !== searchRequestNumberRef.current) {
          return
        }
        setFoundUsers(matchingUsers ?? [])
        setActiveMatchIndex(-1)
      })
    }, USERS_SEARCH_DELAY_MILLISECONDS)
    return () => window.clearTimeout(searchTimer)
  }, [typedText, searchUsers])

  let shownUsers: UsersForSearch[] = []
  if (foundUsers !== null) {
    shownUsers = foundUsers.filter((foundUsersEntry) => !excludedUsersGuids.includes(foundUsersEntry.usersGuid))
  }
  const searchAnswered = foundUsers !== null
  const noMatchShown = searchAnswered && shownUsers.length === 0

  function clearSearch() {
    searchRequestNumberRef.current = searchRequestNumberRef.current + 1
    setTypedText('')
    setFoundUsers(null)
    setActiveMatchIndex(-1)
  }

  function pickUsers(pickedUsers: UsersForSearch) {
    clearSearch()
    onPick(pickedUsers)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const matchesShown = shownUsers.length > 0
    if (matchesShown && event.key === 'ArrowDown') {
      event.preventDefault()
      const nextIndex = Math.min(activeMatchIndex + 1, shownUsers.length - 1)
      setActiveMatchIndex(nextIndex)
      return
    }
    if (matchesShown && event.key === 'ArrowUp') {
      event.preventDefault()
      const previousIndex = Math.max(activeMatchIndex - 1, -1)
      setActiveMatchIndex(previousIndex)
      return
    }
    // Escape leert nur das Feld, ein umgebendes Popup bleibt offen
    if (event.key === 'Escape' && typedText !== '') {
      event.preventDefault()
      event.stopPropagation()
      clearSearch()
      return
    }
    if (event.key === 'Enter') {
      // Enter schickt kein Formular ab, in dem das Feld steht: Es nimmt den gewählten, sonst den ersten Treffer
      event.preventDefault()
      if (!matchesShown) {
        return
      }
      let pickedIndex = activeMatchIndex
      if (pickedIndex < 0) {
        pickedIndex = 0
      }
      const pickedUsers = shownUsers[pickedIndex]
      pickUsers(pickedUsers)
    }
  }

  const placeholder = getTextInCurrentLanguage(USERS_SEARCH_INPUT_TEXTS.placeholder)
  const hint = getTextInCurrentLanguageWithValues(USERS_SEARCH_INPUT_TEXTS.hint, {
    emailMinLength: String(USERS_SEARCH_EMAIL_MIN_LENGTH),
  })

  return (
    <div className="users-search-input">
      <Form.Control
        id={controlId}
        type="search"
        autoComplete="off"
        autoFocus={autoFocus}
        value={typedText}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setTypedText(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Form.Text>{hint}</Form.Text>
      {noMatchShown && <div className="users-search-input-note">{getTextInCurrentLanguage(USERS_SEARCH_INPUT_TEXTS.noMatch)}</div>}
      {shownUsers.length > 0 && (
        <ul className="suggestion-list" role="listbox" aria-label={getTextInCurrentLanguage(USERS_SEARCH_INPUT_TEXTS.matchesLabel)}>
          {shownUsers.map((shownUsersEntry, matchIndex) => {
            let matchClassName = 'suggestion-list-entry'
            if (matchIndex === activeMatchIndex) {
              matchClassName = 'suggestion-list-entry active'
            }
            const usersAvatar = shownUsersEntry.usersAvatar
            return (
              <li key={shownUsersEntry.usersGuid} role="option" aria-selected={matchIndex === activeMatchIndex}>
                <button
                  type="button"
                  className={matchClassName}
                  // mousedown statt Blur: Der Fokus bleibt im Feld, der Klick übernimmt den Treffer
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pickUsers(shownUsersEntry)}>
                  <span className="users-search-input-match">
                    <UsersAvatar
                      usersGuid={shownUsersEntry.usersGuid}
                      username={shownUsersEntry.username}
                      profileImageBase64Png={usersAvatar.profileImageSmallBase64Png}
                      size="small"
                      anonymous={usersAvatar.anonymous}
                      textColor={usersAvatar.avatarTextColor}
                      backgroundColor={usersAvatar.avatarBackgroundColor}
                    />
                    <strong className="users-search-input-name">
                      <HighlightedText text={shownUsersEntry.username} searchText={typedText} />
                    </strong>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
