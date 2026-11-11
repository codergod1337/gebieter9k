package de.gebiter.security.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Ein User hat sich angemeldet oder seine Sitzung verlängert: ein Beweis, dass er da ist. Veröffentlicht vom
 * {@code SessionService}, gebucht als Online-Zeit und Anwesenheit vom {@code AchievementTrackingService} (lose
 * gekoppelt, nach dem Commit).
 *
 * @param usersGuid wer
 * @param sessionNumber in welcher Sitzung (Platz 1 bis {@code gebiter.login.max-sessions})
 * @param checkedInAt wann, von der Uhr des Servers
 * @param login {@code true} beim Login (neue Sitzung), {@code false} bei einer Verlängerung
 */
public record UsersOnlineCheckInEvent(UUID usersGuid, int sessionNumber, Instant checkedInAt, boolean login) {
}
