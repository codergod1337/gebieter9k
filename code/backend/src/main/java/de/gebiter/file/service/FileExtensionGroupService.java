package de.gebiter.file.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.dto.FileExtensionGroupDeletedEvent;
import de.gebiter.file.model.FileExtensionGroup;
import de.gebiter.file.repository.FileExtensionGroupRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link FileExtensionGroup}. Er nutzt nur sein eigenes {@link FileExtensionGroupRepository}.
 * <p>
 * Anlegen, Ändern, Verschieben und Löschen darf nur der Admin, lesen darf jeder (Stammdaten). Beim Löschen meldet er
 * {@link FileExtensionGroupDeletedEvent}, der {@link FileExtensionService} nimmt die Gruppe dann von seinen Endungen.
 */
@Service
public class FileExtensionGroupService {

	private final FileExtensionGroupRepository fileExtensionGroupRepository;

	private final ApplicationEventPublisher applicationEventPublisher;

	/** In dieser Sprache muss jeder Anzeigename Text haben ({@code gebiter.language.default-code}). */
	private final String defaultLanguageCode;

	public FileExtensionGroupService(FileExtensionGroupRepository fileExtensionGroupRepository,
			ApplicationEventPublisher applicationEventPublisher,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.fileExtensionGroupRepository = fileExtensionGroupRepository;
		this.applicationEventPublisher = applicationEventPublisher;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt eine Gruppe an, ans Ende der Liste.
	 *
	 * @throws IllegalArgumentException wenn der Key der Key-Regel nicht entspricht oder der Name in der Pflichtsprache
	 *         fehlt
	 * @throws DuplicateKeyException wenn es den Key schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileExtensionGroup createFileExtensionGroup(String fileExtensionGroupKey, Map<String, String> displayName) {
		Helper.requireValidKey(fileExtensionGroupKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		// Ohne diese Prüfung würde save() eine bestehende Gruppe still überschreiben.
		boolean fileExtensionGroupKeyTaken = doExistsFileExtensionGroup(fileExtensionGroupKey);
		if (fileExtensionGroupKeyTaken) {
			throw new DuplicateKeyException("Die Gruppe " + fileExtensionGroupKey + " gibt es schon.");
		}
		return doCreateFileExtensionGroup(fileExtensionGroupKey, displayName);
	}

	/** READ: Gibt es die Gruppe {@code fileExtensionGroupKey}? */
	@Transactional(readOnly = true)
	public boolean existsFileExtensionGroup(String fileExtensionGroupKey) {
		Helper.requireNotNull(fileExtensionGroupKey, "fileExtensionGroupKey");
		return doExistsFileExtensionGroup(fileExtensionGroupKey);
	}

	/**
	 * READ: Eine Gruppe.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@Transactional(readOnly = true)
	public FileExtensionGroup getFileExtensionGroup(String fileExtensionGroupKey) {
		Helper.requireNotNull(fileExtensionGroupKey, "fileExtensionGroupKey");
		return doGetFileExtensionGroup(fileExtensionGroupKey);
	}

	/** READ: Alle Gruppen in der Reihenfolge der Anzeige. */
	@Transactional(readOnly = true)
	public List<FileExtensionGroup> getAllFileExtensionGroup() {
		return doGetAllFileExtensionGroup();
	}

	/**
	 * UPDATE: Ändert eine Gruppe. Der Key bestimmt nur, welche geändert wird, er selbst ändert sich nie. Übernommen wird
	 * der Anzeigename; den Platz ändert {@link #changeFileExtensionGroupListingPositions(List)}.
	 *
	 * @param changedFileExtensionGroup der Request Body, maßgeblich ist {@code key}
	 * @throws IllegalArgumentException wenn der Name in der Pflichtsprache fehlt
	 * @throws EntityNotFoundException wenn es die Gruppe nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileExtensionGroup changeFileExtensionGroup(FileExtensionGroup changedFileExtensionGroup) {
		String fileExtensionGroupKey = changedFileExtensionGroup.getKey();
		Helper.requireNotNull(fileExtensionGroupKey, "key");
		Map<String, String> changedDisplayName = changedFileExtensionGroup.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);

		FileExtensionGroup existingFileExtensionGroup = doGetFileExtensionGroup(fileExtensionGroupKey);
		existingFileExtensionGroup.setDisplayName(changedDisplayName);
		// verwaltet in dieser Transaktion: Hibernate schreibt beim Commit ohnehin (Dirty Checking), save() zeigt es nur
		return fileExtensionGroupRepository.save(existingFileExtensionGroup);
	}

	/**
	 * UPDATE: Neue Reihenfolge nach Drag and Drop. {@code fileExtensionGroupKeysInOrder} enthält jeden Key genau einmal,
	 * der erste bekommt Platz 1.
	 *
	 * @return alle Gruppen in der neuen Reihenfolge
	 * @throws IllegalArgumentException wenn ein Key fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<FileExtensionGroup> changeFileExtensionGroupListingPositions(
			List<String> fileExtensionGroupKeysInOrder) {
		List<FileExtensionGroup> allFileExtensionGroups = doGetAllFileExtensionGroup();
		List<String> existingFileExtensionGroupKeys = new ArrayList<>();
		for (FileExtensionGroup fileExtensionGroup : allFileExtensionGroups) {
			String existingFileExtensionGroupKey = fileExtensionGroup.getKey();
			existingFileExtensionGroupKeys.add(existingFileExtensionGroupKey);
		}
		Helper.requireCompleteKeyOrder(fileExtensionGroupKeysInOrder, existingFileExtensionGroupKeys, "keysInOrder");
		for (FileExtensionGroup fileExtensionGroup : allFileExtensionGroups) {
			String fileExtensionGroupKey = fileExtensionGroup.getKey();
			int newListingPosition = fileExtensionGroupKeysInOrder.indexOf(fileExtensionGroupKey) + 1;
			// verwaltet in dieser Transaktion: Hibernate schreibt die Änderung beim Commit (Dirty Checking)
			fileExtensionGroup.setListingPosition(newListingPosition);
		}
		fileExtensionGroupRepository.saveAll(allFileExtensionGroups);
		return doGetAllFileExtensionGroup();
	}

	/**
	 * DELETE: Löscht eine Gruppe. Ihre Endungen bleiben und stehen danach ohne Gruppe (über
	 * {@link FileExtensionGroupDeletedEvent}, in derselben Transaktion).
	 *
	 * @throws EntityNotFoundException wenn es die Gruppe nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteFileExtensionGroup(String fileExtensionGroupKey) {
		Helper.requireNotNull(fileExtensionGroupKey, "key");
		FileExtensionGroup existingFileExtensionGroup = doGetFileExtensionGroup(fileExtensionGroupKey);
		FileExtensionGroupDeletedEvent fileExtensionGroupDeletedEvent = new FileExtensionGroupDeletedEvent(
				fileExtensionGroupKey);
		applicationEventPublisher.publishEvent(fileExtensionGroupDeletedEvent);
		fileExtensionGroupRepository.delete(existingFileExtensionGroup);
	}

	private FileExtensionGroup doCreateFileExtensionGroup(String fileExtensionGroupKey,
			Map<String, String> displayName) {
		int newListingPosition = 1;
		Optional<FileExtensionGroup> lastFileExtensionGroup = fileExtensionGroupRepository
				.findTopByOrderByListingPositionDesc();
		if (lastFileExtensionGroup.isPresent()) {
			int lastListingPosition = lastFileExtensionGroup.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		FileExtensionGroup newFileExtensionGroup = new FileExtensionGroup(fileExtensionGroupKey, displayName,
				newListingPosition);
		return fileExtensionGroupRepository.save(newFileExtensionGroup);
	}

	private List<FileExtensionGroup> doGetAllFileExtensionGroup() {
		return fileExtensionGroupRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	private boolean doExistsFileExtensionGroup(String fileExtensionGroupKey) {
		return fileExtensionGroupRepository.existsById(fileExtensionGroupKey);
	}

	private FileExtensionGroup doGetFileExtensionGroup(String fileExtensionGroupKey) {
		Optional<FileExtensionGroup> foundFileExtensionGroup = fileExtensionGroupRepository
				.findById(fileExtensionGroupKey);
		if (foundFileExtensionGroup.isEmpty()) {
			throw new EntityNotFoundException("Die Gruppe " + fileExtensionGroupKey + " gibt es nicht.");
		}
		return foundFileExtensionGroup.get();
	}
}
