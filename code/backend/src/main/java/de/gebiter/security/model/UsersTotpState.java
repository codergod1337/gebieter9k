package de.gebiter.security.model;

/**
 * Wie weit die Authenticator-App eines Users ist: NONE (keine), PENDING (Geheimnis erzeugt, der erste Code fehlt noch),
 * ACTIVE (mit dem ersten Code bestätigt).
 */
public enum UsersTotpState {
	NONE, PENDING, ACTIVE
}
