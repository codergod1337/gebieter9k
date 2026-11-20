package de.gebiter.gallery.dto;

import java.util.UUID;

/**
 * Eine Freigabe in der Übersicht des Admins über alle Freigaben aller Galerien (Nutzer 2026-11-20,
 * {@code GET /api/admin/gallery-share}): die Freigabe, wie sie auch der Besitzer der Galerie sieht, dazu welche Galerie
 * es ist und wem sie gehört. Nur der Admin bekommt dieses Objekt.
 *
 * @param galleryShare die Freigabe mit ihrem Token für den Link und den beiden Zahlen der Bilder (Postgres und Solr)
 * @param galleryTitle der Titel der freigegebenen Galerie; {@code null}, wenn es die Galerie nicht mehr gibt
 * @param ownerUsersGuid wem die Galerie gehört; {@code null}, wenn es die Galerie nicht mehr gibt
 */
public record GalleryShareForAdmin(GalleryShareForClient galleryShare, String galleryTitle, UUID ownerUsersGuid) {
}
