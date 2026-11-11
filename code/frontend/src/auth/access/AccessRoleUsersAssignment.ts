/**
 * Welches Recht welchem User zugewiesen ist, so wie das Backend es als JSON liefert.
 * Doku: `docu/entities/AccessRoleUsersAssignment.md`
 */
export type AccessRoleUsersAssignment = {
  id: number
  usersGuid: string
  accessRoleKey: string
}

/** Body zum Zuweisen: der User und der Key des Rechts, z. B. `ADMIN`. */
export type NewAccessRoleUsersAssignment = {
  usersGuid: string
  accessRoleKey: string
}
