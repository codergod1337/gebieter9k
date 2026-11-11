package de.gebiter.gallery.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import de.gebiter.status.model.Visibility;

/**
 * Eine Galerie für die Anzeige: ihre Daten, dazu wie viele Bilder der Betrachter darin sieht und das Vorschaubild des
 * ersten (PNG als Base64, {@code null} ohne). Zahl und Vorschau kommen mit dem Lesefilter aus Solr.
 */
public record GalleryForClient(Long id, UUID ownerUsersGuid, String title, Map<String, String> description, Visibility visibility,
		int listingPosition, OffsetDateTime createdAt, long fileCount, String coverPreviewBase64Png) {
}
