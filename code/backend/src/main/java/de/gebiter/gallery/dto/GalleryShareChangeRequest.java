package de.gebiter.gallery.dto;

import java.time.Instant;

/**
 * Eine Freigabe ändern (nur der Admin, {@code PUT /api/admin/gallery-share}): die Bezeichnung und wie lange sie gilt.
 * Ohne {@code expiresAt} und ohne {@code maxAccessCount} gilt sie dauerhaft; höchstens eins von beiden darf gesetzt
 * sein. Token, Galerie und die Zahl der bisherigen Aufrufe ändert niemand.
 *
 * @param id die Freigabe
 * @param label die Bezeichnung, z. B. „für Oma“
 * @param expiresAt bis wann sie gilt, {@code null} ohne zeitliche Grenze
 * @param maxAccessCount wie viele Aufrufe sie höchstens erlaubt, {@code null} ohne Grenze
 */
public record GalleryShareChangeRequest(Long id, String label, Instant expiresAt, Long maxAccessCount) {
}
