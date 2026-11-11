import { type KeyboardEvent, type ReactNode, useState } from 'react'
import Form from 'react-bootstrap/Form'

type SearchableListProps<Entry> = {
  entries: Entry[]
  getEntryKey: (entry: Entry) => string
  /** Der Text, in dem gesucht wird, z. B. der Anzeigename. Leer: Der Eintrag passt nur, solange nichts gesucht wird. */
  getEntrySearchText: (entry: Entry) => string
  /** Zeichnet einen Eintrag. `activeSearchText` ist die Suche in Kleinbuchstaben, zum Markieren (`HighlightedText`). */
  renderEntry: (entry: Entry, activeSearchText: string) => ReactNode
  /** Im leeren Suchfeld, z. B. „User suchen …“; zugleich sein Name für Screenreader. */
  searchPlaceholder: string
  /** Wenn die Suche nichts trifft, z. B. „Kein User passt.“ */
  noMatchText: string
}

/**
 * Eine Liste mit kleinem Suchfeld, überall gleich (Nutzer 2026-11-11: jede Liste in einem Hoverlay bekommt eins, z. B.
 * User, später Hooks und andere Felder): Was man tippt, wird als Teilstring im Text jedes Eintrags gesucht, ohne Groß-
 * und Kleinschreibung; nur die Treffer bleiben stehen. Escape leert das Feld. Bei höchstens einem Eintrag gibt es kein
 * Suchfeld. Gesucht wird nur in den Einträgen, die die Liste bekommen hat, nicht im Backend.
 *
 * Gedacht für ein Hoverlay, in dem man klicken und tippen kann (`Hoverlay` mit `interactive`). Lage in base.css
 * (`.searchable-list`), Farben im Theme.
 */
export function SearchableList<Entry>({
  entries,
  getEntryKey,
  getEntrySearchText,
  renderEntry,
  searchPlaceholder,
  noMatchText,
}: SearchableListProps<Entry>) {
  const [searchText, setSearchText] = useState<string>('')
  const searchable = entries.length > 1
  let activeSearchText = ''
  if (searchable) {
    activeSearchText = searchText.trim().toLowerCase()
  }
  const matchingEntries = entries.filter((entry) => {
    if (activeSearchText === '') {
      return true
    }
    const entrySearchText = getEntrySearchText(entry)
    return entrySearchText.toLowerCase().includes(activeSearchText)
  })

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Escape leert nur das Feld, ein umgebendes Popup bleibt offen
    if (event.key === 'Escape' && searchText !== '') {
      event.preventDefault()
      event.stopPropagation()
      setSearchText('')
      return
    }
    // Enter schickt kein Formular ab, in dem die Liste vielleicht steht
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }

  return (
    <div className="searchable-list">
      {searchable && (
        <Form.Control
          type="search"
          size="sm"
          className="searchable-list-search"
          value={searchText}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      )}
      {activeSearchText !== '' && matchingEntries.length === 0 && <span className="searchable-list-note">{noMatchText}</span>}
      {matchingEntries.length > 0 && (
        <div className="searchable-list-entries">
          {matchingEntries.map((entry) => (
            <div key={getEntryKey(entry)} className="searchable-list-entry">
              {renderEntry(entry, activeSearchText)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
