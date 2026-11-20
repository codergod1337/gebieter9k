package de.gebiter.gallery.dto;

/**
 * Meldung: Die Galerie {@code galleryId} wird gerade gelöscht, in der laufenden Transaktion und bevor an ihr etwas
 * geändert ist. Der {@link de.gebiter.gallery.service.GalleryShareService} löscht daraufhin ihre Freigaben. So braucht
 * der {@link de.gebiter.gallery.service.GalleryService} den GalleryShareService nicht, der ihn selbst schon nutzt (kein
 * Kreis). Scheitert das Löschen der Freigaben, scheitert das Löschen der Galerie mit.
 */
public record GalleryDeletedEvent(Long galleryId) {
}
