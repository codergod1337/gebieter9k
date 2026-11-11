package de.gebiter.file.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import de.gebiter.file.FileAccessDeniedException;
import de.gebiter.file.FileConfig;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.security.CurrentUsersProvider;

/**
 * Wer an einer Datei was darf, an EINER Stelle, alles aus dem Token:
 * <ul>
 * <li>ein User ändert und löscht weich nur seine eigenen Dateien, und nur mit einer Schreibrolle der Datei,</li>
 * <li>FILE_MANAGER und ADMIN verwalten jede Datei (über die File-Manager-Endpunkte) und laden ohne Grenze hoch,</li>
 * <li>weich löschen nur der Autor und ADMIN (Nutzer 2026-11-09), der FILE_MANAGER nicht,</li>
 * <li>endgültig löschen nur ADMIN (Admin-Endpunkt, geprüft über den Pfad).</li>
 * </ul>
 */
@Service
public class FileDocumentAccessService {

	private final CurrentUsersProvider currentUsersProvider;

	private final FileConfig fileConfig;

	public FileDocumentAccessService(CurrentUsersProvider currentUsersProvider, FileConfig fileConfig) {
		this.currentUsersProvider = currentUsersProvider;
		this.fileConfig = fileConfig;
	}

	/** READ: Ist der angemeldete User ADMIN oder FILE_MANAGER? Dann verwaltet er jede Datei und lädt ohne Grenze hoch. */
	public boolean isCurrentUsersFileManagerOrAdmin() {
		String adminAccessRoleKey = fileConfig.adminAccessRoleKey();
		String fileManagerAccessRoleKey = fileConfig.fileManagerAccessRoleKey();
		boolean currentUsersIsAdmin = currentUsersProvider.currentUsersHasAccessRole(adminAccessRoleKey);
		boolean currentUsersIsFileManager = currentUsersProvider.currentUsersHasAccessRole(fileManagerAccessRoleKey);
		return currentUsersIsAdmin || currentUsersIsFileManager;
	}

	/** READ: Ist der angemeldete User ADMIN? */
	public boolean isCurrentUsersAdmin() {
		String adminAccessRoleKey = fileConfig.adminAccessRoleKey();
		return currentUsersProvider.currentUsersHasAccessRole(adminAccessRoleKey);
	}

	/** READ: Ist es die eigene Datei des angemeldeten Users, und hat er eine ihrer Schreibrollen? */
	public boolean isCurrentUsersOwnFileWithWriterRole(FileDocumentBackendFacts fileDocumentBackendFacts) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		String currentUsersGuidText = currentUsersGuid.toString();
		String authorUsersGuid = fileDocumentBackendFacts.authorUsersGuid();
		boolean ownFile = currentUsersGuidText.equals(authorUsersGuid);
		if (!ownFile) {
			return false;
		}
		List<String> writerAccessRoleKeys = fileDocumentBackendFacts.writerAccessRoleKeys();
		for (String writerAccessRoleKey : writerAccessRoleKeys) {
			if (currentUsersProvider.currentUsersHasAccessRole(writerAccessRoleKey)) {
				return true;
			}
		}
		return false;
	}

	/** READ: Hat der Autor den angemeldeten User zum Bearbeiten der Metadaten freigegeben? */
	public boolean isCurrentUsersEditor(FileDocumentBackendFacts fileDocumentBackendFacts) {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		String currentUsersGuidText = currentUsersGuid.toString();
		List<String> editorUsersGuids = fileDocumentBackendFacts.editorUsersGuids();
		return editorUsersGuids.contains(currentUsersGuidText);
	}

	/**
	 * READ: Darf der angemeldete User die Metadaten bearbeiten, auf irgendeinem Weg? Autor mit Schreibrolle (Exklusivrecht,
	 * andere mit derselben Rolle nicht), ein freigegebener Bearbeiter, ADMIN oder FILE_MANAGER. Für die Anzeige.
	 */
	public boolean isChangeableByCurrentUsers(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean manageable = isManageableByCurrentUsers(fileDocumentBackendFacts);
		if (manageable) {
			return true;
		}
		return isCurrentUsersEditor(fileDocumentBackendFacts);
	}

	/**
	 * READ: Darf der angemeldete User über die Datei bestimmen (Sichtbarkeit, Bearbeiter freigeben, löschen)? Autor mit
	 * Schreibrolle, ADMIN oder FILE_MANAGER; ein Bearbeiter nicht. Für die Anzeige.
	 */
	public boolean isManageableByCurrentUsers(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean fileManagerOrAdmin = isCurrentUsersFileManagerOrAdmin();
		if (fileManagerOrAdmin) {
			return true;
		}
		return isCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
	}

	/**
	 * READ: Darf der angemeldete User die Datei weich löschen? Autor mit Schreibrolle oder ADMIN (Nutzer 2026-11-09),
	 * weder ein Bearbeiter noch der FILE_MANAGER. Für die Anzeige.
	 */
	public boolean isDeletableByCurrentUsers(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean currentUsersIsAdmin = isCurrentUsersAdmin();
		if (currentUsersIsAdmin) {
			return true;
		}
		return isCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
	}

	/**
	 * Prüft den User-Weg zum Bearbeiten der Metadaten: eigene Datei mit Schreibrolle oder freigegebener Bearbeiter.
	 *
	 * @throws FileAccessDeniedException wenn nicht
	 */
	public void requireCurrentUsersMetadataEditor(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean ownFileWithWriterRole = isCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
		boolean editor = isCurrentUsersEditor(fileDocumentBackendFacts);
		if (!ownFileWithWriterRole && !editor) {
			throw new FileAccessDeniedException("Bearbeiten darfst du nur eigene Dateien oder solche, die dir freigegeben sind.");
		}
	}

	/**
	 * Prüft den User-Weg: eigene Datei mit Schreibrolle.
	 *
	 * @throws FileAccessDeniedException wenn nicht
	 */
	public void requireCurrentUsersOwnFileWithWriterRole(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean ownFileWithWriterRole = isCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
		if (!ownFileWithWriterRole) {
			throw new FileAccessDeniedException("Ändern und Löschen darfst du nur eigene Dateien.");
		}
	}

	/**
	 * Prüft den File-Manager-Weg. Der Pfad ist schon in Spring Security auf ADMIN und FILE_MANAGER beschränkt; das hier
	 * prüft es im Service noch einmal, falls ihn je ein anderer Weg aufruft.
	 *
	 * @throws FileAccessDeniedException wenn der User weder ADMIN noch FILE_MANAGER ist
	 */
	public void requireCurrentUsersFileManagerOrAdmin() {
		boolean fileManagerOrAdmin = isCurrentUsersFileManagerOrAdmin();
		if (!fileManagerOrAdmin) {
			throw new FileAccessDeniedException("Das darf nur der File-Manager.");
		}
	}

	/**
	 * Prüft den Admin-Weg. Der Pfad ist schon in Spring Security auf ADMIN beschränkt; das hier prüft es im Service noch
	 * einmal, falls ihn je ein anderer Weg aufruft.
	 *
	 * @throws FileAccessDeniedException wenn der User nicht ADMIN ist
	 */
	public void requireCurrentUsersAdmin() {
		boolean currentUsersIsAdmin = isCurrentUsersAdmin();
		if (!currentUsersIsAdmin) {
			throw new FileAccessDeniedException("Das darf nur der Admin.");
		}
	}
}
