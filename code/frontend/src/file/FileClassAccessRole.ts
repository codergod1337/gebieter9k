/**
 * Ein Eintrag „Recht X darf an FileClass Y …“, so wie das Backend ihn als JSON liefert: drei eigene Schalter (Nutzer
 * 2026-11-11), lesen, bearbeiten, hochladen. Bearbeiten und Hochladen schließen Lesen ein, das stellt das Backend
 * sicher. Einen Eintrag gibt es nur, wenn mindestens ein Schalter an ist.
 * Doku: `docu/entities/FileClassAccessRole.md`
 */
export type FileClassAccessRole = {
  id: number
  fileClassKey: string
  accessRoleKey: string
  /** lesen: suchen, auflösen, ansehen, herunterladen */
  readGranted: boolean
  /** bearbeiten: Metadaten ändern; wird noch nicht ausgewertet, bis dahin bearbeitet der Autor */
  editGranted: boolean
  /** hochladen: Dateien dieser FileClass hochladen */
  uploadGranted: boolean
}

/** Zum Anlegen: ohne `id`, die vergibt das Backend. */
export type NewFileClassAccessRole = Omit<FileClassAccessRole, 'id'>

/** Einer der drei Schalter eines Eintrags. */
export type FileClassGrant = 'READ' | 'EDIT' | 'UPLOAD'

/** Ist an diesem Eintrag der Schalter `grant` an? */
export function hasFileClassGrant(fileClassAccessRole: FileClassAccessRole, grant: FileClassGrant): boolean {
  if (grant === 'READ') {
    return fileClassAccessRole.readGranted
  }
  if (grant === 'EDIT') {
    return fileClassAccessRole.editGranted
  }
  return fileClassAccessRole.uploadGranted
}

/**
 * Die FileClasses, die ein User mit diesen Rechten hochladen darf: an denen eines seiner Rechte „Hochladen“ hat. Damit
 * bietet die Upload-Maske nur an, was das Backend auch annimmt.
 */
export function getUploadableFileClassKeys(
  fileClassAccessRoles: FileClassAccessRole[],
  hasAccessRole: (accessRoleKey: string) => boolean,
): Set<string> {
  const uploadableFileClassKeys = new Set<string>()
  for (const fileClassAccessRole of fileClassAccessRoles) {
    if (fileClassAccessRole.uploadGranted && hasAccessRole(fileClassAccessRole.accessRoleKey)) {
      uploadableFileClassKeys.add(fileClassAccessRole.fileClassKey)
    }
  }
  return uploadableFileClassKeys
}

/**
 * Die FileClasses, deren Dateien ein User mit diesen Rechten lesen darf: an denen eines seiner Rechte „Lesen“ hat
 * (Bearbeiten und Hochladen schließen es ein). Nur die bietet z. B. die Dateiliste an, in anderen fände er ohnehin
 * nichts.
 */
export function getReadableFileClassKeys(
  fileClassAccessRoles: FileClassAccessRole[],
  hasAccessRole: (accessRoleKey: string) => boolean,
): Set<string> {
  const readableFileClassKeys = new Set<string>()
  for (const fileClassAccessRole of fileClassAccessRoles) {
    if (fileClassAccessRole.readGranted && hasAccessRole(fileClassAccessRole.accessRoleKey)) {
      readableFileClassKeys.add(fileClassAccessRole.fileClassKey)
    }
  }
  return readableFileClassKeys
}
