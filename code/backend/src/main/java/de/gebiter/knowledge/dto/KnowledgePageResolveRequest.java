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
 * @param equationGuid die GUID einer Gleichung: die Seite(n), in deren Inhalt diese Gleichung steht, z. B.
 *        {@code {"equationGuid": "3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b"}}
 */
public record KnowledgePageResolveRequest(String language, String rubricKey, String chapterKey, String subChapterKey,
		String pageKey, String equationGuid) {
}
