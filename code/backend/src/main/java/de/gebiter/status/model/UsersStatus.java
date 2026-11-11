package de.gebiter.status.model;

/**
 * Status eines Users.
 * <p>
 * In der Datenbank nie als Ordinalzahl speichern: Ein neu eingefügter Wert würde sonst die Bedeutung
 * der bestehenden verschieben.
 */
public enum UsersStatus {

	/** Normaler User: sichtbar und kann sich anmelden. */
	ACTIVE,

	/**
	 * Gelöscht: Der Eintrag bleibt in der Datenbank stehen. Der User kann sich nicht mehr anmelden und
	 * ist für normale User unsichtbar. Sehen kann ihn nur noch der Admin.
	 */
	DELETED
}
