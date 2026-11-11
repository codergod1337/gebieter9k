package de.gebiter.shop.model;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Ein Artikel im Gebietermarkt: eine Datei aus dem Solr-Kern FILE, die in einer Rubrik zum Kauf steht (Nutzer
 * 2026-11-11: der Artikel liegt immer im Kern FILE, mit seiner id). Der Artikel sagt nur, DASS die Datei zu kaufen ist.
 * Zu welchem Preis und wie lange, sagt ein {@link ShopOffer}; was ein User davon hat, steht in {@link UsersShopItem}.
 * Eine Datei ist höchstens ein Artikel, das sichert die Datenbank ({@code uq_shop_item_file_document_id}). Lose
 * gekoppelt, ohne JPA-Beziehung: Die Datei ist ein Solr-Dokument, die Rubrik nur ihr Key.
 * <p>
 * Doku: {@code docu/entities/ShopItem.md}.
 */
@Entity
@Table(name = "shop_item", uniqueConstraints = @UniqueConstraint(
		name = "uq_shop_item_file_document_id", columnNames = { "file_document_id" }))
public class ShopItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** id der Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. */
	@Column(name = "file_document_id", nullable = false, updatable = false, length = 64)
	private String fileDocumentId;

	/** In welcher Rubrik der Artikel steht: der Key der {@link ShopCategory}. */
	@Column(nullable = false, length = 100)
	private String shopCategoryKey;

	/**
	 * Wer den Artikel eingestellt hat: der User, der die Datei in den Markt hochgeladen hat (Nutzer 2026-11-10: User
	 * verkaufen selbst). Er bekommt beim Verkauf die Punkte. {@code null} ist für Artikel vorgesehen, die der Server
	 * verkauft; die gibt es noch nicht.
	 */
	@Column(name = "seller_users_guid", updatable = false)
	private UUID sellerUsersGuid;

	/** Nur für JPA. */
	protected ShopItem() {
	}

	public ShopItem(String fileDocumentId, String shopCategoryKey, UUID sellerUsersGuid) {
		this.fileDocumentId = fileDocumentId;
		this.shopCategoryKey = shopCategoryKey;
		this.sellerUsersGuid = sellerUsersGuid;
	}

	public Long getId() {
		return id;
	}

	public String getFileDocumentId() {
		return fileDocumentId;
	}

	public String getShopCategoryKey() {
		return shopCategoryKey;
	}

	public void setShopCategoryKey(String shopCategoryKey) {
		this.shopCategoryKey = shopCategoryKey;
	}

	public UUID getSellerUsersGuid() {
		return sellerUsersGuid;
	}
}
