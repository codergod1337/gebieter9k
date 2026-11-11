package de.gebiter.users.dto;

import de.gebiter.status.model.Visibility;

/**
 * Die eigene Sichtbarkeit einstellen: wer das Profil und wer die Freundesliste sieht, je eins von {@code NONE} (nur
 * ich), {@code FRIENDS} (ich und meine Freunde), {@code AUTHENTICATED} (alle User) und {@code ANY} (alle).
 */
public record OwnUsersVisibilityRequest(Visibility profileVisibility, Visibility friendListVisibility) {
}
