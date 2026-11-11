package de.gebiter.badge.model;

/**
 * Die Struktur, die über dem Verlauf eines Badges liegt, in der Strukturfarbe des {@link BadgeLook}. Wie jede Art
 * aussieht, steht in {@code base.css} (Klasse {@code badge-look-structure-<name klein>}). Ohne Angabe liegt keine
 * Struktur darüber. Grob von schlicht nach edel geordnet.
 */
public enum BadgeStructure {

	/** feine Punkte */
	DOTS,

	/** breite Streifen, schräg */
	STRIPES,

	/** feine senkrechte Nadelstreifen */
	PINSTRIPES,

	/** Karo-Raster */
	GRID,

	/** Schachbrett */
	CHECKER,

	/** Körnung, wie mattes Papier */
	GRAIN,

	/** gebürstetes Metall, feine waagrechte Linien */
	BRUSHED,

	/** Karbon-Gewebe */
	CARBON,

	/** Rauten, wie gesteppt */
	DIAMOND,

	/** Bienenwaben */
	HONEYCOMB,

	/** Wellen */
	WAVES,

	/** Drachenschuppen */
	SCALES,

	/** Leiterbahnen einer Platine */
	CIRCUIT,

	/** kleine Sterne */
	STARS,

	/** Damast, ein Ornament wie auf altem Stoff */
	DAMASK
}
