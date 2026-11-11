package de.gebiter.users.dto;

import java.util.UUID;

/**
 * Ein User für die Anzeige bei anderen, nach der einen Regel der Sichtbarkeit
 * ({@code UsersService.isProfileVisibleToCurrentUsers}). Darf der angemeldete User das Profil sehen, kommt
 * {@link UsersForProfile} mit {@code profileVisible = true}. Sonst kommt nur die GUID, die immer öffentlich ist:
 * {@code profileVisible = false} und {@code users = null}. Dann lädt der Client vom Rest nichts, weder UsersDetail noch
 * Kontakt oder Gästebuch.
 */
public record UsersForClient(UUID usersGuid, boolean profileVisible, UsersForProfile users) {
}
