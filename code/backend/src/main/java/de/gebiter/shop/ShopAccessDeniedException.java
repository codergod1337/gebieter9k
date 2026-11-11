package de.gebiter.shop;

/**
 * Der User darf das im Gebietermarkt nicht, z. B. ein Angebot zu einem Artikel anlegen, den ein anderer eingestellt hat.
 * Wird zu 403.
 */
public class ShopAccessDeniedException extends RuntimeException {

	public ShopAccessDeniedException(String message) {
		super(message);
	}
}
