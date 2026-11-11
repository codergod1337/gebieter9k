package de.gebiter.file.dto;

import java.util.List;

/** Den Stand der Auswertung dieser Dateien auflösen, z. B. der gerade hochgeladenen. */
public record FileAnalysisProgressResolveRequest(List<String> fileDocumentIds) {
}
