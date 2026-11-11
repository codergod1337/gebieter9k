/**
 * Ein Recht in einer Collection, so wie das Backend es als JSON liefert.
 * Doku: `docu/entities/AccessRoleCollectionRole.md`
 */
export type AccessRoleCollectionRole = {
  id: number
  accessRoleCollectionKey: string
  accessRoleKey: string
}

/** Body zum Aufnehmen eines Rechts in eine Collection, die `id` vergibt das Backend. */
export type NewAccessRoleCollectionRole = {
  accessRoleCollectionKey: string
  accessRoleKey: string
}
