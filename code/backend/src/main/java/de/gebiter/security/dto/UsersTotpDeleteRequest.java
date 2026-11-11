package de.gebiter.security.dto;

/**
 * Zum Abschalten der eigenen Authenticator-App: ein aktueller Code aus der App ODER der Schlüssel von der Einrichtung
 * (Base32, Leerzeichen erlaubt, z. B. „GEZD GNBV …“). Wer den Schlüssel hat, kann ohnehin in jeder App Codes rechnen.
 *
 * @param code der 6-stellige Code, leer wenn der Schlüssel gilt
 * @param secretBase32 der Schlüssel, leer wenn der Code gilt
 */
public record UsersTotpDeleteRequest(String code, String secretBase32) {
}
