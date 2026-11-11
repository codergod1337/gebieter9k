import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Collapse from 'react-bootstrap/Collapse'
import type { AccessRole } from '../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../auth/access/AccessRoleBadge.tsx'
import { ContentBox } from '../components/ContentBox.tsx'

type ProfileRightsBoxProps = {
  /** Die Rechte aus dem Token, Namen aus den Stammdaten. */
  ownAccessRoles: AccessRole[]
}

/**
 * Box „Rechte“, wie in der Vorlage per Default zugeklappt: die eigenen Rechte aus dem Token. Echt, nur Anzeige.
 * Vergeben werden sie vom Admin, im Token stehen Änderungen erst nach der nächsten Anmeldung.
 */
export function ProfileRightsBox({ ownAccessRoles }: ProfileRightsBoxProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  function handleToggle() {
    setIsOpen((currentIsOpen) => !currentIsOpen)
  }

  let toggleIconClassName = 'bi bi-chevron-down'
  if (isOpen) {
    toggleIconClassName = 'bi bi-chevron-up'
  }
  const toggleButton = (
    <Button variant="outline-secondary" size="sm" onClick={handleToggle} aria-expanded={isOpen} aria-label="Rechte auf- oder zuklappen">
      <span className="profile-count-chip me-2">{ownAccessRoles.length}</span>
      <i className={toggleIconClassName}></i>
    </Button>
  )

  return (
    <ContentBox title="Rechte" actions={toggleButton} footer="Rechte vergibt der Admin.">
      {!isOpen && <span className="small text-body-secondary">Zugeklappt, der Knopf rechts oben zeigt sie.</span>}
      <Collapse in={isOpen}>
        <div>
          {ownAccessRoles.length === 0 && <p className="mb-0">Keine Rechte.</p>}
          {ownAccessRoles.map((accessRole) => (
            <div key={accessRole.key} className="d-flex align-items-center gap-2 mb-2">
              <AccessRoleBadge accessRole={accessRole} />
              <code className="small">{accessRole.key}</code>
            </div>
          ))}
        </div>
      </Collapse>
    </ContentBox>
  )
}
