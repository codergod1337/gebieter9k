/**
 * Eine Einstellung eines Users, so wie das Backend sie als JSON liefert (`UsersSetting`).
 * Doku: `docu/entities/UsersSetting.md`
 */
export type UsersSetting = {
  id: number
  usersGuid: string
  /** Nach der Key-Regel, z. B. `TABLE_SOLR_FIELD`. */
  settingKey: string
  /** Der Wert als Text, z. B. JSON. */
  settingValue: string | null
}
