package de.gebiter.file.dto;

import java.util.Map;

/** Body von {@code POST /api/file-comment}: die Datei und der Kommentar als mehrsprachiger Rich-Text. */
public record NewFileComment(String fileDocumentId, Map<String, String> commentText) {
}
