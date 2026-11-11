package de.gebiter.gallery.dto;

import java.util.List;

/**
 * Die Bilder einer Seite der Galerie in neuer Reihenfolge (Drag and Drop): genau die ids dieser Seite, die erste kommt
 * nach vorn. Die anderen Seiten bleiben, wie sie sind.
 */
public record GalleryFileListingOrder(Long galleryId, int page, List<String> fileDocumentIdsInOrder) {
}
