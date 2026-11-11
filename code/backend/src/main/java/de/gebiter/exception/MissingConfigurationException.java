package de.gebiter.exception;

/**
 * Eine Einstellung fehlt in der {@code .env}, z. B. der SMTP-Zugang oder der Schlüssel für die Geheimnisse der
 * Authenticator-App. Das Backend läuft trotzdem, nur diese eine Funktion nicht. Wird zu 503, die Meldung nennt den
 * fehlenden Schlüssel.
 */
public class MissingConfigurationException extends RuntimeException {

	public MissingConfigurationException(String message) {
		super(message);
	}
}
