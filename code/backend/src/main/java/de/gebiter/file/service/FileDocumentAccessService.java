package de.gebiter.file.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import de.gebiter.file.FileAccessDeniedException;
import de.gebiter.file.FileConfig;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.security.CurrentUsersProvider;

/**
 * Wer an einer Datei was darf, an EINER Stelle, alles aus dem Token und dem Hauptspeicher (die eigenen Galerien,
 * {@link CurrentUsersProvider#currentUsersOwnGalleryIds()}), ohne Postgres:
 * <ul>
 * <li>ein User ändert und löscht weich seine eigenen Dateien, und nur mit einer Schreibrolle der Datei,</li>
 * <li>der Besitzer einer Galerie bearbeitet und löscht weich JEDES Bild seiner Galerie, auch das eines anderen
 * Uploaders, ohne Schreibrolle (Nutzer 2026-11-22: „schreibberechtigt ist IMMER der Galeriebesitzer“),</li>
 * <li>liegt ein Bild in einer fremden Galerie, bearbeitet und löscht sein Autor es weiter, bestimmt aber nicht mehr
 * über es (Sichtbarkeit, Bearbeiter freigeben): Die Sichtbarkeit gibt die Galerie vor (Nutzer 2026-11-22),</li>
 * <li>FILE_MANAGER und ADMIN verwalten jede Datei (über die File-Manager-Endpunkte) und laden ohne Grenze hoch,</li>
 * <li>weich löschen nur der Autor, der Besitzer der Galerie und ADMIN (Nutzer 2026-11-09 und 2026-11-22), der
 * FILE_MANAGER nicht,</li>
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

	/**
	 * READ: Liegt die Datei in einer Galerie des angemeldeten Users? Dann bearbeitet und löscht er sie, egal wer sie
	 * hochgeladen hat. Aus dem Hauptspeicher, ohne Postgres.
	 */
	public boolean isFileInCurrentUsersOwnGallery(FileDocumentBackendFacts fileDocumentBackendFacts) {
		List<Long> fileGalleryIds = fileDocumentBackendFacts.galleryIds();
		if (fileGalleryIds.isEmpty()) {
			return false;
		}
		List<Long> currentUsersOwnGalleryIds = currentUsersProvider.currentUsersOwnGalleryIds();
		for (Long fileGalleryId : fileGalleryIds) {
			if (currentUsersOwnGalleryIds.contains(fileGalleryId)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * READ: Liegt die Datei in einer Galerie, die dem angemeldeten User nicht gehört (er hat sie als Uploadberechtigter
	 * dort hochgeladen)? Eine Datei ohne Galerie liegt in keiner fremden.
	 */
	public boolean isFileInForeignGallery(FileDocumentBackendFacts fileDocumentBackendFacts) {
		List<Long> fileGalleryIds = fileDocumentBackendFacts.galleryIds();
		if (fileGalleryIds.isEmpty()) {
			return false;
		}
		boolean inOwnGallery = isFileInCurrentUsersOwnGallery(fileDocumentBackendFacts);
		return !inOwnGallery;
	}

	/**
	 * READ: Bestimmt der angemeldete User als Autor über die Datei (Sichtbarkeit, Bearbeiter freigeben)? Eigene Datei mit
	 * Schreibrolle, und sie liegt nicht in einer fremden Galerie.
	 */
	public boolean isCurrentUsersOwnFileOutsideForeignGallery(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean ownFileWithWriterRole = isCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
		if (!ownFileWithWriterRole) {
			return false;
		}
		boolean inForeignGallery = isFileInForeignGallery(fileDocumentBackendFacts);
		return !inForeignGallery;
	}

	/**
	 * READ: Ist es die eigene Datei des angemeldeten Users (mit Schreibrolle) oder ein Bild in einer seiner Galerien? Dann
	 * darf er sie weich löschen.
	 */
	public boolean isCurrentUsersOwnFileOrOwnGalleryFile(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean ownFileWithWriterRole = isCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
		if (ownFileWithWriterRole) {
			return true;
		}
		return isFileInCurrentUsersOwnGallery(fileDocumentBackendFacts);
	}

	/**
	 * READ: Darf der angemeldete User die Metadaten auf dem User-Weg bearbeiten? Eigene Datei mit Schreibrolle, ein
	 * freigegebener Bearbeiter oder ein Bild in einer seiner Galerien.
	 */
	public boolean isCurrentUsersMetadataEditor(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean ownFileOrOwnGalleryFile = isCurrentUsersOwnFileOrOwnGalleryFile(fileDocumentBackendFacts);
		if (ownFileOrOwnGalleryFile) {
			return true;
		}
		return isCurrentUsersEditor(fileDocumentBackendFacts);
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
	 * andere mit derselben Rolle nicht), ein freigegebener Bearbeiter, der Besitzer der Galerie, in der das Bild liegt,
	 * ADMIN oder FILE_MANAGER. Für die Anzeige.
	 */
	public boolean isChangeableByCurrentUsers(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean fileManagerOrAdmin = isCurrentUsersFileManagerOrAdmin();
		if (fileManagerOrAdmin) {
			return true;
		}
		return isCurrentUsersMetadataEditor(fileDocumentBackendFacts);
	}

	/**
	 * READ: Darf der angemeldete User über die Datei bestimmen (Sichtbarkeit, Bearbeiter freigeben)? Autor mit
	 * Schreibrolle, solange die Datei nicht in einer fremden Galerie liegt, ADMIN oder FILE_MANAGER; ein Bearbeiter nicht.
	 * Für die Anzeige.
	 */
	public boolean isManageableByCurrentUsers(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean fileManagerOrAdmin = isCurrentUsersFileManagerOrAdmin();
		if (fileManagerOrAdmin) {
			return true;
		}
		return isCurrentUsersOwnFileOutsideForeignGallery(fileDocumentBackendFacts);
	}

	/**
	 * READ: Darf der angemeldete User die Datei weich löschen? Autor mit Schreibrolle, der Besitzer der Galerie, in der
	 * das Bild liegt, oder ADMIN (Nutzer 2026-11-09 und 2026-11-22), weder ein Bearbeiter noch der FILE_MANAGER. Für die
	 * Anzeige.
	 */
	public boolean isDeletableByCurrentUsers(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean currentUsersIsAdmin = isCurrentUsersAdmin();
		if (currentUsersIsAdmin) {
			return true;
		}
		return isCurrentUsersOwnFileOrOwnGalleryFile(fileDocumentBackendFacts);
	}

	/**
	 * Prüft den User-Weg zum Bearbeiten der Metadaten: eigene Datei mit Schreibrolle, freigegebener Bearbeiter oder ein
	 * Bild in einer eigenen Galerie.
	 *
	 * @throws FileAccessDeniedException wenn nicht
	 */
	public void requireCurrentUsersMetadataEditor(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean metadataEditor = isCurrentUsersMetadataEditor(fileDocumentBackendFacts);
		if (!metadataEditor) {
			throw new FileAccessDeniedException(
					"Bearbeiten darfst du nur eigene Dateien, solche, die dir freigegeben sind, und die Bilder deiner Galerien.");
		}
	}

	/**
	 * Prüft den User-Weg zum Bestimmen über eine Datei (Sichtbarkeit): eigene Datei mit Schreibrolle, die nicht in einer
	 * fremden Galerie liegt.
	 *
	 * @throws FileAccessDeniedException wenn nicht
	 */
	public void requireCurrentUsersOwnFileOutsideForeignGallery(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean ownFileWithWriterRole = isCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
		if (!ownFileWithWriterRole) {
			throw new FileAccessDeniedException("Die Sichtbarkeit änderst du nur an eigenen Dateien.");
		}
		boolean inForeignGallery = isFileInForeignGallery(fileDocumentBackendFacts);
		if (inForeignGallery) {
			throw new FileAccessDeniedException(
					"Das Bild liegt in einer fremden Galerie: Wer es sieht, gibt die Galerie vor.");
		}
	}

	/**
	 * Prüft den User-Weg zum weichen Löschen: eigene Datei mit Schreibrolle oder ein Bild in einer eigenen Galerie.
	 *
	 * @throws FileAccessDeniedException wenn nicht
	 */
	public void requireCurrentUsersOwnFileOrOwnGalleryFile(FileDocumentBackendFacts fileDocumentBackendFacts) {
		boolean ownFileOrOwnGalleryFile = isCurrentUsersOwnFileOrOwnGalleryFile(fileDocumentBackendFacts);
		if (!ownFileOrOwnGalleryFile) {
			throw new FileAccessDeniedException("Löschen darfst du nur eigene Dateien und die Bilder deiner Galerien.");
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
