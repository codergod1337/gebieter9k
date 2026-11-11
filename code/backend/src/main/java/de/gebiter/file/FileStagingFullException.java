package de.gebiter.file;

/**
 * Im Upload-Puffer des Backends ist nicht genug Platz für diese Datei ({@code gebiter.file.staging-max-size}): Erst
 * müssen andere Dateien fertig auf den SFTP. Wird zu 503, der User versucht es später noch einmal.
 */
public class FileStagingFullException extends RuntimeException {

	public FileStagingFullException(String message) {
		super(message);
	}
}
