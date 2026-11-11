package de.gebiter.file.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileAccessDeniedException;
import de.gebiter.file.FileConfig;
import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.file.dto.FileDocumentFinallyDeletedEvent;
import de.gebiter.file.dto.FileDocumentSoftDeletedEvent;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.status.model.Visibility;
import de.gebiter.sftp.service.SftpService;
import de.gebiter.solr.service.SolrDocumentFieldService;
import de.gebiter.solr.service.SolrDocumentService;
import de.gebiter.users.service.UsersService;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Schreiben im Solr-Kern der Dateien, je Vorgang eine Methode. Ein vorhandenes Dokument wird nie voll neu geschrieben, nur
 * per Atomic Update die genannten Felder. Genau vier Dinge schreiben nach Solr: Anlegen beim Upload, das Ergebnis der
 * Auswertung im Hintergrund, Ändern der Metadaten (samt weich Löschen über den Status) und das endgültige Löschen durch
 * den Admin.
 * <p>
 * Ändern und weich löschen gibt es zweimal: die eigene Datei (User-Endpunkt: eigene Datei mit Schreibrolle) und jede
 * Datei (File-Manager-Endpunkt, ADMIN oder FILE_MANAGER).
 */
@Service
public class FileDocumentWriteService {

	private static final Logger LOGGER = LoggerFactory.getLogger(FileDocumentWriteService.class);

	private final SolrDocumentService solrDocumentService;

	private final SolrDocumentFieldService solrDocumentFieldService;

	private final FileDocumentResolveService fileDocumentResolveService;

	private final FileDocumentAccessService fileDocumentAccessService;

	private final SftpService sftpService;

	private final FileStagingService fileStagingService;

	private final CurrentUsersProvider currentUsersProvider;

	private final FileConfig fileConfig;

	private final FileSolrFieldNames fileSolrFieldNames;

	/** Prüft, ob es einen freigegebenen Bearbeiter als User gibt. */
	private final UsersService usersService;

	/** So viele Bearbeiter je Datei ({@code gebiter.file.editor-users-max-count}). */
	private final int editorUsersMaxCount;

	/** Meldet das weiche Löschen einer Datei ({@link FileDocumentSoftDeletedEvent}). */
	private final ApplicationEventPublisher applicationEventPublisher;

	public FileDocumentWriteService(SolrDocumentService solrDocumentService,
			SolrDocumentFieldService solrDocumentFieldService, FileDocumentResolveService fileDocumentResolveService,
			FileDocumentAccessService fileDocumentAccessService, SftpService sftpService,
			FileStagingService fileStagingService, CurrentUsersProvider currentUsersProvider, FileConfig fileConfig,
			FileSolrFieldNames fileSolrFieldNames, UsersService usersService,
			ApplicationEventPublisher applicationEventPublisher,
			@Value("${gebiter.file.editor-users-max-count}") int editorUsersMaxCount) {
		this.applicationEventPublisher = applicationEventPublisher;
		this.solrDocumentService = solrDocumentService;
		this.solrDocumentFieldService = solrDocumentFieldService;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.fileDocumentAccessService = fileDocumentAccessService;
		this.sftpService = sftpService;
		this.fileStagingService = fileStagingService;
		this.currentUsersProvider = currentUsersProvider;
		this.fileConfig = fileConfig;
		this.fileSolrFieldNames = fileSolrFieldNames;
		this.usersService = usersService;
		this.editorUsersMaxCount = editorUsersMaxCount;
	}

	/**
	 * CREATE: Legt das Dokument einer hochgeladenen Datei an, nur wenn es seine id noch nicht gibt. Die Prüfungen (Rechte,
	 * Endung, Grenze) hat der Upload vorher gemacht; hier wird nur geschrieben.
	 *
	 * @throws org.springframework.dao.DuplicateKeyException wenn es die id schon gibt
	 */
	public void createFileDocumentFromUpload(Map<String, Object> fileDocumentFieldValues) {
		String solrCoreKey = fileConfig.solrCoreKey();
		solrDocumentService.createSolrDocument(solrCoreKey, fileDocumentFieldValues);
	}

	/**
	 * UPDATE: Schreibt das Ergebnis der Auswertung (Tika, Texterkennung, EXIF, Vorschau, Stand der Auswertung) ins Dokument.
	 * Ein Vorgang des Backends ohne User, aufgerufen nur vom {@link FileAnalysisService}, über keinen Endpunkt erreichbar.
	 * Setzt kein {@code lastChangedAt}: Die Auswertung ist keine Änderung durch einen Menschen.
	 *
	 * @throws EntityNotFoundException wenn es das Dokument inzwischen nicht mehr gibt
	 */
	public void completeFileDocumentAnalysis(String id, Map<String, Object> analysisValuesByFieldName) {
		String solrCoreKey = fileConfig.solrCoreKey();
		String idFieldName = fileSolrFieldNames.id();
		solrDocumentService.setSolrDocumentFieldValues(solrCoreKey, id, idFieldName, analysisValuesByFieldName);
	}

	/**
	 * UPDATE (Backend): Setzt Felder, die nur das Backend schreibt, z. B. Galerie, Sichtbarkeit und Platz einer Datei,
	 * wenn ihre Galerie sich ändert oder sortiert wird. Ohne Rechteprüfung: Die macht der Aufrufer (der
	 * {@code GalleryService}, nur für den Besitzer). Über keinen Endpunkt direkt erreichbar. {@code null} nimmt ein Feld
	 * heraus.
	 *
	 * @throws EntityNotFoundException wenn es das Dokument nicht gibt
	 */
	public void changeFileDocumentBackendFieldValues(String id, Map<String, Object> backendFieldValues) {
		String solrCoreKey = fileConfig.solrCoreKey();
		String idFieldName = fileSolrFieldNames.id();
		solrDocumentService.setSolrDocumentFieldValues(solrCoreKey, id, idFieldName, backendFieldValues);
	}

	/**
	 * UPDATE (Backend): Wie {@link #changeFileDocumentBackendFieldValues}, aber für mehrere Dateien in einem Rutsch (eine
	 * Anfrage an Solr, ein Commit), z. B. die Plätze der Bilder einer Galerie. Ohne Rechteprüfung: Die macht der Aufrufer.
	 * Über keinen Endpunkt direkt erreichbar. Ohne Dateien geschieht nichts.
	 *
	 * @param backendFieldValuesById je id der Datei die Felder, die in ihr gesetzt werden
	 * @throws EntityNotFoundException wenn es eines der Dokumente nicht gibt
	 */
	public void changeBackendFieldValuesOfFileDocuments(Map<String, Map<String, Object>> backendFieldValuesById) {
		String solrCoreKey = fileConfig.solrCoreKey();
		String idFieldName = fileSolrFieldNames.id();
		solrDocumentService.setFieldValuesOfSolrDocuments(solrCoreKey, idFieldName, backendFieldValuesById);
	}

	/**
	 * UPDATE: Ändert die Metadaten der EIGENEN Datei (eigene Datei mit Schreibrolle). Nur die genannten Felder, die der Client
	 * ändern darf; ein leerer Wert nimmt das Feld heraus. Liefert das Dokument, wie der User es danach lesen darf.
	 *
	 * @throws EntityNotFoundException wenn es keine aktive Datei mit dieser id gibt
	 * @throws de.gebiter.file.FileAccessDeniedException wenn es nicht seine Datei ist oder ihm die Schreibrolle fehlt
	 */
	public Map<String, Object> changeOwnFileDocument(String id, Map<String, Object> rawClientFieldValues) {
		FileDocumentBackendFacts fileDocumentBackendFacts = requireActiveFileDocument(id);
		fileDocumentAccessService.requireCurrentUsersMetadataEditor(fileDocumentBackendFacts);
		doChangeFileDocument(id, rawClientFieldValues);
		return fileDocumentResolveService.resolveFileDocumentById(id);
	}

	/**
	 * UPDATE: Ändert die Metadaten JEDER aktiven Datei, für den File-Manager. Sonst wie {@link #changeOwnFileDocument}.
	 *
	 * @throws EntityNotFoundException wenn es keine aktive Datei mit dieser id gibt
	 */
	@PreAuthorize("hasAnyRole('ADMIN', 'FILE_MANAGER')")
	public Map<String, Object> changeFileDocument(String id, Map<String, Object> rawClientFieldValues) {
		fileDocumentAccessService.requireCurrentUsersFileManagerOrAdmin();
		requireActiveFileDocument(id);
		doChangeFileDocument(id, rawClientFieldValues);
		return fileDocumentResolveService.resolveFileDocumentById(id);
	}

	/**
	 * UPDATE: Ändert die Sichtbarkeit der EIGENEN Datei (eigene Datei mit Schreibrolle), z. B. auf der Seite der Datei.
	 * Liefert das Dokument, wie der User es danach lesen darf. Liegt die Datei in einer Galerie, setzt eine spätere
	 * Änderung der Sichtbarkeit der Galerie sie wieder auf deren Wert.
	 *
	 * @throws IllegalArgumentException wenn die Sichtbarkeit fehlt
	 * @throws EntityNotFoundException wenn es keine aktive Datei mit dieser id gibt
	 * @throws de.gebiter.file.FileAccessDeniedException wenn es nicht seine Datei ist oder ihm die Schreibrolle fehlt
	 */
	public Map<String, Object> changeOwnFileDocumentVisibility(String id, Visibility visibility) {
		Helper.requireNotNull(visibility, "visibility");
		FileDocumentBackendFacts fileDocumentBackendFacts = requireActiveFileDocument(id);
		fileDocumentAccessService.requireCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
		doChangeFileDocumentVisibility(id, fileDocumentBackendFacts, visibility);
		return fileDocumentResolveService.resolveFileDocumentById(id);
	}

	/**
	 * UPDATE: Ändert die Sichtbarkeit JEDER aktiven Datei, für den File-Manager. Sonst wie
	 * {@link #changeOwnFileDocumentVisibility}.
	 */
	@PreAuthorize("hasAnyRole('ADMIN', 'FILE_MANAGER')")
	public Map<String, Object> changeFileDocumentVisibility(String id, Visibility visibility) {
		Helper.requireNotNull(visibility, "visibility");
		fileDocumentAccessService.requireCurrentUsersFileManagerOrAdmin();
		FileDocumentBackendFacts fileDocumentBackendFacts = requireActiveFileDocument(id);
		doChangeFileDocumentVisibility(id, fileDocumentBackendFacts, visibility);
		return fileDocumentResolveService.resolveFileDocumentById(id);
	}

	/**
	 * Die Felder der Sichtbarkeit einer Datei, für eine einzelne Datei und alle Bilder einer Galerie gleich:
	 * {@code visibility} und bei FRIENDS die GUID des Besitzers ({@code readableForFriendsOfUsersGuid}, gegen die
	 * Freundesliste des Lesers), sonst leer.
	 */
	public Map<String, Object> createVisibilityFieldValues(Visibility visibility, UUID ownerUsersGuid) {
		String visibilityFieldName = fileSolrFieldNames.visibility();
		String readableForFriendsFieldName = fileSolrFieldNames.readableForFriendsOfUsersGuid();
		Map<String, Object> visibilityFieldValues = new LinkedHashMap<>();
		visibilityFieldValues.put(visibilityFieldName, visibility.name());
		String readableForFriendsOfUsersGuid = null;
		if (visibility == Visibility.FRIENDS) {
			readableForFriendsOfUsersGuid = ownerUsersGuid.toString();
		}
		visibilityFieldValues.put(readableForFriendsFieldName, readableForFriendsOfUsersGuid);
		return visibilityFieldValues;
	}

	/**
	 * DELETE (weich): Setzt die EIGENE Datei auf DELETED. Danach findet sie kein User mehr, die Bytes bleiben; endgültig
	 * löscht nur der Admin.
	 */
	public void deleteOwnFileDocument(String id) {
		FileDocumentBackendFacts fileDocumentBackendFacts = requireActiveFileDocument(id);
		fileDocumentAccessService.requireCurrentUsersOwnFileWithWriterRole(fileDocumentBackendFacts);
		doSoftDeleteFileDocument(id, fileDocumentBackendFacts);
	}

	/**
	 * DELETE (weich): Setzt JEDE aktive Datei auf DELETED, nur für den Admin (Nutzer 2026-11-09: weich löschen Autor und
	 * Admin, der File-Manager nicht).
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public void deleteFileDocument(String id) {
		fileDocumentAccessService.requireCurrentUsersAdmin();
		FileDocumentBackendFacts fileDocumentBackendFacts = requireActiveFileDocument(id);
		doSoftDeleteFileDocument(id, fileDocumentBackendFacts);
	}

	/**
	 * DELETE (endgültig), nur ADMIN und nur für eine weich gelöschte Datei: erst das Dokument aus Solr, dann die Bytes aus
	 * dem Upload-Puffer (falls sie noch dort liegen) und vom SFTP. Scheitert der SFTP danach, bleibt nur Platz belegt, nie
	 * ein Dokument ohne Datei. Ist der Hintergrund-Thread gerade beim Übertragen, räumt er den SFTP danach selbst auf.
	 * Zuletzt die Meldung {@link FileDocumentFinallyDeletedEvent}: Der {@code FileCheerService} löscht daraufhin die
	 * Stimmen der Datei.
	 *
	 * @throws EntityNotFoundException wenn es keine weich gelöschte Datei mit dieser id gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	public void deleteFileDocumentFinally(String id) {
		String sha256Hex = Helper.requireSha256Hex(id);
		String deletedStatus = fileConfig.statusDeleted();
		FileDocumentBackendFacts fileDocumentBackendFacts = fileDocumentResolveService
				.resolveFileDocumentBackendFactsByStatus(sha256Hex, deletedStatus);
		if (fileDocumentBackendFacts == null) {
			throw new EntityNotFoundException("Endgültig löschen geht nur bei einer weich gelöschten Datei.");
		}
		String solrCoreKey = fileConfig.solrCoreKey();
		solrDocumentService.deleteSolrDocument(solrCoreKey, sha256Hex);
		fileStagingService.deleteStagedFile(sha256Hex);
		String sftpPath = fileDocumentBackendFacts.sftpPath();
		sftpService.deleteFileData(sftpPath);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		LOGGER.info("Datei {} endgültig gelöscht von {}", sha256Hex, currentUsersGuid);
		// zuletzt die Meldung: Was in Postgres an der Datei hängt (ihre Stimmen), räumt der zuständige Service selbst weg
		FileDocumentFinallyDeletedEvent finallyDeletedEvent = new FileDocumentFinallyDeletedEvent(sha256Hex);
		applicationEventPublisher.publishEvent(finallyDeletedEvent);
	}

	/** Die Fakten einer aktiven Datei; ohne aktive Datei 404 („gibt es nicht“). */
	private FileDocumentBackendFacts requireActiveFileDocument(String id) {
		String sha256Hex = Helper.requireSha256Hex(id);
		String activeStatus = fileConfig.statusActive();
		FileDocumentBackendFacts fileDocumentBackendFacts = fileDocumentResolveService
				.resolveFileDocumentBackendFactsByStatus(sha256Hex, activeStatus);
		if (fileDocumentBackendFacts == null) {
			throw new EntityNotFoundException("Die Datei gibt es nicht.");
		}
		return fileDocumentBackendFacts;
	}

	/**
	 * Der Kern des Änderns: von den genannten Feldern nur die mit „vom Client“; ihr geprüfter Wert, leer heißt „heraus“.
	 * Dazu immer {@code lastChangedAt}. Ohne änderbares Feld wird nichts geschrieben. Die FileClass ist hier nie
	 * änderbar: Aus ihr kommen die Rollenlisten, ein Wechsel ist ein eigener Vorgang.
	 */
	private void doChangeFileDocument(String id, Map<String, Object> rawClientFieldValues) {
		String solrCoreKey = fileConfig.solrCoreKey();
		Set<String> clientValueAcceptedFieldNames = solrDocumentFieldService
				.getClientValueAcceptedSolrFieldNames(solrCoreKey);
		Set<String> changeableFieldNames = new HashSet<>(clientValueAcceptedFieldNames);
		String fileClassKeyFieldName = fileSolrFieldNames.fileClassKey();
		changeableFieldNames.remove(fileClassKeyFieldName);
		Map<String, Object> rawConvertedFieldValues = solrDocumentFieldService.convertClientFieldValues(solrCoreKey,
				rawClientFieldValues);
		Map<String, Object> convertedFieldValues = prepareClientFieldValues(rawConvertedFieldValues);
		Map<String, Object> newValuesByFieldName = new LinkedHashMap<>();
		for (String rawFieldName : rawClientFieldValues.keySet()) {
			boolean changeable = changeableFieldNames.contains(rawFieldName);
			if (!changeable) {
				continue;
			}
			Object convertedFieldValue = convertedFieldValues.get(rawFieldName);
			newValuesByFieldName.put(rawFieldName, convertedFieldValue);
		}
		if (newValuesByFieldName.isEmpty()) {
			return;
		}
		doSetFileDocumentFieldValues(id, newValuesByFieldName);
	}

	/**
	 * Die geprüften Werte des Clients, bereit fürs Dokument, beim Hochladen und Bearbeiten gleich: Referenz-Felder (z. B.
	 * {@code wtf}) setzen nur FILE_MANAGER und ADMIN (Nutzer 2026-11-09: damit kann man viel Unsinn machen), Tags
	 * einheitlich ({@link #normalizeTagFieldValues}).
	 *
	 * @throws FileAccessDeniedException wenn ein anderer User ein Referenz-Feld setzen will
	 */
	public Map<String, Object> prepareClientFieldValues(Map<String, Object> convertedFieldValues) {
		boolean fileManagerOrAdmin = fileDocumentAccessService.isCurrentUsersFileManagerOrAdmin();
		if (!fileManagerOrAdmin) {
			String solrCoreKey = fileConfig.solrCoreKey();
			Set<String> solrReferenceFieldNames = solrDocumentFieldService.getSolrReferenceFieldNames(solrCoreKey);
			for (String fieldName : convertedFieldValues.keySet()) {
				boolean referenceField = solrReferenceFieldNames.contains(fieldName);
				if (referenceField) {
					throw new FileAccessDeniedException("Das Feld " + fieldName + " setzen nur File-Manager und Admin.");
				}
			}
		}
		return normalizeTagFieldValues(convertedFieldValues);
	}

	/**
	 * UPDATE: Wer außer dem Autor die Metadaten bearbeiten darf (Nutzer 2026-11-09): die GUIDs, die der Autor freigibt,
	 * höchstens {@code gebiter.file.editor-users-max-count}; diese User dürfen die Datei auch lesen. Bestimmen darf das der
	 * Autor mit Schreibrolle, ADMIN oder FILE_MANAGER. Der Autor selbst und Doppelte fallen heraus, jede GUID muss ein
	 * vorhandener User sein. Eine leere Liste nimmt alle Freigaben zurück. Liefert das Dokument, wie der User es danach
	 * lesen darf.
	 *
	 * @throws IllegalArgumentException wenn die Liste fehlt, zu lang ist oder eine GUID kein vorhandener User ist
	 * @throws EntityNotFoundException wenn es keine aktive Datei mit dieser id gibt
	 * @throws de.gebiter.file.FileAccessDeniedException wenn der User nicht über die Datei bestimmen darf
	 */
	public Map<String, Object> changeFileDocumentEditors(String id, List<UUID> editorUsersGuids) {
		Helper.requireNotNull(editorUsersGuids, "editorUsersGuids");
		if (editorUsersGuids.size() > editorUsersMaxCount) {
			throw new IllegalArgumentException("Höchstens " + editorUsersMaxCount + " Bearbeiter je Datei.");
		}
		FileDocumentBackendFacts fileDocumentBackendFacts = requireActiveFileDocument(id);
		boolean manageable = fileDocumentAccessService.isManageableByCurrentUsers(fileDocumentBackendFacts);
		if (!manageable) {
			throw new FileAccessDeniedException("Bearbeiter freigeben darf nur der Autor der Datei.");
		}
		String authorUsersGuid = fileDocumentBackendFacts.authorUsersGuid();
		Set<String> checkedEditorUsersGuids = new LinkedHashSet<>();
		for (UUID editorUsersGuid : editorUsersGuids) {
			Helper.requireNotNull(editorUsersGuid, "editorUsersGuid");
			boolean usersExists = usersService.existsUsers(editorUsersGuid);
			boolean usersDeleted = usersExists && usersService.isUsersDeleted(editorUsersGuid);
			if (!usersExists || usersDeleted) {
				throw new IllegalArgumentException("Den User " + editorUsersGuid + " gibt es nicht.");
			}
			String editorUsersGuidText = editorUsersGuid.toString();
			if (!editorUsersGuidText.equals(authorUsersGuid)) {
				checkedEditorUsersGuids.add(editorUsersGuidText);
			}
		}
		String editorUsersGuidsFieldName = fileSolrFieldNames.editorUsersGuids();
		Map<String, Object> editorFieldValues = new LinkedHashMap<>();
		if (checkedEditorUsersGuids.isEmpty()) {
			editorFieldValues.put(editorUsersGuidsFieldName, null);
		} else {
			List<String> editorUsersGuidList = new ArrayList<>(checkedEditorUsersGuids);
			editorFieldValues.put(editorUsersGuidsFieldName, editorUsersGuidList);
		}
		doSetFileDocumentFieldValues(id, editorFieldValues);
		return fileDocumentResolveService.resolveFileDocumentById(id);
	}

	/**
	 * Die geprüften Werte des Clients mit einheitlichen Tags ({@link Helper#normalizeTag}): ohne führende Raute, leere
	 * fallen weg, doppelte auch. Für Upload und Ändern gleich. Sind danach keine Tags übrig, ist das Feld leer
	 * ({@code null}, das Atomic Update nimmt es heraus).
	 */
	public Map<String, Object> normalizeTagFieldValues(Map<String, Object> convertedFieldValues) {
		String tagsFieldName = fileSolrFieldNames.tags();
		boolean hasTags = convertedFieldValues.containsKey(tagsFieldName);
		if (!hasTags) {
			return convertedFieldValues;
		}
		Map<String, Object> normalizedFieldValues = new LinkedHashMap<>(convertedFieldValues);
		Object rawTags = convertedFieldValues.get(tagsFieldName);
		List<Object> tagValues = new ArrayList<>();
		if (rawTags instanceof Collection<?> rawTagCollection) {
			tagValues.addAll(rawTagCollection);
		} else if (rawTags != null) {
			tagValues.add(rawTags);
		}
		Set<String> normalizedTags = new LinkedHashSet<>();
		for (Object tagValue : tagValues) {
			String tagText = String.valueOf(tagValue);
			String normalizedTag = Helper.normalizeTag(tagText);
			if (!normalizedTag.isEmpty()) {
				normalizedTags.add(normalizedTag);
			}
		}
		if (normalizedTags.isEmpty()) {
			normalizedFieldValues.put(tagsFieldName, null);
		} else {
			List<String> normalizedTagList = new ArrayList<>(normalizedTags);
			normalizedFieldValues.put(tagsFieldName, normalizedTagList);
		}
		return normalizedFieldValues;
	}

	private void doChangeFileDocumentVisibility(String id, FileDocumentBackendFacts fileDocumentBackendFacts,
			Visibility visibility) {
		String authorUsersGuidText = fileDocumentBackendFacts.authorUsersGuid();
		UUID authorUsersGuid = UUID.fromString(authorUsersGuidText);
		Map<String, Object> visibilityFieldValues = createVisibilityFieldValues(visibility, authorUsersGuid);
		doSetFileDocumentFieldValues(id, visibilityFieldValues);
	}

	/**
	 * Der Kern des weichen Löschens: Status DELETED, danach die Meldung {@link FileDocumentSoftDeletedEvent}. Stand die
	 * Datei in einer Galerie, rücken dort die übrigen Bilder auf (das macht der {@code GalleryService}, der die Meldung
	 * hört).
	 */
	private void doSoftDeleteFileDocument(String id, FileDocumentBackendFacts fileDocumentBackendFacts) {
		String statusFieldName = fileSolrFieldNames.status();
		String deletedStatus = fileConfig.statusDeleted();
		Map<String, Object> newValuesByFieldName = new LinkedHashMap<>();
		newValuesByFieldName.put(statusFieldName, deletedStatus);
		doSetFileDocumentFieldValues(id, newValuesByFieldName);
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		LOGGER.info("Datei {} weich gelöscht von {}", id, currentUsersGuid);
		List<Long> galleryIds = fileDocumentBackendFacts.galleryIds();
		FileDocumentSoftDeletedEvent softDeletedEvent = new FileDocumentSoftDeletedEvent(id, galleryIds);
		applicationEventPublisher.publishEvent(softDeletedEvent);
	}

	/** Das Atomic Update selbst, immer mit {@code lastChangedAt} jetzt. */
	private void doSetFileDocumentFieldValues(String id, Map<String, Object> newValuesByFieldName) {
		String lastChangedAtFieldName = fileSolrFieldNames.lastChangedAt();
		Date now = new Date();
		newValuesByFieldName.put(lastChangedAtFieldName, now);
		String solrCoreKey = fileConfig.solrCoreKey();
		String idFieldName = fileSolrFieldNames.id();
		solrDocumentService.setSolrDocumentFieldValues(solrCoreKey, id, idFieldName, newValuesByFieldName);
	}
}
