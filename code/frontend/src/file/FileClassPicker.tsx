import { type KeyboardEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { HighlightedText } from '../components/HighlightedText.tsx'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { FileClass } from './FileClass.ts'
import { FileClassBadge } from './FileClassBadge.tsx'
import { FileClassHint } from './FileClassHint.tsx'

type FileClassPickerProps = {
  /** Die angebotenen FileClasses, z. B. nur die mit Lese- oder Schreibrecht. Welche, entscheidet der Aufrufer. */
  fileClasses: FileClass[]
  /** Der Key der gewählten, `null` wenn noch keine. */
  selectedFileClassKey: string | null
  onSelectedFileClassKeyChange: (fileClassKey: string) => void
  disabled?: boolean
}

function getDisplayNameOrKey(fileClass: FileClass): string {
  const displayNameText = getTextInCurrentLanguage(fileClass.displayName)
  if (displayNameText.trim() === '') {
    return fileClass.key
  }
  return displayNameText
}

/** Nach Platz, bei gleichem Platz nach Key: So liegt jede Kachel bei jedem Aufruf an derselben Stelle. */
function compareFileClassesByListingPosition(firstFileClass: FileClass, secondFileClass: FileClass): number {
  const listingPositionDifference = firstFileClass.listingPosition - secondFileClass.listingPosition
  if (listingPositionDifference !== 0) {
    return listingPositionDifference
  }
  return firstFileClass.key.localeCompare(secondFileClass.key)
}

/**
 * Die Auswahl der Dateiart, nach dem FileSubClassPicker der Vorlage: je FileClass ihre Kachel (Symbol und Anzeigename im
 * eigenen Aussehen), den Key zeigt der Hinweis. Darüber ein Suchfeld: Teilstring im Anzeigenamen, Fundstellen markiert,
 * Enter nimmt den ersten Treffer, Escape leert das Feld. Nach der Wahl steht nur noch die gewählte Kachel da, ein Klick
 * darauf holt alle zurück. Dieselbe Auswahl an jeder Stelle (Upload, Dateien, später Bearbeiten).
 */
export function FileClassPicker({
  fileClasses,
  selectedFileClassKey,
  onSelectedFileClassKeyChange,
  disabled = false,
}: FileClassPickerProps) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')

  const sortedFileClasses = [...fileClasses].sort(compareFileClassesByListingPosition)
  const selectedFileClass = sortedFileClasses.find((fileClass) => fileClass.key === selectedFileClassKey) ?? null
  const collapsed = selectedFileClass !== null && !expanded
  const searchable = !collapsed && !disabled && sortedFileClasses.length > 1
  let activeSearchText = ''
  if (searchable) {
    activeSearchText = searchText.trim().toLowerCase()
  }
  const matchingFileClasses = sortedFileClasses.filter((fileClass) => {
    if (activeSearchText === '') {
      return true
    }
    const displayNameOrKey = getDisplayNameOrKey(fileClass)
    return displayNameOrKey.toLowerCase().includes(activeSearchText)
  })
  let visibleFileClasses = matchingFileClasses
  if (collapsed && selectedFileClass !== null) {
    visibleFileClasses = [selectedFileClass]
  }

  function handleTileClick(fileClassKey: string) {
    if (collapsed) {
      // die einzelne Kachel ist der Aufklapper, keine neue Wahl
      setExpanded(true)
      setSearchText('')
      return
    }
    onSelectedFileClassKeyChange(fileClassKey)
    setExpanded(false)
    setSearchText('')
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Escape leert nur das Feld, ein umgebendes Popup bleibt offen
    if (event.key === 'Escape' && searchText !== '') {
      event.preventDefault()
      event.stopPropagation()
      setSearchText('')
      return
    }
    // Enter nimmt den ersten Treffer und schickt kein Formular ab
    if (event.key === 'Enter') {
      event.preventDefault()
      const hasMatch = activeSearchText !== '' && matchingFileClasses.length > 0
      if (hasMatch) {
        handleTileClick(matchingFileClasses[0].key)
      }
    }
  }

  if (sortedFileClasses.length === 0) {
    return null
  }

  return (
    <div className="file-class-picker">
      {searchable && (
        <Form.Control
          type="search"
          size="sm"
          className="file-class-picker-search"
          value={searchText}
          placeholder="Dateiart suchen …"
          aria-label="Dateiart suchen"
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      )}
      {activeSearchText !== '' && matchingFileClasses.length === 0 && (
        <span className="small text-secondary">Keine Dateiart passt.</span>
      )}
      <div className="file-class-picker-tiles">
        {visibleFileClasses.map((fileClass) => {
          const isSelected = fileClass.key === selectedFileClassKey
          let tileClassName = 'file-class-picker-tile'
          if (isSelected) {
            tileClassName = 'file-class-picker-tile active'
          }
          let hintNote: string | undefined = undefined
          if (collapsed && !disabled) {
            hintNote = 'Klick: andere Dateiart wählen'
          }
          const displayNameOrKey = getDisplayNameOrKey(fileClass)
          return (
            <Hoverlay key={fileClass.key} text={<FileClassHint fileClass={fileClass} note={hintNote} />}>
              <button
                type="button"
                className={tileClassName}
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => handleTileClick(fileClass.key)}>
                <FileClassBadge fileClass={fileClass}>
                  <HighlightedText text={displayNameOrKey} searchText={activeSearchText} />
                </FileClassBadge>
              </button>
            </Hoverlay>
          )
        })}
      </div>
    </div>
  )
}
