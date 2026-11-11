import { useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../../api/useLoadedData.ts'
import type { AccessRoleCollection } from '../../auth/access/AccessRoleCollection.ts'
import { AccessRoleCollectionBadge } from '../../auth/access/AccessRoleCollectionBadge.tsx'
import { Hoverlay } from '../../components/Hoverlay.tsx'
import { Matrix } from '../../components/Matrix.tsx'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import type { Users } from '../../users/Users.ts'
import { useUsers } from '../../users/useUsers.ts'

/**
 * Tab „User-ARC“ der Administration, wie in der Vorlage: welcher User auf welcher Position (ARC) sitzt. Links alle
 * User, die ältesten zuerst (die GUIDs sind Version 7, also nach Zeit sortierbar), oben die Collections. Eine Zeile
 * wirkt wie eine Radio-Gruppe: Klick auf eine leere Zelle setzt diese Position und ersetzt die bisherige; Klick auf die
 * gesetzte nimmt sie weg, der User hat dann keine Position, nur seine direkt zugewiesenen Rechte. Die Position steht ab
 * der nächsten Erneuerung der Sitzung im Token, ihre Rechte kommen zu den direkt zugewiesenen dazu.
 */
export function UsersArcMatrixTab() {
  const loadUsersHook = useUsers()
  const saveUsersHook = useUsers()
  const { accessRoleCollections, error: masterDataError } = useMasterData()
  const loadedUsers = useLoadedData(loadUsersHook.getAllUsers)
  // Was seit dem Laden gespeichert wurde, je User-GUID der Stand aus dem Backend
  const [savedUsersByGuid, setSavedUsersByGuid] = useState<Record<string, Users>>({})
  const [savingUsersGuid, setSavingUsersGuid] = useState<string | null>(null)

  function getShownUsers(users: Users): Users {
    const savedUsers = savedUsersByGuid[users.guid]
    if (savedUsers !== undefined) {
      return savedUsers
    }
    return users
  }

  async function handleCellClick(users: Users, accessRoleCollection: AccessRoleCollection) {
    if (savingUsersGuid !== null) {
      return
    }
    const shownUsers = getShownUsers(users)
    // Ein Klick auf die schon gesetzte Position nimmt sie weg: Der User hat dann keine, nur seine direkten Rechte.
    const alreadySelected = shownUsers.accessRoleCollectionKey === accessRoleCollection.key
    let changedAccessRoleCollectionKey: string | null = accessRoleCollection.key
    if (alreadySelected) {
      changedAccessRoleCollectionKey = null
    }
    setSavingUsersGuid(users.guid)
    const changedUsers: Users = { ...shownUsers, accessRoleCollectionKey: changedAccessRoleCollectionKey }
    const savedUsers = await saveUsersHook.changeUsers(changedUsers)
    if (savedUsers !== null) {
      setSavedUsersByGuid((currentSavedUsers) => ({ ...currentSavedUsers, [savedUsers.guid]: savedUsers }))
    }
    setSavingUsersGuid(null)
  }

  function isMarked(users: Users, accessRoleCollection: AccessRoleCollection): boolean {
    const shownUsers = getShownUsers(users)
    return shownUsers.accessRoleCollectionKey === accessRoleCollection.key
  }

  function getCellLabel(users: Users, accessRoleCollection: AccessRoleCollection): string {
    const marked = isMarked(users, accessRoleCollection)
    if (marked) {
      return accessRoleCollection.key + ' bei ' + users.username + ' entfernen'
    }
    return accessRoleCollection.key + ' für ' + users.username + ' setzen'
  }

  function renderRowHeader(users: Users) {
    return (
      <span className="matrix-row-head-content">
        <Hoverlay text={users.email}>
          <span>{users.username}</span>
        </Hoverlay>
        {users.status !== 'ACTIVE' && <span className="matrix-chip">{users.status}</span>}
      </span>
    )
  }

  let errorMessage: string | null = null
  if (masterDataError !== null) {
    errorMessage = masterDataError.detail
  } else if (loadUsersHook.error !== null) {
    errorMessage = loadUsersHook.error.detail
  } else if (saveUsersHook.error !== null) {
    errorMessage = saveUsersHook.error.detail
  }
  const allUsers = loadedUsers.data
  const isLoading = allUsers === null || accessRoleCollections === null

  // die ältesten zuerst: eine GUID Version 7 beginnt mit der Zeit
  const sortedUsers: Users[] = []
  if (allUsers !== null) {
    sortedUsers.push(...allUsers)
    sortedUsers.sort((firstUsers, secondUsers) => firstUsers.guid.localeCompare(secondUsers.guid))
  }

  return (
    <>
      {/* Nur bei Fehler oder während des Ladens, sonst steht die Matrix allein */}
      {(errorMessage !== null || isLoading) && (
        <div className="matrix-message">
          {errorMessage !== null && <span className="text-danger">{errorMessage}</span>}
          {errorMessage === null && <Spinner animation="border" size="sm" />}
        </div>
      )}
      {!isLoading && accessRoleCollections !== null && (
        <Matrix
          rows={sortedUsers}
          columns={accessRoleCollections}
          rowKey={(users) => users.guid}
          columnKey={(accessRoleCollection) => accessRoleCollection.key}
          rowsLabel="User"
          columnsLabel="AccessRoleCollection"
          rowHeader={renderRowHeader}
          columnHeader={(accessRoleCollection) => <AccessRoleCollectionBadge accessRoleCollection={accessRoleCollection} />}
          isMarked={isMarked}
          cellLabel={getCellLabel}
          onCellClick={handleCellClick}
          disabled={savingUsersGuid !== null}
        />
      )}
    </>
  )
}
