package de.gebiter.file.dto;

import de.gebiter.status.model.Visibility;

/** Die Sichtbarkeit einer Datei ändern: welche Datei und für wen sie sichtbar ist. */
public record FileDocumentVisibilityChangeRequest(String id, Visibility visibility) {
}
