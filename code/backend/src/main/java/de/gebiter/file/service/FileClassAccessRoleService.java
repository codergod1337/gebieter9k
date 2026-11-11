package de.gebiter.file.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.access.service.AccessRoleService;
import de.gebiter.file.model.FileClassAccessRole;
import de.gebiter.file.repository.FileClassAccessRoleRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Service der Klasse {@link FileClassAccessRole}: welches Recht an den Dateien einer FileClass lesen, bearbeiten und
 * hochladen darf (drei eigene Schalter, Nutzer 2026-11-11). Er nutzt nur sein eigenes
 * {@link FileClassAccessRoleRepository}. Ob es FileClass und Recht gibt, prüft er über den {@link FileClassService} und den
 * {@link AccessRoleService}.
 * <p>
 * Bearbeiten und Hochladen schließen Lesen ein: Wer eines davon bekommt, bekommt hier immer auch Lesen. Sonst könnte
 * jemand eine Datei hochladen, die er danach selbst nicht sieht.
 * <p>
 * Anlegen, Ändern und Löschen darf nur der Admin, lesen darf jeder: Das Frontend bietet beim Upload nur die FileClasses an,
 * die der User hochladen darf.
 */
@Service
public class FileClassAccessRoleService {

	private final FileClassAccessRoleRepository fileClassAccessRoleRepository;

	private final FileClassService fileClassService;

	private final AccessRoleService accessRoleService;

	public FileClassAccessRoleService(FileClassAccessRoleRepository fileClassAccessRoleRepository,
			FileClassService fileClassService, AccessRoleService accessRoleService) {
		this.fileClassAccessRoleRepository = fileClassAccessRoleRepository;
		this.fileClassService = fileClassService;
		this.accessRoleService = accessRoleService;
	}

	/**
	 * CREATE: Gibt dem Recht {@code accessRoleKey} an der FileClass {@code fileClassKey} Zugriff: lesen, bearbeiten,
	 * hochladen, je ein eigener Schalter. Bearbeiten und Hochladen schließen Lesen ein.
	 *
	 * @throws IllegalArgumentException wenn ein Key ungültig ist, kein Schalter an ist oder es FileClass bzw. Recht nicht
	 *         gibt
	 * @throws DuplicateKeyException wenn das Recht an der FileClass schon einen Eintrag hat (dann ändern, nicht anlegen)
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileClassAccessRole createFileClassAccessRole(String fileClassKey, String accessRoleKey, boolean readGranted,
			boolean editGranted, boolean uploadGranted) {
		Helper.requireValidKey(fileClassKey);
		Helper.requireValidKey(accessRoleKey);
		requireAnythingGranted(readGranted, editGranted, uploadGranted);

		boolean fileClassExists = fileClassService.existsFileClass(fileClassKey);
		if (!fileClassExists) {
			throw new IllegalArgumentException("Die FileClass " + fileClassKey + " gibt es nicht.");
		}
		boolean accessRoleExists = accessRoleService.existsAccessRole(accessRoleKey);
		if (!accessRoleExists) {
			throw new IllegalArgumentException("Das Recht " + accessRoleKey + " gibt es nicht.");
		}
		Optional<FileClassAccessRole> existingFileClassAccessRole = fileClassAccessRoleRepository
				.findByFileClassKeyAndAccessRoleKey(fileClassKey, accessRoleKey);
		if (existingFileClassAccessRole.isPresent()) {
			throw new DuplicateKeyException(
					"Das Recht " + accessRoleKey + " hat an der FileClass " + fileClassKey + " schon einen Eintrag.");
		}
		boolean readGrantedOrIncluded = readGranted || editGranted || uploadGranted;
		FileClassAccessRole newFileClassAccessRole = new FileClassAccessRole(fileClassKey, accessRoleKey,
				readGrantedOrIncluded, editGranted, uploadGranted);
		return fileClassAccessRoleRepository.save(newFileClassAccessRole);
	}

	/**
	 * READ: Ein Eintrag über seine {@code id}.
	 *
	 * @throws EntityNotFoundException wenn es ihn nicht gibt
	 */
	@Transactional(readOnly = true)
	public FileClassAccessRole getFileClassAccessRole(Long id) {
		Helper.requireNotNull(id, "id");
		return doGetFileClassAccessRole(id);
	}

	/** READ: Alle Einträge aller FileClasses, z. B. für die Matrix „FileClass × AR“ und die Stammdaten. */
	@Transactional(readOnly = true)
	public List<FileClassAccessRole> getAllFileClassAccessRole() {
		return fileClassAccessRoleRepository.findAll();
	}

	/**
	 * READ: Die Keys der Rechte, die an der FileClass lesen dürfen. Bearbeiten und Hochladen schließen Lesen ein, diese
	 * Rechte sind also dabei. Das wird {@code readerAccessRoleKeys} jedes neuen Dokuments.
	 */
	@Transactional(readOnly = true)
	public List<String> getReaderAccessRoleKeysByFileClassKey(String fileClassKey) {
		Helper.requireNotNull(fileClassKey, "fileClassKey");
		List<FileClassAccessRole> fileClassAccessRolesOfFileClass = fileClassAccessRoleRepository
				.findByFileClassKey(fileClassKey);
		List<String> readerAccessRoleKeys = new ArrayList<>();
		for (FileClassAccessRole fileClassAccessRole : fileClassAccessRolesOfFileClass) {
			boolean readGranted = fileClassAccessRole.isReadGranted();
			if (readGranted) {
				String accessRoleKey = fileClassAccessRole.getAccessRoleKey();
				readerAccessRoleKeys.add(accessRoleKey);
			}
		}
		return readerAccessRoleKeys;
	}

	/** READ: Die Keys der Rechte, die Dateien dieser FileClass hochladen dürfen. */
	@Transactional(readOnly = true)
	public List<String> getUploaderAccessRoleKeysByFileClassKey(String fileClassKey) {
		Helper.requireNotNull(fileClassKey, "fileClassKey");
		List<FileClassAccessRole> fileClassAccessRolesOfFileClass = fileClassAccessRoleRepository
				.findByFileClassKey(fileClassKey);
		List<String> uploaderAccessRoleKeys = new ArrayList<>();
		for (FileClassAccessRole fileClassAccessRole : fileClassAccessRolesOfFileClass) {
			boolean uploadGranted = fileClassAccessRole.isUploadGranted();
			if (uploadGranted) {
				String accessRoleKey = fileClassAccessRole.getAccessRoleKey();
				uploaderAccessRoleKeys.add(accessRoleKey);
			}
		}
		return uploaderAccessRoleKeys;
	}

	/**
	 * UPDATE: Setzt die drei Schalter eines Eintrags neu. Übernommen werden nur {@code readGranted}, {@code editGranted}
	 * und {@code uploadGranted}; FileClass und Recht eines Eintrags ändern sich nie. Bearbeiten und Hochladen schließen
	 * Lesen ein. Soll das Recht an der FileClass nichts mehr dürfen, wird der Eintrag gelöscht, nicht geändert.
	 *
	 * @param changedFileClassAccessRole der Request Body, maßgeblich ist {@code id}
	 * @throws IllegalArgumentException wenn {@code id} fehlt oder kein Schalter an ist
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public FileClassAccessRole changeFileClassAccessRole(FileClassAccessRole changedFileClassAccessRole) {
		Long id = changedFileClassAccessRole.getId();
		Helper.requireNotNull(id, "id");
		boolean changedReadGranted = changedFileClassAccessRole.isReadGranted();
		boolean changedEditGranted = changedFileClassAccessRole.isEditGranted();
		boolean changedUploadGranted = changedFileClassAccessRole.isUploadGranted();
		requireAnythingGranted(changedReadGranted, changedEditGranted, changedUploadGranted);
		boolean readGrantedOrIncluded = changedReadGranted || changedEditGranted || changedUploadGranted;

		FileClassAccessRole existingFileClassAccessRole = doGetFileClassAccessRole(id);
		existingFileClassAccessRole.setReadGranted(readGrantedOrIncluded);
		existingFileClassAccessRole.setEditGranted(changedEditGranted);
		existingFileClassAccessRole.setUploadGranted(changedUploadGranted);
		// verwaltet in dieser Transaktion: Hibernate schreibt beim Commit ohnehin (Dirty Checking), save() zeigt es nur
		return fileClassAccessRoleRepository.save(existingFileClassAccessRole);
	}

	/**
	 * DELETE: Nimmt dem Recht den Zugriff auf die FileClass, gelöscht wird genau dieser eine Eintrag.
	 *
	 * @throws EntityNotFoundException wenn es den Eintrag nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public void deleteFileClassAccessRole(Long id) {
		Helper.requireNotNull(id, "id");
		FileClassAccessRole existingFileClassAccessRole = doGetFileClassAccessRole(id);
		fileClassAccessRoleRepository.delete(existingFileClassAccessRole);
	}

	private void requireAnythingGranted(boolean readGranted, boolean editGranted, boolean uploadGranted) {
		boolean anythingGranted = readGranted || editGranted || uploadGranted;
		if (!anythingGranted) {
			throw new IllegalArgumentException("Mindestens eines muss erlaubt sein: lesen, bearbeiten oder hochladen. "
					+ "Soll das Recht an der FileClass nichts mehr dürfen, den Eintrag löschen.");
		}
	}

	private FileClassAccessRole doGetFileClassAccessRole(Long id) {
		Optional<FileClassAccessRole> foundFileClassAccessRole = fileClassAccessRoleRepository.findById(id);
		if (foundFileClassAccessRole.isEmpty()) {
			throw new EntityNotFoundException("Es gibt keinen Eintrag mit der id " + id + ".");
		}
		return foundFileClassAccessRole.get();
	}
}
