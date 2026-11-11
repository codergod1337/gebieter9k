package de.gebiter.file.dto;

/**
 * Die Werte des Feldes {@code analysisStatus} aus {@code gebiter.file.analysis-status-*}. Das Frontend lädt sie mit den
 * Stammdaten, so stehen sie nur in der {@code application.yaml}.
 *
 * @param pending die Auswertung wartet noch
 * @param done die Auswertung ist fertig
 * @param failed die Auswertung ist gescheitert
 */
public record FileAnalysisStatusValueSet(String pending, String done, String failed) {
}
