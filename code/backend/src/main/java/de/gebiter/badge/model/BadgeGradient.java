package de.gebiter.badge.model;

/**
 * Der Verlauf unter einem Badge, gezeichnet aus Anfangs- und Endfarbe des {@link BadgeLook}. Wie jede Art aussieht,
 * steht in {@code base.css} (Klasse {@code badge-look-gradient-<name klein>}), in jedem Theme gleich. Ohne Angabe gilt
 * {@link #LINEAR}. Grob von schlicht nach edel geordnet.
 */
public enum BadgeGradient {

	/** einfarbig, nur die Anfangsfarbe */
	FLAT,

	/** von oben nach unten */
	LINEAR,

	/** schräg von links oben nach rechts unten */
	DIAGONAL,

	/** harte Teilung schräg, wie ein Wappen */
	SPLIT,

	/** 3D gewölbt: oben aufgehellt, Lichtkante oben, dunkle Kante unten */
	BEVEL,

	/** von der Mitte nach außen */
	RADIAL,

	/** Metall: mehrere Stufen mit Glanzstreifen */
	METAL,

	/** Chrom: Spiegel mit harter Horizontlinie */
	CHROME,

	/** Fächer um die Mitte, wie ein Kegel von oben */
	CONIC,

	/** geschliffener Edelstein mit Facetten */
	GEM,

	/** Polarlicht: mehrere weiche Farbwolken */
	AURORA,

	/** Prisma: der Regenbogen über den langen Weg von Anfangs- zu Endfarbe */
	PRISM
}
