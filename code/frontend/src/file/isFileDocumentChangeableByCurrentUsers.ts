import type { FileDocument } from './FileDocument.ts'
import type { FileSolrFieldNameSet } from './FileSolrFieldNameSet.ts'

/**
 * Ob der angemeldete User die Metadaten dieser Datei ändern darf, für die Anzeige (Stift an der Kachel), wie
 * `FileDocumentAccessService.isChangeableByCurrentUsers` im Backend: FILE_MANAGER oder ADMIN jede Datei, ein vom Autor
 * freigegebener Bearbeiter (`editorUsersGuids`), sonst nur die eigene mit einer Schreibrolle ihrer FileClass. Das ist
 * Anzeige, kein Schutz: Das Backend prüft jeden Schreibweg selbst.
 */
export function isFileDocumentChangeableByCurrentUsers(
  fileDocument: FileDocument,
  fileSolrFieldNameSet: FileSolrFieldNameSet,
  currentUsersGuid: string,
  fileManagerOrAdmin: boolean,
  hasAccessRole: (accessRoleKey: string) => boolean,
): boolean {
  if (fileManagerOrAdmin) {
    return true
  }
  const editorUsersGuids = fileDocument[fileSolrFieldNameSet.editorUsersGuids]
  if (Array.isArray(editorUsersGuids) && editorUsersGuids.includes(currentUsersGuid)) {
    return true
  }
  const authorUsersGuid = fileDocument[fileSolrFieldNameSet.authorUsersGuid]
  if (authorUsersGuid !== currentUsersGuid) {
    return false
  }
  const writerAccessRoleKeys = fileDocument[fileSolrFieldNameSet.writerAccessRoleKeys]
  if (!Array.isArray(writerAccessRoleKeys)) {
    return false
  }
  return writerAccessRoleKeys.some((writerAccessRoleKey) => hasAccessRole(String(writerAccessRoleKey)))
}
