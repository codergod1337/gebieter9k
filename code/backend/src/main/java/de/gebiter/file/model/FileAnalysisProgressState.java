package de.gebiter.file.model;

/** Wo eine Datei in der Auswertung steht, für die Anzeige beim Hochladen. */
public enum FileAnalysisProgressState {

	/** In der Warteschlange, andere Dateien sind vor ihr dran. */
	WAITING,

	/** Wird gerade bearbeitet. */
	RUNNING,

	/** Nicht in der Warteschlange: schon fertig, noch nicht eingereiht oder von einem anderen Backend bearbeitet. */
	NOT_QUEUED
}
