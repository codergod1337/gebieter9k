package de.gebiter.security.service;

import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.users.model.Users;
import de.gebiter.users.service.UsersCredentialService;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;

/**
 * Die Registrierung: Ein Besucher legt sich selbst ein Konto an, mit selbst gewähltem Passwort. Er
 * nutzt dafür den {@link UsersService} und den {@link UsersCredentialService}, kein Repository.
 * <p>
 * Das Konto ist sofort aktiv, eine Bestätigung per Mail gibt es nicht. Das Passwort kennt der Server
 * nie im Klartext, er bekommt nur den SHA-256-Hex-Wert und speichert davon BCrypt.
 */
@Service
public class RegistrationService {

	private final UsersService usersService;

	private final UsersCredentialService usersCredentialService;

	public RegistrationService(UsersService usersService, UsersCredentialService usersCredentialService) {
		this.usersService = usersService;
		this.usersCredentialService = usersCredentialService;
	}

	/**
	 * CREATE: Legt den User an und setzt sein Passwort, beides in EINER Transaktion: Scheitert ein
	 * Schritt, entsteht gar nichts.
	 *
	 * @throws IllegalArgumentException wenn Username oder E-Mail-Adresse fehlen oder das Passwort kein
	 *         SHA-256-Hex-Wert ist
	 * @throws DuplicateKeyException wenn Username oder E-Mail-Adresse schon vergeben sind, auch von
	 *         einem gelöschten User
	 */
	@Transactional
	public Users createRegistration(String username, String email, String sha256HexPassword) {
		String lowerCaseSha256HexPassword = Helper.requireSha256Hex(sha256HexPassword);
		return doCreateRegistration(username, email, lowerCaseSha256HexPassword);
	}

	private Users doCreateRegistration(String username, String email, String sha256HexPassword) {
		Users createdUsers = usersService.createUsers(username, email);
		UUID createdUsersGuid = createdUsers.getGuid();
		usersCredentialService.changeUsersCredential(createdUsersGuid, sha256HexPassword);
		return createdUsers;
	}
}
