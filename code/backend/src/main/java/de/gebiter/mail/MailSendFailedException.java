package de.gebiter.mail;

/**
 * Der SMTP-Server hat die Mail nicht angenommen oder war nicht erreichbar (z. B. falsches Passwort, Port gesperrt,
 * Anbieter erlaubt kein SMTP). Wird zu 502, mit der Antwort des Servers in der Meldung.
 */
public class MailSendFailedException extends RuntimeException {

	public MailSendFailedException(String message, Throwable cause) {
		super(message, cause);
	}
}
