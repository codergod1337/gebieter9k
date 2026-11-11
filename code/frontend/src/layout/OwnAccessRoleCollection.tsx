import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import type { AccessRole } from '../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../auth/access/AccessRoleBadge.tsx'
import type { AccessRoleCollection } from '../auth/access/AccessRoleCollection.ts'
import { AccessRoleCollectionBadge } from '../auth/access/AccessRoleCollectionBadge.tsx'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { LookBadge } from '../badge/LookBadge.tsx'
import { useMasterData } from '../masterdata/useMasterData.ts'

/**
 * Die eigene Position im Header, wie in der Vorlage: die eigene AccessRoleCollection als Badge. Ein Klick öffnet ein
 * Popup mit der Position und allen Rechten aus dem Token. Namen kommen aus den Stammdaten, steht etwas (noch) nicht
 * darin, steht dort sein Key. Ohne Anmeldung zeigt es nichts.
 */
export function OwnAccessRoleCollection() {
  const { session } = useCurrentSession()
  const { accessRoles, accessRoleCollections } = useMasterData()
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)

  if (session === null) {
    return null
  }

  const ownAccessRoleCollectionKey = session.users.accessRoleCollectionKey
  let ownAccessRoleCollection: AccessRoleCollection | null = null
  for (const accessRoleCollection of accessRoleCollections ?? []) {
    if (accessRoleCollection.key === ownAccessRoleCollectionKey) {
      ownAccessRoleCollection = accessRoleCollection
    }
  }

  function findAccessRole(accessRoleKey: string): AccessRole | null {
    for (const accessRole of accessRoles ?? []) {
      if (accessRole.key === accessRoleKey) {
        return accessRole
      }
    }
    return null
  }

  function handleOpenPopup() {
    setIsPopupOpen(true)
  }

  function handleClosePopup() {
    setIsPopupOpen(false)
  }

  let ownPosition = (
    <LookBadge look={null} shape="pill">
      keine Position
    </LookBadge>
  )
  if (ownAccessRoleCollection !== null) {
    ownPosition = <AccessRoleCollectionBadge accessRoleCollection={ownAccessRoleCollection} />
  } else if (ownAccessRoleCollectionKey !== null) {
    ownPosition = <code>{ownAccessRoleCollectionKey}</code>
  }

  return (
    <>
      <button type="button" className="header-position" aria-label="Meine Position zeigen" onClick={handleOpenPopup}>
        {ownPosition}
      </button>
      <Modal show={isPopupOpen} onHide={handleClosePopup} centered>
        <Modal.Header closeButton>
          <Modal.Title>Meine Position</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <dl className="mb-0">
            <dt>Position (ARC)</dt>
            <dd>{ownPosition}</dd>
            <dt>Rechte (AR)</dt>
            <dd className="mb-0">
              {session.accessRoleKeys.length === 0 && 'keine'}
              {session.accessRoleKeys.map((accessRoleKey) => {
                const accessRole = findAccessRole(accessRoleKey)
                if (accessRole === null) {
                  return (
                    <code key={accessRoleKey} className="me-1">
                      {accessRoleKey}
                    </code>
                  )
                }
                return <AccessRoleBadge key={accessRoleKey} accessRole={accessRole} />
              })}
            </dd>
          </dl>
        </Modal.Body>
        <Modal.Footer className="small text-body-secondary justify-content-start">
          So stehen sie in deinem Token: die Rechte der Position und die direkt zugewiesenen. Änderungen wirken mit der
          nächsten Erneuerung der Sitzung.
        </Modal.Footer>
      </Modal>
    </>
  )
}
