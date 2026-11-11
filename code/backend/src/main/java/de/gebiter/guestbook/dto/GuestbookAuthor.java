package de.gebiter.guestbook.dto;

import java.util.UUID;

/**
 * Was die Darstellung über einen Autor braucht, einmal je Autor in {@link GuestbookPage}: GUID, Username, das kleine
 * Profilbild (PNG als Base64, {@code null} ohne Bild) und die Farben seines Avatars ohne Bild ({@code null}: Standard).
 * Bei einem gelöschten User ist {@code username} {@code null}.
 */
public record GuestbookAuthor(UUID usersGuid, String username, String profileImageSmallBase64Png, String avatarTextColor,
		String avatarBackgroundColor) {
}
