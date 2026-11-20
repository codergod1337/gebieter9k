package de.gebiter.gallery.dto;

import java.time.Instant;

/**
 * Eine eigene Galerie freigeben. Ohne {@code expiresAt} und ohne {@code maxAccessCount} gilt die Freigabe dauerhaft;
 * höchstens eins von beiden darf gesetzt sein.
 *
 * @param galleryId die eigene Galerie
 * @param label die Bezeichnung der Freigabe, z. B. „für Oma“
 * @param expiresAt bis wann die Freigabe gilt, {@code null} ohne zeitliche Grenze
 * @param maxAccessCount wie viele Aufrufe sie höchstens erlaubt, {@code null} ohne Grenze
 */
public record NewGalleryShare(Long galleryId, String label, Instant expiresAt, Long maxAccessCount) {
}
