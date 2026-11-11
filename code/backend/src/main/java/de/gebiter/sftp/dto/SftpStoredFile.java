package de.gebiter.sftp.dto;

/**
 * Eine Datei, die der {@code SftpService} abgelegt und dabei selbst gehasht hat, wie in der Vorlage.
 *
 * @param relativePath Pfad relativ zum root-dir, z. B. {@code 2026/11/05/<sha256>.bin}. Den merkt sich der Aufrufer.
 * @param sha256Hex SHA-256 des Inhalts als Hex, zugleich der Dateiname
 * @param sizeBytes Größe, wie sie auf dem Server angekommen ist
 */
public record SftpStoredFile(String relativePath, String sha256Hex, long sizeBytes) {
}
