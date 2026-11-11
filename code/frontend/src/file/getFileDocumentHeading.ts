import { type FileDocument, getFileDocumentText } from './FileDocument.ts'
import type { FileSolrFieldNameSet } from './FileSolrFieldNameSet.ts'

/** Die Tags einer Datei, wie sie gespeichert sind (ohne Raute), in ihrer Reihenfolge. */
export function getFileDocumentTags(fileDocument: FileDocument, fileSolrFieldNameSet: FileSolrFieldNameSet): string[] {
  const storedTags = fileDocument[fileSolrFieldNameSet.tags]
  if (!Array.isArray(storedTags)) {
    return []
  }
  return storedTags.map((storedTag) => String(storedTag))
}

/** Ein Tag zum Anzeigen: mit Raute davor, wie bei Instagram; gespeichert ist er ohne. */
export function formatTag(tag: string): string {
  return '#' + tag
}

/**
 * Die Überschrift einer Datei (Nutzer 2026-11-09: die Tags, einen Titel gibt es nicht): ihre Tags mit Raute, z. B.
 * „#beach #sky“; ohne Tags der Dateiname.
 */
export function getFileDocumentHeading(fileDocument: FileDocument, fileSolrFieldNameSet: FileSolrFieldNameSet): string {
  const tags = getFileDocumentTags(fileDocument, fileSolrFieldNameSet)
  if (tags.length === 0) {
    return getFileDocumentText(fileDocument, fileSolrFieldNameSet.fileName)
  }
  return tags.map(formatTag).join(' ')
}
