package de.gebiter.shop.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Der Beleg eines Kaufs im Gebietermarkt (Nutzer 2026-11-09: nachweisen, wer welches Item wann gekauft hat): wer, welches
 * Angebot, welche Datei, zu welchem Preis, wann. Wird nur angelegt, nie geändert. Preis und Form des Kaufs sind hier
 * festgeschrieben, weil das Angebot ({@link ShopOffer}) später geändert wird oder verschwindet. Die Buchung im Kontobuch
 * bezieht sich auf die id dieses Belegs; so kann ein User dasselbe Angebot mehrmals kaufen. Lose gekoppelt, ohne
 * JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/ShopOrder.md}.
 */
@Entity
@Table(name = "shop_order", indexes = @Index(name = "shop_order_users_guid", columnList = "users_guid"))
public class ShopOrder {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Wer gekauft hat. */
	@Column(name = "users_guid", nullable = false, updatable = false)
	private UUID usersGuid;

	/** Welches Angebot gekauft wurde: die id des {@link ShopOffer}; das Angebot selbst kann inzwischen weg sein. */
	@Column(nullable = false, updatable = false)
	private Long shopOfferId;

	/** id der gekauften Datei im Solr-Kern FILE: der SHA-256 ihrer Bytes als Hex. */
	@Column(nullable = false, updatable = false, length = 64)
	private String fileDocumentId;

	/** Der bezahlte Preis in Punkten, beim Kauf festgeschrieben. */
	@Column(nullable = false, updatable = false)
	private long pricePoints;

	/** Der Kauf galt dauerhaft, beim Kauf festgeschrieben. */
	@Column(nullable = false, updatable = false)
	private boolean permanent;

	/** So viele Nutzungen brachte der Kauf, beim Kauf festgeschrieben; bei einem dauerhaften Kauf 0. */
	@Column(nullable = false, updatable = false)
	private int grantedUsageCount;

	/** Wann gekauft wurde. */
	@Column(nullable = false, updatable = false)
	private Instant orderedAt;

	/** Nur für JPA. */
	protected ShopOrder() {
	}

	public ShopOrder(UUID usersGuid, Long shopOfferId, String fileDocumentId, long pricePoints, boolean permanent,
			int grantedUsageCount, Instant orderedAt) {
		this.usersGuid = usersGuid;
		this.shopOfferId = shopOfferId;
		this.fileDocumentId = fileDocumentId;
		this.pricePoints = pricePoints;
		this.permanent = permanent;
		this.grantedUsageCount = grantedUsageCount;
		this.orderedAt = orderedAt;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public Long getShopOfferId() {
		return shopOfferId;
	}

	public String getFileDocumentId() {
		return fileDocumentId;
	}

	public long getPricePoints() {
		return pricePoints;
	}

	public boolean isPermanent() {
		return permanent;
	}

	public int getGrantedUsageCount() {
		return grantedUsageCount;
	}

	public Instant getOrderedAt() {
		return orderedAt;
	}
}
