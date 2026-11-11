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
 * Was ein User von einem Artikel des Gebietermarkts zur Verfügung hat (Nutzer 2026-11-11: eine Entity für die gekauften
 * bzw. überhaupt die Artikel eines Users): dauerhaft oder noch eine Anzahl Nutzungen. Je User und Datei gibt es
 * höchstens eine Zeile ({@code uq_users_shop_item}); jeder weitere Kauf ändert sie.
 * <p>
 * Die Zeile zeigt auf die Datei im Solr-Kern FILE, nicht auf das Angebot und nicht auf den Artikel im Markt: Verschwindet
 * das Angebot ({@link ShopOffer}), bleibt sie mit ihren restlichen Nutzungen stehen. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/UsersShopItem.md}.
 */
@Entity
@Table(name = "users_shop_item", uniqueConstraints = @UniqueConstraint(
		name = "uq_users_shop_item", columnNames = { "users_guid", "file_document_id" }))
public class UsersShopItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Wem es gehört. */
	@Column(name = "users_guid", nullable = false, updatable = false)
	private UUID usersGuid;

	/** id der Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. */
	@Column(name = "file_document_id", nullable = false, updatable = false, length = 64)
	private String fileDocumentId;

	/** Der User hat den Artikel dauerhaft und darf ihn beliebig oft nutzen; die restlichen Nutzungen zählen dann nicht. */
	@Column(nullable = false)
	private boolean permanent;

	/**
	 * So viele Nutzungen hat der User noch, z. B. 7 von einem 10er-Paket. Ohne Setter: Kauf und Nutzung zählen in der
	 * Datenbank in einer Anweisung, damit zwei gleichzeitige Posts nicht dieselbe Nutzung verbrauchen.
	 */
	@Column(nullable = false)
	private int remainingUsageCount;

	/** Nur für JPA. */
	protected UsersShopItem() {
	}

	public UsersShopItem(UUID usersGuid, String fileDocumentId, boolean permanent, int remainingUsageCount) {
		this.usersGuid = usersGuid;
		this.fileDocumentId = fileDocumentId;
		this.permanent = permanent;
		this.remainingUsageCount = remainingUsageCount;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public String getFileDocumentId() {
		return fileDocumentId;
	}

	public boolean isPermanent() {
		return permanent;
	}

	public void setPermanent(boolean permanent) {
		this.permanent = permanent;
	}

	public int getRemainingUsageCount() {
		return remainingUsageCount;
	}
}
