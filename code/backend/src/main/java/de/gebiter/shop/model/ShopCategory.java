package de.gebiter.shop.model;

import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Eine Rubrik im Gebietermarkt (Nutzer 2026-11-10: aufgebaut wie die Galerien, ein Shop-Manager, darin Rubriken, in den
 * Rubriken die Bilder zum Kauf), z. B. „Sticker“. Der Admin legt sie an und sortiert sie; jeder Artikel
 * ({@link ShopItem}) steht in genau einer Rubrik.
 * <p>
 * Jede Rubrik hat genau eine FileClass (Nutzer 2026-11-11: eine Rubrik setzt immer eine FileClass voraus): Was in die
 * Rubrik hochgeladen wird, bekommt diese FileClass, der Upload wählt sie nicht. Lose gekoppelt über den Key.
 * <p>
 * Doku: {@code docu/entities/ShopCategory.md}.
 */
@Entity
@Table(name = "shop_category")
public class ShopCategory {

	/** Fester technischer Schlüssel, Key-Regel, z. B. {@code STICKER}. */
	@Id
	@Column(name = "shop_category_key", nullable = false, updatable = false, length = 100)
	private String key;

	/** Mehrsprachiger Anzeigename, z. B. {@code {"de": "Sticker"}}. */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(nullable = false, columnDefinition = "jsonb")
	private Map<String, String> displayName;

	/**
	 * Die FileClass der Rubrik, Pflicht: der Key der {@code FileClass}, die jede Datei bekommt, die in diese Rubrik
	 * hochgeladen wird, z. B. {@code MEME}.
	 */
	@Column(name = "file_class_key", nullable = false, length = 100)
	private String fileClassKey;

	/** Platz unter den Rubriken, ab 1. */
	@Column(nullable = false)
	private int listingPosition;

	/** Nur für JPA. */
	protected ShopCategory() {
	}

	public ShopCategory(String key, Map<String, String> displayName, String fileClassKey, int listingPosition) {
		this.key = key;
		this.displayName = displayName;
		this.fileClassKey = fileClassKey;
		this.listingPosition = listingPosition;
	}

	public String getKey() {
		return key;
	}

	public Map<String, String> getDisplayName() {
		return displayName;
	}

	public void setDisplayName(Map<String, String> displayName) {
		this.displayName = displayName;
	}

	public String getFileClassKey() {
		return fileClassKey;
	}

	public void setFileClassKey(String fileClassKey) {
		this.fileClassKey = fileClassKey;
	}

	public int getListingPosition() {
		return listingPosition;
	}

	public void setListingPosition(int listingPosition) {
		this.listingPosition = listingPosition;
	}
}
