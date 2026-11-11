package de.gebiter.security.model;

/**
 * Was nach dem Passwort kommt (Vorgabe des Nutzers 2026-11-08: 2FA ist Pflicht). Ohne zweiten Schritt gibt es keine
 * Sitzung.
 */
public enum UsersLogin2faSecondFactor {

	/** Die Authenticator-App ist eingerichtet: den aktuellen Code eingeben. */
	TOTP_CODE,

	/** Noch keine App (erste Anmeldung, abgeschaltet oder vom Admin entfernt): jetzt einrichten, der erste Code bestätigt. */
	TOTP_SETUP
}
