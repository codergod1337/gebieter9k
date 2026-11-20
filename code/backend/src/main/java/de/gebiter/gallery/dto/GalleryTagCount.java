package de.gebiter.gallery.dto;

/**
 * Ein Hashtag einer Galerie für den Filter über ihren Kacheln: der Tag und in wie vielen Bildern der Galerie er steht
 * (nur Bilder, die der Betrachter lesen darf).
 *
 * @param tag der Tag ohne Raute, z. B. {@code strand}; die Raute zeigt nur die Oberfläche
 * @param fileCount so viele Bilder der Galerie tragen ihn
 */
public record GalleryTagCount(String tag, long fileCount) {
}
