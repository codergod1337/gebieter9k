import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { useAccessRoleUsersAssignment } from '../../auth/access/useAccessRoleUsersAssignment.ts'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { useMasterData } from '../../masterdata/useMasterData.ts'
import { useUsers } from '../../users/useUsers.ts'
import { EditUsersForm } from './EditUsersForm.tsx'
import { UsersTotpBox } from './UsersTotpBox.tsx'
import { useOrigin } from '../../navigation/useOrigin.ts'

/** Wohin Abbrechen und Speichern führen: zurück zum Tab „User“. */
const USERS_TAB_PATH = '/admin/users'

/**
 * Seite „User bearbeiten“ unter `/admin/users/edit/<guid>`: lädt User und Zuweisungen, dann das Formular. Darunter die
 * Authenticator-App des Users (Stand, Entfernen).
 */
export function EditUsersTab() {
  const originNavigation = useOrigin()
  const { guid } = useParams()
  const usersGuid = guid ?? ''
  const usersHook = useUsers()
  const accessRoleUsersAssignmentHook = useAccessRoleUsersAssignment()
  const { accessRoles } = useMasterData()

  const getUsers = usersHook.getUsers
  const getAccessRoleUsersAssignmentByUsersGuid = accessRoleUsersAssignmentHook.getAccessRoleUsersAssignmentByUsersGuid
  const loadUsers = useCallback(() => getUsers(usersGuid), [getUsers, usersGuid])
  const loadUsersAssignments = useCallback(
    () => getAccessRoleUsersAssignmentByUsersGuid(usersGuid),
    [getAccessRoleUsersAssignmentByUsersGuid, usersGuid],
  )
  const loadedUsers = useLoadedData(loadUsers)
  const loadedUsersAssignments = useLoadedData(loadUsersAssignments)

  function handleDone() {
    originNavigation.goBackToOrigin(USERS_TAB_PATH)
  }

  let errorMessage: string | null = null
  if (usersHook.error !== null) {
    errorMessage = usersHook.error.detail
  } else if (accessRoleUsersAssignmentHook.error !== null) {
    errorMessage = accessRoleUsersAssignmentHook.error.detail
  }
  if (errorMessage !== null) {
    return <ErrorAlert message={errorMessage} />
  }

  const users = loadedUsers.data
  const usersAssignments = loadedUsersAssignments.data
  if (users === null || usersAssignments === null || accessRoles === null) {
    return <Spinner animation="border" />
  }
  return (
    <>
      <EditUsersForm
        key={users.guid}
        users={users}
        usersAssignments={usersAssignments}
        accessRoles={accessRoles}
        onDone={handleDone}
      />
      <UsersTotpBox usersGuid={users.guid} username={users.username} />
    </>
  )
}
