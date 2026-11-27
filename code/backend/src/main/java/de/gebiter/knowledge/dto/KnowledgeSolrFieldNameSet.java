package de.gebiter.knowledge.dto;

/**
 * Wie die Felder einer Wissensseite im Solr-Kern heißen, für das Frontend: Es liest die Dokumente als Feld-Maps und
 * fragt hier, unter welchem Namen es Titel, Inhalt usw. findet ({@code gebiter.knowledge.field.*}).
 */
public record KnowledgeSolrFieldNameSet(String id, String pageGuid, String language, String rubricKey, String chapterKey,
		String subChapterKey, String pageKey, String listingPosition, String title, String summary, String content,
		String contentFormatVersion, String tags, String status, String relatedPageGuids, String authorUsersGuid,
		String createdAt, String lastChangedAt, String equationGuids) {
}
