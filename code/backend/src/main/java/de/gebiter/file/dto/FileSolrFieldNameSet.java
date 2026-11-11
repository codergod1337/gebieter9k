package de.gebiter.file.dto;

/**
 * Die Namen der Felder im Solr-Kern der Dateien, mit denen Backend und Frontend rechnen, aus {@code gebiter.file.field.*}.
 * Das Frontend lädt sie mit den Stammdaten, so stehen sie nur an einer Stelle (der {@code application.yaml}).
 */
public record FileSolrFieldNameSet(String id, String sftpPath, String authorUsersGuid, String fileClassKey,
		String readerAccessRoleKeys, String writerAccessRoleKeys, String status, String fileName, String fileExtension,
		String mimeType, String fileSizeBytes, String uploadedAt, String lastChangedAt, String cheerUpCount,
		String cheerDownCount, String previewBase64Png, String searchableText, String imageWidth, String imageHeight,
		String capturedAt, String cameraModel, String gpsLatitude, String gpsLongitude, String tikaFileDescription,
		String analysisStatus, String cursorDate, String visibility, String readableForFriendsOfUsersGuid,
		String galleryIds, String galleryListingPosition, String fileDescription, String tags,
		String editorUsersGuids) {
}
