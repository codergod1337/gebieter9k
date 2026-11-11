package de.gebiter.file.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.badge.model.BadgeLook;
import de.gebiter.badge.service.BadgeLookService;
import de.gebiter.file.model.FileClass;
import de.gebiter.file.repository.FileClassRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link FileClass}. Er nutzt nur sein eigenes {@link FileClassRepository}.
 * <p>
 * Anlegen und Ändern darf nur der Admin, lesen darf jeder (Stammdaten des Frontends, Auswahl beim Upload). DELETE fehlt
 * noch: Mit der FileClass müssen ihre Rechte und Endungen weg, und deren Services prüfen umgekehrt über diesen Service, ob
 * es die FileClass gibt. Außerdem tragen Dokumente in Solr ihren Key. Der Weg wird erst besprochen.
 */
@Service
public class FileClassService {

	private final FileClassRepository fileClassRepository;

	private final BadgeLookService badgeLookService;

	/** In dieser Sprache muss jeder Anzeigename Text haben ({@code gebiter.language.default-code}). */
	private final String defaultLanguageCode;

	public FileClassService(FileClassRepository fileClassRepository, BadgeLookService badgeLookService,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.fileClassRepository = fileClassRepository;
		this.badgeLookService = badgeLookService;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt eine FileClass an, ans Ende der Liste, mit ihrem Badge (Symbol, Verlauf, Effekte …).
	 *
	 * @throws IllegalArgumentException wenn der Key der Key-Regel nicht entspricht, der Name in der Pflichtsprache fehlt
	 *         oder das Badge ungültig ist
	 * @throws DuplicateKeyException wenn es den Key schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileClass createFileClass(String fileClassKey, Map<String, String> displayName,
			Map<String, String> description, BadgeLook badgeLook) {
		Helper.requireValidKey(fileClassKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		BadgeLook validBadgeLook = badgeLookService.requireValidBadgeLook(badgeLook);
		// Ohne diese Prüfung würde save() eine bestehende FileClass still überschreiben.
		boolean fileClassKeyTaken = doExistsFileClass(fileClassKey);
		if (fileClassKeyTaken) {
			throw new DuplicateKeyException("Die FileClass " + fileClassKey + " gibt es schon.");
		}
		return doCreateFileClass(fileClassKey, displayName, description, validBadgeLook);
	}

	/** READ: Gibt es die FileClass {@code fileClassKey}? */
	@Transactional(readOnly = true)
	public boolean existsFileClass(String fileClassKey) {
		Helper.requireNotNull(fileClassKey, "fileClassKey");
		return doExistsFileClass(fileClassKey);
	}

	/**
	 * READ: Eine FileClass über ihren Key.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@Transactional(readOnly = true)
	public FileClass getFileClass(String fileClassKey) {
		Helper.requireNotNull(fileClassKey, "fileClassKey");
		return doGetFileClass(fileClassKey);
	}

	/** READ: Alle FileClasses in der Reihenfolge der Anzeige. */
	@Transactional(readOnly = true)
	public List<FileClass> getAllFileClass() {
		// Bei gleichem Platz nach Key: So springen Listen im Frontend nie.
		return fileClassRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	/**
	 * UPDATE: Ändert eine FileClass. Der Key bestimmt nur, welche geändert wird, er selbst ändert sich nie. Übernommen
	 * werden Anzeigename, Beschreibung und Badge.
	 *
	 * @param changedFileClass der Request Body, maßgeblich ist {@code key}
	 * @throws IllegalArgumentException wenn der Key oder der Name in der Pflichtsprache fehlt
	 * @throws EntityNotFoundException wenn es die FileClass nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileClass changeFileClass(FileClass changedFileClass) {
		String fileClassKey = changedFileClass.getKey();
		Helper.requireNotNull(fileClassKey, "key");
		Map<String, String> changedDisplayName = changedFileClass.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);
		Map<String, String> changedDescription = changedFileClass.getDescription();
		BadgeLook enteredBadgeLook = changedFileClass.getBadgeLook();
		BadgeLook changedBadgeLook = badgeLookService.requireValidBadgeLook(enteredBadgeLook);

		FileClass existingFileClass = doGetFileClass(fileClassKey);
		existingFileClass.setDisplayName(changedDisplayName);
		existingFileClass.setDescription(changedDescription);
		existingFileClass.setBadgeLook(changedBadgeLook);
		// verwaltet in dieser Transaktion: Hibernate schreibt beim Commit ohnehin (Dirty Checking), save() zeigt es nur
		return fileClassRepository.save(existingFileClass);
	}

	private FileClass doCreateFileClass(String fileClassKey, Map<String, String> displayName,
			Map<String, String> description, BadgeLook badgeLook) {
		int newListingPosition = 1;
		Optional<FileClass> lastFileClass = fileClassRepository.findTopByOrderByListingPositionDesc();
		if (lastFileClass.isPresent()) {
			int lastListingPosition = lastFileClass.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		FileClass newFileClass = new FileClass(fileClassKey, displayName, description, newListingPosition, badgeLook);
		return fileClassRepository.save(newFileClass);
	}

	private boolean doExistsFileClass(String fileClassKey) {
		return fileClassRepository.existsById(fileClassKey);
	}

	private FileClass doGetFileClass(String fileClassKey) {
		Optional<FileClass> foundFileClass = fileClassRepository.findById(fileClassKey);
		if (foundFileClass.isEmpty()) {
			throw new EntityNotFoundException("Die FileClass " + fileClassKey + " gibt es nicht.");
		}
		return foundFileClass.get();
	}
}
