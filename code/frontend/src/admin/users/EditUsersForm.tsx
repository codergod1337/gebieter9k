import { type ChangeEvent, type FormEvent, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import type { AccessRole } from '../../auth/access/AccessRole.ts'
import type { AccessRoleUsersAssignment } from '../../auth/access/AccessRoleUsersAssignment.ts'
import { AccessRoleToggleList } from '../../auth/access/AccessRoleToggleList.tsx'
import { useAccessRoleUsersAssignment } from '../../auth/access/useAccessRoleUsersAssignment.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { ErrorAlert } from '../../components/ErrorAlert.tsx'
import { SubmitButton } from '../../components/SubmitButton.tsx'
import type { Users } from '../../users/Users.ts'
import { useUsers } from '../../users/useUsers.ts'

type EditUsersFormProps = {
  /** Der User, wie er gespeichert ist. */
  users: Users
  /** Seine Zuweisungen, wie sie gespeichert sind. */
  usersAssignments: AccessRoleUsersAssignment[]
  /** Alle Rechte aus den Stammdaten. */
  accessRoles: AccessRole[]
  /** Nach dem Speichern und beim Abbrechen. */
  onDone: () => void
}

/**
 * Das Formular „User bearbeiten“: Username, E-Mail-Adresse und die Rechte. Gespeichert wird alles mit „Speichern“:
 * erst der User, dann entzogene Rechte, dann neue. Für jeden User neu erzeugt (`key`), deshalb startet der Entwurf
 * immer mit dem gespeicherten Stand.
 */
export function EditUsersForm({ users, usersAssignments, accessRoles, onDone }: EditUsersFormProps) {
  const usersHook = useUsers()
  const accessRoleUsersAssignmentHook = useAccessRoleUsersAssignment()

  const savedAccessRoleKeys: string[] = []
  for (const usersAssignment of usersAssignments) {
    savedAccessRoleKeys.push(usersAssignment.accessRoleKey)
  }
  const [username, setUsername] = useState<string>(users.username)
  const [email, setEmail] = useState<string>(users.email)
  const [selectedAccessRoleKeys, setSelectedAccessRoleKeys] = useState<Set<string>>(new Set(savedAccessRoleKeys))

  function handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredUsername = event.target.value
    setUsername(enteredUsername)
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    const enteredEmail = event.target.value
    setEmail(enteredEmail)
  }

  function handleToggleAccessRole(accessRoleKey: string) {
    setSelectedAccessRoleKeys((currentSelection) => {
      const changedSelection = new Set(currentSelection)
      if (changedSelection.has(accessRoleKey)) {
        changedSelection.delete(accessRoleKey)
      } else {
        changedSelection.add(accessRoleKey)
      }
      return changedSelection
    })
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const changedUsers: Users = { ...users, username, email }
    const savedUsers = await usersHook.changeUsers(changedUsers)
    if (savedUsers === null) {
      return
    }
    for (const usersAssignment of usersAssignments) {
      const stillSelected = selectedAccessRoleKeys.has(usersAssignment.accessRoleKey)
      if (!stillSelected) {
        const revoked = await accessRoleUsersAssignmentHook.deleteAccessRoleUsersAssignment(usersAssignment.id)
        if (!revoked) {
          return
        }
      }
    }
    for (const selectedAccessRoleKey of selectedAccessRoleKeys) {
      const alreadyAssigned = savedAccessRoleKeys.includes(selectedAccessRoleKey)
      if (!alreadyAssigned) {
        const newAssignment = { usersGuid: users.guid, accessRoleKey: selectedAccessRoleKey }
        const createdAssignment = await accessRoleUsersAssignmentHook.createAccessRoleUsersAssignment(newAssignment)
        if (createdAssignment === null) {
          return
        }
      }
    }
    onDone()
  }

  let errorMessage: string | null = null
  if (usersHook.error !== null) {
    errorMessage = usersHook.error.detail
  } else if (accessRoleUsersAssignmentHook.error !== null) {
    errorMessage = accessRoleUsersAssignmentHook.error.detail
  }
  const isSaving = usersHook.isLoading || accessRoleUsersAssignmentHook.isLoading
  const contentBoxTitle = 'User bearbeiten: ' + users.username
  const footer = (
    <div className="d-flex justify-content-end gap-2">
      <Button variant="secondary" onClick={onDone} disabled={isSaving}>
        Abbrechen
      </Button>
      <SubmitButton isSubmitting={isSaving} fullWidth={false}>
        Speichern
      </SubmitButton>
    </div>
  )

  return (
    <Form onSubmit={handleSave}>
      <ContentBox title={contentBoxTitle} footer={footer}>
        <ErrorAlert message={errorMessage} />
        <Form.Group className="mb-3" controlId="editUsersUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control value={username} onChange={handleUsernameChange} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="editUsersEmail">
          <Form.Label>E-Mail-Adresse</Form.Label>
          <Form.Control value={email} onChange={handleEmailChange} required />
        </Form.Group>
        <Form.Label>Rechte</Form.Label>
        <AccessRoleToggleList
          accessRoles={accessRoles}
          selectedAccessRoleKeys={selectedAccessRoleKeys}
          onToggle={handleToggleAccessRole}
          disabled={isSaving}
        />
        <p className="small text-body-secondary mt-2 mb-0">
          Rechte stehen im Token: Eine Änderung wirkt für den User erst nach seiner nächsten Anmeldung.
        </p>
      </ContentBox>
    </Form>
  )
}
