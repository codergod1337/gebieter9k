package de.gebiter.users.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.model.UsersCredential;
import de.gebiter.users.repository.UsersCredentialRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link UsersCredential}. Er nutzt nur sein eigenes {@link UsersCredentialRepository}.
 * <p>
 * Zu jedem User gibt es immer genau einen Eintrag. Er entsteht ohne Passwort bei der Anlage des Users
 * über den {@link UsersService}. Wird der User gelöscht, bleibt der Eintrag stehen.
 * <p>
 * Nach außen gibt es nur die Prüfung des Passworts, sie liefert {@code true} oder {@code false}. Den
 * Passwort-Hash liefert keine Methode.
 */
@Service
public class UsersCredentialService {

	private final UsersCredentialRepository usersCredentialRepository;

	private final PasswordEncoder passwordEncoder;

	private final CurrentUsersProvider currentUsersProvider;

	public UsersCredentialService(UsersCredentialRepository usersCredentialRepository, PasswordEncoder passwordEncoder,
			CurrentUsersProvider currentUsersProvider) {
		this.usersCredentialRepository = usersCredentialRepository;
		this.passwordEncoder = passwordEncoder;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE: Legt den leeren Eintrag für einen neuen User an: nur die GUID, noch kein Passwort.
	 * Aufgerufen wird die Methode nur bei der Anlage des Users im {@link UsersService}.
	 *
	 * @throws DuplicateKeyException wenn es für die GUID schon einen Eintrag gibt
	 */
	@Transactional
	public UsersCredential createUsersCredential(UUID usersGuid) {
		// Ohne diese Prüfung würde save() ein bestehendes Passwort still mit null überschreiben.
		boolean usersCredentialExists = usersCredentialRepository.existsById(usersGuid);
		if (usersCredentialExists) {
			throw new DuplicateKeyException("Für die GUID " + usersGuid + " gibt es schon einen UsersCredential-Eintrag.");
		}
		return doCreateUsersCredential(usersGuid);
	}

	/**
	 * READ: Stimmt das Passwort des Users mit {@code usersGuid}? Ohne Eintrag, ohne gesetztes Passwort
	 * oder bei einem Wert, der kein SHA-256-Hex-Wert ist, immer {@code false}.
	 * <p>
	 * Ob der User gelöscht ist, prüft diese Methode nicht. Das macht vorher der Controller über den
	 * {@link UsersService}, denn den darf dieser Service nicht nutzen: Der UsersService braucht ihn
	 * zum Anlegen eines Users, das wäre ein Zirkel.
	 * <p>
	 * TODO Spring Security: {@code usersGuid} kommt dann vom Current User, nicht mehr aus dem Request.
	 *
	 * @param sha256HexPassword das Passwort, im Frontend mit SHA-256 gehasht, als Hex-Text
	 * @throws IllegalArgumentException wenn {@code usersGuid} fehlt
	 */
	@Transactional(readOnly = true)
	public boolean checkUsersCredential(UUID usersGuid, String sha256HexPassword) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		return doCheckUsersCredential(usersGuid, sha256HexPassword);
	}

	/**
	 * UPDATE: Setzt das Passwort des Users mit {@code usersGuid} neu. Gespeichert wird nur der
	 * BCrypt-Hash des SHA-256-Hex-Werts. Aufgerufen vom Start-Runner (Startpasswort des Admin-Kontos), von der
	 * Registrierung und beim Anlegen durch den Admin ({@code UsersService.createUsersWithPassword}).
	 *
	 * @param sha256HexPassword das Passwort, mit SHA-256 gehasht, als Hex-Text
	 * @throws IllegalArgumentException wenn die GUID fehlt oder kein SHA-256-Hex-Wert übergeben wird
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@Transactional
	public void changeUsersCredential(UUID usersGuid, String sha256HexPassword) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		String lowerCaseSha256HexPassword = Helper.requireSha256Hex(sha256HexPassword);
		UsersCredential existingUsersCredential = doGetUsersCredential(usersGuid);
		doChangeUsersCredential(existingUsersCredential, lowerCaseSha256HexPassword);
	}

	/**
	 * UPDATE: Der angemeldete User ändert sein eigenes Passwort (Profil, „Sicherheit“). Nur mit dem bisherigen Passwort,
	 * sonst könnte jeder mit einer offenen Sitzung es übernehmen. Gespeichert wird nur der BCrypt-Hash.
	 *
	 * @param currentSha256HexPassword das bisherige Passwort, SHA-256 als Hex-Text
	 * @param newSha256HexPassword das neue Passwort, SHA-256 als Hex-Text
	 * @throws IllegalArgumentException (400) wenn das bisherige nicht stimmt oder das neue kein SHA-256-Hex-Wert ist
	 */
	@Transactional
	public void changeOwnUsersCredential(String currentSha256HexPassword, String newSha256HexPassword) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		String lowerCaseNewSha256HexPassword = Helper.requireSha256Hex(newSha256HexPassword);
		boolean currentPasswordMatches = doCheckUsersCredential(currentUsersGuid, currentSha256HexPassword);
		if (!currentPasswordMatches) {
			throw new IllegalArgumentException("Das bisherige Passwort stimmt nicht.");
		}
		UsersCredential existingUsersCredential = doGetUsersCredential(currentUsersGuid);
		doChangeUsersCredential(existingUsersCredential, lowerCaseNewSha256HexPassword);
	}

	/**
	 * DELETE: Löscht den Eintrag des Users mit {@code usersGuid}.
	 * <p>
	 * Derzeit ruft sie niemand auf: Ein gelöschter User bekommt nur den Status {@code DELETED}, sein
	 * Eintrag bleibt stehen. Ob es ein endgültiges Löschen gibt, ist noch offen.
	 */
	@Transactional
	public void deleteUsersCredential(UUID usersGuid) {
		doDeleteUsersCredential(usersGuid);
	}

	private UsersCredential doCreateUsersCredential(UUID usersGuid) {
		UsersCredential newUsersCredential = new UsersCredential(usersGuid);
		return usersCredentialRepository.save(newUsersCredential);
	}

	private boolean doCheckUsersCredential(UUID usersGuid, String sha256HexPassword) {
		Optional<UsersCredential> foundUsersCredential = usersCredentialRepository.findById(usersGuid);
		if (foundUsersCredential.isEmpty()) {
			return false;
		}
		UsersCredential usersCredential = foundUsersCredential.get();
		return usersCredential.matchesPassword(sha256HexPassword, passwordEncoder);
	}

	private UsersCredential doGetUsersCredential(UUID usersGuid) {
		Optional<UsersCredential> foundUsersCredential = usersCredentialRepository.findById(usersGuid);
		if (foundUsersCredential.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen UsersCredential-Eintrag mit der GUID " + usersGuid + ".");
		}
		return foundUsersCredential.get();
	}

	private void doChangeUsersCredential(UsersCredential existingUsersCredential, String sha256HexPassword) {
		existingUsersCredential.changePassword(sha256HexPassword, passwordEncoder);
		usersCredentialRepository.save(existingUsersCredential);
	}

	private void doDeleteUsersCredential(UUID usersGuid) {
		usersCredentialRepository.deleteById(usersGuid);
	}
}
