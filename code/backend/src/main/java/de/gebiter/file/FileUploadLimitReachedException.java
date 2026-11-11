package de.gebiter.file;

/** Der User hat schon so viele aktive Dateien, wie ihm zustehen ({@code gebiter.file.max-files-per-users}). Wird zu 409. */
public class FileUploadLimitReachedException extends RuntimeException {

	public FileUploadLimitReachedException(String message) {
		super(message);
	}
}
