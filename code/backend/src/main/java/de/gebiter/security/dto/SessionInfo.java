package de.gebiter.security.dto;

import java.time.Instant;
import java.util.List;

import de.gebiter.users.model.Users;

/**
 * Antwort auf Login und {@code GET /api/session}: wer angemeldet ist und was er darf.
 *
 * @param users der eigene {@code Users}-Eintrag, frisch aus der Datenbank
 * @param accessRoleKeys die Keys seiner AccessRoles, wie sie im Token stehen
 * @param tokenExpiresAt wann das Token abläuft
 * @param tokenRenewalDueAt wann das Frontend die Sitzung erneuern soll: Ausstellung plus
 *        {@code gebiter.jwt.renewal-interval}; derselbe Termin nach F5, nur ein Hinweis (gemessen wird auf dem Server)
 * @param sessionNumber der Platz der Sitzung, z. B. {@code 2} für „Sitzung #2“
 */
public record SessionInfo(Users users, List<String> accessRoleKeys, Instant tokenExpiresAt, Instant tokenRenewalDueAt,
		int sessionNumber) {
}
