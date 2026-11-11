package de.gebiter.file.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.params.CommonParams;
import org.apache.solr.common.params.ModifiableSolrParams;
import org.springframework.stereotype.Service;

import de.gebiter.file.FileConfig;
import de.gebiter.file.FileSolrFieldNames;
import de.gebiter.file.dto.FileAnalysisStatusValueSet;
import de.gebiter.file.dto.FileStatusValueSet;
import de.gebiter.file.dto.FileDocumentBackendFacts;
import de.gebiter.file.dto.FileDocumentForClient;
import de.gebiter.file.dto.FileDocumentPage;
import de.gebiter.file.dto.FileSolrFieldNameSet;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.solr.service.SolrDocumentFieldService;
import de.gebiter.solr.service.SolrDocumentService;
import de.gebiter.status.model.Visibility;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Lesen im Solr-Kern der Dateien, nach dem Wording des Konzepts „Auflösen“: exakte Sollwerte, Ergebnis ein Dokument, eine
 * Liste oder nichts. Suchen (Freitext) kommt später in einen eigenen Service.
 * <p>
 * Jede Abfrage für einen User trägt fest die Lesegrenze, die kein Aufrufer weglassen kann
 * ({@link #createReadFilterQueriesForCurrentUsers()}, Konzept {@code docu/konzept-lesezugriff.md}): {@code status} ist
 * ACTIVE; ADMIN und FILE_MANAGER sehen damit jede Datei. Alle anderen brauchen dazu eine Leserolle der FileClass in
 * {@code readerAccessRoleKeys} und einen der Wege Autor, Sichtbarkeit für Angemeldete oder alle, Freund des Autors. Zurück kommen nur die Felder, die er lesen darf. „Gibt es
 * nicht“ und „darfst du nicht“ sehen gleich aus. Ohne Leseprüfung laufen nur der Existenzcheck (ja oder nein), das Zählen
 * für die Grenze und die Fakten fürs Backend vor Ändern und Löschen; die prüfen ihre Rechte selbst.
 */
@Service
public class FileDocumentResolveService {

	private final SolrDocumentService solrDocumentService;

	private final SolrDocumentFieldService solrDocumentFieldService;

	private final CurrentUsersProvider currentUsersProvider;

	private final FileDocumentAccessService fileDocumentAccessService;

	private final FileConfig fileConfig;

	private final FileSolrFieldNames fileSolrFieldNames;

	public FileDocumentResolveService(SolrDocumentService solrDocumentService,
			SolrDocumentFieldService solrDocumentFieldService, CurrentUsersProvider currentUsersProvider,
			FileDocumentAccessService fileDocumentAccessService, FileConfig fileConfig,
			FileSolrFieldNames fileSolrFieldNames) {
		this.solrDocumentService = solrDocumentService;
		this.solrDocumentFieldService = solrDocumentFieldService;
		this.currentUsersProvider = currentUsersProvider;
		this.fileDocumentAccessService = fileDocumentAccessService;
		this.fileConfig = fileConfig;
		this.fileSolrFieldNames = fileSolrFieldNames;
	}

	/** READ: Die Werte des Auswertungs-Stands (Stammdaten des Frontends). */
	public FileAnalysisStatusValueSet getFileAnalysisStatusValueSet() {
		String pendingStatus = fileConfig.analysisStatusPending();
		String doneStatus = fileConfig.analysisStatusDone();
		String failedStatus = fileConfig.analysisStatusFailed();
		return new FileAnalysisStatusValueSet(pendingStatus, doneStatus, failedStatus);
	}

	/** READ: Die Werte des Status einer Datei (Stammdaten des Frontends). */
	public FileStatusValueSet getFileStatusValueSet() {
		String activeStatus = fileConfig.statusActive();
		String deactivatedStatus = fileConfig.statusDeactivated();
		String archivedStatus = fileConfig.statusArchived();
		String deletedStatus = fileConfig.statusDeleted();
		return new FileStatusValueSet(activeStatus, deactivatedStatus, archivedStatus, deletedStatus);
	}

	/** READ: Die Namen der Felder des Kerns, mit denen das Frontend rechnet (Stammdaten). */
	public FileSolrFieldNameSet getFileSolrFieldNameSet() {
		return fileSolrFieldNames.toFileSolrFieldNameSet();
	}

	/**
	 * READ: Die Seite einer Datei: das Dokument, wie der User es lesen darf, und ob er es ändern darf (nur Anzeige, geprüft
	 * wird beim Ändern erneut). Ändern geht nur bei aktiven Dateien; deaktivierte und archivierte sind lesbar, aber
	 * gesperrt.
	 *
	 * @throws EntityNotFoundException wenn es die Datei nicht gibt, sie gelöscht ist oder er sie nicht lesen darf
	 */
	public FileDocumentForClient getFileDocumentForClient(String id) {
		Map<String, Object> readableDocument = resolveFileDocumentById(id);
		if (readableDocument == null) {
			throw new EntityNotFoundException("Die Datei gibt es nicht.");
		}
		String activeStatus = fileConfig.statusActive();
		FileDocumentBackendFacts fileDocumentBackendFacts = resolveFileDocumentBackendFactsByStatus(id, activeStatus);
		boolean changeable = false;
		boolean manageable = false;
		boolean deletable = false;
		if (fileDocumentBackendFacts != null) {
			changeable = fileDocumentAccessService.isChangeableByCurrentUsers(fileDocumentBackendFacts);
			manageable = fileDocumentAccessService.isManageableByCurrentUsers(fileDocumentBackendFacts);
			deletable = fileDocumentAccessService.isDeletableByCurrentUsers(fileDocumentBackendFacts);
		}
		return new FileDocumentForClient(readableDocument, changeable, manageable, deletable);
	}

	/** READ: Gibt es ein Dokument mit dieser id, egal mit welchem Status? Ohne Rechteprüfung, nur ja oder nein. */
	public boolean existsFileDocument(String id) {
		String sha256Hex = Helper.requireSha256Hex(id);
		String idFilterQuery = createIdFilterQuery(sha256Hex);
		List<String> filterQueries = List.of(idFilterQuery);
		String solrCoreKey = fileConfig.solrCoreKey();
		long matchingDocumentCount = solrDocumentService.countSolrDocuments(solrCoreKey, filterQueries);
		return matchingDocumentCount > 0;
	}

	/**
	 * READ: Das Dokument mit dieser id, so wie der angemeldete User es lesen darf. {@code null}, wenn es das Dokument nicht
	 * gibt, es nicht ACTIVE ist oder er es nicht lesen darf.
	 */
	public Map<String, Object> resolveFileDocumentById(String id) {
		String sha256Hex = Helper.requireSha256Hex(id);
		String idFilterQuery = createIdFilterQuery(sha256Hex);
		List<String> conditionFilterQueries = List.of(idFilterQuery);
		String uploadedAtFieldName = fileSolrFieldNames.uploadedAt();
		String newestFirstSort = uploadedAtFieldName + " desc";
		FileDocumentPage foundPage = doResolveReadableFileDocuments(conditionFilterQueries, 0, 1, newestFirstSort);
		List<Map<String, Object>> foundDocuments = foundPage.documents();
		if (foundDocuments.isEmpty()) {
			return null;
		}
		return foundDocuments.get(0);
	}

	/**
	 * READ: Auflösen nach Sollwerten, z. B. alle Dateien einer FileClass: je Feld genau ein Wert, alle Felder müssen passen.
	 * Neueste zuerst, seitenweise ({@code gebiter.file.resolve-page-size}).
	 *
	 * @throws IllegalArgumentException ohne Bedingung, mit negativer Seite oder mit einem Feld, nach dem der User nicht
	 *         auflösen darf (lesbar und indexiert)
	 */
	public FileDocumentPage resolveFileDocuments(Map<String, String> exactValueByFieldName, int page) {
		if (exactValueByFieldName == null || exactValueByFieldName.isEmpty()) {
			throw new IllegalArgumentException("Auflösen braucht mindestens eine Bedingung.");
		}
		if (page < 0) {
			throw new IllegalArgumentException("page darf nicht negativ sein.");
		}
		List<String> currentUsersAccessRoleKeys = currentUsersProvider.currentUsersAccessRoleKeys();
		String solrCoreKey = fileConfig.solrCoreKey();
		Set<String> resolvableFieldNames = solrDocumentFieldService.getResolvableSolrFieldNames(solrCoreKey,
				currentUsersAccessRoleKeys);
		List<String> conditionFilterQueries = new ArrayList<>();
		for (Map.Entry<String, String> exactValueEntry : exactValueByFieldName.entrySet()) {
			String fieldName = exactValueEntry.getKey();
			String exactValue = exactValueEntry.getValue();
			boolean resolvable = resolvableFieldNames.contains(fieldName);
			if (!resolvable) {
				throw new IllegalArgumentException("Nach dem Feld " + fieldName + " lässt sich nicht auflösen.");
			}
			Helper.requireNotBlank(exactValue, fieldName);
			String conditionFilterQuery = createTermFilterQuery(fieldName, exactValue);
			conditionFilterQueries.add(conditionFilterQuery);
		}
		int pageSize = fileConfig.resolvePageSize();
		int start = page * pageSize;
		String uploadedAtFieldName = fileSolrFieldNames.uploadedAt();
		String newestFirstSort = uploadedAtFieldName + " desc";
		return doResolveReadableFileDocuments(conditionFilterQueries, start, pageSize, newestFirstSort);
	}

	/**
	 * READ: Die Dateien einer Galerie, die der User lesen darf (derselbe Lesefilter wie überall), in der Reihenfolge der
	 * Galerie: nach Platz, bei gleichem Platz nach Upload. Seitenweise ab 0.
	 *
	 * @throws IllegalArgumentException ohne Galerie, mit negativer Seite oder Seitengröße unter 1
	 */
	public FileDocumentPage resolveFileDocumentsOfGallery(Long galleryId, int page, int pageSize) {
		Helper.requireNotNull(galleryId, "galleryId");
		if (page < 0 || pageSize < 1) {
			throw new IllegalArgumentException("page darf nicht negativ und pageSize nicht kleiner als 1 sein.");
		}
		String galleryFilterQuery = createGalleryFilterQuery(galleryId);
		List<String> conditionFilterQueries = List.of(galleryFilterQuery);
		String galleryOrderSort = createGalleryOrderSort();
		int start = page * pageSize;
		return doResolveReadableFileDocuments(conditionFilterQueries, start, pageSize, galleryOrderSort);
	}

	/**
	 * READ (Backend): Die ids aller aktiven Dateien einer Galerie in ihrer Reihenfolge, ohne Lesefilter. Für Vorgänge des
	 * Besitzers (Sichtbarkeit übertragen, sortieren, Galerie löschen); die Rechte prüft der Aufrufer.
	 */
	public List<String> resolveActiveFileDocumentIdsOfGallery(Long galleryId) {
		Map<String, Long> listingPositionsByFileDocumentId = resolveActiveFileDocumentListingPositionsOfGallery(
				galleryId);
		Set<String> fileDocumentIds = listingPositionsByFileDocumentId.keySet();
		return new ArrayList<>(fileDocumentIds);
	}

	/**
	 * READ (Backend): Je aktiver Datei einer Galerie ihr gespeicherter Platz ({@code galleryListingPosition}), in der
	 * Reihenfolge der Galerie (nach Platz, bei gleichem Platz nach Upload), ohne Lesefilter. Damit prüft der
	 * {@code GalleryService}, ob die Plätze lückenlos 1 bis n sind. Eine Datei ohne Platz hat den Wert {@code null}. Nur
	 * die ids und der Platz werden gelesen, keine weiteren Felder; die Rechte prüft der Aufrufer.
	 *
	 * @return id der Datei → gespeicherter Platz; die Einträge stehen in der Reihenfolge der Galerie
	 */
	public Map<String, Long> resolveActiveFileDocumentListingPositionsOfGallery(Long galleryId) {
		Helper.requireNotNull(galleryId, "galleryId");
		String galleryFilterQuery = createGalleryFilterQuery(galleryId);
		String statusFieldName = fileSolrFieldNames.status();
		String activeStatus = fileConfig.statusActive();
		String activeFilterQuery = createTermFilterQuery(statusFieldName, activeStatus);
		String idFieldName = fileSolrFieldNames.id();
		String galleryListingPositionFieldName = fileSolrFieldNames.galleryListingPosition();
		String fieldList = idFieldName + "," + galleryListingPositionFieldName;
		String galleryOrderSort = createGalleryOrderSort();
		String solrCoreKey = fileConfig.solrCoreKey();
		int batchSize = fileConfig.resolvePageSize();
		// LinkedHashMap: behält die Reihenfolge, in der Solr die Dateien liefert
		Map<String, Long> listingPositionsByFileDocumentId = new LinkedHashMap<>();
		long foundCount = Long.MAX_VALUE;
		int start = 0;
		while (start < foundCount) {
			ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
			queryParams.add(CommonParams.FQ, galleryFilterQuery);
			queryParams.add(CommonParams.FQ, activeFilterQuery);
			queryParams.set(CommonParams.FL, fieldList);
			queryParams.set(CommonParams.SORT, galleryOrderSort);
			queryParams.set(CommonParams.START, start);
			queryParams.set(CommonParams.ROWS, batchSize);
			SolrDocumentList foundSolrDocuments = solrDocumentService.querySolrDocuments(solrCoreKey, queryParams);
			foundCount = foundSolrDocuments.getNumFound();
			if (foundSolrDocuments.isEmpty()) {
				break;
			}
			for (SolrDocument foundSolrDocument : foundSolrDocuments) {
				String fileDocumentId = readText(foundSolrDocument, idFieldName);
				Long listingPosition = readLong(foundSolrDocument, galleryListingPositionFieldName);
				listingPositionsByFileDocumentId.put(fileDocumentId, listingPosition);
			}
			start = start + foundSolrDocuments.size();
		}
		return listingPositionsByFileDocumentId;
	}

	/**
	 * READ (Backend): Die ids der nicht gelöschten Dateien, deren Auswertung noch offen ist (PENDING), obwohl sie vor
	 * {@code uploadedBefore} hochgeladen wurden; die älteste zuerst, ohne Lesefilter. Für den täglichen Lauf des
	 * {@code FileAnalysisService}, der hängende Auswertungen ein zweites Mal versucht. Beispiel: Der Lauf um 05:00 fragt
	 * nach allem vor 00:00; ein Bild von gestern 14:10, das noch auf PENDING steht, kommt zurück, ein Upload von 03:00
	 * nicht.
	 */
	public List<String> resolvePendingFileDocumentIdsUploadedBefore(Instant uploadedBefore) {
		Helper.requireNotNull(uploadedBefore, "uploadedBefore");
		String analysisStatusFieldName = fileSolrFieldNames.analysisStatus();
		String pendingStatus = fileConfig.analysisStatusPending();
		String pendingFilterQuery = createTermFilterQuery(analysisStatusFieldName, pendingStatus);
		String activeStatus = fileConfig.statusActive();
		String deactivatedStatus = fileConfig.statusDeactivated();
		String archivedStatus = fileConfig.statusArchived();
		String statusFieldName = fileSolrFieldNames.status();
		List<String> notDeletedStatuses = List.of(activeStatus, deactivatedStatus, archivedStatus);
		String notDeletedFilterQuery = createTermsFilterQuery(statusFieldName, notDeletedStatuses);
		// Bereich „bis ausschließlich“: Solr liest den Zeitpunkt als ISO-Text in UTC, auf Sekunden genau reicht
		String uploadedAtFieldName = fileSolrFieldNames.uploadedAt();
		Instant uploadedBeforeSecond = uploadedBefore.truncatedTo(ChronoUnit.SECONDS);
		String uploadedBeforeText = uploadedBeforeSecond.toString();
		String uploadedBeforeFilterQuery = uploadedAtFieldName + ":[* TO " + uploadedBeforeText + "}";
		String idFieldName = fileSolrFieldNames.id();
		String oldestFirstSort = uploadedAtFieldName + " asc";
		String solrCoreKey = fileConfig.solrCoreKey();
		int batchSize = fileConfig.resolvePageSize();
		List<String> pendingFileDocumentIds = new ArrayList<>();
		long foundCount = Long.MAX_VALUE;
		int start = 0;
		while (start < foundCount) {
			ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
			queryParams.add(CommonParams.FQ, pendingFilterQuery);
			queryParams.add(CommonParams.FQ, notDeletedFilterQuery);
			queryParams.add(CommonParams.FQ, uploadedBeforeFilterQuery);
			queryParams.set(CommonParams.FL, idFieldName);
			queryParams.set(CommonParams.SORT, oldestFirstSort);
			queryParams.set(CommonParams.START, start);
			queryParams.set(CommonParams.ROWS, batchSize);
			SolrDocumentList foundSolrDocuments = solrDocumentService.querySolrDocuments(solrCoreKey, queryParams);
			foundCount = foundSolrDocuments.getNumFound();
			if (foundSolrDocuments.isEmpty()) {
				break;
			}
			for (SolrDocument foundSolrDocument : foundSolrDocuments) {
				String pendingFileDocumentId = readText(foundSolrDocument, idFieldName);
				pendingFileDocumentIds.add(pendingFileDocumentId);
			}
			start = start + foundSolrDocuments.size();
		}
		return pendingFileDocumentIds;
	}

	/**
	 * READ: Die Fakten fürs Ausliefern (Viewer, Download), nur wenn der User die Datei lesen darf und sie ACTIVE ist. Sonst
	 * {@code null}: „gibt es nicht“ und „darfst du nicht“ sehen gleich aus.
	 */
	public FileDocumentBackendFacts resolveReadableFileDocumentBackendFacts(String id) {
		String sha256Hex = Helper.requireSha256Hex(id);
		List<String> currentUsersAccessRoleKeys = currentUsersProvider.currentUsersAccessRoleKeys();
		if (currentUsersAccessRoleKeys.isEmpty()) {
			return null;
		}
		String idFilterQuery = createIdFilterQuery(sha256Hex);
		List<String> readFilterQueries = createReadFilterQueriesForCurrentUsers();
		List<String> filterQueries = new ArrayList<>(readFilterQueries);
		filterQueries.add(idFilterQuery);
		return doResolveFileDocumentBackendFacts(filterQueries);
	}

	/**
	 * READ: Die Fakten fürs Ändern und Löschen, ohne Leseprüfung: Wer was darf, prüft der aufrufende Vorgang selbst (eigene
	 * Datei mit Schreibrolle, File-Manager, Admin). {@code null}, wenn es keine Datei mit dieser id und diesem Status gibt.
	 */
	public FileDocumentBackendFacts resolveFileDocumentBackendFactsByStatus(String id, String status) {
		String sha256Hex = Helper.requireSha256Hex(id);
		String idFilterQuery = createIdFilterQuery(sha256Hex);
		String statusFilterQuery = createStatusFilterQuery(status);
		List<String> filterQueries = List.of(idFilterQuery, statusFilterQuery);
		return doResolveFileDocumentBackendFacts(filterQueries);
	}

	/**
	 * READ: Die Fakten einer Datei in jedem Status (aktiv oder weich gelöscht), ohne Leseprüfung. Für den Hintergrund-Thread,
	 * der eine Datei aus dem Upload-Puffer auf den SFTP bringt und auswertet: Er läuft ohne User. {@code null} ohne Datei.
	 */
	public FileDocumentBackendFacts resolveFileDocumentBackendFacts(String id) {
		String sha256Hex = Helper.requireSha256Hex(id);
		String idFilterQuery = createIdFilterQuery(sha256Hex);
		List<String> filterQueries = List.of(idFilterQuery);
		return doResolveFileDocumentBackendFacts(filterQueries);
	}

	/** READ: Wie viele aktive Dateien hat dieser User hochgeladen? Für die Grenze je User, ohne Leseprüfung. */
	public long countActiveFileDocumentsOfAuthor(UUID authorUsersGuid) {
		Helper.requireNotNull(authorUsersGuid, "authorUsersGuid");
		String authorUsersGuidText = authorUsersGuid.toString();
		String authorUsersGuidFieldName = fileSolrFieldNames.authorUsersGuid();
		String authorFilterQuery = createTermFilterQuery(authorUsersGuidFieldName, authorUsersGuidText);
		String activeStatus = fileConfig.statusActive();
		String activeStatusFilterQuery = createStatusFilterQuery(activeStatus);
		List<String> filterQueries = List.of(authorFilterQuery, activeStatusFilterQuery);
		String solrCoreKey = fileConfig.solrCoreKey();
		return solrDocumentService.countSolrDocuments(solrCoreKey, filterQueries);
	}

	/**
	 * Der Kern jedes Lesens für einen User: die Bedingungen des Aufrufers plus fest Leserolle und Status, nur lesbare
	 * Felder, neueste zuerst. Ohne Rollen oder ohne lesbare Felder eine leere Seite.
	 */
	/** Der Filter auf die Dateien einer Galerie. */
	private String createGalleryFilterQuery(Long galleryId) {
		String galleryIdsFieldName = fileSolrFieldNames.galleryIds();
		String galleryIdText = String.valueOf(galleryId);
		return createTermFilterQuery(galleryIdsFieldName, galleryIdText);
	}

	/** Die Reihenfolge einer Galerie: nach Platz, bei gleichem Platz nach Upload. */
	private String createGalleryOrderSort() {
		String galleryListingPositionFieldName = fileSolrFieldNames.galleryListingPosition();
		String uploadedAtFieldName = fileSolrFieldNames.uploadedAt();
		return galleryListingPositionFieldName + " asc," + uploadedAtFieldName + " asc";
	}

	private FileDocumentPage doResolveReadableFileDocuments(List<String> conditionFilterQueries, int start, int rows,
			String sort) {
		int page = 0;
		if (rows > 0) {
			page = start / rows;
		}
		List<String> currentUsersAccessRoleKeys = currentUsersProvider.currentUsersAccessRoleKeys();
		String solrCoreKey = fileConfig.solrCoreKey();
		List<String> readableFieldNames = solrDocumentFieldService.getReadableSolrFieldNames(solrCoreKey,
				currentUsersAccessRoleKeys);
		if (currentUsersAccessRoleKeys.isEmpty() || readableFieldNames.isEmpty()) {
			return new FileDocumentPage(List.of(), 0, page, rows);
		}
		List<String> readFilterQueries = createReadFilterQueriesForCurrentUsers();

		ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
		for (String conditionFilterQuery : conditionFilterQueries) {
			queryParams.add(CommonParams.FQ, conditionFilterQuery);
		}
		for (String readFilterQuery : readFilterQueries) {
			queryParams.add(CommonParams.FQ, readFilterQuery);
		}
		String fieldList = String.join(",", readableFieldNames);
		queryParams.set(CommonParams.FL, fieldList);
		queryParams.set(CommonParams.SORT, sort);
		queryParams.set(CommonParams.START, start);
		queryParams.set(CommonParams.ROWS, rows);

		SolrDocumentList foundSolrDocuments = solrDocumentService.querySolrDocuments(solrCoreKey, queryParams);
		List<Map<String, Object>> clientDocuments = new ArrayList<>();
		for (SolrDocument foundSolrDocument : foundSolrDocuments) {
			Map<String, Object> clientDocument = toClientDocument(foundSolrDocument);
			clientDocuments.add(clientDocument);
		}
		long totalCount = foundSolrDocuments.getNumFound();
		return new FileDocumentPage(clientDocuments, totalCount, page, rows);
	}

	/** Die Fakten fürs Backend aus dem ersten Treffer der Filter, {@code null} ohne Treffer. */
	private FileDocumentBackendFacts doResolveFileDocumentBackendFacts(List<String> filterQueries) {
		String sftpPathFieldName = fileSolrFieldNames.sftpPath();
		String fileNameFieldName = fileSolrFieldNames.fileName();
		String fileExtensionFieldName = fileSolrFieldNames.fileExtension();
		String mimeTypeFieldName = fileSolrFieldNames.mimeType();
		String fileSizeBytesFieldName = fileSolrFieldNames.fileSizeBytes();
		String authorUsersGuidFieldName = fileSolrFieldNames.authorUsersGuid();
		String writerAccessRoleKeysFieldName = fileSolrFieldNames.writerAccessRoleKeys();
		String statusFieldName = fileSolrFieldNames.status();
		String analysisStatusFieldName = fileSolrFieldNames.analysisStatus();
		String editorUsersGuidsFieldName = fileSolrFieldNames.editorUsersGuids();
		String galleryIdsFieldName = fileSolrFieldNames.galleryIds();
		List<String> backendFieldNames = List.of(sftpPathFieldName, fileNameFieldName, fileExtensionFieldName,
				mimeTypeFieldName, fileSizeBytesFieldName, authorUsersGuidFieldName, writerAccessRoleKeysFieldName,
				statusFieldName, analysisStatusFieldName, editorUsersGuidsFieldName, galleryIdsFieldName);

		ModifiableSolrParams queryParams = solrDocumentService.createFilterOnlyQueryParams();
		for (String filterQuery : filterQueries) {
			queryParams.add(CommonParams.FQ, filterQuery);
		}
		String fieldList = String.join(",", backendFieldNames);
		queryParams.set(CommonParams.FL, fieldList);
		queryParams.set(CommonParams.ROWS, 1);
		String solrCoreKey = fileConfig.solrCoreKey();
		SolrDocumentList foundSolrDocuments = solrDocumentService.querySolrDocuments(solrCoreKey, queryParams);
		if (foundSolrDocuments.isEmpty()) {
			return null;
		}
		SolrDocument foundSolrDocument = foundSolrDocuments.get(0);
		String sftpPath = readText(foundSolrDocument, sftpPathFieldName);
		String fileName = readText(foundSolrDocument, fileNameFieldName);
		String fileExtension = readText(foundSolrDocument, fileExtensionFieldName);
		String mimeType = readText(foundSolrDocument, mimeTypeFieldName);
		Object rawFileSizeBytes = foundSolrDocument.getFieldValue(fileSizeBytesFieldName);
		long fileSizeBytes = 0;
		if (rawFileSizeBytes instanceof Number fileSizeBytesNumber) {
			fileSizeBytes = fileSizeBytesNumber.longValue();
		}
		String authorUsersGuid = readText(foundSolrDocument, authorUsersGuidFieldName);
		List<String> writerAccessRoleKeys = readTexts(foundSolrDocument, writerAccessRoleKeysFieldName);
		String status = readText(foundSolrDocument, statusFieldName);
		String analysisStatus = readText(foundSolrDocument, analysisStatusFieldName);
		List<String> editorUsersGuids = readTexts(foundSolrDocument, editorUsersGuidsFieldName);
		List<Long> galleryIds = readLongs(foundSolrDocument, galleryIdsFieldName);
		return new FileDocumentBackendFacts(sftpPath, fileName, fileExtension, mimeType, fileSizeBytes, authorUsersGuid,
				writerAccessRoleKeys, status, analysisStatus, editorUsersGuids, galleryIds);
	}

	private static String readText(SolrDocument solrDocument, String fieldName) {
		Object fieldValue = solrDocument.getFirstValue(fieldName);
		if (fieldValue == null) {
			return null;
		}
		return fieldValue.toString();
	}

	/** Der Wert eines Zahlenfeldes, {@code null}, wenn das Dokument das Feld nicht hat. */
	private static Long readLong(SolrDocument solrDocument, String fieldName) {
		Object fieldValue = solrDocument.getFirstValue(fieldName);
		if (fieldValue instanceof Number numberValue) {
			return numberValue.longValue();
		}
		return null;
	}

	/** Die Werte eines mehrwertigen Zahlenfeldes, leer, wenn das Dokument das Feld nicht hat. */
	private static List<Long> readLongs(SolrDocument solrDocument, String fieldName) {
		Collection<Object> fieldValues = solrDocument.getFieldValues(fieldName);
		List<Long> longValues = new ArrayList<>();
		if (fieldValues == null) {
			return longValues;
		}
		for (Object fieldValue : fieldValues) {
			if (fieldValue instanceof Number numberValue) {
				long longValue = numberValue.longValue();
				longValues.add(longValue);
			}
		}
		return longValues;
	}

	private static List<String> readTexts(SolrDocument solrDocument, String fieldName) {
		Collection<Object> fieldValues = solrDocument.getFieldValues(fieldName);
		List<String> texts = new ArrayList<>();
		if (fieldValues == null) {
			return texts;
		}
		for (Object fieldValue : fieldValues) {
			String text = fieldValue.toString();
			texts.add(text);
		}
		return texts;
	}

	/** Ein Dokument für die Antwort: Zeitpunkte als ISO-Text (UTC), Listen als Listen, alles andere unverändert. */
	private Map<String, Object> toClientDocument(SolrDocument solrDocument) {
		Map<String, Object> clientDocument = new LinkedHashMap<>();
		for (String fieldName : solrDocument.getFieldNames()) {
			Object fieldValue = solrDocument.getFieldValue(fieldName);
			Object clientFieldValue = toClientFieldValue(fieldValue);
			clientDocument.put(fieldName, clientFieldValue);
		}
		return clientDocument;
	}

	private Object toClientFieldValue(Object fieldValue) {
		if (fieldValue instanceof Date dateValue) {
			Instant instantValue = dateValue.toInstant();
			return instantValue.toString();
		}
		if (fieldValue instanceof Collection<?> fieldValues) {
			List<Object> clientFieldValues = new ArrayList<>();
			for (Object singleFieldValue : fieldValues) {
				Object clientSingleFieldValue = toClientFieldValue(singleFieldValue);
				clientFieldValues.add(clientSingleFieldValue);
			}
			return clientFieldValues;
		}
		return fieldValue;
	}

	private String createIdFilterQuery(String sha256Hex) {
		String idFieldName = fileSolrFieldNames.id();
		return createTermFilterQuery(idFieldName, sha256Hex);
	}

	/** Filter „status hat diesen Wert“, z. B. nur aktive Dateien für Vorgänge, die etwas ändern. */
	private String createStatusFilterQuery(String status) {
		String statusFieldName = fileSolrFieldNames.status();
		return createTermFilterQuery(statusFieldName, status);
	}

	/**
	 * Die Lesegrenze des angemeldeten Users, an genau dieser Stelle: Jeder Leseweg für einen User nutzt sie. ADMIN und
	 * FILE_MANAGER sehen jede nicht gelöschte Datei, die Sichtbarkeit gilt für sie nicht. Alle anderen brauchen eine Leserolle der
	 * FileClass (die Obergrenze) und dazu einen der Wege aus {@link #createVisibilityFilterQuery()}. Alles kommt aus Token,
	 * Dokument und Hauptspeicher, ohne Postgres.
	 */
	private List<String> createReadFilterQueriesForCurrentUsers() {
		// Lesen dürfen User alles außer gelöscht (Nutzer 2026-11-09): aktiv, deaktiviert, archiviert
		String activeStatus = fileConfig.statusActive();
		String deactivatedStatus = fileConfig.statusDeactivated();
		String archivedStatus = fileConfig.statusArchived();
		String statusFieldName = fileSolrFieldNames.status();
		List<String> readableStatuses = List.of(activeStatus, deactivatedStatus, archivedStatus);
		String activeStatusFilterQuery = createTermsFilterQuery(statusFieldName, readableStatuses);
		boolean fileManagerOrAdmin = fileDocumentAccessService.isCurrentUsersFileManagerOrAdmin();
		if (fileManagerOrAdmin) {
			return List.of(activeStatusFilterQuery);
		}
		List<String> currentUsersAccessRoleKeys = currentUsersProvider.currentUsersAccessRoleKeys();
		String readerFilterQuery = createReaderFilterQuery(currentUsersAccessRoleKeys);
		String visibilityFilterQuery = createVisibilityFilterQuery();
		return List.of(activeStatusFilterQuery, readerFilterQuery, visibilityFilterQuery);
	}

	/**
	 * Filter „ich bin der Autor ODER die Datei ist für Angemeldete oder alle sichtbar ODER bei FRIENDS steht im Feld
	 * {@code readableForFriendsOfUsersGuid} einer meiner Freunde“, als ein bool-Filter aus term-Teilen. Die Freundesliste
	 * kommt aus dem Hauptspeicher ({@link CurrentUsersProvider#currentUsersFriendUsersGuids()}). Die Teile tragen nur
	 * Feldnamen, GUIDs und Namen aus {@link Visibility}, nie ein Hochkomma: Das Einschließen in Hochkommas ist sicher.
	 */
	private String createVisibilityFilterQuery() {
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		String currentUsersGuidText = currentUsersGuid.toString();
		String authorUsersGuidFieldName = fileSolrFieldNames.authorUsersGuid();
		String authorFilterQuery = createTermFilterQuery(authorUsersGuidFieldName, currentUsersGuidText);
		String visibilityFieldName = fileSolrFieldNames.visibility();
		String authenticatedVisibilityName = Visibility.AUTHENTICATED.name();
		String anyVisibilityName = Visibility.ANY.name();
		List<String> visibleForAuthenticatedNames = List.of(authenticatedVisibilityName, anyVisibilityName);
		String openVisibilityFilterQuery = createTermsFilterQuery(visibilityFieldName, visibleForAuthenticatedNames);
		// Wen der Autor zum Bearbeiten freigegeben hat, der darf die Datei auch lesen
		String editorUsersGuidsFieldName = fileSolrFieldNames.editorUsersGuids();
		String editorFilterQuery = createTermFilterQuery(editorUsersGuidsFieldName, currentUsersGuidText);
		List<String> shouldFilterQueries = new ArrayList<>();
		shouldFilterQueries.add(authorFilterQuery);
		shouldFilterQueries.add(openVisibilityFilterQuery);
		shouldFilterQueries.add(editorFilterQuery);
		List<UUID> friendUsersGuids = currentUsersProvider.currentUsersFriendUsersGuids();
		if (!friendUsersGuids.isEmpty()) {
			List<String> friendUsersGuidTexts = new ArrayList<>();
			for (UUID friendUsersGuid : friendUsersGuids) {
				String friendUsersGuidText = friendUsersGuid.toString();
				friendUsersGuidTexts.add(friendUsersGuidText);
			}
			String readableForFriendsFieldName = fileSolrFieldNames.readableForFriendsOfUsersGuid();
			String friendsFilterQuery = createTermsFilterQuery(readableForFriendsFieldName, friendUsersGuidTexts);
			shouldFilterQueries.add(friendsFilterQuery);
		}
		StringBuilder boolFilterQuery = new StringBuilder("{!bool");
		for (String shouldFilterQuery : shouldFilterQueries) {
			boolFilterQuery.append(" should='").append(shouldFilterQuery).append("'");
		}
		boolFilterQuery.append("}");
		return boolFilterQuery.toString();
	}

	/** Filter „readerAccessRoleKeys enthält eine Rolle des Users“. */
	private String createReaderFilterQuery(List<String> currentUsersAccessRoleKeys) {
		String readerAccessRoleKeysFieldName = fileSolrFieldNames.readerAccessRoleKeys();
		return createTermsFilterQuery(readerAccessRoleKeysFieldName, currentUsersAccessRoleKeys);
	}

	/**
	 * Filter „Feld hat genau diesen Wert“ über den term-Parser: Der Wert geht wörtlich hinein, ohne Escaping und ohne dass
	 * er als Abfrage gelesen wird. So kann kein Wert die Filter aushebeln.
	 */
	private static String createTermFilterQuery(String fieldName, String value) {
		return "{!term f=" + fieldName + "}" + value;
	}

	/** Filter „Feld hat einen dieser Werte“ über den terms-Parser. Nur für Werte ohne Komma: Keys, GUIDs, Enum-Namen. */
	private static String createTermsFilterQuery(String fieldName, Collection<String> values) {
		String joinedValues = String.join(",", values);
		return "{!terms f=" + fieldName + "}" + joinedValues;
	}
}
