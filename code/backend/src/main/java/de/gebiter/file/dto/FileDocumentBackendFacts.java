package de.gebiter.file.dto;

import java.util.List;

/**
 * Was das Backend über eine Datei wissen muss, bevor es sie ausliefert, ändert oder löscht. Geht nie zum Client
 * ({@code sftpPath}).
 *
 * @param sftpPath wo die Bytes liegen
 * @param fileName der Dateiname für den Download
 * @param fileExtension die Endung, z. B. für die Frage „Vorschaubild rechnen?“
 * @param mimeType der Typ laut Tika
 * @param fileSizeBytes die Größe, für Byte-Bereiche
 * @param authorUsersGuid der Autor: wer die Datei hochgeladen hat
 * @param writerAccessRoleKeys die Schreibrollen
 * @param status der Status
 * @param analysisStatus der Stand der Auswertung im Hintergrund (PENDING, DONE, FAILED)
 * @param editorUsersGuids wen der Autor zum Bearbeiten der Metadaten freigegeben hat
 * @param galleryIds die Galerien, in denen die Datei steht (leer ohne Galerie); nach dem Löschen rücken dort die übrigen
 *        Bilder auf
 */
public record FileDocumentBackendFacts(String sftpPath, String fileName, String fileExtension, String mimeType,
		long fileSizeBytes,
		String authorUsersGuid, List<String> writerAccessRoleKeys, String status, String analysisStatus,
		List<String> editorUsersGuids, List<Long> galleryIds) {
}
