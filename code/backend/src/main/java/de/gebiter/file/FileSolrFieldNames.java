package de.gebiter.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import de.gebiter.file.dto.FileSolrFieldNameSet;

/**
 * Die Namen der Felder im Solr-Kern der Dateien, mit denen das Backend rechnet, aus {@code gebiter.file.field.*} der
 * {@code application.yaml}. Angelegt werden die Felder im SolrManager (Postgres), hier steht nur, wie sie heißen.
 */
@Component
public class FileSolrFieldNames {

	private final String id;
	private final String sftpPath;
	private final String authorUsersGuid;
	private final String fileClassKey;
	private final String readerAccessRoleKeys;
	private final String writerAccessRoleKeys;
	private final String status;
	private final String fileName;
	private final String fileExtension;
	private final String mimeType;
	private final String fileSizeBytes;
	private final String uploadedAt;
	private final String lastChangedAt;
	private final String cheerUpCount;
	private final String cheerDownCount;
	private final String previewBase64Png;
	private final String searchableText;
	private final String imageWidth;
	private final String imageHeight;
	private final String capturedAt;
	private final String cameraModel;
	private final String gpsLatitude;
	private final String gpsLongitude;
	private final String tikaFileDescription;
	private final String analysisStatus;
	private final String cursorDate;

	private final String visibility;

	private final String readableForFriendsOfUsersGuid;

	private final String galleryIds;

	private final String galleryListingPosition;

	private final String fileDescription;

	private final String tags;

	private final String editorUsersGuids;

	public FileSolrFieldNames(@Value("${gebiter.file.field.id}") String id,
			@Value("${gebiter.file.field.sftp-path}") String sftpPath,
			@Value("${gebiter.file.field.author-users-guid}") String authorUsersGuid,
			@Value("${gebiter.file.field.file-class-key}") String fileClassKey,
			@Value("${gebiter.file.field.reader-access-role-keys}") String readerAccessRoleKeys,
			@Value("${gebiter.file.field.writer-access-role-keys}") String writerAccessRoleKeys,
			@Value("${gebiter.file.field.status}") String status,
			@Value("${gebiter.file.field.file-name}") String fileName,
			@Value("${gebiter.file.field.file-extension}") String fileExtension,
			@Value("${gebiter.file.field.mime-type}") String mimeType,
			@Value("${gebiter.file.field.file-size-bytes}") String fileSizeBytes,
			@Value("${gebiter.file.field.uploaded-at}") String uploadedAt,
			@Value("${gebiter.file.field.last-changed-at}") String lastChangedAt,
			@Value("${gebiter.file.field.cheer-up-count}") String cheerUpCount,
			@Value("${gebiter.file.field.cheer-down-count}") String cheerDownCount,
			@Value("${gebiter.file.field.preview-base64-png}") String previewBase64Png,
			@Value("${gebiter.file.field.searchable-text}") String searchableText,
			@Value("${gebiter.file.field.image-width}") String imageWidth,
			@Value("${gebiter.file.field.image-height}") String imageHeight,
			@Value("${gebiter.file.field.captured-at}") String capturedAt,
			@Value("${gebiter.file.field.camera-model}") String cameraModel,
			@Value("${gebiter.file.field.gps-latitude}") String gpsLatitude,
			@Value("${gebiter.file.field.gps-longitude}") String gpsLongitude,
			@Value("${gebiter.file.field.tika-file-description}") String tikaFileDescription,
			@Value("${gebiter.file.field.analysis-status}") String analysisStatus,
			@Value("${gebiter.file.field.cursor-date}") String cursorDate,
			@Value("${gebiter.file.field.visibility}") String visibility,
			@Value("${gebiter.file.field.readable-for-friends-of-users-guid}") String readableForFriendsOfUsersGuid,
			@Value("${gebiter.file.field.gallery-ids}") String galleryIds,
			@Value("${gebiter.file.field.gallery-listing-position}") String galleryListingPosition,
			@Value("${gebiter.file.field.file-description}") String fileDescription,
			@Value("${gebiter.file.field.tags}") String tags,
			@Value("${gebiter.file.field.editor-users-guids}") String editorUsersGuids) {
		this.id = id;
		this.sftpPath = sftpPath;
		this.authorUsersGuid = authorUsersGuid;
		this.fileClassKey = fileClassKey;
		this.readerAccessRoleKeys = readerAccessRoleKeys;
		this.writerAccessRoleKeys = writerAccessRoleKeys;
		this.status = status;
		this.fileName = fileName;
		this.fileExtension = fileExtension;
		this.mimeType = mimeType;
		this.fileSizeBytes = fileSizeBytes;
		this.uploadedAt = uploadedAt;
		this.lastChangedAt = lastChangedAt;
		this.cheerUpCount = cheerUpCount;
		this.cheerDownCount = cheerDownCount;
		this.previewBase64Png = previewBase64Png;
		this.searchableText = searchableText;
		this.imageWidth = imageWidth;
		this.imageHeight = imageHeight;
		this.capturedAt = capturedAt;
		this.cameraModel = cameraModel;
		this.gpsLatitude = gpsLatitude;
		this.gpsLongitude = gpsLongitude;
		this.tikaFileDescription = tikaFileDescription;
		this.analysisStatus = analysisStatus;
		this.cursorDate = cursorDate;
		this.visibility = visibility;
		this.readableForFriendsOfUsersGuid = readableForFriendsOfUsersGuid;
		this.galleryIds = galleryIds;
		this.galleryListingPosition = galleryListingPosition;
		this.fileDescription = fileDescription;
		this.tags = tags;
		this.editorUsersGuids = editorUsersGuids;
	}

	/** Alle Namen als ein Objekt, z. B. für die Stammdaten des Frontends. */
	public FileSolrFieldNameSet toFileSolrFieldNameSet() {
		return new FileSolrFieldNameSet(id, sftpPath, authorUsersGuid, fileClassKey, readerAccessRoleKeys,
				writerAccessRoleKeys, status, fileName, fileExtension, mimeType, fileSizeBytes, uploadedAt, lastChangedAt,
				cheerUpCount, cheerDownCount, previewBase64Png, searchableText, imageWidth, imageHeight, capturedAt,
				cameraModel, gpsLatitude, gpsLongitude, tikaFileDescription, analysisStatus, cursorDate, visibility,
				readableForFriendsOfUsersGuid, galleryIds, galleryListingPosition, fileDescription, tags, editorUsersGuids);
	}

	/** SHA-256 der Bytes, zugleich die id des Dokuments. */
	public String id() {
		return id;
	}

	/** Pfad der Bytes auf dem SFTP, nur fürs Backend. */
	public String sftpPath() {
		return sftpPath;
	}

	/** GUID des Uploaders. */
	public String authorUsersGuid() {
		return authorUsersGuid;
	}

	public String fileClassKey() {
		return fileClassKey;
	}

	/** Leserollen, Pflichtfilter jeder Abfrage. */
	public String readerAccessRoleKeys() {
		return readerAccessRoleKeys;
	}

	public String writerAccessRoleKeys() {
		return writerAccessRoleKeys;
	}

	public String status() {
		return status;
	}

	public String fileName() {
		return fileName;
	}

	public String fileExtension() {
		return fileExtension;
	}

	public String mimeType() {
		return mimeType;
	}

	public String fileSizeBytes() {
		return fileSizeBytes;
	}

	public String uploadedAt() {
		return uploadedAt;
	}

	public String lastChangedAt() {
		return lastChangedAt;
	}

	public String cheerUpCount() {
		return cheerUpCount;
	}

	public String cheerDownCount() {
		return cheerDownCount;
	}

	public String previewBase64Png() {
		return previewBase64Png;
	}

	/** Volltext von Tika, geht nie zum Client. */
	public String searchableText() {
		return searchableText;
	}

	public String imageWidth() {
		return imageWidth;
	}

	public String imageHeight() {
		return imageHeight;
	}

	public String capturedAt() {
		return capturedAt;
	}

	public String cameraModel() {
		return cameraModel;
	}

	public String gpsLatitude() {
		return gpsLatitude;
	}

	public String gpsLongitude() {
		return gpsLongitude;
	}

	/**
	 * Der Text, den Tika gelesen hat: bei einem Bild die Texterkennung, bei einem Dokument sein Inhalt. Die zweite
	 * Beschreibung, sichtbar für Leser; setzt die Auswertung.
	 */
	public String tikaFileDescription() {
		return tikaFileDescription;
	}

	/** Stand der Auswertung im Hintergrund: wartet, fertig, gescheitert. */
	public String analysisStatus() {
		return analysisStatus;
	}

	/**
	 * Wann ein Durchlauf über alle Dateien die Datei zuletzt angefasst hat, wie {@code cursorDate} in der Vorlage. Setzt nur
	 * das Backend: Ein Durchlauf blättert per Solr-Cursor nach {@code id} (nie nach diesem Feld, das er selbst ändert) und
	 * schreibt es bei jeder Datei, die er ändert.
	 */
	public String cursorDate() {
		return cursorDate;
	}

	/** Wer die Datei sieht: ein Wert aus {@code Visibility}, setzt nur das Backend. */
	public String visibility() {
		return visibility;
	}

	/** Bei FRIENDS die GUID des Autors: Seine Freunde dürfen lesen. Setzt nur das Backend. */
	public String readableForFriendsOfUsersGuid() {
		return readableForFriendsOfUsersGuid;
	}

	/** Die Galerie der Datei, genau eine id (das Feld ist mehrwertig, das Backend schreibt nur eine). */
	public String galleryIds() {
		return galleryIds;
	}

	/** Der Platz der Datei in ihrer Galerie, für die Reihenfolge per Drag and Drop. */
	public String galleryListingPosition() {
		return galleryListingPosition;
	}

	/** Die Beschreibung des Users (getrennt von dem, was Tika gelesen hat). */
	public String fileDescription() {
		return fileDescription;
	}

	/** Die Tags des Users, mehrwertig; vervollständigt über die Feldwert-Suche. */
	public String tags() {
		return tags;
	}

	/** Die GUIDs der User, die der Autor zum Bearbeiten der Metadaten freigegeben hat; sie dürfen die Datei auch lesen. */
	public String editorUsersGuids() {
		return editorUsersGuids;
	}
}
