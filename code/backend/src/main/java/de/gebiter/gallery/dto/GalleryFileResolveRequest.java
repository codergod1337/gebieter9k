package de.gebiter.gallery.dto;

/** Eine Seite der Bilder einer Galerie, ab 0. */
public record GalleryFileResolveRequest(Long galleryId, int page) {
}
