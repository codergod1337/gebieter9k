package de.gebiter.knowledge.model;

/** Der Status einer Wissensseite, Feld {@code status} im Kern {@code KNOWLEDGE}. */
public enum KnowledgePageStatus {

	/** Entwurf: Nur der Admin sieht die Seite. */
	DRAFT,

	/** Veröffentlicht: Jeder sieht die Seite, auch ohne Anmeldung. */
	PUBLISHED,

	/** Weich gelöscht: Die Seite ist für Besucher weg, das Dokument bleibt im Kern. */
	DELETED
}
