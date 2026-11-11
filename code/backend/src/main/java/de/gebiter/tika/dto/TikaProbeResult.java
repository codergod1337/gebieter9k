package de.gebiter.tika.dto;

import java.util.List;

/**
 * Alles, was Tika in einer Datei gefunden hat, für den Tika-Test.
 *
 * @param receivedBytes wie viele Bytes ankamen
 * @param durationMillis wie lange Lesen und Auswerten gedauert haben
 * @param parseErrorText der Fehler, an dem Tika abgebrochen hat, {@code null} wenn keiner. Ein Tika-Fehler ist kein
 *        Fehler des Tests: Was Tika bis dahin gefunden hat, steht trotzdem in {@code documents}.
 * @param documents das erste ist die Datei selbst, danach jedes darin eingebettete (z. B. Bilder in einem
 *        Word-Dokument, Dateien in einem ZIP), je mit Text und allen Metadaten
 */
public record TikaProbeResult(long receivedBytes, long durationMillis, String parseErrorText,
		List<TikaProbeDocument> documents) {
}
