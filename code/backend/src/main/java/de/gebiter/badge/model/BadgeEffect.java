package de.gebiter.badge.model;

/**
 * Ein Effekt auf einem Badge, beliebig kombinierbar. Wie jeder aussieht, steht in {@code base.css} (Klasse
 * {@code badge-look-effect-<name klein>}). Grob von schlicht nach edel geordnet; die letzten sind animiert.
 */
public enum BadgeEffect {

	/** Glanzkante: die obere Hälfte wie Glas aufgehellt */
	GLOSS,

	/** geprägte Schrift, wie in Metall gedrückt */
	EMBOSS,

	/** innerer Zierrahmen */
	FRAME,

	/** Nieten links und rechts */
	RIVETS,

	/** schwebt: tiefer, weicher Schatten */
	DEEP,

	/** ein Lichtstreifen läuft immer wieder darüber (animiert) */
	SHINE,

	/** leuchtet und pulsiert in der Schattenfarbe (animiert) */
	GLOW,

	/** funkelnde Sterne (animiert) */
	SPARKLE,

	/** irisierender Schimmer wie eine Holo-Karte (animiert) */
	HOLO,

	/** ein Regenbogen-Rand läuft rundherum (animiert) */
	RING
}
