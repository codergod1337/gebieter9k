package de.gebiter.gallery;

/**
 * Über Galerie-Freigaben laufen schon so viele Abrufe gleichzeitig, wie für Besucher vorgesehen sind
 * ({@code gebiter.gallery-share.max-parallel-deliveries}), und die Wartezeit auf einen freien Platz lief ab. Nichts ist
 * kaputt: Der {@code GlobalExceptionHandler} macht daraus 429 mit {@code Retry-After}. Ohne diese Grenze könnten Besucher
 * alle Verbindungen zum Dateispeicher belegen, und angemeldete User kämen nicht mehr an ihre Dateien.
 */
public class GalleryShareBusyException extends RuntimeException {

	/** So lange soll ein Aufrufer warten, bevor er es noch einmal versucht. */
	private final String retryAfterSeconds;

	public GalleryShareBusyException(String retryAfterSeconds) {
		super("Gerade laufen zu viele Abrufe über Freigaben, bitte gleich noch einmal versuchen.");
		this.retryAfterSeconds = retryAfterSeconds;
	}

	public String getRetryAfterSeconds() {
		return retryAfterSeconds;
	}
}
