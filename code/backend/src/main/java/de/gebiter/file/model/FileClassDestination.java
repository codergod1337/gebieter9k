package de.gebiter.file.model;

/**
 * Ein Ziel einer {@link FileClass}: ein Upload-Weg, in dessen Dropdown die FileClass angeboten wird (Nutzer 2026-11-09).
 * Jeder Weg hat eigenen Code, deshalb ein Enum und keine Tabelle mit freien Werten. Weitere Ziele (Profilbanner,
 * Shop-Grafik) kommen, wenn ihr Upload-Weg gebaut wird.
 */
public enum FileClassDestination {

	/** Hochladen in eine eigene Galerie im Profil. */
	GALLERY
}
