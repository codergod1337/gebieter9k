package de.gebiter.knowledge.dto;

/**
 * Der neue Key eines Punkts der Gliederung. Body: {@code {"knowledgeSectionId": 2, "key": "BASICS"}}. Welcher der drei
 * Keys gemeint ist, sagt die Ebene des Punkts: bei einer Rubrik ihr {@code rubricKey}, bei einem Kapitel sein
 * {@code chapterKey}, bei einem Unterkapitel sein {@code subChapterKey}.
 */
public record KnowledgeSectionKeyChange(Long knowledgeSectionId, String key) {
}
