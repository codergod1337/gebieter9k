package de.gebiter.file;

import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

import de.gebiter.status.model.Visibility;

/**
 * Die Einstellungen des File-Kerns aus {@code gebiter.file.*} der {@code application.yaml}, an EINER Stelle gelesen. Die
 * Feldnamen des Kerns liest {@link FileSolrFieldNames}.
 */
@Component
public class FileConfig {

	private final String solrCoreKey;

	private final int maxFilesPerUsers;

	private final DataSize uploadMaxFileSize;

	private final DataSize uploadMaxDataSize;

	private final DataSize uploadBufferSize;

	private final Path stagingDirectory;

	private final DataSize stagingMaxSize;

	private final int tikaMaxTextCharacters;

	private final int previewSizePixels;

	private final int previewDecodeMinShortSidePixels;

	private final int resolvePageSize;

	private final List<String> inlineMimeTypes;

	private final String statusActive;

	/** Die Sichtbarkeit einer neuen Datei ({@code gebiter.file.default-visibility}), bis sie in eine Galerie kommt. */
	private final Visibility defaultVisibility;

	private final String statusDeleted;

	private final String statusDeactivated;

	private final String statusArchived;

	private final String analysisStatusPending;

	private final String analysisStatusDone;

	private final String analysisStatusFailed;

	private final Duration analysisPendingScanInterval;

	private final LocalTime analysisRetryTime;

	private final ZoneId analysisRetryTimeZone;

	private final Duration analysisRetryMinAge;

	private final int cheerShownUsersMax;

	private final int cheerUsersPageSize;

	private final String adminAccessRoleKey;

	private final String fileManagerAccessRoleKey;

	public FileConfig(@Value("${gebiter.file.solr-core-key}") String solrCoreKey,
			@Value("${gebiter.file.max-files-per-users}") int maxFilesPerUsers,
			@Value("${gebiter.file.upload-max-file-size}") DataSize uploadMaxFileSize,
			@Value("${gebiter.file.upload-max-data-size}") DataSize uploadMaxDataSize,
			@Value("${gebiter.file.upload-buffer-size}") DataSize uploadBufferSize,
			@Value("${gebiter.file.staging-directory}") Path stagingDirectory,
			@Value("${gebiter.file.staging-max-size}") DataSize stagingMaxSize,
			@Value("${gebiter.file.tika-max-text-characters}") int tikaMaxTextCharacters,
			@Value("${gebiter.file.preview-size-pixels}") int previewSizePixels,
			@Value("${gebiter.file.preview-decode-min-short-side-pixels}") int previewDecodeMinShortSidePixels,
			@Value("${gebiter.file.resolve-page-size}") int resolvePageSize,
			@Value("${gebiter.file.inline-mime-types}") List<String> inlineMimeTypes,
			@Value("${gebiter.file.status-active}") String statusActive,
			@Value("${gebiter.file.default-visibility}") Visibility defaultVisibility,
			@Value("${gebiter.file.status-deleted}") String statusDeleted,
			@Value("${gebiter.file.status-deactivated}") String statusDeactivated,
			@Value("${gebiter.file.status-archived}") String statusArchived,
			@Value("${gebiter.file.analysis-status-pending}") String analysisStatusPending,
			@Value("${gebiter.file.analysis-status-done}") String analysisStatusDone,
			@Value("${gebiter.file.analysis-status-failed}") String analysisStatusFailed,
			@Value("${gebiter.file.analysis-pending-scan-interval}") Duration analysisPendingScanInterval,
			@Value("${gebiter.file.analysis-retry-time}") String analysisRetryTimeText,
			@Value("${gebiter.file.analysis-retry-time-zone}") String analysisRetryTimeZoneText,
			@Value("${gebiter.file.analysis-retry-min-age}") Duration analysisRetryMinAge,
			@Value("${gebiter.file.cheer-shown-users-max}") int cheerShownUsersMax,
			@Value("${gebiter.file.cheer-users-page-size}") int cheerUsersPageSize,
			@Value("${gebiter.accessrole.admin-key}") String adminAccessRoleKey,
			@Value("${gebiter.accessrole.file-manager-key}") String fileManagerAccessRoleKey) {
		this.solrCoreKey = solrCoreKey;
		this.maxFilesPerUsers = maxFilesPerUsers;
		this.uploadMaxFileSize = uploadMaxFileSize;
		this.uploadMaxDataSize = uploadMaxDataSize;
		this.uploadBufferSize = uploadBufferSize;
		this.stagingDirectory = stagingDirectory.toAbsolutePath().normalize();
		this.stagingMaxSize = stagingMaxSize;
		this.tikaMaxTextCharacters = tikaMaxTextCharacters;
		this.previewSizePixels = previewSizePixels;
		this.previewDecodeMinShortSidePixels = previewDecodeMinShortSidePixels;
		this.resolvePageSize = resolvePageSize;
		this.inlineMimeTypes = List.copyOf(inlineMimeTypes);
		this.statusActive = statusActive;
		this.defaultVisibility = defaultVisibility;
		this.statusDeleted = statusDeleted;
		this.statusDeactivated = statusDeactivated;
		this.statusArchived = statusArchived;
		this.analysisStatusPending = analysisStatusPending;
		this.analysisStatusDone = analysisStatusDone;
		this.analysisStatusFailed = analysisStatusFailed;
		this.analysisPendingScanInterval = analysisPendingScanInterval;
		// Uhrzeit als „HH:mm“ und Zeitzone als Name (z. B. Europe/Berlin): Ein Tippfehler in der YAML fällt beim Start auf
		this.analysisRetryTime = LocalTime.parse(analysisRetryTimeText);
		this.analysisRetryTimeZone = ZoneId.of(analysisRetryTimeZoneText);
		this.analysisRetryMinAge = analysisRetryMinAge;
		this.cheerShownUsersMax = cheerShownUsersMax;
		this.cheerUsersPageSize = cheerUsersPageSize;
		this.adminAccessRoleKey = adminAccessRoleKey;
		this.fileManagerAccessRoleKey = fileManagerAccessRoleKey;
	}

	/** Der Solr-Kern der Dateien, z. B. {@code FILE}. */
	public String solrCoreKey() {
		return solrCoreKey;
	}

	/** So viele aktive Dateien darf ein normaler User haben. */
	public int maxFilesPerUsers() {
		return maxFilesPerUsers;
	}

	/** So groß darf eine hochgeladene Datei höchstens sein. */
	public DataSize uploadMaxFileSize() {
		return uploadMaxFileSize;
	}

	/** So groß darf der Teil {@code data} (JSON mit den Feldern) eines Uploads höchstens sein. */
	public DataSize uploadMaxDataSize() {
		return uploadMaxDataSize;
	}

	/** So viel liest der Upload je Schritt vom Netz und schreibt es in den Puffer. */
	public DataSize uploadBufferSize() {
		return uploadBufferSize;
	}

	/** Der Upload-Puffer auf der Platte des Backends, absolut. */
	public Path stagingDirectory() {
		return stagingDirectory;
	}

	/** So viel darf im Upload-Puffer höchstens liegen, laufende Uploads mitgezählt. */
	public DataSize stagingMaxSize() {
		return stagingMaxSize;
	}

	/** Höchstens so viele Zeichen Volltext je Datei. */
	public int tikaMaxTextCharacters() {
		return tikaMaxTextCharacters;
	}

	/** Kantenlänge des quadratischen Vorschaubilds in Pixeln. */
	public int previewSizePixels() {
		return previewSizePixels;
	}

	/** Beim Dekodieren für die Vorschau bleibt die kurze Seite mindestens so lang. */
	public int previewDecodeMinShortSidePixels() {
		return previewDecodeMinShortSidePixels;
	}

	/** Beim Auflösen so viele Dateien je Seite. */
	public int resolvePageSize() {
		return resolvePageSize;
	}

	/** Diese Typen dürfen inline im Browser gezeigt werden, alles andere nur als Download. */
	public List<String> inlineMimeTypes() {
		return inlineMimeTypes;
	}

	/** Status einer sichtbaren Datei, z. B. {@code ACTIVE}. */
	public String statusActive() {
		return statusActive;
	}

	public Visibility defaultVisibility() {
		return defaultVisibility;
	}

	/** Status einer weich gelöschten Datei, z. B. {@code DELETED}. */
	public String statusDeleted() {
		return statusDeleted;
	}

	/** Status einer deaktivierten Datei: lesbar und in der Suche, aber gesperrt, z. B. {@code DEACTIVATED}. */
	public String statusDeactivated() {
		return statusDeactivated;
	}

	/** Status einer archivierten Datei: für normale User nur noch lesbar, z. B. {@code ARCHIVED}. */
	public String statusArchived() {
		return statusArchived;
	}

	/** Auswertung wartet noch (nach dem Upload). */
	public String analysisStatusPending() {
		return analysisStatusPending;
	}

	/** Auswertung fertig. */
	public String analysisStatusDone() {
		return analysisStatusDone;
	}

	/** Auswertung gescheitert, Grund im Log. */
	public String analysisStatusFailed() {
		return analysisStatusFailed;
	}

	/** So oft schaut der Hintergrund-Thread in den Upload-Puffer, ob dort Arbeit liegt. */
	public Duration analysisPendingScanInterval() {
		return analysisPendingScanInterval;
	}

	/** Um diese Uhrzeit läuft einmal am Tag der zweite Versuch für hängende Auswertungen. */
	public LocalTime analysisRetryTime() {
		return analysisRetryTime;
	}

	/** In dieser Zeitzone gilt {@link #analysisRetryTime()}, z. B. {@code Europe/Berlin}. */
	public ZoneId analysisRetryTimeZone() {
		return analysisRetryTimeZone;
	}

	/** Erst wenn der Upload so lange her ist, gilt eine Datei auf PENDING als hängend. */
	public Duration analysisRetryMinAge() {
		return analysisRetryMinAge;
	}

	/** So viele User nennt der Stand der Stimmen einer Datei je Richtung höchstens beim Namen. */
	public int cheerShownUsersMax() {
		return cheerShownUsersMax;
	}

	/** So viele User hat eine Seite, wenn die Oberfläche alle Stimmen einer Richtung nachlädt. */
	public int cheerUsersPageSize() {
		return cheerUsersPageSize;
	}

	/** Das Admin-Recht: verwaltet alles, für ihn gilt die Grenze an Dateien nicht. */
	public String adminAccessRoleKey() {
		return adminAccessRoleKey;
	}

	/** Das Recht des File-Managers: verwaltet jede Datei, für ihn gilt die Grenze an Dateien nicht. */
	public String fileManagerAccessRoleKey() {
		return fileManagerAccessRoleKey;
	}
}
