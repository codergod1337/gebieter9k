package de.gebiter.file.model;

/** Wie ein Upload ausgegangen ist. */
public enum FileUploadStatus {

	/** Neu angelegt: Datei auf dem SFTP, Dokument in Solr. */
	CREATED,

	/** Dieselbe Datei (gleicher SHA-256) gibt es schon, gespeichert wurde nichts. Kein Merge. */
	EXISTS;
}
