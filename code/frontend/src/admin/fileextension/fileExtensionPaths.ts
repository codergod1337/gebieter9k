/** Der Tab „Endungen“ der Administration. Abbrechen und Speichern führen hierher zurück. */
export const FILE_EXTENSION_TAB_PATH = '/admin/file-extension'

/** Die Seite „neue Endung“. */
export const NEW_FILE_EXTENSION_PATH = '/admin/file-extension/new'

/** Die Seite „Endung bearbeiten“ für die Endung `fileExtension`. */
export function getEditFileExtensionPath(fileExtension: string): string {
  return '/admin/file-extension/edit/' + fileExtension
}

/** Die Seite „neue Gruppe“ (Übergruppe der Endungen). */
export const NEW_FILE_EXTENSION_GROUP_PATH = '/admin/file-extension/group/new'

/** Die Seite „Gruppe bearbeiten“ für die Gruppe `fileExtensionGroupKey`. */
export function getEditFileExtensionGroupPath(fileExtensionGroupKey: string): string {
  return '/admin/file-extension/group/edit/' + fileExtensionGroupKey
}
