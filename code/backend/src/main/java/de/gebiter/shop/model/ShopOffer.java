package de.gebiter.shop.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Ein Angebot im Gebietermarkt: zu welchem Preis, in welcher Form und wie lange ein Artikel ({@link ShopItem}) zu kaufen
 * ist (Nutzer 2026-11-10 und 2026-11-11). Ein Artikel kann mehrere Angebote haben, z. B. dauerhaft für 500 Punkte und
 * daneben ein 10er-Paket für 80 Punkte.
 * <ul>
 * <li>Was der Käufer bekommt: den Artikel dauerhaft ({@code permanent}) oder eine Anzahl Nutzungen
 * ({@code grantedUsageCount}, z. B. 10 Posts).</li>
 * <li>Wie lange es im Markt steht: ohne Ende, bis zu einem Zeitpunkt ({@code endsAt}) oder bis eine Stückzahl verkauft
 * ist ({@code maxPurchaseCount}).</li>
 * </ul>
 * Das Angebot verschwindet irgendwann aus dem Markt. Was ein User gekauft hat, hängt nicht an ihm: Es steht in
 * {@link UsersShopItem}, der Beleg in {@link ShopOrder}. Lose gekoppelt, ohne JPA-Beziehung.
 * <p>
 * Doku: {@code docu/entities/ShopOffer.md}.
 */
@Entity
@Table(name = "shop_offer", indexes = @Index(name = "shop_offer_shop_item_id", columnList = "shop_item_id"))
public class ShopOffer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Welcher Artikel angeboten wird: die id des {@link ShopItem}. */
	@Column(name = "shop_item_id", nullable = false, updatable = false)
	private Long shopItemId;

	/** Der Preis eines Kaufs in Punkten. */
	@Column(nullable = false)
	private long pricePoints;

	/** Der Käufer bekommt den Artikel dauerhaft und darf ihn beliebig oft nutzen. */
	@Column(nullable = false, updatable = false)
	private boolean permanent;

	/** So viele Nutzungen bringt ein Kauf, z. B. 10; bei einem dauerhaften Angebot 0. */
	@Column(nullable = false, updatable = false)
	private int grantedUsageCount;

	/** Ab wann das Angebot im Markt steht. */
	@Column(nullable = false)
	private Instant startsAt;

	/** Bis wann das Angebot im Markt steht; {@code null}: ohne Ende. */
	@Column
	private Instant endsAt;

	/** So oft kann das Angebot höchstens gekauft werden (Stückzahl), z. B. 10; {@code null}: unbegrenzt. */
	@Column
	private Integer maxPurchaseCount;

	/** So oft wurde das Angebot schon gekauft. Ohne Setter: Der Kauf zählt in der Datenbank in einer Anweisung hoch. */
	@Column(nullable = false)
	private int purchaseCount;

	/** Nur für JPA. */
	protected ShopOffer() {
	}

	public ShopOffer(Long shopItemId, long pricePoints, boolean permanent, int grantedUsageCount, Instant startsAt,
			Instant endsAt, Integer maxPurchaseCount) {
		this.shopItemId = shopItemId;
		this.pricePoints = pricePoints;
		this.permanent = permanent;
		this.grantedUsageCount = grantedUsageCount;
		this.startsAt = startsAt;
		this.endsAt = endsAt;
		this.maxPurchaseCount = maxPurchaseCount;
		this.purchaseCount = 0;
	}

	public Long getId() {
		return id;
	}

	public Long getShopItemId() {
		return shopItemId;
	}

	public long getPricePoints() {
		return pricePoints;
	}

	public void setPricePoints(long pricePoints) {
		this.pricePoints = pricePoints;
	}

	public boolean isPermanent() {
		return permanent;
	}

	public int getGrantedUsageCount() {
		return grantedUsageCount;
	}

	public Instant getStartsAt() {
		return startsAt;
	}

	public void setStartsAt(Instant startsAt) {
		this.startsAt = startsAt;
	}

	public Instant getEndsAt() {
		return endsAt;
	}

	public void setEndsAt(Instant endsAt) {
		this.endsAt = endsAt;
	}

	public Integer getMaxPurchaseCount() {
		return maxPurchaseCount;
	}

	public void setMaxPurchaseCount(Integer maxPurchaseCount) {
		this.maxPurchaseCount = maxPurchaseCount;
	}

	public int getPurchaseCount() {
		return purchaseCount;
	}
}
