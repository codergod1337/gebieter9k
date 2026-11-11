package de.gebiter.file.service;

import java.util.List;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.model.FileClassDestination;
import de.gebiter.file.model.FileClassDestinationAssignment;
import de.gebiter.file.repository.FileClassDestinationAssignmentRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link FileClassDestinationAssignment}: an welchem Ziel (Upload-Weg) eine FileClass im Dropdown
 * angeboten wird. Er nutzt nur sein eigenes Repository; ob es die FileClass gibt, prüft er über den
 * {@link FileClassService}.
 * <p>
 * Zuordnen und Entfernen darf nur der Admin, lesen darf jeder: Das Frontend baut daraus das Dropdown, der Upload-Weg
 * prüft es im Backend noch einmal.
 */
@Service
public class FileClassDestinationAssignmentService {

	private final FileClassDestinationAssignmentRepository fileClassDestinationAssignmentRepository;

	private final FileClassService fileClassService;

	public FileClassDestinationAssignmentService(
			FileClassDestinationAssignmentRepository fileClassDestinationAssignmentRepository,
			FileClassService fileClassService) {
		this.fileClassDestinationAssignmentRepository = fileClassDestinationAssignmentRepository;
		this.fileClassService = fileClassService;
	}

	/**
	 * CREATE: Bietet die FileClass {@code fileClassKey} am Ziel {@code destination} an.
	 *
	 * @throws IllegalArgumentException wenn Key oder Ziel fehlen oder es die FileClass nicht gibt
	 * @throws DuplicateKeyException wenn die Zuordnung schon besteht
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileClassDestinationAssignment createFileClassDestinationAssignment(String fileClassKey,
			FileClassDestination destination) {
		Helper.requireValidKey(fileClassKey);
		Helper.requireNotNull(destination, "destination");
		boolean fileClassExists = fileClassService.existsFileClass(fileClassKey);
		if (!fileClassExists) {
			throw new IllegalArgumentException("Die FileClass " + fileClassKey + " gibt es nicht.");
		}
		boolean alreadyAssigned = doExistsFileClassDestinationAssignment(fileClassKey, destination);
		if (alreadyAssigned) {
			throw new DuplicateKeyException(
					"Die FileClass " + fileClassKey + " wird am Ziel " + destination + " schon angeboten.");
		}
		FileClassDestinationAssignment newAssignment = new FileClassDestinationAssignment(fileClassKey, destination);
		return fileClassDestinationAssignmentRepository.save(newAssignment);
	}

	/** READ: Wird die FileClass {@code fileClassKey} am Ziel {@code destination} angeboten? */
	@Transactional(readOnly = true)
	public boolean existsFileClassDestinationAssignment(String fileClassKey, FileClassDestination destination) {
		Helper.requireNotNull(fileClassKey, "fileClassKey");
		Helper.requireNotNull(destination, "destination");
		return doExistsFileClassDestinationAssignment(fileClassKey, destination);
	}

	/**
	 * READ: Eine Zuordnung über ihre {@code id}.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@Transactional(readOnly = true)
	public FileClassDestinationAssignment getFileClassDestinationAssignment(Long id) {
		Helper.requireNotNull(id, "id");
		return doGetFileClassDestinationAssignment(id);
	}

	/** READ: Alle Zuordnungen, z. B. für die Matrix „FileClass × Ziel“ und das Dropdown beim Hochladen. */
	@Transactional(readOnly = true)
	public List<FileClassDestinationAssignment> getAllFileClassDestinationAssignment() {
		return fileClassDestinationAssignmentRepository.findAll();
	}

	// Kein UPDATE: Eine Zuordnung besteht nur aus FileClass und Ziel. Ändern heißt entfernen und neu zuordnen.

	/**
	 * DELETE: Nimmt die Zuordnung zurück. Dateien, die schon hochgeladen sind, bleiben.
	 *
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteFileClassDestinationAssignment(Long id) {
		Helper.requireNotNull(id, "id");
		FileClassDestinationAssignment existingAssignment = doGetFileClassDestinationAssignment(id);
		fileClassDestinationAssignmentRepository.delete(existingAssignment);
	}

	private boolean doExistsFileClassDestinationAssignment(String fileClassKey, FileClassDestination destination) {
		return fileClassDestinationAssignmentRepository.existsByFileClassKeyAndDestination(fileClassKey, destination);
	}

	private FileClassDestinationAssignment doGetFileClassDestinationAssignment(Long id) {
		Optional<FileClassDestinationAssignment> foundAssignment = fileClassDestinationAssignmentRepository.findById(id);
		if (foundAssignment.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keine Zuordnung mit der id " + id + ".");
		}
		return foundAssignment.get();
	}
}
