package de.gebiter.file.dto;

import de.gebiter.file.model.FileCheerDirection;

/**
 * Eine Seite der User auflösen, die in einer Richtung für eine Datei gestimmt haben, z. B. {@code {"fileDocumentId":
 * "…", "direction": "UP", "page": 0}}. Die Seiten zählen ab 0.
 */
public record FileCheerUsersResolveRequest(String fileDocumentId, FileCheerDirection direction, int page) {
}
