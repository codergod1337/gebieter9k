package de.gebiter.file.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.dto.FileExtensionDeletedEvent;
import de.gebiter.file.dto.FileExtensionGroupDeletedEvent;
import de.gebiter.file.model.FileExtension;
import de.gebiter.file.repository.FileExtensionRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link FileExtension}. Er nutzt nur sein eigenes {@link FileExtensionRepository}; ob es eine Gruppe
 * gibt, fragt er den {@link FileExtensionGroupService}.
 * <p>
 * Anlegen, Ändern, Verschieben und Löschen darf nur der Admin, lesen darf jeder. Beim Löschen meldet er
 * {@link FileExtensionDeletedEvent}, der {@link FileClassFileExtensionService} entfernt dann die Freischaltungen. Wird
 * eine Gruppe gelöscht, nimmt er sie von seinen Endungen ({@link FileExtensionGroupDeletedEvent}).
 */
@Service
public class FileExtensionService {

	private final FileExtensionRepository fileExtensionRepository;

	private final FileExtensionGroupService fileExtensionGroupService;

	private final ApplicationEventPublisher applicationEventPublisher;

	public FileExtensionService(FileExtensionRepository fileExtensionRepository,
			FileExtensionGroupService fileExtensionGroupService, ApplicationEventPublisher applicationEventPublisher) {
		this.fileExtensionRepository = fileExtensionRepository;
		this.fileExtensionGroupService = fileExtensionGroupService;
		this.applicationEventPublisher = applicationEventPublisher;
	}

	/**
	 * CREATE: Legt eine Endung an, ans Ende der Liste.
	 *
	 * @param fileExtensionGroupKey die Gruppe, {@code null} für ohne Gruppe
	 * @throws IllegalArgumentException wenn die Endung der Endungs-Regel nicht entspricht oder es die Gruppe nicht gibt
	 * @throws DuplicateKeyException wenn es die Endung schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileExtension createFileExtension(String fileExtension, Map<String, String> description,
			String fileExtensionGroupKey, boolean imagePreview) {
		Helper.requireValidFileExtension(fileExtension);
		requireExistingFileExtensionGroupOrNull(fileExtensionGroupKey);
		boolean fileExtensionTaken = doExistsFileExtension(fileExtension);
		if (fileExtensionTaken) {
			throw new DuplicateKeyException("Die Endung " + fileExtension + " gibt es schon.");
		}
		return doCreateFileExtension(fileExtension, description, fileExtensionGroupKey, imagePreview);
	}

	/** READ: Gibt es die Endung {@code fileExtension}? */
	@Transactional(readOnly = true)
	public boolean existsFileExtension(String fileExtension) {
		Helper.requireNotNull(fileExtension, "fileExtension");
		return doExistsFileExtension(fileExtension);
	}

	/**
	 * READ: Eine Endung.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@Transactional(readOnly = true)
	public FileExtension getFileExtension(String fileExtension) {
		Helper.requireNotNull(fileExtension, "fileExtension");
		return doGetFileExtension(fileExtension);
	}

	/** READ: Alle Endungen in der Reihenfolge der Anzeige. */
	@Transactional(readOnly = true)
	public List<FileExtension> getAllFileExtension() {
		return doGetAllFileExtension();
	}

	/**
	 * UPDATE: Ändert eine Endung. Die Endung bestimmt nur, welche geändert wird, sie selbst ändert sich nie. Übernommen
	 * werden Beschreibung, Gruppe und {@code imagePreview}; den Platz ändert {@link #changeFileExtensionListingPositions}.
	 *
	 * @param changedFileExtension der Request Body, maßgeblich ist {@code extension}
	 * @throws IllegalArgumentException wenn es die Gruppe nicht gibt
	 * @throws EntityNotFoundException wenn es die Endung nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileExtension changeFileExtension(FileExtension changedFileExtension) {
		String fileExtension = changedFileExtension.getExtension();
		Helper.requireNotNull(fileExtension, "extension");
		Map<String, String> changedDescription = changedFileExtension.getDescription();
		String changedFileExtensionGroupKey = changedFileExtension.getFileExtensionGroupKey();
		boolean changedImagePreview = changedFileExtension.isImagePreview();
		requireExistingFileExtensionGroupOrNull(changedFileExtensionGroupKey);

		FileExtension existingFileExtension = doGetFileExtension(fileExtension);
		existingFileExtension.setDescription(changedDescription);
		existingFileExtension.setFileExtensionGroupKey(changedFileExtensionGroupKey);
		existingFileExtension.setImagePreview(changedImagePreview);
		// verwaltet in dieser Transaktion: Hibernate schreibt beim Commit ohnehin (Dirty Checking), save() zeigt es nur
		return fileExtensionRepository.save(existingFileExtension);
	}

	/**
	 * UPDATE: Neue Reihenfolge nach Drag and Drop. {@code fileExtensionsInOrder} enthält jede Endung genau einmal, die
	 * erste bekommt Platz 1. Das Frontend schickt die Gruppen hintereinander, so gilt der Platz auch innerhalb jeder
	 * Gruppe.
	 *
	 * @return alle Endungen in der neuen Reihenfolge
	 * @throws IllegalArgumentException wenn eine Endung fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<FileExtension> changeFileExtensionListingPositions(List<String> fileExtensionsInOrder) {
		List<FileExtension> allFileExtensions = doGetAllFileExtension();
		List<String> existingFileExtensions = new ArrayList<>();
		for (FileExtension fileExtension : allFileExtensions) {
			String existingFileExtension = fileExtension.getExtension();
			existingFileExtensions.add(existingFileExtension);
		}
		Helper.requireCompleteKeyOrder(fileExtensionsInOrder, existingFileExtensions, "keysInOrder");
		for (FileExtension fileExtension : allFileExtensions) {
			String extension = fileExtension.getExtension();
			int newListingPosition = fileExtensionsInOrder.indexOf(extension) + 1;
			// verwaltet in dieser Transaktion: Hibernate schreibt die Änderung beim Commit (Dirty Checking)
			fileExtension.setListingPosition(newListingPosition);
		}
		fileExtensionRepository.saveAll(allFileExtensions);
		return doGetAllFileExtension();
	}

	/**
	 * DELETE: Löscht eine Endung samt ihrer Freischaltungen an den FileClasses (über {@link FileExtensionDeletedEvent}, in
	 * derselben Transaktion). Danach nimmt keine FileClass sie mehr an. Schon hochgeladene Dateien bleiben.
	 *
	 * @throws EntityNotFoundException wenn es die Endung nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteFileExtension(String fileExtension) {
		Helper.requireNotNull(fileExtension, "extension");
		FileExtension existingFileExtension = doGetFileExtension(fileExtension);
		FileExtensionDeletedEvent fileExtensionDeletedEvent = new FileExtensionDeletedEvent(fileExtension);
		applicationEventPublisher.publishEvent(fileExtensionDeletedEvent);
		fileExtensionRepository.delete(existingFileExtension);
	}

	/**
	 * Eine Gruppe wird gelöscht: Ihre Endungen stehen danach ohne Gruppe. Läuft in der Transaktion des Löschens, die
	 * Rechte hat {@link FileExtensionGroupService#deleteFileExtensionGroup(String)} schon geprüft.
	 */
	@EventListener
	@Transactional
	void removeFileExtensionGroupFromFileExtensions(FileExtensionGroupDeletedEvent fileExtensionGroupDeletedEvent) {
		String deletedFileExtensionGroupKey = fileExtensionGroupDeletedEvent.fileExtensionGroupKey();
		List<FileExtension> fileExtensionsOfGroup = fileExtensionRepository
				.findAllByFileExtensionGroupKey(deletedFileExtensionGroupKey);
		for (FileExtension fileExtension : fileExtensionsOfGroup) {
			// verwaltet in dieser Transaktion: Hibernate schreibt die Änderung beim Commit (Dirty Checking)
			fileExtension.setFileExtensionGroupKey(null);
		}
		fileExtensionRepository.saveAll(fileExtensionsOfGroup);
	}

	/** {@code null} heißt ohne Gruppe und ist erlaubt, sonst muss es die Gruppe geben. */
	private void requireExistingFileExtensionGroupOrNull(String fileExtensionGroupKey) {
		if (fileExtensionGroupKey == null) {
			return;
		}
		boolean fileExtensionGroupExists = fileExtensionGroupService.existsFileExtensionGroup(fileExtensionGroupKey);
		if (!fileExtensionGroupExists) {
			throw new IllegalArgumentException("Die Gruppe " + fileExtensionGroupKey + " gibt es nicht.");
		}
	}

	private FileExtension doCreateFileExtension(String fileExtension, Map<String, String> description,
			String fileExtensionGroupKey, boolean imagePreview) {
		int newListingPosition = 1;
		Optional<FileExtension> lastFileExtension = fileExtensionRepository.findTopByOrderByListingPositionDesc();
		if (lastFileExtension.isPresent()) {
			int lastListingPosition = lastFileExtension.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		FileExtension newFileExtension = new FileExtension(fileExtension, description, fileExtensionGroupKey,
				newListingPosition, imagePreview);
		return fileExtensionRepository.save(newFileExtension);
	}

	private List<FileExtension> doGetAllFileExtension() {
		return fileExtensionRepository.findAllByOrderByListingPositionAscExtensionAsc();
	}

	private boolean doExistsFileExtension(String fileExtension) {
		return fileExtensionRepository.existsById(fileExtension);
	}

	private FileExtension doGetFileExtension(String fileExtension) {
		Optional<FileExtension> foundFileExtension = fileExtensionRepository.findById(fileExtension);
		if (foundFileExtension.isEmpty()) {
			throw new EntityNotFoundException("Die Endung " + fileExtension + " gibt es nicht.");
		}
		return foundFileExtension.get();
	}
}
