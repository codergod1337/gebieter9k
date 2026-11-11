package de.gebiter.badge.service;

import org.springframework.stereotype.Service;

import de.gebiter.badge.model.BadgeLook;
import de.gebiter.util.Helper;

/**
 * Prüft das Aussehen eines Badges ({@link BadgeLook}), bevor es eine Klasse mit Badge speichert (Position, Rang,
 * Achievement). Ohne eigenes Repository: Das Aussehen hat keine eigene Tabelle, es steht in den Spalten der jeweiligen
 * Klasse. Die Services dieser Klassen rufen ihn vor dem Speichern auf.
 */
@Service
public class BadgeLookService {

	/**
	 * Prüft das Aussehen und bringt die Farben in Kleinbuchstaben. Ist kein Wert gesetzt, kommt {@code null} zurück, dann
	 * speichert der Aufrufer kein leeres Aussehen.
	 *
	 * @throws IllegalArgumentException wenn eine Farbe nicht {@code #rrggbb} ist oder beim Symbol Paket oder Name fehlt
	 *         bzw. die Symbol-Regel verletzt
	 */
	public BadgeLook requireValidBadgeLook(BadgeLook badgeLook) {
		if (badgeLook == null || badgeLook.hasNoValue()) {
			return null;
		}
		requireValidSymbol(badgeLook);

		String enteredGradientStartColor = badgeLook.getGradientStartColor();
		String gradientStartColor = requireValidHexColorOrNull(enteredGradientStartColor, "badgeLook.gradientStartColor");
		badgeLook.setGradientStartColor(gradientStartColor);
		String enteredGradientEndColor = badgeLook.getGradientEndColor();
		String gradientEndColor = requireValidHexColorOrNull(enteredGradientEndColor, "badgeLook.gradientEndColor");
		badgeLook.setGradientEndColor(gradientEndColor);
		String enteredTextColor = badgeLook.getTextColor();
		String textColor = requireValidHexColorOrNull(enteredTextColor, "badgeLook.textColor");
		badgeLook.setTextColor(textColor);
		String enteredTextShadowColor = badgeLook.getTextShadowColor();
		String textShadowColor = requireValidHexColorOrNull(enteredTextShadowColor, "badgeLook.textShadowColor");
		badgeLook.setTextShadowColor(textShadowColor);
		String enteredBorderColor = badgeLook.getBorderColor();
		String borderColor = requireValidHexColorOrNull(enteredBorderColor, "badgeLook.borderColor");
		badgeLook.setBorderColor(borderColor);
		String enteredShadowColor = badgeLook.getShadowColor();
		String shadowColor = requireValidHexColorOrNull(enteredShadowColor, "badgeLook.shadowColor");
		badgeLook.setShadowColor(shadowColor);
		String enteredStructureColor = badgeLook.getStructureColor();
		String structureColor = requireValidHexColorOrNull(enteredStructureColor, "badgeLook.structureColor");
		badgeLook.setStructureColor(structureColor);
		return badgeLook;
	}

	/** Ein Symbol hat Paket und Name oder keins von beiden. */
	private void requireValidSymbol(BadgeLook badgeLook) {
		String symbolPack = badgeLook.getSymbolPack();
		String symbolName = badgeLook.getSymbolName();
		if (symbolPack == null && symbolName == null) {
			return;
		}
		Helper.requireValidSymbolPart(symbolPack, "badgeLook.symbolPack");
		Helper.requireValidSymbolPart(symbolName, "badgeLook.symbolName");
	}

	private String requireValidHexColorOrNull(String color, String fieldName) {
		if (color == null) {
			return null;
		}
		return Helper.requireValidHexColor(color, fieldName);
	}
}
