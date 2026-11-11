/**
 * Ein Eintrag „FileClass X nimmt Endung Y an“, so wie das Backend ihn als JSON liefert.
 * Doku: `docu/entities/FileClassFileExtension.md`
 */
export type FileClassFileExtension = {
  id: number
  fileClassKey: string
  fileExtension: string
}

/** Zum Anlegen: ohne `id`, die vergibt das Backend. */
export type NewFileClassFileExtension = Omit<FileClassFileExtension, 'id'>

/** Die Endungen, die die FileClass `fileClassKey` annimmt, in der Reihenfolge der Einträge. */
export function getFileExtensionsOfFileClass(
  fileClassFileExtensions: FileClassFileExtension[],
  fileClassKey: string,
): string[] {
  const fileExtensionsOfFileClass: string[] = []
  for (const fileClassFileExtension of fileClassFileExtensions) {
    if (fileClassFileExtension.fileClassKey === fileClassKey) {
      fileExtensionsOfFileClass.push(fileClassFileExtension.fileExtension)
    }
  }
  return fileExtensionsOfFileClass
}
