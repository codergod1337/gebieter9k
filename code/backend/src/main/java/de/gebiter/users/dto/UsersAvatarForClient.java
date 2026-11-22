package de.gebiter.users.dto;

import java.util.UUID;

/**
 * Was man braucht, um einen User aus seiner GUID überall gleich darzustellen (Avatar und Name, wie im Gästebuch). Nach
 * der Sichtbarkeit seines Profils: sichtbar mit Name, kleinem Profilbild, Avatar-Farben und der Rahmenfarbe seiner
 * Uploads ({@code uploadFrameColor}, {@code null}: Farbe aus der GUID); privat nur {@code anonymous = true} (dann Smiley
 * und Rahmenfarbe aus der GUID); gelöscht oder unbekannt ohne Name.
 */
public record UsersAvatarForClient(UUID usersGuid, boolean anonymous, String username, String profileImageSmallBase64Png,
		String avatarTextColor, String avatarBackgroundColor, String uploadFrameColor) {
}
