package de.gebiter.gallery.dto;

import java.util.Map;

import de.gebiter.status.model.Visibility;

/** Eine eigene Galerie anlegen: Titel, Beschreibung (darf fehlen) und Sichtbarkeit. */
public record NewGallery(String title, Map<String, String> description, Visibility visibility) {
}
