package de.gebiter.sftp;

/**
 * Die angefragte Datei liegt nicht auf dem Dateispeicher. Der {@code GlobalExceptionHandler} macht daraus 404. Die
 * Meldung enthält keinen Pfad, der steht nur im Log.
 */
public class SftpFileNotFoundException extends RuntimeException {

	public SftpFileNotFoundException() {
		super("Die Datei liegt nicht auf dem Dateispeicher.");
	}
}
