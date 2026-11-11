package de.gebiter.file.dto;

import java.util.List;
import java.util.UUID;

/** Wer außer dem Autor die Metadaten einer Datei bearbeiten darf: die Datei und die GUIDs der freigegebenen User. */
public record FileDocumentEditorsChangeRequest(String id, List<UUID> editorUsersGuids) {
}
