/**
 * Eine Wissensseite, so wie das Backend sie liefert: die Felder ihres Solr-Dokuments, die der Leser lesen darf, je
 * Feld unter seinem Namen im Kern `KNOWLEDGE`. Welche Felder kommen, bestimmt „Wer liest“ in der Feldtabelle des Kerns
 * (SolrManager); wie sie heißen, sagt {@link KnowledgeSolrFieldNameSet}.
 */
export type KnowledgePageDocument = Record<string, unknown>

/** Wie die Felder einer Wissensseite im Kern heißen, vom Backend (`gebiter.knowledge.field.*`). */
export type KnowledgeSolrFieldNameSet = {
  id: string
  pageGuid: string
  language: string
  rubricKey: string
  chapterKey: string
  subChapterKey: string
  pageKey: string
  listingPosition: string
  title: string
  summary: string
  content: string
  contentFormatVersion: string
  tags: string
  status: string
  relatedPageGuids: string
  authorUsersGuid: string
  createdAt: string
  lastChangedAt: string
}

/** Exakte Sollwerte zum Auflösen von Seiten; ein Wert, der fehlt, filtert nicht. */
export type KnowledgePageResolveRequest = {
  language?: string
  rubricKey?: string
  chapterKey?: string
  subChapterKey?: string
  pageKey?: string
}

/** Die Texte eines mehrwertigen Feldes einer Seite, z. B. ihre Schlagwörter; leer, wenn das Dokument das Feld nicht hat. */
export function getKnowledgePageTexts(knowledgePageDocument: KnowledgePageDocument, fieldName: string): string[] {
  const fieldValue = knowledgePageDocument[fieldName]
  if (!Array.isArray(fieldValue)) {
    return []
  }
  return fieldValue.filter((singleValue): singleValue is string => typeof singleValue === 'string')
}

/** Der Text eines Feldes einer Seite; `null`, wenn das Dokument das Feld nicht hat oder es kein Text ist. */
export function getKnowledgePageText(knowledgePageDocument: KnowledgePageDocument, fieldName: string): string | null {
  const fieldValue = knowledgePageDocument[fieldName]
  if (typeof fieldValue !== 'string') {
    return null
  }
  return fieldValue
}
