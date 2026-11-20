package de.gebiter.file.dto;

/**
 * Was ein ZIP-Download von einer Datei braucht: woher die Bytes kommen und wie der Eintrag heißen soll. Nur fürs Backend,
 * geht nie an einen Client (der Pfad auf dem SFTP bleibt intern).
 *
 * @param id die id der Datei (SHA-256), auch der Schlüssel im Upload-Puffer
 * @param sftpPath der Pfad auf dem SFTP
 * @param fileName der gespeicherte Dateiname, {@code null} ohne
 * @param fileExtension die Endung ohne Punkt, {@code null} ohne
 * @param fileSizeBytes die Größe in Bytes
 */
public record FileDocumentZipSource(String id, String sftpPath, String fileName, String fileExtension,
		long fileSizeBytes) {
}
