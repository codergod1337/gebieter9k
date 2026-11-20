package de.gebiter.gallery.dto;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import de.gebiter.status.model.Visibility;

/**
 * Eine Galerie für die Anzeige: ihre Daten, dazu wie viele Bilder der Betrachter darin sieht, das Vorschaubild des
 * ersten (PNG als Base64, {@code null} ohne) und wann zuletzt eines hochgeladen wurde ({@code null} ohne Bild). Zahl,
 * Vorschau und letzter Upload kommen mit dem Lesefilter aus Solr.
 */
public record GalleryForClient(Long id, UUID ownerUsersGuid, String title, Map<String, String> description, Visibility visibility,
		int listingPosition, OffsetDateTime createdAt, long fileCount, String coverPreviewBase64Png, Instant lastUploadedAt) {
}
