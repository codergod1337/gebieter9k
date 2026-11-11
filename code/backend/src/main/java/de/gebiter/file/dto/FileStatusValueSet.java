package de.gebiter.file.dto;

/**
 * Die Werte des Feldes {@code status} einer Datei aus {@code gebiter.file.status-*}. Das Frontend lädt sie mit den
 * Stammdaten und zeigt sie als Zeichen in Worten, so stehen sie nur in der {@code application.yaml}.
 *
 * @param active die Datei ist da, für alle, die sie sehen dürfen, änderbar nach den Rechten
 * @param deactivated noch lesbar und in der Suche, aber gesperrt: nichts mehr ändern
 * @param archived für normale User nur noch lesbar
 * @param deleted weich gelöscht, nur der Admin bekommt sie über seine Endpunkte und kann sie endgültig löschen
 */
public record FileStatusValueSet(String active, String deactivated, String archived, String deleted) {
}
