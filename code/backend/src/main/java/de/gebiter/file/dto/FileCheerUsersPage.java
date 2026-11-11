package de.gebiter.file.dto;

import java.util.List;
import java.util.UUID;

import de.gebiter.file.model.FileCheerDirection;

/**
 * Eine Seite der User, die in einer Richtung für eine Datei gestimmt haben, der neueste zuerst. Damit lädt die Oberfläche
 * auf Wunsch alle nach („Alle laden“), eine Seite nach der anderen.
 *
 * @param fileDocumentId die Datei
 * @param direction die Richtung der Stimmen
 * @param usersGuids die User dieser Seite
 * @param totalCount so viele Stimmen dieser Richtung gibt es insgesamt
 * @param page die Seite, ab 0
 * @param pageSize so viele User je Seite ({@code gebiter.file.cheer-users-page-size})
 */
public record FileCheerUsersPage(String fileDocumentId, FileCheerDirection direction, List<UUID> usersGuids,
		long totalCount, int page, int pageSize) {
}
