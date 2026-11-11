package de.gebiter.file.dto;

import de.gebiter.file.model.FileAnalysisStep;

/** Der Schritt, an dem der Hintergrund-Thread gerade arbeitet: welche Datei, welcher Schritt, der wievielte von wie vielen. */
public record FileAnalysisRunningStep(String fileDocumentId, FileAnalysisStep step, int stepNumber, int stepCount) {
}
