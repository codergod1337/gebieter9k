package de.gebiter.gallery.dto;

import java.util.Map;

import de.gebiter.status.model.Visibility;

/** Eine eigene Galerie ändern: Titel, Beschreibung und Sichtbarkeit; die Sichtbarkeit geht auf alle ihre Bilder über. */
public record GalleryChangeRequest(Long id, String title, Map<String, String> description, Visibility visibility) {
}
