package de.gebiter.file.dto;

import java.util.Map;

/**
 * Der Teil {@code data} beim Hochladen in eine Galerie, ein JSON-Objekt: die Galerie und die Felder des Clients wie
 * beim normalen Upload (darunter die FileClass aus dem Dropdown). Z. B. {@code {"galleryId": 7,
 * "fieldValuesByFieldName": {"fileClassKey": "FOTO_URLAUB"}}}.
 */
public record FileUploadIntoGalleryData(Long galleryId, Map<String, Object> fieldValuesByFieldName) {
}
