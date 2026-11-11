import { useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import { useNavigate } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import type { AccessRole } from '../../auth/access/AccessRole.ts'
import type { AccessRoleCollection } from '../../auth/access/AccessRoleCollection.ts'
import { useAccessRoleUsersAssignment } from '../../auth/access/useAccessRoleUsersAssignment.ts'
import { ConfirmDeletePopup } from '../../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { NewEntityButton } from '../../components/NewEntityButton.tsx'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import type { Users } from '../../users/Users.ts'
import { useUsers } from '../../users/useUsers.ts'
import { NewUsersPopup } from './NewUsersPopup.tsx'
import { NEW_USERS_TEXTS } from './newUsersTexts.ts'
import { UsersTableRow } from './UsersTableRow.tsx'
import { useOrigin } from '../../navigation/useOrigin.ts'

/**
 * Tab „User“ der Administration, wie in der Vorlage: alle User mit Status, ARC und Rechten, rechts Bearbeiten und
 * Löschen, oben rechts „neuer User“ (Anlegen im kleinen Popup, {@link NewUsersPopup}). Gelesen wird über die normalen
 * Endpunkte.
 */
export function UsersTab() {
  const navigate = useNavigate()
  const originNavigation = useOrigin()
  const usersHook = useUsers()
  const deleteUsersHook = useUsers()
  const accessRoleUsersAssignmentHook = useAccessRoleUsersAssignment()
  const { accessRoles, accessRoleCollections } = useMasterData()
  const loadedUsers = useLoadedData(usersHook.getAllUsers)
  const loadedAssignments = useLoadedData(accessRoleUsersAssignmentHook.getAllAccessRoleUsersAssignment)
  const [usersToDelete, setUsersToDelete] = useState<Users | null>(null)
  const [newUsersOpen, setNewUsersOpen] = useState<boolean>(false)

  const allUsers = loadedUsers.data
  const allAssignments = loadedAssignments.data

  /** Die Rechte eines Users, in der Reihenfolge der Stammdaten. */
  function getAssignedAccessRoles(usersGuid: string): AccessRole[] {
    const assignedAccessRoles: AccessRole[] = []
    if (accessRoles === null || allAssignments === null) {
      return assignedAccessRoles
    }
    for (const accessRole of accessRoles) {
      for (const assignment of allAssignments) {
        const assignedToThisUsers = assignment.usersGuid === usersGuid && assignment.accessRoleKey === accessRole.key
        if (assignedToThisUsers) {
          assignedAccessRoles.push(accessRole)
        }
      }
    }
    return assignedAccessRoles
  }

  function getAccessRoleCollection(accessRoleCollectionKey: string | null): AccessRoleCollection | null {
    if (accessRoleCollections === null || accessRoleCollectionKey === null) {
      return null
    }
    for (const accessRoleCollection of accessRoleCollections) {
      if (accessRoleCollection.key === accessRoleCollectionKey) {
        return accessRoleCollection
      }
    }
    return null
  }

  function handleEdit(users: Users) {
    const editUsersPath = '/admin/users/edit/' + users.guid
    const originState = originNavigation.createOriginStateHere('User')
    navigate(editUsersPath, { state: originState })
  }

  async function handleConfirmDelete() {
    if (usersToDelete === null) {
      return
    }
    const deleted = await deleteUsersHook.deleteUsers(usersToDelete.guid)
    if (deleted) {
      setUsersToDelete(null)
      await loadedUsers.reload()
    }
  }

  function handleCloseDeletePopup() {
    setUsersToDelete(null)
  }

  async function handleUsersCreated() {
    setNewUsersOpen(false)
    await loadedUsers.reload()
  }

  let errorMessage: string | null = null
  if (usersHook.error !== null) {
    errorMessage = usersHook.error.detail
  } else if (accessRoleUsersAssignmentHook.error !== null) {
    errorMessage = accessRoleUsersAssignmentHook.error.detail
  }
  let deleteErrorMessage: string | null = null
  if (deleteUsersHook.error !== null) {
    deleteErrorMessage = deleteUsersHook.error.detail
  }

  const loaded = allUsers !== null && allAssignments !== null && accessRoles !== null
  let footer
  if (errorMessage !== null) {
    footer = <span className="text-danger">{errorMessage}</span>
  } else if (!loaded) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    const usersCountText = allUsers.length + ' User'
    footer = <span>{usersCountText}</span>
  }

  const newUsersLabel = getTextInCurrentLanguage(NEW_USERS_TEXTS.newUsers)
  const newUsersButton = <NewEntityButton label={newUsersLabel} onClick={() => setNewUsersOpen(true)} />

  return (
    <>
      <ContentBox title="User" actions={newUsersButton} footer={footer}>
        {loaded && (
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>E-Mail</th>
                <th>Status</th>
                <th>ARC</th>
                <th>Rechte</th>
                <th>Username</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((users) => {
                const assignedAccessRoles = getAssignedAccessRoles(users.guid)
                const accessRoleCollection = getAccessRoleCollection(users.accessRoleCollectionKey)
                return (
                  <UsersTableRow
                    key={users.guid}
                    users={users}
                    assignedAccessRoles={assignedAccessRoles}
                    accessRoleCollection={accessRoleCollection}
                    onEdit={handleEdit}
                    onDelete={setUsersToDelete}
                  />
                )
              })}
            </tbody>
          </Table>
        )}
      </ContentBox>
      {newUsersOpen && <NewUsersPopup onCreated={handleUsersCreated} onClose={() => setNewUsersOpen(false)} />}
      {usersToDelete !== null && (
        <ConfirmDeletePopup
          title="User löschen"
          isDeleting={deleteUsersHook.isLoading}
          errorMessage={deleteErrorMessage}
          onConfirm={handleConfirmDelete}
          onClose={handleCloseDeletePopup}>
          Soll <strong>{usersToDelete.username}</strong> wirklich gelöscht werden? Der User wird auf DELETED gesetzt, kann
          sich nicht mehr anmelden und verschwindet aus der Liste.
        </ConfirmDeletePopup>
      )}
    </>
  )
}
