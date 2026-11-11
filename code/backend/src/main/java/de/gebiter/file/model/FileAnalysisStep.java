package de.gebiter.file.model;

/**
 * Die Schritte, die der Hintergrund-Thread mit einer hochgeladenen Datei macht, in dieser Reihenfolge. Welche davon eine
 * Datei braucht, steht zu Beginn fest (HEIF nur bei HEIC-Bildern, Vorschau nur bei Endungen mit Bildvorschau). Die
 * Anzeige im Frontend nennt sie in Worten.
 */
public enum FileAnalysisStep {

	/** Die Datei aus dem Upload-Puffer auf den SFTP. */
	STORE_ON_SFTP,

	/** HEIC in ein JPEG samt EXIF umwandeln (libheif), damit Tika, Texterkennung und Vorschau es lesen. */
	CONVERT_HEIF,

	/** Tika: Inhalt und EXIF; bei Dokumenten samt Texterkennung eingebetteter Bilder. */
	READ_WITH_TIKA,

	/** Nur bei Bildern: Texterkennung auf einer verkleinerten Kopie (im Original dauert sie ein Vielfaches). */
	RECOGNIZE_TEXT,

	/** Das Vorschaubild rechnen. */
	CREATE_PREVIEW,

	/** Das Ergebnis ins Solr-Dokument schreiben. */
	SAVE_RESULT
}
