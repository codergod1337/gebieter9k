package de.gebiter.file;

/**
 * Der User darf das nicht, z. B. in eine FileClass hochladen, die er nicht hochladen darf. Wird zu 403. Die Meldung nennt nur, was er
 * ohnehin weiß, nie Inhalte fremder Dateien.
 */
public class FileAccessDeniedException extends RuntimeException {

	public FileAccessDeniedException(String message) {
		super(message);
	}
}
