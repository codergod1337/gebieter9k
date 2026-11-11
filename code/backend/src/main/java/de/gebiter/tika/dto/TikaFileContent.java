package de.gebiter.tika.dto;

import java.util.Date;

/**
 * Was der Upload von Tika braucht: Typ, Text und die EXIF-Werte, die in den Kern gehen. Jeder Wert ist {@code null}, wenn
 * Tika ihn nicht gefunden hat.
 *
 * @param mimeType der Typ laut Tika, erkannt an den Bytes, nicht an der Endung
 * @param text der Text der Datei, höchstens so viele Zeichen wie verlangt
 * @param imageWidth Breite eines Bildes oder Videos in Pixeln
 * @param imageHeight Höhe eines Bildes oder Videos in Pixeln
 * @param exifOrientation EXIF-Ausrichtung 1 bis 8, nötig, um die Vorschau richtig zu drehen
 * @param capturedAt Aufnahmezeit (EXIF), sonst die Erstellzeit der Datei
 * @param cameraModel das Kameramodell (EXIF)
 * @param gpsLatitude Breitengrad (EXIF)
 * @param gpsLongitude Längengrad (EXIF)
 */
public record TikaFileContent(String mimeType, String text, Long imageWidth, Long imageHeight, Integer exifOrientation,
		Date capturedAt, String cameraModel, Double gpsLatitude, Double gpsLongitude) {
}
