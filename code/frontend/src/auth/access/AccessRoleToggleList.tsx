import type { AccessRole } from './AccessRole.ts'
import { AccessRoleBadge } from './AccessRoleBadge.tsx'

type AccessRoleToggleListProps = {
  /** Alle Rechte aus den Stammdaten, in ihrer Reihenfolge. */
  accessRoles: AccessRole[]
  selectedAccessRoleKeys: Set<string>
  onToggle: (accessRoleKey: string) => void
  disabled: boolean
}

/**
 * Alle Rechte als Badges zum Anklicken, wie in der Vorlage: gewählte voll sichtbar, die anderen blass und
 * durchgestrichen. Ein Klick auf das Badge schaltet um. Die Liste speichert nichts, das macht der Aufrufer.
 */
export function AccessRoleToggleList({ accessRoles, selectedAccessRoleKeys, onToggle, disabled }: AccessRoleToggleListProps) {
  return (
    <div className="access-role-toggle-list">
      {accessRoles.map((accessRole) => {
        const selected = selectedAccessRoleKeys.has(accessRole.key)
        let toggleClassName = 'access-role-toggle'
        if (selected) {
          toggleClassName = 'access-role-toggle access-role-toggle-active'
        }
        return (
          <button
            key={accessRole.key}
            type="button"
            className={toggleClassName}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onToggle(accessRole.key)}>
            <AccessRoleBadge accessRole={accessRole} />
          </button>
        )
      })}
    </div>
  )
}
