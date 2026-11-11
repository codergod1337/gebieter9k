package de.gebiter.users.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.status.model.Visibility;
import de.gebiter.users.dto.UsersContactForClient;
import de.gebiter.users.model.UsersContact;
import de.gebiter.users.model.UsersContactType;
import de.gebiter.users.repository.UsersContactRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link UsersContact}, die eine Stelle für die Rechte an Kontaktangaben (Nutzer 2026-11-09). Er nutzt
 * nur sein eigenes {@link UsersContactRepository} und für die Regel der Sichtbarkeit den {@link UsersService}.
 * <p>
 * Wer welche Angabe sieht: der Besitzer alle. Ein anderer nur, wenn er das Profil sehen darf (privat: nichts außer der
 * GUID) und die Sichtbarkeit der Angabe ihn zulässt ({@link UsersService#isVisibleToCurrentUsers}). Der Admin liest alles
 * über {@code /api/admin/users-contact}. Schreiben nur der Besitzer, die GUID kommt aus dem Token.
 */
@Service
public class UsersContactService {

	private final UsersContactRepository usersContactRepository;

	private final UsersService usersService;

	private final CurrentUsersProvider currentUsersProvider;

	/** Höchstlänge einer Angabe in Zeichen ({@code gebiter.users-contact.value-max-length}). */
	private final int contactValueMaxLength;

	public UsersContactService(UsersContactRepository usersContactRepository, UsersService usersService,
			CurrentUsersProvider currentUsersProvider,
			@Value("${gebiter.users-contact.value-max-length}") int contactValueMaxLength) {
		this.usersContactRepository = usersContactRepository;
		this.usersService = usersService;
		this.currentUsersProvider = currentUsersProvider;
		this.contactValueMaxLength = contactValueMaxLength;
	}

	/** READ: Die eigenen Angaben samt ihrer Sichtbarkeit, in der Reihenfolge der Arten. */
	@Transactional(readOnly = true)
	public List<UsersContact> getOwnUsersContact() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		return doGetUsersContactInOrder(currentUsersGuid);
	}

	/**
	 * READ: Die Angaben eines Users, die der angemeldete User sehen darf, nur Art und Wert. Den eigenen sieht er alle.
	 *
	 * @throws EntityNotFoundException wenn er das Profil nicht sehen darf (sieht aus wie „gibt es nicht“)
	 */
	@Transactional(readOnly = true)
	public List<UsersContactForClient> getVisibleUsersContact(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		boolean profileVisible = usersService.isProfileVisibleToCurrentUsers(usersGuid);
		if (!profileVisible) {
			throw new EntityNotFoundException("Die Kontaktangaben dieses Users gibt es nicht.");
		}
		List<UsersContact> usersContacts = doGetUsersContactInOrder(usersGuid);
		List<UsersContactForClient> visibleUsersContacts = new ArrayList<>();
		for (UsersContact usersContact : usersContacts) {
			Visibility contactVisibility = usersContact.getVisibility();
			boolean contactVisible = usersService.isVisibleToCurrentUsers(usersGuid, contactVisibility);
			if (!contactVisible) {
				continue;
			}
			UsersContactType contactType = usersContact.getContactType();
			String contactValue = usersContact.getContactValue();
			UsersContactForClient visibleUsersContact = new UsersContactForClient(contactType, contactValue);
			visibleUsersContacts.add(visibleUsersContact);
		}
		return visibleUsersContacts;
	}

	/** READ: Alle Angaben eines Users, ohne Regel der Sichtbarkeit. Nur für den Admin. */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional(readOnly = true)
	public List<UsersContact> getUsersContactByUsers(UUID usersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		return doGetUsersContactInOrder(usersGuid);
	}

	/** READ: Alle Angaben aller User. Nur für den Admin. */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional(readOnly = true)
	public List<UsersContact> getAllUsersContact() {
		return usersContactRepository.findAll();
	}

	/**
	 * UPDATE: Setzt eine eigene Angabe mit ihrer Sichtbarkeit; der Eintrag entsteht beim ersten Setzen. Der Wert ohne
	 * Leerzeichen außen. Eine leere Angabe gibt es nicht: Dafür ist {@link #deleteOwnUsersContact} da.
	 *
	 * @throws IllegalArgumentException wenn Art, Wert oder Sichtbarkeit fehlen, der Wert zu lang ist oder einen
	 *         Zeilenumbruch oder ein Steuerzeichen enthält
	 */
	@Transactional
	public UsersContact saveOwnUsersContact(UsersContactType contactType, String contactValue, Visibility visibility) {
		Helper.requireNotNull(contactType, "contactType");
		Helper.requireNotNull(visibility, "visibility");
		String checkedContactValue = requireContactValue(contactValue);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		return doSaveUsersContact(currentUsersGuid, contactType, checkedContactValue, visibility);
	}

	/** DELETE: Löscht eine eigene Angabe. Gibt es sie nicht, ändert sich nichts. */
	@Transactional
	public void deleteOwnUsersContact(UsersContactType contactType) {
		Helper.requireNotNull(contactType, "contactType");
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		Optional<UsersContact> foundUsersContact = usersContactRepository.findByUsersGuidAndContactType(currentUsersGuid,
				contactType);
		if (foundUsersContact.isPresent()) {
			UsersContact ownUsersContact = foundUsersContact.get();
			usersContactRepository.delete(ownUsersContact);
		}
	}

	private List<UsersContact> doGetUsersContactInOrder(UUID usersGuid) {
		List<UsersContact> usersContacts = usersContactRepository.findByUsersGuid(usersGuid);
		List<UsersContact> sortedUsersContacts = new ArrayList<>(usersContacts);
		// nach der Reihenfolge der Arten im Enum, so wie die Anzeige sie zeigt
		Comparator<UsersContact> contactTypeOrder = Comparator.comparing(UsersContact::getContactType);
		sortedUsersContacts.sort(contactTypeOrder);
		return sortedUsersContacts;
	}

	private UsersContact doSaveUsersContact(UUID usersGuid, UsersContactType contactType, String contactValue,
			Visibility visibility) {
		Optional<UsersContact> foundUsersContact = usersContactRepository.findByUsersGuidAndContactType(usersGuid,
				contactType);
		UsersContact usersContact;
		if (foundUsersContact.isPresent()) {
			usersContact = foundUsersContact.get();
		} else {
			usersContact = new UsersContact(usersGuid, contactType);
		}
		usersContact.setContactValue(contactValue);
		usersContact.setVisibility(visibility);
		return usersContactRepository.save(usersContact);
	}

	/** Der Wert ohne Leerzeichen außen: nicht leer, nicht zu lang, eine Zeile ohne Steuerzeichen. */
	private String requireContactValue(String contactValue) {
		Helper.requireNotBlank(contactValue, "contactValue");
		String strippedContactValue = contactValue.strip();
		if (strippedContactValue.length() > contactValueMaxLength) {
			throw new IllegalArgumentException("Eine Kontaktangabe darf höchstens " + contactValueMaxLength
					+ " Zeichen haben.");
		}
		boolean containsControlCharacter = strippedContactValue.chars().anyMatch(Character::isISOControl);
		if (containsControlCharacter) {
			throw new IllegalArgumentException("Eine Kontaktangabe darf keinen Zeilenumbruch und kein Steuerzeichen enthalten.");
		}
		return strippedContactValue;
	}
}
