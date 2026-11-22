package de.gebiter.gallery.dto;

import java.util.UUID;

/**
 * Einen Uploadberechtigten in eine eigene Galerie eintragen.
 *
 * @param galleryId die eigene Galerie
 * @param uploaderUsersGuid der User, der in die Galerie hochladen dürfen soll
 */
public record NewGalleryUploader(Long galleryId, UUID uploaderUsersGuid) {
}
