package de.gebiter.users.model;

/**
 * Wofür eine Buchung im Kontobuch ist (Nutzer 2026-11-09). Jeder Grund hat genau einen Weg im Backend, der ihn bucht;
 * der Client kann keinen auslösen. Neue Gründe kommen mit ihrem Vorgang dazu (Gebietermarkt: Kauf, Rückgabe, Handel).
 */
public enum UsersPointBookingReason {

	/** Punkte für einen Abschluss eines Achievements; Bezug: die Zeile in {@code users_achievement}. */
	ACHIEVEMENT_REWARD,

	/**
	 * Punkte für eine Tätigkeit ({@code PointActivity}); Bezug: Key der Tätigkeit und das, was entstand (id des
	 * Gästebucheintrags, des Kommentars, SHA-256 der Datei).
	 */
	ACTIVITY_REWARD,

	/**
	 * Ein Kauf im Gebietermarkt, beim Käufer: Der Preis geht ab. Bezug: die Datei ({@code fileDocumentId}) als Key und
	 * die id des Belegs ({@code ShopOrder}).
	 */
	SHOP_PURCHASE,

	/**
	 * Ein Verkauf im Gebietermarkt, beim Verkäufer: Der Preis abzüglich der Marktgebühr kommt dazu. Bezug wie beim Kauf:
	 * die Datei als Key und die id des Belegs.
	 */
	SHOP_SALE
}
