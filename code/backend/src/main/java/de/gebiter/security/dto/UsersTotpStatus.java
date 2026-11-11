package de.gebiter.security.dto;

import java.time.Instant;

import de.gebiter.security.model.UsersTotpState;

/** Der Stand der eigenen Authenticator-App: keine, Einrichtung offen oder aktiv seit {@code confirmedAt}. */
public record UsersTotpStatus(UsersTotpState state, Instant confirmedAt) {
}
