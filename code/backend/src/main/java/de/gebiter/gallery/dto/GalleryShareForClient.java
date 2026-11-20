package de.gebiter.gallery.dto;

import java.time.Instant;

/**
 * Eine Freigabe für die Anzeige beim Besitzer der Galerie, mit ihrem Token: Aus ihm baut die Oberfläche den Link, den
 * der Besitzer jederzeit wieder ansehen und weiterschicken kann (Nutzer 2026-11-20). Der Hash des Tokens steht nicht
 * darin. Dieses Objekt bekommt nur der Besitzer der Galerie, dazu der Admin in seiner Übersicht über alle Freigaben
 * ({@link GalleryShareForAdmin}).
 *
 * @param id die Freigabe
 * @param galleryId die freigegebene Galerie
 * @param label die Bezeichnung, z. B. „für Oma“
 * @param shareToken der Token für den Link, Hex-Text
 * @param expiresAt bis wann sie gilt, {@code null} ohne zeitliche Grenze
 * @param maxAccessCount wie viele Aufrufe sie höchstens erlaubt, {@code null} ohne Grenze
 * @param accessCount wie viele Aufrufe es schon gab
 * @param fileCount in wie vielen Bildern die Freigabe stehen soll (Postgres)
 * @param sharedFileCount in wie vielen aktiven Bildern sie wirklich steht (Solr); weicht die Zahl von {@code fileCount}
 *        ab, stimmt etwas nicht
 * @param createdAt wann sie angelegt wurde
 */
public record GalleryShareForClient(Long id, Long galleryId, String label, String shareToken, Instant expiresAt,
		Long maxAccessCount, long accessCount, long fileCount, long sharedFileCount, Instant createdAt) {
}
