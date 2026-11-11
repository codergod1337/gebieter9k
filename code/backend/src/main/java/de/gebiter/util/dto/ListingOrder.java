package de.gebiter.util.dto;

import java.util.List;

/**
 * Eine neue Reihenfolge nach Drag and Drop, z. B. der Rechte im Tab „AR“: alle Keys der Liste, von oben nach unten.
 * Body: {@code {"keysInOrder": ["ADMIN", "MODERATOR", "USER"]}}. Der erste bekommt Platz 1.
 */
public record ListingOrder(List<String> keysInOrder) {
}
