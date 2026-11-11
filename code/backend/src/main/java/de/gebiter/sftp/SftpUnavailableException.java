package de.gebiter.sftp;

/**
 * Der Dateispeicher ist nicht erreichbar, eine Übertragung ist gescheitert oder der Broker war zu lange voll, wie in der
 * Vorlage. Das liegt an uns, nicht am Aufrufer: Der {@code GlobalExceptionHandler} macht daraus 503 mit
 * {@code Retry-After}, ein Aufrufer darf es gleich noch einmal versuchen. Die Meldung nach außen bleibt allgemein,
 * Pfade und Ursache stehen nur im Log.
 */
public class SftpUnavailableException extends RuntimeException {

	/** So lange soll ein Aufrufer warten, bevor er es noch einmal versucht ({@code gebiter.sftp.retry-after-seconds}). */
	private final String retryAfterSeconds;

	public SftpUnavailableException(String message, String retryAfterSeconds) {
		super(message);
		this.retryAfterSeconds = retryAfterSeconds;
	}

	public SftpUnavailableException(String message, String retryAfterSeconds, Throwable cause) {
		super(message, cause);
		this.retryAfterSeconds = retryAfterSeconds;
	}

	public String getRetryAfterSeconds() {
		return retryAfterSeconds;
	}
}
