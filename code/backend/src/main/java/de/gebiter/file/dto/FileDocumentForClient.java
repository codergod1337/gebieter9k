package de.gebiter.file.dto;

import java.util.Map;

/**
 * Die Seite einer Datei: das Dokument, so wie der User es lesen darf, und was er daran darf. Nur Anzeige: Geprüft wird
 * beim Ändern noch einmal.
 *
 * @param document die lesbaren Felder
 * @param changeable die Metadaten bearbeiten: Autor mit Schreibrolle, ein freigegebener Bearbeiter, ADMIN oder
 *        FILE_MANAGER; nur bei aktiven Dateien
 * @param manageable über die Datei bestimmen (Sichtbarkeit, Bearbeiter freigeben): Autor mit Schreibrolle, ADMIN oder
 *        FILE_MANAGER; nur bei aktiven Dateien
 * @param deletable weich löschen: Autor mit Schreibrolle oder ADMIN, nicht der FILE_MANAGER; nur bei aktiven Dateien
 */
public record FileDocumentForClient(Map<String, Object> document, boolean changeable, boolean manageable,
		boolean deletable) {
}
