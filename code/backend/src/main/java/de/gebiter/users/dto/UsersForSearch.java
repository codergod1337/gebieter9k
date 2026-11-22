package de.gebiter.users.dto;

import java.util.UUID;

/**
 * Ein Treffer der Vervollständigung von Usern (Nutzer 2026-11-22): die GUID, die der Aufrufer speichert, der Username
 * und das, was man für den Avatar braucht. Den Username bekommt man hier bei jedem Treffer, auch bei einem privaten
 * Profil (über den Username ist jeder findbar); der Avatar folgt der Sichtbarkeit des Profils wie überall
 * ({@link UsersAvatarForClient}, privat nur der Smiley aus der GUID). Nie die E-Mail-Adresse, auch dann nicht, wenn sie
 * den Treffer ergeben hat.
 */
public record UsersForSearch(UUID usersGuid, String username, UsersAvatarForClient usersAvatar) {
}
