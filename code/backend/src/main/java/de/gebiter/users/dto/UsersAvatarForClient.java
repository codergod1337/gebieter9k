package de.gebiter.users.dto;

import java.util.UUID;

/**
 * Was man braucht, um einen User aus seiner GUID überall gleich darzustellen (Avatar und Name, wie im Gästebuch). Nach
 * der Sichtbarkeit seines Profils: sichtbar mit Name, kleinem Profilbild und Avatar-Farben; privat nur
 * {@code anonymous = true} (dann Smiley aus der GUID); gelöscht oder unbekannt ohne Name.
 */
public record UsersAvatarForClient(UUID usersGuid, boolean anonymous, String username, String profileImageSmallBase64Png,
		String avatarTextColor, String avatarBackgroundColor) {
}
