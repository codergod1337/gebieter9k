package de.gebiter.file.service;

import java.util.List;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.context.event.EventListener;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.dto.FileExtensionDeletedEvent;
import de.gebiter.file.model.FileClassFileExtension;
import de.gebiter.file.repository.FileClassFileExtensionRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link FileClassFileExtension}: welche Endungen eine FileClass annimmt. Er nutzt nur sein eigenes
 * {@link FileClassFileExtensionRepository}. Ob es FileClass und Endung gibt, prüft er über den {@link FileClassService}
 * und den {@link FileExtensionService}.
 * <p>
 * Freischalten und Entfernen darf nur der Admin, lesen darf jeder: Das Frontend prüft die Endung schon beim Ablegen einer
 * Datei. Wird eine Endung gelöscht, entfernt er ihre Freischaltungen ({@link FileExtensionDeletedEvent}).
 */
@Service
public class FileClassFileExtensionService {

	private final FileClassFileExtensionRepository fileClassFileExtensionRepository;

	private final FileClassService fileClassService;

	private final FileExtensionService fileExtensionService;

	public FileClassFileExtensionService(FileClassFileExtensionRepository fileClassFileExtensionRepository,
			FileClassService fileClassService, FileExtensionService fileExtensionService) {
		this.fileClassFileExtensionRepository = fileClassFileExtensionRepository;
		this.fileClassService = fileClassService;
		this.fileExtensionService = fileExtensionService;
	}

	/**
	 * CREATE: Schaltet die Endung {@code fileExtension} für die FileClass {@code fileClassKey} frei.
	 *
	 * @throws IllegalArgumentException wenn Key oder Endung ungültig sind oder es FileClass bzw. Endung nicht gibt
	 * @throws DuplicateKeyException wenn die Endung schon freigeschaltet ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileClassFileExtension createFileClassFileExtension(String fileClassKey, String fileExtension) {
		Helper.requireValidKey(fileClassKey);
		Helper.requireValidFileExtension(fileExtension);

		boolean fileClassExists = fileClassService.existsFileClass(fileClassKey);
		if (!fileClassExists) {
			throw new IllegalArgumentException("Die FileClass " + fileClassKey + " gibt es nicht.");
		}
		boolean fileExtensionExists = fileExtensionService.existsFileExtension(fileExtension);
		if (!fileExtensionExists) {
			throw new IllegalArgumentException("Die Endung " + fileExtension + " gibt es nicht.");
		}
		boolean alreadyEnabled = doExistsFileClassFileExtension(fileClassKey, fileExtension);
		if (alreadyEnabled) {
			throw new DuplicateKeyException(
					"Die Endung " + fileExtension + " ist für die FileClass " + fileClassKey + " schon freigeschaltet.");
		}
		FileClassFileExtension newFileClassFileExtension = new FileClassFileExtension(fileClassKey, fileExtension);
		return fileClassFileExtensionRepository.save(newFileClassFileExtension);
	}

	/** READ: Nimmt die FileClass {@code fileClassKey} die Endung {@code fileExtension} an? */
	@Transactional(readOnly = true)
	public boolean existsFileClassFileExtension(String fileClassKey, String fileExtension) {
		Helper.requireNotNull(fileClassKey, "fileClassKey");
		Helper.requireNotNull(fileExtension, "fileExtension");
		return doExistsFileClassFileExtension(fileClassKey, fileExtension);
	}

	/**
	 * READ: Ein Eintrag über seine {@code id}.
	 *
	 * @throws EntityNotFoundException wenn es ihn nicht gibt
	 */
	@Transactional(readOnly = true)
	public FileClassFileExtension getFileClassFileExtension(Long id) {
		Helper.requireNotNull(id, "id");
		return doGetFileClassFileExtension(id);
	}

	/** READ: Alle Freischaltungen aller FileClasses, z. B. für die Matrix „FileClass × Endung“ und die Stammdaten. */
	@Transactional(readOnly = true)
	public List<FileClassFileExtension> getAllFileClassFileExtension() {
		return fileClassFileExtensionRepository.findAll();
	}

	// Kein UPDATE: Ein Eintrag besteht nur aus FileClass und Endung. Ändern heißt entfernen und neu freischalten.

	/**
	 * DELETE: Nimmt die Freischaltung zurück, gelöscht wird genau dieser eine Eintrag. Dateien, die schon hochgeladen sind,
	 * bleiben.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteFileClassFileExtension(Long id) {
		Helper.requireNotNull(id, "id");
		FileClassFileExtension existingFileClassFileExtension = doGetFileClassFileExtension(id);
		fileClassFileExtensionRepository.delete(existingFileClassFileExtension);
	}

	/**
	 * Eine Endung wird gelöscht: Keine FileClass nimmt sie danach noch an. Läuft in der Transaktion des Löschens, die
	 * Rechte hat {@link FileExtensionService#deleteFileExtension(String)} schon geprüft.
	 */
	@EventListener
	@Transactional
	void deleteFileClassFileExtensionsOfDeletedFileExtension(FileExtensionDeletedEvent fileExtensionDeletedEvent) {
		String deletedFileExtension = fileExtensionDeletedEvent.fileExtension();
		List<FileClassFileExtension> fileClassFileExtensionsOfFileExtension = fileClassFileExtensionRepository
				.findAllByFileExtension(deletedFileExtension);
		fileClassFileExtensionRepository.deleteAll(fileClassFileExtensionsOfFileExtension);
	}

	private boolean doExistsFileClassFileExtension(String fileClassKey, String fileExtension) {
		return fileClassFileExtensionRepository.existsByFileClassKeyAndFileExtension(fileClassKey, fileExtension);
	}

	private FileClassFileExtension doGetFileClassFileExtension(Long id) {
		Optional<FileClassFileExtension> foundFileClassFileExtension = fileClassFileExtensionRepository.findById(id);
		if (foundFileClassFileExtension.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen Eintrag mit der id " + id + ".");
		}
		return foundFileClassFileExtension.get();
	}
}
