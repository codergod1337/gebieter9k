package de.gebiter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import de.gebiter.access.model.AccessRole;
import de.gebiter.access.service.AccessRoleCollectionRoleService;
import de.gebiter.access.service.AccessRoleCollectionService;
import de.gebiter.access.service.AccessRoleService;
import de.gebiter.access.service.AccessRoleUsersAssignmentService;
import de.gebiter.file.service.FileStagingService;
import de.gebiter.point.service.PointActivityService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.security.service.UsersTotpService;
import de.gebiter.solr.service.SolrReferenceService;
import de.gebiter.users.service.UsersCredentialService;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;

/**
 * Startklasse. Als {@link CommandLineRunner} stellt sie beim Start sicher, dass die Grundrechte immer existieren, und
 * gibt dazu etwas im Log aus. Das Admin-Konto fasst sie nur an, wenn es erzwungen wird
 * ({@code gebiter.admin-users.force}, Umgebungsvariable FORCE_ADMIN): für den ersten Start nach einem Reset der
 * Datenbank, damit es einen User für den Import gibt. Weitere Objekte für den Start kommen hierher, nicht in eigene
 * Initializer-Klassen.
 * <p>
 * Alle Werte kommen aus {@code application.yaml}: {@code gebiter.language.*},
 * {@code gebiter.accessrole.*}, {@code gebiter.accessrolecollection.*}, {@code gebiter.admin-users.*} und
 * {@code gebiter.solr.flag-reference.*}. Anzeigenamen stehen dort nur in der Standardsprache, der Runner
 * macht daraus den mehrsprachigen Text.
 * <p>
 * Die Methoden zum Anlegen tragen {@code @PreAuthorize}, und {@code @EnableMethodSecurity} ist aktiv (seit
 * 2026-11-09). Deshalb läuft der Runner angemeldet als das Admin-Konto aus der YAML mit dem Recht ADMIN
 * ({@link CurrentUsersProvider#runAsUsers}), nur für seine Dauer.
 */
@SpringBootApplication
public class Gebiter9kApplication implements CommandLineRunner {

	private static final Logger LOGGER = LoggerFactory.getLogger(Gebiter9kApplication.class);

	private final AccessRoleService accessRoleService;

	private final UsersService usersService;

	private final UsersCredentialService usersCredentialService;

	private final AccessRoleUsersAssignmentService accessRoleUsersAssignmentService;

	private final AccessRoleCollectionService accessRoleCollectionService;

	private final AccessRoleCollectionRoleService accessRoleCollectionRoleService;

	private final SolrReferenceService solrReferenceService;

	private final FileStagingService fileStagingService;

	/** Für die Anmeldung als Admin-Konto während des Starts. */
	private final CurrentUsersProvider currentUsersProvider;

	private final String defaultLanguageCode;

	private final String adminAccessRoleKey;

	private final String adminAccessRoleDisplayName;

	private final String userAccessRoleKey;

	private final String userAccessRoleDisplayName;

	private final String almightyAccessRoleCollectionKey;

	private final String almightyAccessRoleCollectionDisplayName;

	private final String defaultAccessRoleCollectionKey;

	private final String defaultAccessRoleCollectionDisplayName;

	private final UUID adminUsersGuid;

	private final String adminUsersUsername;

	private final String adminUsersEmail;

	/** Gesetzt nur, wenn das Admin-Konto erzwungen wird: erst SHA-256 wie im Frontend, davon dann BCrypt. */
	private final String adminUsersStartPassword;

	/**
	 * Wird das Admin-Konto beim Start erzwungen ({@code gebiter.admin-users.force}, Umgebungsvariable FORCE_ADMIN)? Nur
	 * dann fasst der Runner es an; sonst überspringt er jede Prüfung des Kontos.
	 */
	private final boolean adminUsersForced;

	/** Entfernt die Authenticator-App des erzwungenen Admin-Kontos. */
	private final UsersTotpService usersTotpService;

	/** Die Referenz für beliebige Markierungen ({@code wtf}, wie in der Vorlage). */
	private final String flagSolrReferenceKey;

	private final String flagSolrReferenceDisplayName;

	private final String flagSolrReferenceDescription;

	private final PointActivityService pointActivityService;

	/** Die Tätigkeiten mit Punkten, die der Code auslöst ({@code gebiter.point-activity.*}): Key, Name, Punkte. */
	private final String guestbookEntryWrittenKey;

	private final String guestbookEntryWrittenDisplayName;

	private final long guestbookEntryWrittenRewardPoints;

	private final String guestbookCommentWrittenKey;

	private final String guestbookCommentWrittenDisplayName;

	private final long guestbookCommentWrittenRewardPoints;

	private final String galleryUploadKey;

	private final String galleryUploadDisplayName;

	private final long galleryUploadRewardPoints;

	public Gebiter9kApplication(AccessRoleService accessRoleService, UsersService usersService,
			UsersCredentialService usersCredentialService,
			AccessRoleUsersAssignmentService accessRoleUsersAssignmentService,
			AccessRoleCollectionService accessRoleCollectionService,
			AccessRoleCollectionRoleService accessRoleCollectionRoleService,
			SolrReferenceService solrReferenceService, FileStagingService fileStagingService,
			CurrentUsersProvider currentUsersProvider, PointActivityService pointActivityService,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode,
			@Value("${gebiter.accessrole.admin-key}") String adminAccessRoleKey,
			@Value("${gebiter.accessrole.admin-display-name}") String adminAccessRoleDisplayName,
			@Value("${gebiter.accessrole.user-key}") String userAccessRoleKey,
			@Value("${gebiter.accessrole.user-display-name}") String userAccessRoleDisplayName,
			@Value("${gebiter.accessrolecollection.almighty-key}") String almightyAccessRoleCollectionKey,
			@Value("${gebiter.accessrolecollection.almighty-display-name}") String almightyAccessRoleCollectionDisplayName,
			@Value("${gebiter.accessrolecollection.default-key}") String defaultAccessRoleCollectionKey,
			@Value("${gebiter.accessrolecollection.default-display-name}") String defaultAccessRoleCollectionDisplayName,
			@Value("${gebiter.admin-users.guid}") UUID adminUsersGuid,
			@Value("${gebiter.admin-users.username}") String adminUsersUsername,
			@Value("${gebiter.admin-users.email}") String adminUsersEmail,
			@Value("${gebiter.admin-users.start-password}") String adminUsersStartPassword,
			@Value("${gebiter.admin-users.force}") boolean adminUsersForced, UsersTotpService usersTotpService,
			@Value("${gebiter.solr.flag-reference.key}") String flagSolrReferenceKey,
			@Value("${gebiter.solr.flag-reference.display-name}") String flagSolrReferenceDisplayName,
			@Value("${gebiter.solr.flag-reference.description}") String flagSolrReferenceDescription,
			@Value("${gebiter.point-activity.guestbook-entry-written.key}") String guestbookEntryWrittenKey,
			@Value("${gebiter.point-activity.guestbook-entry-written.display-name}") String guestbookEntryWrittenDisplayName,
			@Value("${gebiter.point-activity.guestbook-entry-written.reward-points}") long guestbookEntryWrittenRewardPoints,
			@Value("${gebiter.point-activity.guestbook-comment-written.key}") String guestbookCommentWrittenKey,
			@Value("${gebiter.point-activity.guestbook-comment-written.display-name}") String guestbookCommentWrittenDisplayName,
			@Value("${gebiter.point-activity.guestbook-comment-written.reward-points}") long guestbookCommentWrittenRewardPoints,
			@Value("${gebiter.point-activity.gallery-upload.key}") String galleryUploadKey,
			@Value("${gebiter.point-activity.gallery-upload.display-name}") String galleryUploadDisplayName,
			@Value("${gebiter.point-activity.gallery-upload.reward-points}") long galleryUploadRewardPoints) {
		this.accessRoleService = accessRoleService;
		this.usersService = usersService;
		this.usersCredentialService = usersCredentialService;
		this.accessRoleUsersAssignmentService = accessRoleUsersAssignmentService;
		this.accessRoleCollectionService = accessRoleCollectionService;
		this.accessRoleCollectionRoleService = accessRoleCollectionRoleService;
		this.solrReferenceService = solrReferenceService;
		this.fileStagingService = fileStagingService;
		this.currentUsersProvider = currentUsersProvider;
		this.defaultLanguageCode = defaultLanguageCode;
		this.adminAccessRoleKey = adminAccessRoleKey;
		this.adminAccessRoleDisplayName = adminAccessRoleDisplayName;
		this.userAccessRoleKey = userAccessRoleKey;
		this.userAccessRoleDisplayName = userAccessRoleDisplayName;
		this.almightyAccessRoleCollectionKey = almightyAccessRoleCollectionKey;
		this.almightyAccessRoleCollectionDisplayName = almightyAccessRoleCollectionDisplayName;
		this.defaultAccessRoleCollectionKey = defaultAccessRoleCollectionKey;
		this.defaultAccessRoleCollectionDisplayName = defaultAccessRoleCollectionDisplayName;
		this.adminUsersGuid = adminUsersGuid;
		this.adminUsersUsername = adminUsersUsername;
		this.adminUsersEmail = adminUsersEmail;
		this.adminUsersStartPassword = adminUsersStartPassword;
		this.adminUsersForced = adminUsersForced;
		this.usersTotpService = usersTotpService;
		this.flagSolrReferenceKey = flagSolrReferenceKey;
		this.flagSolrReferenceDisplayName = flagSolrReferenceDisplayName;
		this.flagSolrReferenceDescription = flagSolrReferenceDescription;
		this.pointActivityService = pointActivityService;
		this.guestbookEntryWrittenKey = guestbookEntryWrittenKey;
		this.guestbookEntryWrittenDisplayName = guestbookEntryWrittenDisplayName;
		this.guestbookEntryWrittenRewardPoints = guestbookEntryWrittenRewardPoints;
		this.guestbookCommentWrittenKey = guestbookCommentWrittenKey;
		this.guestbookCommentWrittenDisplayName = guestbookCommentWrittenDisplayName;
		this.guestbookCommentWrittenRewardPoints = guestbookCommentWrittenRewardPoints;
		this.galleryUploadKey = galleryUploadKey;
		this.galleryUploadDisplayName = galleryUploadDisplayName;
		this.galleryUploadRewardPoints = galleryUploadRewardPoints;
	}

	public static void main(String[] args) {
		SpringApplication.run(Gebiter9kApplication.class, args);
	}

	/**
	 * BCrypt für die Passwörter in {@code UsersCredential}. Zieht in die Security-Konfiguration um,
	 * sobald es sie gibt.
	 * <p>
	 * {@code static}, weil die Bean sonst eine fertige Instanz dieser Klasse bräuchte. Die braucht
	 * aber über den {@code UsersService} selbst den {@code PasswordEncoder}, das wäre ein Zirkel.
	 */
	@Bean
	public static PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	/**
	 * Die Checks in dieser Reihenfolge, jeder legt nur an, was fehlt:
	 * <ol>
	 * <li>Admin-Konto Alice, NUR wenn es erzwungen wird ({@link #forceAdminUsers()}): anlegen, wieder aktiv setzen,
	 * Startpasswort, Authenticator-App entfernen. Sonst wird das Konto nicht angefasst.</li>
	 * <li>Recht ADMIN</li>
	 * <li>Alice hat ADMIN, ebenfalls nur erzwungen</li>
	 * <li>Recht USER</li>
	 * <li>Position ALLMAECHTIGER (Admin) mit JEDEM Recht, auch mit jedem, das der Admin später anlegt: Bei jedem Start
	 * bekommt sie die Rechte, die ihr noch fehlen (Vorgabe des Nutzers: „für alle Fälle“)</li>
	 * <li>Standard-Position ({@code gebiter.accessrolecollection.default-key}, BUERGER, Start jedes neuen Users) mit nur
	 * USER</li>
	 * <li>Referenz {@code wtf} ({@code gebiter.solr.flag-reference.*}) für beliebige Markierungen an Dokumenten</li>
	 * <li>Jede Referenz hat ihre Zeile in jedem Kern (ein neuer Kern in der YAML bekommt sie so)</li>
	 * <li>Upload-Puffer: Reste abgebrochener Uploads ({@code .part}) löschen, damit nichts liegen bleibt (Vorgabe des
	 * Nutzers 2026-11-08: Rollback, kein Müll). Fertige Dateien im Puffer arbeitet danach der Hintergrund-Thread ab.</li>
	 * </ol>
	 * Alle weiteren Rechte und Positionen legt der Admin an.
	 */
	@Override
	public void run(String... args) {
		List<String> startupAccessRoleKeys = List.of(adminAccessRoleKey);
		currentUsersProvider.runAsUsers(adminUsersGuid, startupAccessRoleKeys, this::createStartupObjects);
	}

	/** Die Schritte des Starts, angemeldet als Admin-Konto. */
	private void createStartupObjects() {
		if (adminUsersForced) {
			forceAdminUsers();
		} else {
			LOGGER.info("Admin-Konto {} wird nicht geprüft (FORCE_ADMIN ist aus).", adminUsersGuid);
		}
		createAccessRoleIfMissing(adminAccessRoleKey, adminAccessRoleDisplayName);
		if (adminUsersForced) {
			createAdminUsersAssignmentIfMissing();
		}
		createAccessRoleIfMissing(userAccessRoleKey, userAccessRoleDisplayName);
		createAccessRoleCollectionIfMissing(almightyAccessRoleCollectionKey, almightyAccessRoleCollectionDisplayName);
		grantEveryAccessRoleToAlmightyIfMissing();
		createAccessRoleCollectionIfMissing(defaultAccessRoleCollectionKey, defaultAccessRoleCollectionDisplayName);
		createAccessRoleCollectionRoleIfMissing(defaultAccessRoleCollectionKey, userAccessRoleKey);
		createFlagSolrReferenceIfMissing();
		createMissingSolrReferenceFields();
		createMissingPointActivities();
		fileStagingService.deleteAbandonedPartFiles();
	}

	/**
	 * Die Tätigkeiten mit Punkten, die der Code auslöst (Nutzer 2026-11-09): fehlende mit den Vorgaben aus der YAML
	 * anlegen; was der Admin geändert hat, bleibt.
	 */
	private void createMissingPointActivities() {
		boolean guestbookEntryWrittenCreated = pointActivityService.createMissingPointActivity(guestbookEntryWrittenKey,
				guestbookEntryWrittenDisplayName, guestbookEntryWrittenRewardPoints);
		boolean guestbookCommentWrittenCreated = pointActivityService.createMissingPointActivity(
				guestbookCommentWrittenKey, guestbookCommentWrittenDisplayName, guestbookCommentWrittenRewardPoints);
		boolean galleryUploadCreated = pointActivityService.createMissingPointActivity(galleryUploadKey,
				galleryUploadDisplayName, galleryUploadRewardPoints);
		LOGGER.info("Tätigkeiten mit Punkten geprüft (neu: Eintrag {}, Kommentar {}, Galerie-Upload {}).",
				guestbookEntryWrittenCreated, guestbookCommentWrittenCreated, galleryUploadCreated);
	}

	/** Gibt es die Referenz {@code wtf}? Wenn nicht, wird sie angelegt, samt ihrer Zeile in jedem Kern. */
	private void createFlagSolrReferenceIfMissing() {
		boolean flagSolrReferenceExists = solrReferenceService.existsSolrReference(flagSolrReferenceKey);
		if (flagSolrReferenceExists) {
			LOGGER.info("Referenz {} ist vorhanden.", flagSolrReferenceKey);
			return;
		}
		Map<String, String> displayName = Map.of(defaultLanguageCode, flagSolrReferenceDisplayName);
		Map<String, String> description = Map.of(defaultLanguageCode, flagSolrReferenceDescription);
		solrReferenceService.createSolrReference(flagSolrReferenceKey, displayName, description);
		LOGGER.info("Referenz {} angelegt.", flagSolrReferenceKey);
	}

	/** Jede Referenz in jedem Kern: Fehlende Zeilen werden angelegt. */
	private void createMissingSolrReferenceFields() {
		int createdSolrReferenceFieldCount = solrReferenceService.createMissingSolrReferenceFieldsOfAllSolrReferences();
		LOGGER.info("Referenz-Zeilen in den Kernen geprüft, {} neu angelegt.", createdSolrReferenceFieldCount);
	}

	/**
	 * Erzwingt das Admin-Konto (Nutzer 2026-11-11, nur mit {@code gebiter.admin-users.force}): für den ersten Start nach
	 * einem Reset der Datenbank, damit es einen User gibt, mit dem sich ein Import fahren lässt. Bei jedem solchen Start:
	 * <ol>
	 * <li>Gibt es die GUID (lauter Siebenen) nicht, wird Alice angelegt.</li>
	 * <li>Ist das Konto gelöscht, wird es wieder aktiv.</li>
	 * <li>Das Passwort wird auf das Startpasswort gesetzt.</li>
	 * <li>Seine Authenticator-App wird entfernt: Es meldet sich nur mit dem Passwort an und richtet die App bei der
	 * ersten Anmeldung neu ein, wie jeder User ohne App.</li>
	 * </ol>
	 * Das Recht ADMIN bekommt es danach in {@link #createAdminUsersAssignmentIfMissing()}. Nach dem ersten Start gehört
	 * der Schalter wieder aus: Solange er an ist, kann sich nach jedem Neustart jeder mit dem Startpasswort anmelden und
	 * seine eigene App einrichten. Deshalb steht es als Warnung im Log.
	 */
	private void forceAdminUsers() {
		boolean adminUsersExists = usersService.existsUsers(adminUsersGuid);
		if (!adminUsersExists) {
			usersService.createUsers(adminUsersGuid, adminUsersUsername, adminUsersEmail);
			LOGGER.info("Admin-Konto {} ({}) angelegt.", adminUsersGuid, adminUsersUsername);
		}
		boolean adminUsersRestored = usersService.restoreUsers(adminUsersGuid);
		String adminUsersSha256HexPassword = Helper.createSha256Hex(adminUsersStartPassword);
		usersCredentialService.changeUsersCredential(adminUsersGuid, adminUsersSha256HexPassword);
		boolean adminUsersTotpDeleted = usersTotpService.deleteUsersTotpIfExists(adminUsersGuid);
		LOGGER.warn("FORCE_ADMIN ist an: Admin-Konto {} erzwungen (neu angelegt: {}, wieder aktiv gesetzt: {}, Passwort auf "
				+ "das Startpasswort gesetzt, Authenticator-App entfernt: {}). Nach dem ersten Start wieder ausschalten.",
				adminUsersGuid, !adminUsersExists, adminUsersRestored, adminUsersTotpDeleted);
	}

	/** Gibt es das Recht? Wenn nicht, wird es mit dem Anzeigenamen in der Standardsprache angelegt. */
	private void createAccessRoleIfMissing(String accessRoleKey, String displayNameInDefaultLanguage) {
		boolean accessRoleExists = accessRoleService.existsAccessRole(accessRoleKey);
		if (accessRoleExists) {
			LOGGER.info("Recht {} ist vorhanden.", accessRoleKey);
			return;
		}
		Map<String, String> displayName = Map.of(defaultLanguageCode, displayNameInDefaultLanguage);
		accessRoleService.createAccessRole(accessRoleKey, displayName);
		LOGGER.info("Recht {} angelegt.", accessRoleKey);
	}

	/** Hat das Admin-Konto das Admin-Recht? Wenn nicht, wird es zugewiesen. */
	private void createAdminUsersAssignmentIfMissing() {
		boolean adminUsersAssignmentExists = accessRoleUsersAssignmentService
				.existsAccessRoleUsersAssignment(adminUsersGuid, adminAccessRoleKey);
		if (adminUsersAssignmentExists) {
			LOGGER.info("Admin-Konto hat das Recht {}.", adminAccessRoleKey);
			return;
		}
		accessRoleUsersAssignmentService.createAccessRoleUsersAssignment(adminUsersGuid, adminAccessRoleKey);
		LOGGER.info("Recht {} an das Admin-Konto zugewiesen.", adminAccessRoleKey);
	}

	/** Gibt es die Collection? Wenn nicht, wird sie mit dem Anzeigenamen in der Standardsprache angelegt. */
	private void createAccessRoleCollectionIfMissing(String accessRoleCollectionKey,
			String displayNameInDefaultLanguage) {
		boolean accessRoleCollectionExists = accessRoleCollectionService
				.existsAccessRoleCollection(accessRoleCollectionKey);
		if (accessRoleCollectionExists) {
			LOGGER.info("Collection {} ist vorhanden.", accessRoleCollectionKey);
			return;
		}
		Map<String, String> displayName = Map.of(defaultLanguageCode, displayNameInDefaultLanguage);
		accessRoleCollectionService.createAccessRoleCollection(accessRoleCollectionKey, displayName);
		LOGGER.info("Collection {} angelegt.", accessRoleCollectionKey);
	}

	/** Der Allmächtige hat jedes Recht: Jedes, das ihm fehlt, wird aufgenommen, auch eins, das der Admin neu angelegt hat. */
	private void grantEveryAccessRoleToAlmightyIfMissing() {
		List<AccessRole> allAccessRoles = accessRoleService.getAllAccessRole();
		for (AccessRole accessRole : allAccessRoles) {
			String accessRoleKey = accessRole.getKey();
			createAccessRoleCollectionRoleIfMissing(almightyAccessRoleCollectionKey, accessRoleKey);
		}
	}

	/** Enthält die Collection das Recht? Wenn nicht, wird es aufgenommen. */
	private void createAccessRoleCollectionRoleIfMissing(String accessRoleCollectionKey, String accessRoleKey) {
		boolean accessRoleCollectionRoleExists = accessRoleCollectionRoleService
				.existsAccessRoleCollectionRole(accessRoleCollectionKey, accessRoleKey);
		if (accessRoleCollectionRoleExists) {
			LOGGER.info("Collection {} enthält das Recht {}.", accessRoleCollectionKey, accessRoleKey);
			return;
		}
		accessRoleCollectionRoleService.createAccessRoleCollectionRole(accessRoleCollectionKey, accessRoleKey);
		LOGGER.info("Recht {} in die Collection {} aufgenommen.", accessRoleKey, accessRoleCollectionKey);
	}
}
