package de.gebiter.file.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import de.gebiter.file.model.FileClassDestination;

/**
 * Was der Upload vor dem Annehmen der Bytes geprüft hat und zum Einchecken braucht. Bleibt im Backend.
 *
 * @param originalFileName der Dateiname ohne Pfad
 * @param fileExtension die Endung, klein
 * @param browserMimeType der Typ laut Browser, falls Tika nichts erkennt
 * @param fileClassKey die geprüfte FileClass
 * @param writerAccessRoleKeys die Schreibrollen fürs Dokument: die Rechte, die die FileClass hochladen dürfen
 * @param clientFieldValues die geprüften Felder des Clients
 * @param authorUsersGuid der Autor: wer die Datei hochgeladen hat
 * @param backendFieldValues Felder, die der Upload-Weg setzt und die immer gewinnen, z. B. Galerie, Sichtbarkeit und
 *            Platz beim Hochladen in eine Galerie; leer beim normalen Upload
 * @param destination das Ziel des Upload-Wegs, z. B. die Galerie (für die Punkte); {@code null} beim normalen Upload
 * @param shopCategoryKey die Rubrik des Gebietermarkts, in die hochgeladen wird: Nach dem Einchecken entsteht dort der
 *            Artikel; {@code null} auf jedem anderen Weg
 */
public record FileUploadFacts(String originalFileName, String fileExtension, String browserMimeType,
		String fileClassKey, List<String> writerAccessRoleKeys, Map<String, Object> clientFieldValues,
		UUID authorUsersGuid, Map<String, Object> backendFieldValues, FileClassDestination destination,
		String shopCategoryKey) {
}
