package de.gebiter.badge.model;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Das Aussehen eines Badges, wie in der Vorlage als Daten statt fest im CSS: Verlauf, Struktur darüber, Effekte, Symbol
 * und Farben. Eingebettet in jede Klasse mit Badge (Position, Rang, Achievement), die Spalten heißen dort
 * {@code badge_*}. Jeder Wert darf fehlen ({@code null}), dann gilt der Standard aus {@code base.css}. Fehlt alles, ist
 * der ganze {@code badgeLook} {@code null}.
 * <p>
 * Verlauf, Struktur und Effekte stehen in der Datenbank als Text (Name des Enums), nach außen als Enum. So legt
 * Hibernate keinen CHECK auf die Spalten, und eine neue Art braucht keine Änderung an der Datenbank. Geprüft wird im
 * {@code BadgeLookService}.
 */
@Embeddable
public class BadgeLook {

	/** Name eines {@link BadgeGradient}. */
	@Column(name = "badge_gradient", length = 40)
	private String gradient;

	/** Name einer {@link BadgeStructure}. */
	@Column(name = "badge_structure", length = 40)
	private String structure;

	/** Namen der {@link BadgeEffect}e, jeder höchstens einmal, in der gewählten Reihenfolge. */
	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(name = "badge_effects", columnDefinition = "text[]")
	private List<String> effects;

	/** Paket des Symbols, z. B. {@code gameicons}. Nur zusammen mit {@link #symbolName}. */
	@Column(name = "badge_symbol_pack", length = 120)
	private String symbolPack;

	/** Name des Symbols im Paket, z. B. {@code crown}. */
	@Column(name = "badge_symbol_name", length = 120)
	private String symbolName;

	/** Anfangsfarbe des Verlaufs, {@code #rrggbb}. */
	@Column(name = "badge_gradient_start_color", length = 7)
	private String gradientStartColor;

	/** Endfarbe des Verlaufs, {@code #rrggbb}. */
	@Column(name = "badge_gradient_end_color", length = 7)
	private String gradientEndColor;

	@Column(name = "badge_text_color", length = 7)
	private String textColor;

	/** Schein hinter der Schrift, für Kontrast auf jedem Verlauf. */
	@Column(name = "badge_text_shadow_color", length = 7)
	private String textShadowColor;

	@Column(name = "badge_border_color", length = 7)
	private String borderColor;

	/** Schatten unter dem Badge, beim Effekt {@link BadgeEffect#GLOW} auch die Farbe des Leuchtens. */
	@Column(name = "badge_shadow_color", length = 7)
	private String shadowColor;

	/** Farbe der {@link BadgeStructure}, ohne Angabe ein heller Hauch. */
	@Column(name = "badge_structure_color", length = 7)
	private String structureColor;

	/** Für JPA und für Jackson beim Einlesen eines Request Body. */
	public BadgeLook() {
	}

	public BadgeGradient getGradient() {
		if (gradient == null) {
			return null;
		}
		return BadgeGradient.valueOf(gradient);
	}

	public void setGradient(BadgeGradient badgeGradient) {
		if (badgeGradient == null) {
			this.gradient = null;
			return;
		}
		this.gradient = badgeGradient.name();
	}

	public BadgeStructure getStructure() {
		if (structure == null) {
			return null;
		}
		return BadgeStructure.valueOf(structure);
	}

	public void setStructure(BadgeStructure badgeStructure) {
		if (badgeStructure == null) {
			this.structure = null;
			return;
		}
		this.structure = badgeStructure.name();
	}

	public List<BadgeEffect> getEffects() {
		if (effects == null) {
			return null;
		}
		List<BadgeEffect> badgeEffects = new ArrayList<>();
		for (String effectName : effects) {
			BadgeEffect badgeEffect = BadgeEffect.valueOf(effectName);
			badgeEffects.add(badgeEffect);
		}
		return badgeEffects;
	}

	/** Doppelte fallen weg, eine leere Liste wird {@code null}. */
	public void setEffects(List<BadgeEffect> badgeEffects) {
		if (badgeEffects == null || badgeEffects.isEmpty()) {
			this.effects = null;
			return;
		}
		List<String> effectNames = new ArrayList<>();
		for (BadgeEffect badgeEffect : badgeEffects) {
			if (badgeEffect == null) {
				throw new IllegalArgumentException("Ein Effekt in \"badgeLook.effects\" ist leer.");
			}
			String effectName = badgeEffect.name();
			boolean alreadyListed = effectNames.contains(effectName);
			if (!alreadyListed) {
				effectNames.add(effectName);
			}
		}
		this.effects = effectNames;
	}

	public String getSymbolPack() {
		return symbolPack;
	}

	public void setSymbolPack(String symbolPack) {
		this.symbolPack = symbolPack;
	}

	public String getSymbolName() {
		return symbolName;
	}

	public void setSymbolName(String symbolName) {
		this.symbolName = symbolName;
	}

	public String getGradientStartColor() {
		return gradientStartColor;
	}

	public void setGradientStartColor(String gradientStartColor) {
		this.gradientStartColor = gradientStartColor;
	}

	public String getGradientEndColor() {
		return gradientEndColor;
	}

	public void setGradientEndColor(String gradientEndColor) {
		this.gradientEndColor = gradientEndColor;
	}

	public String getTextColor() {
		return textColor;
	}

	public void setTextColor(String textColor) {
		this.textColor = textColor;
	}

	public String getTextShadowColor() {
		return textShadowColor;
	}

	public void setTextShadowColor(String textShadowColor) {
		this.textShadowColor = textShadowColor;
	}

	public String getBorderColor() {
		return borderColor;
	}

	public void setBorderColor(String borderColor) {
		this.borderColor = borderColor;
	}

	public String getShadowColor() {
		return shadowColor;
	}

	public void setShadowColor(String shadowColor) {
		this.shadowColor = shadowColor;
	}

	public String getStructureColor() {
		return structureColor;
	}

	public void setStructureColor(String structureColor) {
		this.structureColor = structureColor;
	}

	/** Ist kein einziger Wert gesetzt? Dann speichert der Service {@code null} statt eines leeren Aussehens. */
	public boolean hasNoValue() {
		boolean noStyle = gradient == null && structure == null && effects == null;
		boolean noSymbol = symbolPack == null && symbolName == null;
		boolean noGradientColor = gradientStartColor == null && gradientEndColor == null;
		boolean noTextColor = textColor == null && textShadowColor == null;
		boolean noOtherColor = borderColor == null && shadowColor == null && structureColor == null;
		return noStyle && noSymbol && noGradientColor && noTextColor && noOtherColor;
	}
}
