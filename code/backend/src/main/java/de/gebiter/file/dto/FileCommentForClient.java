package de.gebiter.file.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Ein Kommentar zu einer Datei, wie die Darstellung ihn braucht.
 *
 * @param id der Kommentar
 * @param authorUsersGuid wer ihn geschrieben hat
 * @param commentText der Text als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML
 * @param writtenAt wann er geschrieben wurde
 * @param deletableByCurrentUsers ob der angemeldete User ihn löschen darf (sein Autor oder der Autor der Datei); für
 *        einen Besucher ohne Anmeldung immer {@code false}
 */
public record FileCommentForClient(Long id, UUID authorUsersGuid, Map<String, String> commentText, OffsetDateTime writtenAt,
		boolean deletableByCurrentUsers) {
}
