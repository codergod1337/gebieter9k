package de.gebiter.achievement.model;

/**
 * Was das Protokoll {@code achievement_tracking} zählt, je Art ein Kontrollcounter je User. Ein Achievement hängt an
 * genau einer Art und wird geprüft, sobald eine neue Zeile dieser Art entsteht (Nutzer 2026-11-09). Neue Arten kommen
 * hier dazu, jede mit der Stelle, die sie bucht.
 */
public enum AchievementTrackingKey {

	/**
	 * Online-Zeit am Stück in Sekunden. Gebucht bei Login und Token-Verlängerung ({@code AchievementTrackingService}),
	 * gemessen nur mit der Uhr des Servers. Fehlt länger als {@code gebiter.achievement.online-presence.max-gap} jede
	 * Spur des Users, beginnt die Serie neu bei 0.
	 */
	ONLINE_PRESENCE
}
