package de.gebiter.guestbook;

/**
 * Der User darf das im Gästebuch nicht, z. B. einen fremden Eintrag in einem fremden Gästebuch löschen. Wird zu 403.
 */
public class GuestbookAccessDeniedException extends RuntimeException {

	public GuestbookAccessDeniedException(String message) {
		super(message);
	}
}
