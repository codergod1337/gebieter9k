package de.gebiter.file.dto;

import de.gebiter.file.model.FileAnalysisProgressState;
import de.gebiter.file.model.FileAnalysisStep;

/**
 * Wie weit die Auswertung einer Datei ist: Platz in der Warteschlange ({@code queuePosition} von {@code queueSize}, ab 1;
 * die laufende Datei ist Platz 1) und, wenn sie läuft, ihr Schritt ({@code stepNumber} von {@code stepCount}, ab 1). Wartet
 * sie oder steht sie nicht in der Schlange, sind Schritt {@code null} und die Zahlen 0.
 */
public record FileAnalysisProgress(String fileDocumentId, FileAnalysisProgressState state, int queuePosition,
		int queueSize, FileAnalysisStep step, int stepNumber, int stepCount) {
}
