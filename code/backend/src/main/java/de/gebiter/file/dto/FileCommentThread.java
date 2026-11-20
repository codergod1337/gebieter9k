package de.gebiter.file.dto;

import java.util.List;

import de.gebiter.users.dto.UsersAvatarForClient;

/**
 * Der Verlauf der Kommentare einer Datei: die Kommentare, die ältesten zuerst, und einmal je Autor, was die Darstellung
 * über ihn braucht (Avatar und Name nach der Sichtbarkeit seines Profils). Die Autoren kommen mit, damit auch ein
 * Besucher ohne Anmeldung sie sieht; er kann sie nicht selbst nachfragen.
 *
 * @param fileDocumentId die Datei
 * @param comments ihre Kommentare, die ältesten zuerst
 * @param authors jeder Autor der Kommentare einmal
 */
public record FileCommentThread(String fileDocumentId, List<FileCommentForClient> comments,
		List<UsersAvatarForClient> authors) {
}
