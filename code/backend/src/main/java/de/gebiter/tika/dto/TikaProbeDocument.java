package de.gebiter.tika.dto;

import java.util.List;
import java.util.Map;

/**
 * Ein Dokument, das Tika gelesen hat: die Datei selbst oder ein darin eingebettetes.
 *
 * @param embeddedResourcePath der Pfad in der Datei, z. B. {@code /bilder/bild.png}; {@code null} bei der Datei selbst
 * @param content der erkannte Text, vollständig; {@code null}, wenn Tika keinen liefert
 * @param metadata alle übrigen Metadaten, Schlüssel alphabetisch, jeder mit allen Werten, so wie Tika sie nennt
 */
public record TikaProbeDocument(String embeddedResourcePath, String content, Map<String, List<String>> metadata) {
}
