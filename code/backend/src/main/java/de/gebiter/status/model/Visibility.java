package de.gebiter.status.model;

/**
 * Wer etwas sehen darf. Bewusst EIN Enum für alle Entities – keine eigene Visibility-Klasse je
 * Entity.
 * <p>
 * Für den User gelten vorerst nur die vier Werte unten. Für andere Entities kommen später
 * weitere Werte mit eigenen Bedingungen dazu. Damit das nirgends zu Fehlern führt:
 * <ul>
 * <li>Jede Auswertung behandelt einen Wert, den sie nicht kennt, als „nicht sichtbar“ – sie wirft
 * keinen Fehler.</li>
 * <li>In der Datenbank nie als Ordinalzahl speichern: Ein neu eingefügter Wert würde sonst die
 * Bedeutung der bestehenden verschieben.</li>
 * </ul>
 */
public enum Visibility {

	/** Niemand außer dem Eigentümer selbst. */
	NONE,

	/** Zusätzlich die Freunde des Eigentümers, also die Mitglieder seiner eigenen Gruppe. */
	FRIENDS,

	/** Zusätzlich jeder angemeldete User. */
	AUTHENTICATED,

	/** Jeder, auch nicht angemeldete Besucher. */
	ANY
}
