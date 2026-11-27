package de.gebiter.knowledge.dto;

import java.util.List;

/**
 * Eine neue Reihenfolge von Geschwistern der Gliederung, z. B. der Kapitel einer Rubrik: die ids ALLER Geschwister, von
 * oben nach unten. Body: {@code {"knowledgeSectionIdsInOrder": [12, 7, 9]}}. Der erste bekommt Platz 1.
 */
public record KnowledgeSectionListingOrder(List<Long> knowledgeSectionIdsInOrder) {
}
