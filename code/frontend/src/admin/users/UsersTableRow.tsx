import type { AccessRole } from '../../auth/access/AccessRole.ts'
import { AccessRoleBadge } from '../../auth/access/AccessRoleBadge.tsx'
import type { AccessRoleCollection } from '../../auth/access/AccessRoleCollection.ts'
import { AccessRoleCollectionBadge } from '../../auth/access/AccessRoleCollectionBadge.tsx'
import { DeleteButton } from '../../components/DeleteButton.tsx'
import { EditButton } from '../../components/EditButton.tsx'
import type { Users } from '../../users/Users.ts'

type UsersTableRowProps = {
  users: Users
  /** Die Rechte des Users, in der Reihenfolge der Stammdaten. */
  assignedAccessRoles: AccessRole[]
  /** Seine Collection, `null` wenn es sie in den Stammdaten nicht gibt. */
  accessRoleCollection: AccessRoleCollection | null
  onEdit: (users: Users) => void
  onDelete: (users: Users) => void
}

/** Eine Zeile im Tab „User“, ganz rechts die Aktionen Bearbeiten und Löschen. */
export function UsersTableRow({ users, assignedAccessRoles, accessRoleCollection, onEdit, onDelete }: UsersTableRowProps) {
  function handleEditClick() {
    onEdit(users)
  }

  function handleDeleteClick() {
    onDelete(users)
  }

  const editLabel = users.username + ' bearbeiten'
  const deleteLabel = users.username + ' löschen'

  return (
    <tr>
      <td>{users.email}</td>
      <td>{users.status}</td>
      <td>
        {accessRoleCollection !== null && <AccessRoleCollectionBadge accessRoleCollection={accessRoleCollection} />}
      </td>
      <td>
        {assignedAccessRoles.map((accessRole) => (
          <AccessRoleBadge key={accessRole.key} accessRole={accessRole} />
        ))}
      </td>
      <td>{users.username}</td>
      <td className="text-end text-nowrap">
        <EditButton label={editLabel} onClick={handleEditClick} />
        <DeleteButton label={deleteLabel} onClick={handleDeleteClick} />
      </td>
    </tr>
  )
}
