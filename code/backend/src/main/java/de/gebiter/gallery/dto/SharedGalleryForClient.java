package de.gebiter.gallery.dto;

import java.time.Instant;
import java.util.Map;

import de.gebiter.file.dto.FileDocumentPage;
import de.gebiter.file.dto.FileSolrFieldNameSet;

/**
 * Die Standardansicht einer Galerie-Freigabe für einen Besucher: was er von der Galerie sieht und eine Seite ihrer
 * Bilder. Weder die id der Galerie noch ihr Besitzer noch der Token stehen darin.
 *
 * @param title der Titel der Galerie
 * @param description die Beschreibung als mehrsprachiger Rich-Text, {@code null} ohne
 * @param expiresAt bis wann die Freigabe gilt, {@code null} ohne zeitliche Grenze
 * @param remainingAccessCount wie viele Aufrufe (Bild im Viewer oder Download) noch gehen, {@code null} ohne Grenze
 * @param filePage eine Seite der Bilder in der Reihenfolge der Galerie, mit der Gesamtzahl
 * @param fileSolrFieldNameSet wie die Felder eines Bildes heißen (nur die Namen): Ein Besucher hat keine Anmeldung und
 *        bekommt die Stammdaten des Frontends sonst nicht
 */
public record SharedGalleryForClient(String title, Map<String, String> description, Instant expiresAt,
		Long remainingAccessCount, FileDocumentPage filePage, FileSolrFieldNameSet fileSolrFieldNameSet) {
}
