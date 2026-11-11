package de.gebiter.achievement.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Die Anwesenheit eines Users im Speicher: je Sitzung der letzte Check-in und der Beginn der aktuellen Serie.
 *
 * @param lastCheckInAtBySessionNumber je Sitzung (Platz) der letzte Login oder die letzte Verlängerung
 * @param restoredCheckInAt nach einem Neustart aus dem Protokoll zurückgelesen, Sitzung unbekannt; {@code null}, sobald
 *        eine echte Sitzung eincheckt oder sich abmeldet
 * @param onlineSince seit wann er am Stück da ist: der Beginn der Serie im Protokoll
 */
public record OnlinePresence(Map<Integer, Instant> lastCheckInAtBySessionNumber, Instant restoredCheckInAt,
		Instant onlineSince) {
}
