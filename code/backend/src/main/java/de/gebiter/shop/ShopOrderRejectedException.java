package de.gebiter.shop;

/**
 * Ein Kauf im Gebietermarkt kommt nicht zustande, z. B. weil das Angebot nicht mehr läuft, die Punkte nicht reichen oder
 * der User den Artikel schon dauerhaft hat. Wird zu 409; gebucht ist dann nichts.
 */
public class ShopOrderRejectedException extends RuntimeException {

	public ShopOrderRejectedException(String message) {
		super(message);
	}
}
