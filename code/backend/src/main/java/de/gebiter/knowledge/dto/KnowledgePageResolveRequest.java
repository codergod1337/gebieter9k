package de.gebiter.knowledge.dto;

/**
 * Request Body zum Auflösen von Wissensseiten ({@code POST …/knowledge-page/resolve}): exakte Sollwerte, zurück kommt
 * die Liste der Seiten, die auf alle genannten Werte passen, oder eine leere Liste. Ein Wert {@code null} filtert nicht.
 * Beispiel: {@code {"language": "de", "rubricKey": "MATHE", "chapterKey": "GRUNDLAGEN"}} sind alle deutschen Seiten des
 * Kapitels.
 *
 * @param language die Sprache, z. B. {@code de}
 * @param rubricKey die Rubrik
 * @param chapterKey das Kapitel
 * @param subChapterKey das Unterkapitel
 * @param pageKey die Seite in ihrer Adresse
 */
public record KnowledgePageResolveRequest(String language, String rubricKey, String chapterKey, String subChapterKey,
		String pageKey) {
}
