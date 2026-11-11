package de.gebiter.security;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Woher ein Service erfährt, WER gerade fragt. Aufbau wie im Vorlageprojekt.
 * <p>
 * Damit kein Service die Sicherheits-API von Spring direkt anfassen muss, fragt der Fachcode dieses
 * Interface.
 * <p>
 * ALLE ANTWORTEN KOMMEN AUS DEM TOKEN der laufenden Anfrage und kosten keinen Datenbankzugriff.
 * Sie sind dafür so alt wie das Token. Neue Rechte stehen erst im nächsten Token. Einzige Ausnahme: die
 * Freundesliste, sie liegt im Hauptspeicher (siehe {@link #currentUsersFriendUsersGuids()}).
 */
public interface CurrentUsersProvider {

	/**
	 * Ist überhaupt jemand angemeldet? Zuerst das fragen, wenn ein Weg auch anonym erreichbar ist: Die
	 * übrigen Methoden werfen, wenn niemand angemeldet ist.
	 */
	boolean isAuthenticated();

	/** Die GUID des angemeldeten Users, der {@code sub}-Claim des Tokens. */
	UUID currentUsersGuid();

	/** Die AccessRole-Keys des angemeldeten Users aus dem Rollen-Claim ({@code gebiter.jwt.roles-claim}). */
	List<String> currentUsersAccessRoleKeys();

	/** Steht {@code accessRoleKey} im Token des angemeldeten Users, z. B. {@code "ADMIN"}? */
	boolean currentUsersHasAccessRole(String accessRoleKey);

	/**
	 * Der Key der AccessRoleCollection des angemeldeten Users aus dem Collection-Claim
	 * ({@code gebiter.jwt.access-role-collection-claim}). Leer, wenn er keine hat.
	 */
	Optional<String> currentUsersAccessRoleCollectionKey();

	/** Wann das Token der laufenden Anfrage abläuft, z. B. damit das Frontend rechtzeitig erneuert. */
	Instant currentUsersTokenExpiresAt();

	/** Der Platz der Sitzung aus dem Sitzungs-Claim ({@code gebiter.jwt.session-number-claim}). */
	int currentUsersSessionNumber();

	/**
	 * Die GUIDs der Freunde des angemeldeten Users. Kommen nicht aus dem Token (ab etwa 80 Freunden wäre das Cookie zu
	 * groß), sondern aus dem Hauptspeicher: Bei jedem Login und Token-Refresh lädt der {@code SessionService} die Liste
	 * neu, Annehmen und Kündigen ziehen sie sofort nach. Kein Datenbankzugriff. Für den Lesefilter jeder Suche.
	 */
	List<UUID> currentUsersFriendUsersGuids();

	/**
	 * Führt {@code action} aus, als wäre dieser User mit diesen Rechten angemeldet, für Abläufe ohne Request, die
	 * geschützte Methoden aufrufen ({@code @EnableMethodSecurity}), z. B. der Start-Runner als Admin-Konto. Danach ist
	 * die Anmeldung wieder leer.
	 */
	void runAsUsers(UUID usersGuid, List<String> accessRoleKeys, Runnable action);
}
