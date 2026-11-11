/** Der Tab „FileClass“ der Administration. Abbrechen und Speichern führen hierher zurück. */
export const FILE_CLASS_TAB_PATH = '/admin/file-class'

/** Die Seite „neue FileClass“. */
export const NEW_FILE_CLASS_PATH = '/admin/file-class/new'

/** Die Seite „FileClass bearbeiten“ für die FileClass mit `fileClassKey`. */
export function getEditFileClassPath(fileClassKey: string): string {
  return '/admin/file-class/edit/' + fileClassKey
}

/** Die Matrix „FileClass × Endung“. */
export const FILE_CLASS_FILE_EXTENSION_MATRIX_PATH = '/admin/file-class-extension'

/** Der Tab „FileClass-Ziel“: an welchem Upload-Weg eine FileClass im Dropdown steht. */
export const FILE_CLASS_DESTINATION_TAB_PATH = '/admin/file-class-destination'

/** Die Matrix „FileClass × AR“. */
export const FILE_CLASS_ACCESS_ROLE_MATRIX_PATH = '/admin/file-class-ar'
