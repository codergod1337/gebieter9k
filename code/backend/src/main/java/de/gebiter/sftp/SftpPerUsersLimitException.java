package de.gebiter.sftp;

/**
 * Der angemeldete User hat schon so viele Übertragungen offen, wie ihm zustehen, und die Wartezeit auf einen freien
 * Platz lief ab, wie in der Vorlage. Nichts ist kaputt, es liegt am Aufrufer: Der {@code GlobalExceptionHandler} macht
 * daraus 429 mit {@code Retry-After}. Ohne diese Grenze könnte ein Einzelner mit zwanzig Uploads den ganzen Broker
 * belegen.
 */
public class SftpPerUsersLimitException extends RuntimeException {

	/** So lange soll ein Aufrufer warten, bevor er es noch einmal versucht ({@code gebiter.sftp.retry-after-seconds}). */
	private final String retryAfterSeconds;

	public SftpPerUsersLimitException(int maxConnectionsPerUsers, String retryAfterSeconds) {
		super("Höchstens " + maxConnectionsPerUsers + " Übertragungen gleichzeitig, bitte gleich noch einmal versuchen.");
		this.retryAfterSeconds = retryAfterSeconds;
	}

	public String getRetryAfterSeconds() {
		return retryAfterSeconds;
	}
}
