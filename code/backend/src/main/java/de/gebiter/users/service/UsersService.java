package de.gebiter.users.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.status.model.UsersStatus;
import de.gebiter.status.model.Visibility;
import de.gebiter.users.dto.UsersAvatarForClient;
import de.gebiter.users.dto.UsersForClient;
import de.gebiter.users.dto.UsersForProfile;
import de.gebiter.users.model.Users;
import de.gebiter.users.model.UsersDetail;
import de.gebiter.users.repository.UsersRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link Users}. Er nutzt nur sein eigenes {@link UsersRepository}. Die Einträge
 * anderer Klassen legt er über deren Services an.
 * <p>
 * Aufbau jeder öffentlichen Methode: erst prüfen (woher kommt der Aufrufer, wohin will er, darf er
 * das, muss vorher etwas geprüft werden), dann an den privaten {@code do…}-Kern weitergeben. Der
 * Kern macht nur den eigentlichen Zugriff und prüft selbst nichts.
 * <p>
 * Gelöschte User ({@link UsersStatus#DELETED}) liefert nur {@link #getDeletedUsers()} für den Admin.
 * Für alle anderen Methoden gibt es sie nicht.
 * <p>
 * RECHTE: Der Pfad ({@code SecurityConfig}) lässt Lesen über {@code /api/…} (AR USER oder ADMIN) und Schreiben fremder
 * Einträge nur über {@code /api/admin/…} (AR ADMIN) zu. Dazu prüfen die {@code @PreAuthorize} an den Methoden selbst
 * ({@code @EnableMethodSecurity} ist seit 2026-11-09 aktiv).
 */
@Service
public class UsersService {

	private final UsersRepository usersRepository;

	private final UsersDetailService usersDetailService;

	private final UsersCredentialService usersCredentialService;

	private final CurrentUsersProvider currentUsersProvider;

	/** Mit dieser AccessRoleCollection startet jeder neue User, aus {@code gebiter.accessrolecollection.default-key}. */
	private final String defaultAccessRoleCollectionKey;

	/** Die Sichtbarkeit des Profils neuer User ({@code gebiter.users.default-profile-visibility}). */
	private final Visibility defaultProfileVisibility;

	/** Die Sichtbarkeit der Freundesliste neuer User ({@code gebiter.users.default-friend-list-visibility}). */
	private final Visibility defaultFriendListVisibility;

	/** So viele GUIDs löst eine Anfrage höchstens in Name und Avatar auf ({@code gebiter.users.avatar-resolve-max-guids}). */
	private final int avatarResolveMaxGuids;

	/** Das Passwort eines vom Admin angelegten Users, wenn der Admin keins eingibt ({@code gebiter.users.start-password}). */
	private final String startPassword;

	public UsersService(UsersRepository usersRepository, UsersDetailService usersDetailService,
			UsersCredentialService usersCredentialService, CurrentUsersProvider currentUsersProvider,
			@Value("${gebiter.accessrolecollection.default-key}") String defaultAccessRoleCollectionKey,
			@Value("${gebiter.users.default-profile-visibility}") Visibility defaultProfileVisibility,
			@Value("${gebiter.users.default-friend-list-visibility}") Visibility defaultFriendListVisibility,
			@Value("${gebiter.users.avatar-resolve-max-guids}") int avatarResolveMaxGuids,
			@Value("${gebiter.users.start-password}") String startPassword) {
		this.usersRepository = usersRepository;
		this.usersDetailService = usersDetailService;
		this.usersCredentialService = usersCredentialService;
		this.currentUsersProvider = currentUsersProvider;
		this.defaultAccessRoleCollectionKey = defaultAccessRoleCollectionKey;
		this.defaultProfileVisibility = defaultProfileVisibility;
		this.defaultFriendListVisibility = defaultFriendListVisibility;
		this.avatarResolveMaxGuids = avatarResolveMaxGuids;
		this.startPassword = startPassword;
	}

	/**
	 * CREATE: Legt einen neuen User mit einer neuen GUID Version 7 an, dazu seine leeren Einträge in
	 * {@code UsersDetail} und {@code UsersCredential}. So hat jeder User immer alle 1:1-Einträge, und
	 * danach wird nur noch geändert.
	 *
	 * @throws IllegalArgumentException wenn Username oder E-Mail-Adresse fehlen
	 * @throws DuplicateKeyException wenn der Username oder die E-Mail-Adresse schon vergeben ist, auch
	 *         von einem gelöschten User
	 */
	@Transactional
	public Users createUsers(String username, String email) {
		requireUsernameAndEmailNotBlank(username, email);
		requireUsernameAndEmailFree(username, email);
		Users newUsers = new Users(username, email);
		newUsers.setAccessRoleCollectionKey(defaultAccessRoleCollectionKey);
		newUsers.setProfileVisibility(defaultProfileVisibility);
		newUsers.setFriendListVisibility(defaultFriendListVisibility);
		return doCreateUsers(newUsers);
	}

	/**
	 * CREATE: Wie {@link #createUsers(String, String)}, aber der Admin gibt die GUID vor.
	 *
	 * @throws IllegalArgumentException wenn GUID, Username oder E-Mail-Adresse fehlen
	 * @throws DuplicateKeyException wenn die GUID, der Username oder die E-Mail-Adresse schon vergeben
	 *         ist, auch von einem gelöschten User
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public Users createUsers(UUID usersGuid, String username, String email) {
		Helper.requireNotNull(usersGuid, "guid");
		// Ohne diese Prüfung würde save() einen bestehenden User still überschreiben.
		boolean usersGuidTaken = doExistsUsers(usersGuid);
		if (usersGuidTaken) {
			throw new DuplicateKeyException("Die GUID " + usersGuid + " ist schon vergeben.");
		}
		requireUsernameAndEmailNotBlank(username, email);
		requireUsernameAndEmailFree(username, email);
		Users newUsers = new Users(usersGuid, username, email);
		newUsers.setAccessRoleCollectionKey(defaultAccessRoleCollectionKey);
		newUsers.setProfileVisibility(defaultProfileVisibility);
		newUsers.setFriendListVisibility(defaultFriendListVisibility);
		return doCreateUsers(newUsers);
	}

	/**
	 * CREATE: Der Admin legt einen User an wie bei der Registrierung, samt Passwort, beides in EINER Transaktion (Nutzer
	 * 2026-11-11, Administration, Tab „User“, „neuer User“): Scheitert ein Schritt, entsteht gar nichts. Der neue User
	 * bekommt die Standard-Position wie jeder andere und hat noch keine Authenticator-App; die richtet er bei seiner
	 * ersten Anmeldung selbst ein.
	 *
	 * @param usersGuid die gewünschte GUID; {@code null}: eine neue GUID Version 7
	 * @param sha256HexPassword das Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text; {@code null} oder leer: das
	 *        Startpasswort aus {@code gebiter.users.start-password}
	 * @throws IllegalArgumentException wenn Username oder E-Mail-Adresse fehlen oder das Passwort kein SHA-256-Hex-Wert ist
	 * @throws DuplicateKeyException wenn die GUID, der Username oder die E-Mail-Adresse schon vergeben ist, auch von
	 *         einem gelöschten User
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public Users createUsersWithPassword(UUID usersGuid, String username, String email, String sha256HexPassword) {
		String sha256HexPasswordToSet;
		boolean passwordGiven = sha256HexPassword != null && !sha256HexPassword.isBlank();
		if (passwordGiven) {
			sha256HexPasswordToSet = Helper.requireSha256Hex(sha256HexPassword);
		} else {
			// Dasselbe wie das Frontend mit einem eingegebenen Passwort: erst SHA-256, davon speichert der
			// UsersCredentialService BCrypt.
			sha256HexPasswordToSet = Helper.createSha256Hex(startPassword);
		}
		Users createdUsers;
		if (usersGuid == null) {
			createdUsers = createUsers(username, email);
		} else {
			createdUsers = createUsers(usersGuid, username, email);
		}
		UUID createdUsersGuid = createdUsers.getGuid();
		usersCredentialService.changeUsersCredential(createdUsersGuid, sha256HexPasswordToSet);
		return createdUsers;
	}

	/**
	 * READ: Gibt es einen User mit {@code usersGuid}? Gelöschte User zählen mit, denn ihre GUID bleibt
	 * vergeben. Für Abläufe ohne Request, z. B. beim Start der Anwendung.
	 */
	@Transactional(readOnly = true)
	public boolean existsUsers(UUID usersGuid) {
		return doExistsUsers(usersGuid);
	}

	/**
	 * READ: Prüft für einen Controller, ob es den User gibt, auf den ein Request verweist. Ein
	 * gelöschter User gilt als nicht vorhanden, auf ihn darf nichts Neues mehr verweisen.
	 *
	 * @param fieldName Name des Felds im Request, für die Fehlermeldung
	 * @throws IllegalArgumentException wenn die GUID fehlt oder es den User nicht gibt
	 */
	@Transactional(readOnly = true)
	public void checkUsersExists(UUID usersGuid, String fieldName) {
		Helper.requireNotNull(usersGuid, fieldName);
		boolean notDeletedUsersExists = doExistsNotDeletedUsers(usersGuid);
		if (!notDeletedUsersExists) {
			throw new IllegalArgumentException("Im Feld \"" + fieldName + "\" steht die GUID " + usersGuid
					+ ", zu der es keinen User gibt.");
		}
	}

	/**
	 * READ: Ist der User mit {@code usersGuid} gelöscht? Für die Prüfung des Passworts, denn ein
	 * gelöschter User kann sich nicht mehr anmelden. Gibt es den User gar nicht, ist die Antwort
	 * {@code false}.
	 *
	 * @throws IllegalArgumentException wenn die GUID fehlt
	 */
	@Transactional(readOnly = true)
	public boolean isUsersDeleted(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		return doIsUsersDeleted(usersGuid);
	}

	/**
	 * READ: Der User mit {@code usersGuid}.
	 *
	 * @throws EntityNotFoundException wenn es den User nicht gibt oder er gelöscht ist
	 */
	@Transactional(readOnly = true)
	public Users getUsers(UUID usersGuid) {
		return doGetNotDeletedUsers(usersGuid);
	}

	/**
	 * READ: Darf der angemeldete User das Profil von {@code profileUsersGuid} sehen? Die eine Regel für alles, was am
	 * Profil hängt (Profil laden, Gästebuch lesen und schreiben): Den eigenen sieht er immer. Sonst entscheidet
	 * {@code profileVisibility}: ANY und AUTHENTICATED ja, FRIENDS nur als Freund (Freundesliste aus dem Hauptspeicher),
	 * NONE nie. Einen gelöschten oder unbekannten User sieht niemand. Der Admin hat hier keinen Sonderweg: Er liest alles
	 * über die Admin-Endpunkte (Nutzer 2026-11-09).
	 */
	@Transactional(readOnly = true)
	public boolean isProfileVisibleToCurrentUsers(UUID profileUsersGuid) {
		if (profileUsersGuid == null) {
			return false;
		}
		Optional<Users> foundProfileUsers = usersRepository.findById(profileUsersGuid);
		if (foundProfileUsers.isEmpty()) {
			return false;
		}
		Users profileUsers = foundProfileUsers.get();
		return doIsProfileVisibleToCurrentUsers(profileUsers);
	}

	/**
	 * READ: Ein User für die Anzeige bei anderen (Nutzer 2026-11-09): erst der User mit seiner Sichtbarkeit, und nur wenn
	 * der angemeldete User das Profil sehen darf, der ganze User. Sonst nur die GUID, dann lädt der Client vom Rest nichts.
	 * Der Admin liest alles über {@code /api/admin/users}, nicht hier.
	 *
	 * @throws EntityNotFoundException wenn es den User nicht gibt oder er gelöscht ist
	 */
	@Transactional(readOnly = true)
	public UsersForClient getUsersForClient(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Users existingUsers = doGetNotDeletedUsers(usersGuid);
		boolean profileVisible = doIsProfileVisibleToCurrentUsers(existingUsers);
		if (!profileVisible) {
			return new UsersForClient(usersGuid, false, null);
		}
		String username = existingUsers.getUsername();
		String accessRoleCollectionKey = existingUsers.getAccessRoleCollectionKey();
		long points = existingUsers.getPoints();
		UsersForProfile usersForProfile = new UsersForProfile(usersGuid, username, accessRoleCollectionKey, points);
		return new UsersForClient(usersGuid, true, usersForProfile);
	}

	/**
	 * READ: Was man braucht, um einen User aus seiner GUID überall gleich darzustellen (Avatar und Name, wie im
	 * Gästebuch), nach der Sichtbarkeit seines Profils: sichtbar mit Name, kleinem Profilbild und Avatar-Farben; privat
	 * nur anonym; gelöscht oder unbekannt ohne Name. Wirft nie „gibt es nicht“: Auch eine fremde GUID bekommt ihre
	 * Darstellung.
	 */
	@Transactional(readOnly = true)
	public UsersAvatarForClient getUsersAvatarForClient(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		return doGetUsersAvatarForClient(usersGuid);
	}

	/**
	 * READ (Auflösen): Wie {@link #getUsersAvatarForClient(UUID)}, aber für mehrere User in einer Anfrage, z. B. für eine
	 * Liste von Usern (wer für eine Datei gestimmt hat). Je GUID eine Darstellung, in der Reihenfolge der GUIDs; für jeden
	 * gilt dieselbe Regel der Sichtbarkeit. Höchstens {@code gebiter.users.avatar-resolve-max-guids} auf einmal.
	 *
	 * @throws IllegalArgumentException wenn die Liste fehlt, zu lang ist oder eine GUID fehlt
	 */
	@Transactional(readOnly = true)
	public List<UsersAvatarForClient> resolveUsersAvatarsForClient(List<UUID> usersGuids) {
		Helper.requireNotNull(usersGuids, "usersGuids");
		if (usersGuids.size() > avatarResolveMaxGuids) {
			throw new IllegalArgumentException("Höchstens " + avatarResolveMaxGuids + " User auf einmal.");
		}
		List<UsersAvatarForClient> usersAvatarsForClient = new ArrayList<>();
		for (UUID usersGuid : usersGuids) {
			Helper.requireNotNull(usersGuid, "usersGuid");
			UsersAvatarForClient usersAvatarForClient = doGetUsersAvatarForClient(usersGuid);
			usersAvatarsForClient.add(usersAvatarForClient);
		}
		return usersAvatarsForClient;
	}

	/** Die Darstellung eines Users nach der Sichtbarkeit seines Profils, der Kern von einzeln und mehreren. */
	private UsersAvatarForClient doGetUsersAvatarForClient(UUID usersGuid) {
		Optional<Users> foundUsers = usersRepository.findById(usersGuid);
		boolean usersMissing = foundUsers.isEmpty() || foundUsers.get().getStatus() == UsersStatus.DELETED;
		if (usersMissing) {
			return new UsersAvatarForClient(usersGuid, false, null, null, null, null);
		}
		Users existingUsers = foundUsers.get();
		boolean profileVisible = doIsProfileVisibleToCurrentUsers(existingUsers);
		if (!profileVisible) {
			return new UsersAvatarForClient(usersGuid, true, null, null, null, null);
		}
		String username = existingUsers.getUsername();
		UsersDetail usersDetail = usersDetailService.getUsersDetail(usersGuid);
		// Das kleine Profilbild: Eine Seite zeigt viele User, große Bilder würden sie schwer machen
		String profileImageSmallBase64Png = usersDetail.getProfileImageSmallBase64Png();
		String avatarTextColor = usersDetail.getAvatarTextColor();
		String avatarBackgroundColor = usersDetail.getAvatarBackgroundColor();
		return new UsersAvatarForClient(usersGuid, false, username, profileImageSmallBase64Png, avatarTextColor,
				avatarBackgroundColor);
	}

	/**
	 * Die eine Regel der Sichtbarkeit für alles, was einem User gehört (Profil, Galerie, Kontaktangabe): Darf der
	 * angemeldete User etwas von {@code ownerUsersGuid} mit dieser {@code visibility} sehen? Der Besitzer immer. Ohne
	 * Anmeldung nur ANY. Sonst ANY und AUTHENTICATED ja, FRIENDS nur als Freund (Freundesliste aus dem Hauptspeicher),
	 * NONE nie. Ob das Profil selbst sichtbar ist, prüft diese Methode nicht.
	 */
	public boolean isVisibleToCurrentUsers(UUID ownerUsersGuid, Visibility visibility) {
		Helper.requireNotNull(ownerUsersGuid, "ownerUsersGuid");
		Helper.requireNotNull(visibility, "visibility");
		return doIsVisibleToCurrentUsers(ownerUsersGuid, visibility);
	}

	/**
	 * READ: Die Details eines Users (Profilbild, Status-Text, Banner-Drift, Avatar-Farben, Zähler), nur wenn der angemeldete User sein
	 * Profil sehen darf; sonst sieht es aus wie „gibt es nicht“. Steht hier und nicht im {@code UsersDetailService}, weil
	 * die Regel am User hängt und der {@code UsersDetailService} den UsersService nicht nutzen darf (Zirkel über die
	 * Anlage). Der Admin liest alles über {@code /api/admin/users-detail}.
	 *
	 * @throws EntityNotFoundException wenn es den User nicht gibt, er gelöscht ist oder sein Profil nicht sichtbar ist
	 */
	@Transactional(readOnly = true)
	public UsersDetail getVisibleUsersDetail(UUID usersGuid) {
		boolean profileVisible = isProfileVisibleToCurrentUsers(usersGuid);
		if (!profileVisible) {
			throw new EntityNotFoundException("Die Details dieses Users gibt es nicht.");
		}
		return usersDetailService.getUsersDetail(usersGuid);
	}

	/**
	 * READ: Der User mit dieser E-Mail-Adresse, für den Login. Gelöschte User gibt es dabei nicht.
	 * Leer, wenn es keinen gibt oder die E-Mail-Adresse fehlt.
	 */
	@Transactional(readOnly = true)
	public Optional<Users> findUsersByEmail(String email) {
		if (email == null || email.isBlank()) {
			return Optional.empty();
		}
		return doFindNotDeletedUsersByEmail(email);
	}

	/** READ: Alle User außer den gelöschten. */
	@Transactional(readOnly = true)
	public List<Users> getAllUsers() {
		return doGetAllNotDeletedUsers();
	}

	/** READ: Alle gelöschten User. Nur für den Admin. */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional(readOnly = true)
	public List<Users> getDeletedUsers() {
		return doGetDeletedUsers();
	}

	/**
	 * UPDATE: Übernimmt aus dem vollen Objekt Username, E-Mail-Adresse, beide Visibilities und den Key
	 * der AccessRoleCollection. Die GUID und der Status bleiben, wie sie sind.
	 * <p>
	 * TODO Spring Security: Den Key der AccessRoleCollection ändert dann nur noch der Admin. Ob es die
	 * Collection gibt, wird noch nicht geprüft, das kommt mit dem Service der AccessRoleCollection.
	 *
	 * @param changedUsers der Request Body, maßgeblich ist {@code guid}
	 * @throws IllegalArgumentException wenn ein Pflichtfeld fehlt
	 * @throws EntityNotFoundException wenn es den User nicht gibt oder er gelöscht ist
	 * @throws DuplicateKeyException wenn ein anderer User den Username oder die E-Mail-Adresse schon hat,
	 *         auch ein gelöschter
	 */
	@Transactional
	public Users changeUsers(Users changedUsers) {
		UUID usersGuid = changedUsers.getGuid();
		Helper.requireNotNull(usersGuid, "guid");

		String changedUsername = changedUsers.getUsername();
		String changedEmail = changedUsers.getEmail();
		requireUsernameAndEmailNotBlank(changedUsername, changedEmail);
		Visibility changedProfileVisibility = changedUsers.getProfileVisibility();
		Helper.requireNotNull(changedProfileVisibility, "profileVisibility");
		Visibility changedFriendListVisibility = changedUsers.getFriendListVisibility();
		Helper.requireNotNull(changedFriendListVisibility, "friendListVisibility");

		boolean usernameTakenByOtherUsers = usersRepository.existsByUsernameAndGuidNot(changedUsername, usersGuid);
		if (usernameTakenByOtherUsers) {
			throw new DuplicateKeyException("Der Username \"" + changedUsername + "\" ist schon vergeben.");
		}
		boolean emailTakenByOtherUsers = usersRepository.existsByEmailAndGuidNot(changedEmail, usersGuid);
		if (emailTakenByOtherUsers) {
			throw new DuplicateKeyException("Die E-Mail-Adresse \"" + changedEmail + "\" ist schon vergeben.");
		}

		Users existingUsers = doGetNotDeletedUsers(usersGuid);
		return doChangeUsers(existingUsers, changedUsers);
	}

	/**
	 * UPDATE: Ändert den Kontostand ({@code Users.points}) atomar, nie ins Minus. Aufgerufen NUR vom
	 * {@link UsersPointBookingService}, in der Transaktion seiner Buchung: Ohne Zeile im Kontobuch ändert sich kein Stand.
	 *
	 * @return der Kontostand danach
	 * @throws IllegalArgumentException wenn der Betrag 0 ist
	 * @throws EntityNotFoundException wenn es den User nicht gibt
	 * @throws IllegalStateException wenn der Stand für eine Abbuchung nicht reicht
	 */
	@Transactional
	public long changeUsersPoints(UUID usersGuid, long amountPoints) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		if (amountPoints == 0) {
			throw new IllegalArgumentException("Eine Buchung bewegt Punkte.");
		}
		int changedRowCount = usersRepository.changePoints(usersGuid, amountPoints);
		if (changedRowCount == 0) {
			boolean usersExists = usersRepository.existsById(usersGuid);
			if (!usersExists) {
				throw new EntityNotFoundException("Den User mit der GUID " + usersGuid + " gibt es nicht.");
			}
			throw new IllegalStateException("Der Punktestand reicht nicht.");
		}
		return getUsersPoints(usersGuid);
	}

	/**
	 * READ: Der Kontostand eines Users, frisch aus der Datenbank. Für das Kontobuch.
	 *
	 * @throws EntityNotFoundException wenn es den User nicht gibt
	 */
	@Transactional(readOnly = true)
	public long getUsersPoints(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Optional<Users> foundUsers = usersRepository.findById(usersGuid);
		if (foundUsers.isEmpty()) {
			throw new EntityNotFoundException("Den User mit der GUID " + usersGuid + " gibt es nicht.");
		}
		return foundUsers.get().getPoints();
	}

	/**
	 * UPDATE: Der angemeldete User stellt ein, wer sein Profil und wer seine Freundesliste sieht: nur er selbst
	 * ({@code NONE}), er und seine Freunde ({@code FRIENDS}), alle angemeldeten User ({@code AUTHENTICATED}) oder alle
	 * ({@code ANY}). Die GUID kommt aus dem Token, fremde Einstellungen erreicht er so nie. Alles andere bleibt.
	 *
	 * @throws IllegalArgumentException wenn eine der beiden Sichtbarkeiten fehlt
	 * @throws EntityNotFoundException wenn der User gelöscht ist
	 */
	@Transactional
	public Users changeOwnUsersVisibility(Visibility profileVisibility, Visibility friendListVisibility) {
		Helper.requireNotNull(profileVisibility, "profileVisibility");
		Helper.requireNotNull(friendListVisibility, "friendListVisibility");
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Users ownUsers = doGetNotDeletedUsers(currentUsersGuid);
		ownUsers.setProfileVisibility(profileVisibility);
		ownUsers.setFriendListVisibility(friendListVisibility);
		return usersRepository.save(ownUsers);
	}

	/**
	 * UPDATE: Setzt einen gelöschten User wieder auf {@link UsersStatus#ACTIVE}: Er kann sich wieder anmelden und ist
	 * wieder sichtbar. Ist er nicht gelöscht, passiert nichts. Aufgerufen wird die Methode derzeit nur vom Start-Runner
	 * für das erzwungene Admin-Konto ({@code gebiter.admin-users.force}).
	 *
	 * @return {@code true}, wenn er gelöscht war und jetzt wieder aktiv ist
	 * @throws IllegalArgumentException wenn die GUID fehlt
	 * @throws EntityNotFoundException wenn es den User nicht gibt
	 */
	@Transactional
	public boolean restoreUsers(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Optional<Users> foundUsers = usersRepository.findById(usersGuid);
		if (foundUsers.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen User mit der GUID " + usersGuid + ".");
		}
		Users existingUsers = foundUsers.get();
		boolean usersDeleted = existingUsers.getStatus() == UsersStatus.DELETED;
		if (!usersDeleted) {
			return false;
		}
		existingUsers.setStatus(UsersStatus.ACTIVE);
		usersRepository.save(existingUsers);
		return true;
	}

	/**
	 * DELETE: Setzt den Status des Users mit {@code usersGuid} auf {@link UsersStatus#DELETED}. Gelöscht
	 * wird nichts: Der User und alle seine Einträge in anderen Tabellen bleiben stehen. Danach kann er
	 * sich nicht mehr anmelden und ist für normale User unsichtbar. Username, E-Mail-Adresse und GUID
	 * bleiben vergeben.
	 *
	 * @throws IllegalArgumentException wenn die GUID fehlt
	 * @throws EntityNotFoundException wenn es den User nicht gibt oder er schon gelöscht ist
	 */
	@Transactional
	public void deleteUsers(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "guid");
		Users existingUsers = doGetNotDeletedUsers(usersGuid);
		doDeleteUsers(existingUsers);
	}

	private Users doCreateUsers(Users newUsers) {
		Users savedUsers = usersRepository.save(newUsers);
		UUID savedUsersGuid = savedUsers.getGuid();
		usersDetailService.createUsersDetail(savedUsersGuid);
		usersCredentialService.createUsersCredential(savedUsersGuid);
		return savedUsers;
	}

	private boolean doExistsUsers(UUID usersGuid) {
		return usersRepository.existsById(usersGuid);
	}

	private boolean doExistsNotDeletedUsers(UUID usersGuid) {
		return usersRepository.existsByGuidAndStatusNot(usersGuid, UsersStatus.DELETED);
	}

	private boolean doIsUsersDeleted(UUID usersGuid) {
		return usersRepository.existsByGuidAndStatus(usersGuid, UsersStatus.DELETED);
	}

	/** Der Kern der Regel: Darf der angemeldete User das Profil dieses Users sehen? */
	private boolean doIsProfileVisibleToCurrentUsers(Users profileUsers) {
		UUID profileUsersGuid = profileUsers.getGuid();
		boolean profileUsersDeleted = profileUsers.getStatus() == UsersStatus.DELETED;
		if (profileUsersDeleted) {
			return false;
		}
		Visibility profileVisibility = profileUsers.getProfileVisibility();
		return doIsVisibleToCurrentUsers(profileUsersGuid, profileVisibility);
	}

	private boolean doIsVisibleToCurrentUsers(UUID ownerUsersGuid, Visibility visibility) {
		boolean authenticated = currentUsersProvider.isAuthenticated();
		if (!authenticated) {
			return visibility == Visibility.ANY;
		}
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		boolean ownEntry = currentUsersGuid.equals(ownerUsersGuid);
		if (ownEntry) {
			return true;
		}
		if (visibility == Visibility.ANY || visibility == Visibility.AUTHENTICATED) {
			return true;
		}
		if (visibility == Visibility.FRIENDS) {
			List<UUID> currentUsersFriendUsersGuids = currentUsersProvider.currentUsersFriendUsersGuids();
			return currentUsersFriendUsersGuids.contains(ownerUsersGuid);
		}
		return false;
	}

	private Users doGetNotDeletedUsers(UUID usersGuid) {
		Optional<Users> foundUsers = usersRepository.findByGuidAndStatusNot(usersGuid, UsersStatus.DELETED);
		if (foundUsers.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen User mit der GUID " + usersGuid + ".");
		}
		return foundUsers.get();
	}

	private Optional<Users> doFindNotDeletedUsersByEmail(String email) {
		return usersRepository.findByEmailAndStatusNot(email, UsersStatus.DELETED);
	}

	private List<Users> doGetAllNotDeletedUsers() {
		return usersRepository.findByStatusNot(UsersStatus.DELETED);
	}

	private List<Users> doGetDeletedUsers() {
		return usersRepository.findByStatus(UsersStatus.DELETED);
	}

	private Users doChangeUsers(Users existingUsers, Users changedUsers) {
		String changedUsername = changedUsers.getUsername();
		existingUsers.setUsername(changedUsername);
		String changedEmail = changedUsers.getEmail();
		existingUsers.setEmail(changedEmail);
		Visibility changedProfileVisibility = changedUsers.getProfileVisibility();
		existingUsers.setProfileVisibility(changedProfileVisibility);
		Visibility changedFriendListVisibility = changedUsers.getFriendListVisibility();
		existingUsers.setFriendListVisibility(changedFriendListVisibility);
		String changedAccessRoleCollectionKey = changedUsers.getAccessRoleCollectionKey();
		existingUsers.setAccessRoleCollectionKey(changedAccessRoleCollectionKey);
		return usersRepository.save(existingUsers);
	}

	private void doDeleteUsers(Users existingUsers) {
		existingUsers.setStatus(UsersStatus.DELETED);
		usersRepository.save(existingUsers);
	}

	/** @throws IllegalArgumentException wenn Username oder E-Mail-Adresse fehlen */
	private void requireUsernameAndEmailNotBlank(String username, String email) {
		Helper.requireNotBlank(username, "username");
		Helper.requireNotBlank(email, "email");
	}

	/** @throws DuplicateKeyException wenn der Username oder die E-Mail-Adresse schon vergeben ist */
	private void requireUsernameAndEmailFree(String username, String email) {
		boolean usernameTaken = usersRepository.existsByUsername(username);
		if (usernameTaken) {
			throw new DuplicateKeyException("Der Username \"" + username + "\" ist schon vergeben.");
		}
		boolean emailTaken = usersRepository.existsByEmail(email);
		if (emailTaken) {
			throw new DuplicateKeyException("Die E-Mail-Adresse \"" + email + "\" ist schon vergeben.");
		}
	}
}
