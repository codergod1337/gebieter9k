package de.gebiter.file.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.dto.FileAnalysisProgress;
import de.gebiter.file.dto.FileAnalysisProgressResolveRequest;
import de.gebiter.file.dto.FileAnalysisStatusValueSet;
import de.gebiter.file.dto.FileDocumentChangeRequest;
import de.gebiter.file.dto.FileDocumentExistence;
import de.gebiter.file.dto.FileDocumentForClient;
import de.gebiter.file.dto.FileDocumentIdRequest;
import de.gebiter.file.dto.FileDocumentPage;
import de.gebiter.file.dto.FileDocumentEditorsChangeRequest;
import de.gebiter.file.dto.FileDocumentResolveRequest;
import de.gebiter.file.dto.FileDocumentVisibilityChangeRequest;
import de.gebiter.status.model.Visibility;
import de.gebiter.file.dto.FileFieldValueSearchRequest;
import de.gebiter.file.dto.FileFieldValueSuggestion;
import de.gebiter.file.dto.FileSolrFieldNameSet;
import de.gebiter.file.dto.FileStatusValueSet;
import de.gebiter.file.service.FileAnalysisService;
import de.gebiter.file.service.FileDocumentResolveService;
import de.gebiter.file.service.FileDocumentSearchService;
import de.gebiter.file.service.FileDocumentWriteService;
import de.gebiter.file.service.FileDownloadService;
import de.gebiter.file.service.FileUploadService;
import de.gebiter.util.Helper;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Endpunkte der Dateien im File-Kern für jeden angemeldeten User (Pfad {@code /api/**}). Wer was darf, entscheiden die
 * Services aus den Rollen der FileClass, nicht der Pfad. Er nutzt nur Services, nie ein Repository.
 * <p>
 * Hochladen steht bewusst nicht hier (seit 2026-11-11): Ein normaler User lädt nur über ein Ziel hoch, z. B. in seine
 * Galerie ({@code POST /api/gallery/upload}). Den Upload ohne Ziel hat nur der File-Manager
 * ({@link FileDocumentFileManagerController}). Übersicht der Wege: {@code docu/konzept-file-kern.md}, „Upload-Wege“.
 * <p>
 * Doku: {@code docu/entities/SolrField.md}, {@code docu/solr-cores/FILE.md}.
 */
@RestController
@RequestMapping("/api/file-document")
public class FileDocumentController {

	private final FileUploadService fileUploadService;

	private final FileDocumentResolveService fileDocumentResolveService;

	private final FileDocumentWriteService fileDocumentWriteService;

	private final FileDownloadService fileDownloadService;

	private final FileDocumentSearchService fileDocumentSearchService;

	private final FileAnalysisService fileAnalysisService;

	public FileDocumentController(FileUploadService fileUploadService,
			FileDocumentResolveService fileDocumentResolveService, FileDocumentWriteService fileDocumentWriteService,
			FileDownloadService fileDownloadService, FileDocumentSearchService fileDocumentSearchService,
			FileAnalysisService fileAnalysisService) {
		this.fileUploadService = fileUploadService;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.fileDocumentWriteService = fileDocumentWriteService;
		this.fileDownloadService = fileDownloadService;
		this.fileDocumentSearchService = fileDocumentSearchService;
		this.fileAnalysisService = fileAnalysisService;
	}

	/** READ: Die Werte des Auswertungs-Stands (PENDING, DONE, FAILED). Für die Stammdaten. */
	@GetMapping("/analysis-status-value-set")
	public ResponseEntity<FileAnalysisStatusValueSet> getFileAnalysisStatusValueSet() {
		FileAnalysisStatusValueSet fileAnalysisStatusValueSet = fileDocumentResolveService
				.getFileAnalysisStatusValueSet();
		return ResponseEntity.ok(fileAnalysisStatusValueSet);
	}

	/** READ: Die Werte des Status einer Datei (ACTIVE, DELETED). Für die Stammdaten. */
	@GetMapping("/status-value-set")
	public ResponseEntity<FileStatusValueSet> getFileStatusValueSet() {
		FileStatusValueSet fileStatusValueSet = fileDocumentResolveService.getFileStatusValueSet();
		return ResponseEntity.ok(fileStatusValueSet);
	}

	/** READ: Die Namen der Felder des Kerns, mit denen das Frontend rechnet. Für die Stammdaten. */
	@GetMapping("/field-name-set")
	public ResponseEntity<FileSolrFieldNameSet> getFileSolrFieldNameSet() {
		FileSolrFieldNameSet fileSolrFieldNameSet = fileDocumentResolveService.getFileSolrFieldNameSet();
		return ResponseEntity.ok(fileSolrFieldNameSet);
	}

	/**
	 * READ: Gibt es diese Bytes schon? Für die Vorprüfung im Browser vor dem Hochladen. Mit Dokument, wenn der User es lesen
	 * darf. Die Form des Hashes wird zuerst geprüft.
	 */
	@GetMapping("/existence/{sha256Hex}")
	public ResponseEntity<FileDocumentExistence> getFileDocumentExistence(@PathVariable String sha256Hex) {
		Helper.requireSha256Hex(sha256Hex);
		FileDocumentExistence fileDocumentExistence = fileUploadService.getFileDocumentExistence(sha256Hex);
		return ResponseEntity.ok(fileDocumentExistence);
	}

	/** READ: Die Seite einer Datei: das Dokument, wie der User es lesen darf, und ob er es ändern darf. 404 sonst. */
	@GetMapping("/{id}")
	public ResponseEntity<FileDocumentForClient> getFileDocumentForClient(@PathVariable String id) {
		Helper.requireSha256Hex(id);
		FileDocumentForClient fileDocumentForClient = fileDocumentResolveService.getFileDocumentForClient(id);
		return ResponseEntity.ok(fileDocumentForClient);
	}

	/**
	 * READ: Auflösen nach Sollwerten, z. B. alle Dateien einer FileClass, neueste zuerst. Body: {@code {"exactValueByFieldName":
	 * {"fileClassKey": "FOTO_URLAUB"}, "page": 0}}.
	 */
	@PostMapping("/resolve")
	public ResponseEntity<FileDocumentPage> resolveFileDocuments(@RequestBody FileDocumentResolveRequest resolveRequest) {
		Map<String, String> exactValueByFieldName = resolveRequest.exactValueByFieldName();
		int page = resolveRequest.page();
		FileDocumentPage fileDocumentPage = fileDocumentResolveService.resolveFileDocuments(exactValueByFieldName, page);
		return ResponseEntity.ok(fileDocumentPage);
	}

	/**
	 * READ (Suchen): Vorhandene Werte eines Feldes für die Vervollständigung, z. B. Tags beim Tippen, häufigste zuerst. Nur
	 * Werte, nie Dokumente. Body: {@code {"fieldName": "tags", "searchText": "som"}}.
	 */
	@PostMapping("/search-field-values")
	public ResponseEntity<List<FileFieldValueSuggestion>> searchFileFieldValues(
			@RequestBody FileFieldValueSearchRequest searchRequest) {
		String fieldName = searchRequest.fieldName();
		String searchText = searchRequest.searchText();
		List<FileFieldValueSuggestion> suggestions = fileDocumentSearchService.searchFileFieldValues(fieldName,
				searchText);
		return ResponseEntity.ok(suggestions);
	}

	/**
	 * READ (Auflösen): Wie weit die Auswertung dieser Dateien ist (Platz in der Warteschlange, laufender Schritt), für die
	 * Upload-Liste. Body: {@code {"fileDocumentIds": ["<sha256>", …]}}.
	 */
	@PostMapping("/analysis-progress/resolve")
	public ResponseEntity<List<FileAnalysisProgress>> resolveFileAnalysisProgress(
			@RequestBody FileAnalysisProgressResolveRequest resolveRequest) {
		List<String> fileDocumentIds = resolveRequest.fileDocumentIds();
		List<FileAnalysisProgress> fileAnalysisProgresses = fileAnalysisService.resolveFileAnalysisProgress(fileDocumentIds);
		return ResponseEntity.ok(fileAnalysisProgresses);
	}

	/** READ: Die Datei als Download (Anhang). Byte-Bereiche (Range) gehen. 404, wenn es sie nicht gibt oder er sie nicht lesen darf. */
	@GetMapping("/download/{id}")
	public void downloadFileDocument(@PathVariable String id,
			@RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
			HttpServletResponse response) {
		Helper.requireSha256Hex(id);
		fileDownloadService.streamFileDocument(id, true, rangeHeader, response);
	}

	/**
	 * READ: Die Datei für den Viewer: inline nur bei erlaubtem Typ (Bilder, Videos), sonst als Anhang. Byte-Bereiche gehen,
	 * damit Videos vorspulen.
	 */
	@GetMapping("/view/{id}")
	public void viewFileDocument(@PathVariable String id,
			@RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
			HttpServletResponse response) {
		Helper.requireSha256Hex(id);
		fileDownloadService.streamFileDocument(id, false, rangeHeader, response);
	}

	/** UPDATE: Ändert die Metadaten der EIGENEN Datei. Body: {@code {"id": "…", "fieldValuesByFieldName": {…}}}. */
	@PutMapping
	public ResponseEntity<Map<String, Object>> changeOwnFileDocument(
			@RequestBody FileDocumentChangeRequest changeRequest) {
		String id = changeRequest.id();
		Helper.requireSha256Hex(id);
		Map<String, Object> rawClientFieldValues = readFieldValues(changeRequest);
		Map<String, Object> changedDocument = fileDocumentWriteService.changeOwnFileDocument(id, rawClientFieldValues);
		return ResponseEntity.ok(changedDocument);
	}

	/**
	 * UPDATE: Wer außer dem Autor die Metadaten bearbeiten darf (Autor, ADMIN, FILE_MANAGER). Body: {@code {"id": "…",
	 * "editorUsersGuids": ["…"]}}; eine leere Liste nimmt alle Freigaben zurück.
	 */
	@PutMapping("/editors")
	public ResponseEntity<Map<String, Object>> changeFileDocumentEditors(
			@RequestBody FileDocumentEditorsChangeRequest changeRequest) {
		String id = changeRequest.id();
		Helper.requireSha256Hex(id);
		List<UUID> editorUsersGuids = changeRequest.editorUsersGuids();
		Map<String, Object> changedDocument = fileDocumentWriteService.changeFileDocumentEditors(id, editorUsersGuids);
		return ResponseEntity.ok(changedDocument);
	}

	/** UPDATE: Ändert die Sichtbarkeit der EIGENEN Datei. Body: {@code {"id": "…", "visibility": "FRIENDS"}}. */
	@PutMapping("/visibility")
	public ResponseEntity<Map<String, Object>> changeOwnFileDocumentVisibility(
			@RequestBody FileDocumentVisibilityChangeRequest changeRequest) {
		String id = changeRequest.id();
		Helper.requireSha256Hex(id);
		Visibility visibility = changeRequest.visibility();
		Map<String, Object> changedDocument = fileDocumentWriteService.changeOwnFileDocumentVisibility(id, visibility);
		return ResponseEntity.ok(changedDocument);
	}

	/** DELETE (weich): Setzt die EIGENE Datei auf DELETED. Body: {@code {"id": "…"}}. */
	@DeleteMapping
	public ResponseEntity<Void> deleteOwnFileDocument(@RequestBody FileDocumentIdRequest idRequest) {
		String id = idRequest.id();
		Helper.requireSha256Hex(id);
		fileDocumentWriteService.deleteOwnFileDocument(id);
		return ResponseEntity.noContent().build();
	}

	/** Die Feldwerte eines Änderns; fehlen sie, keine. */
	private static Map<String, Object> readFieldValues(FileDocumentChangeRequest changeRequest) {
		Map<String, Object> fieldValuesByFieldName = changeRequest.fieldValuesByFieldName();
		if (fieldValuesByFieldName == null) {
			return Map.of();
		}
		return fieldValuesByFieldName;
	}

}
