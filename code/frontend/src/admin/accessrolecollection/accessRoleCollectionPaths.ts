/** Der Tab „ARC“ der Administration. Abbrechen und Speichern führen hierher zurück. */
export const ACCESS_ROLE_COLLECTION_TAB_PATH = '/admin/access-role-collection'

/** Die Seite „Position bearbeiten“ für die Position mit `accessRoleCollectionKey`. */
export function getEditAccessRoleCollectionPath(accessRoleCollectionKey: string): string {
  return '/admin/access-role-collection/edit/' + accessRoleCollectionKey
}
