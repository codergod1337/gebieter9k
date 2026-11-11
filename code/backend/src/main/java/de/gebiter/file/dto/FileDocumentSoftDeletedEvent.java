package de.gebiter.file.dto;

import java.util.List;

/**
 * Meldung: Die Datei {@code fileDocumentId} ist gerade weich gelöscht worden (Status DELETED, in Solr schon sichtbar). Der
 * {@link de.gebiter.gallery.service.GalleryService} lässt daraufhin in ihren Galerien die übrigen Bilder aufrücken,
 * damit die Plätze lückenlos bleiben. So braucht der {@link de.gebiter.file.service.FileDocumentWriteService} den
 * GalleryService nicht, der ihn selbst schon nutzt (kein Kreis).
 *
 * @param fileDocumentId die gelöschte Datei
 * @param galleryIds die Galerien, in denen sie stand (leer ohne Galerie)
 */
public record FileDocumentSoftDeletedEvent(String fileDocumentId, List<Long> galleryIds) {
}
