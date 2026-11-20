package de.gebiter.file.dto;

/** Body von {@code DELETE /api/file-comment}: die id des Kommentars. */
public record FileCommentDeleteRequest(Long id) {
}
