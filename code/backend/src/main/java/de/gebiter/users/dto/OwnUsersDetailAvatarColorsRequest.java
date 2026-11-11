package de.gebiter.users.dto;

/** Die Farben des eigenen Avatars ohne Profilbild: Schrift und Hintergrund als #rrggbb, leer heißt Standard. */
public record OwnUsersDetailAvatarColorsRequest(String avatarTextColor, String avatarBackgroundColor) {
}
