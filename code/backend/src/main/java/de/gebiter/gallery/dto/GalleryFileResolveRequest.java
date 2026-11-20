package de.gebiter.gallery.dto;

import java.util.List;

/**
 * Eine Seite der Bilder einer Galerie, ab 0.
 *
 * @param galleryId die Galerie
 * @param page die Seite, ab 0
 * @param tags Filter nach Hashtags: nur Bilder mit mindestens einem dieser Tags; {@code null} oder leer: alle Bilder
 */
public record GalleryFileResolveRequest(Long galleryId, int page, List<String> tags) {
}
