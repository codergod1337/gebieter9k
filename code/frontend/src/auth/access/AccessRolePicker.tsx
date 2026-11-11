import { type ChangeEvent, type KeyboardEvent, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { HighlightedText } from '../../components/HighlightedText.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import type { AccessRole } from './AccessRole.ts'
import { AccessRoleBadge } from './AccessRoleBadge.tsx'

type AccessRolePickerProps = {
  /** Die angebotenen Rechte, z. B. ohne die schon gewählten. Welche, entscheidet der Aufrufer. */
  accessRoles: AccessRole[]
  onPick: (accessRole: AccessRole) => void
  disabled: boolean
}

/** Nach Platz, bei gleichem Platz nach Key: So steht jedes Recht bei jedem Aufruf an derselben Stelle. */
function compareAccessRolesByListingPosition(firstAccessRole: AccessRole, secondAccessRole: AccessRole): number {
  const listingPositionDifference = firstAccessRole.listingPosition - secondAccessRole.listingPosition
  if (listingPositionDifference !== 0) {
    return listingPositionDifference
  }
  return firstAccessRole.key.localeCompare(secondAccessRole.key)
}

/** Ob ein Recht zum Suchtext passt: Teilstring im Key oder im Anzeigenamen, ohne Groß- und Kleinschreibung. */
function matchesSearchText(accessRole: AccessRole, lowerCaseSearchText: string): boolean {
  if (lowerCaseSearchText === '') {
    return true
  }
  const lowerCaseKey = accessRole.key.toLowerCase()
  if (lowerCaseKey.includes(lowerCaseSearchText)) {
    return true
  }
  const displayNameText = getTextInCurrentLanguage(accessRole.displayName)
  const lowerCaseDisplayName = displayNameText.toLowerCase()
  return lowerCaseDisplayName.includes(lowerCaseSearchText)
}

/**
 * Die Auswahl eines Rechts wie die Hook-Suche der Vorlage: oben ein kleines Suchfeld, der Fokus sitzt sofort darin,
 * darunter die Rechte nach ihrer Position untereinander, je Zeile das Badge und der Key. Tippen filtert live per
 * Teilstring über Key und Anzeigenamen, die Fundstellen im Key sind markiert. Ein Klick wählt, Enter nimmt den ersten
 * Treffer. Die Auswahl speichert nichts, das macht der Aufrufer.
 */
export function AccessRolePicker({ accessRoles, onPick, disabled }: AccessRolePickerProps) {
  const [searchText, setSearchText] = useState<string>('')

  const sortedAccessRoles = [...accessRoles].sort(compareAccessRolesByListingPosition)
  const lowerCaseSearchText = searchText.trim().toLowerCase()
  const matchingAccessRoles = sortedAccessRoles.filter((accessRole) => matchesSearchText(accessRole, lowerCaseSearchText))

  function pickAccessRole(accessRole: AccessRole) {
    onPick(accessRole)
    setSearchText('')
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
    const firstMatchingAccessRole = matchingAccessRoles[0]
    if (firstMatchingAccessRole !== undefined && !disabled) {
      pickAccessRole(firstMatchingAccessRole)
    }
  }

  let emptyText: string | null = null
  if (sortedAccessRoles.length === 0) {
    emptyText = 'Alle Rechte sind schon gewählt.'
  } else if (matchingAccessRoles.length === 0) {
    emptyText = 'Kein Recht passt zur Suche.'
  }

  return (
    <div>
      <Form.Control
        type="search"
        size="sm"
        autoFocus
        placeholder="Recht suchen …"
        aria-label="Recht suchen"
        value={searchText}
        onChange={handleSearchTextChange}
        onKeyDown={handleSearchKeyDown}
      />
      <div className="access-role-picker-list">
        {emptyText !== null && <span className="small text-body-secondary">{emptyText}</span>}
        {matchingAccessRoles.map((accessRole) => (
          <button
            key={accessRole.key}
            type="button"
            className="access-role-picker-entry"
            disabled={disabled}
            onClick={() => pickAccessRole(accessRole)}>
            <AccessRoleBadge accessRole={accessRole} />
            <span className="access-role-picker-key">
              <HighlightedText text={accessRole.key} searchText={lowerCaseSearchText} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
