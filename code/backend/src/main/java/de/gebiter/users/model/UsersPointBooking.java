package de.gebiter.users.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Eine Buchung im Kontobuch der Punkte (Nutzer 2026-11-09): was rein- oder rausging, wofür, wann, und der Stand danach,
 * wie ein Kontoauszug. Der Kontostand selbst steht in {@code Users.points} und ändert sich nur zusammen mit einer
 * Buchung, in derselben Transaktion. Buchungen werden nie geändert oder gelöscht; eine Korrektur ist eine Gegenbuchung.
 * Ein Bezug (Grund, {@code referenceKey} und {@code referenceId}) wird höchstens einmal gebucht.
 */
@Entity
@Table(name = "users_point_booking",
		uniqueConstraints = @UniqueConstraint(name = "users_point_booking_reason_key_reference",
				columnNames = { "booking_reason", "reference_key", "reference_id" }),
		indexes = @Index(name = "users_point_booking_users_guid_booked_at", columnList = "users_guid, booked_at"))
/**
 * Doku: {@code docu/entities/UsersPointBooking.md}.
 */
public class UsersPointBooking {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Wessen Konto. */
	@Column(name = "users_guid", nullable = false, updatable = false)
	private UUID usersGuid;

	/** Wie viele Punkte, positiv: rein, negativ: raus. */
	@Column(nullable = false, updatable = false)
	private long amountPoints;

	/** Der Kontostand nach dieser Buchung. */
	@Column(nullable = false, updatable = false)
	private long balanceAfter;

	/** Wofür. */
	@Enumerated(EnumType.STRING)
	@Column(name = "booking_reason", nullable = false, updatable = false, length = 50)
	private UsersPointBookingReason bookingReason;

	/**
	 * Woher, als Key zum Anzeigen, z. B. der Key des Achievements ({@code ONLINE_STUNDE}) oder der Tätigkeit; bei Kauf
	 * und Verkauf im Gebietermarkt die id der Datei (SHA-256).
	 */
	@Column(name = "reference_key", updatable = false, length = 100)
	private String referenceKey;

	/**
	 * Woher, zum Nachvollziehen: die id der Zeile in {@code users_achievement}, des Gästebucheintrags oder Kommentars oder
	 * der SHA-256 der Datei, bei Kauf und Verkauf die id des Belegs ({@code ShopOrder}); mit Grund und Key höchstens
	 * einmal.
	 */
	@Column(name = "reference_id", updatable = false, length = 100)
	private String referenceId;

	/** Wann gebucht, von der Uhr des Servers. */
	@Column(name = "booked_at", nullable = false, updatable = false)
	private Instant bookedAt;

	/** Wer die Buchung ausgelöst hat; {@code null}: das System selbst, z. B. für ein Achievement. */
	@Column(updatable = false)
	private UUID bookedByUsersGuid;

	/** Nur für JPA. */
	protected UsersPointBooking() {
	}

	public UsersPointBooking(UUID usersGuid, long amountPoints, long balanceAfter, UsersPointBookingReason bookingReason,
			String referenceKey, String referenceId, Instant bookedAt, UUID bookedByUsersGuid) {
		this.usersGuid = usersGuid;
		this.amountPoints = amountPoints;
		this.balanceAfter = balanceAfter;
		this.bookingReason = bookingReason;
		this.referenceKey = referenceKey;
		this.referenceId = referenceId;
		this.bookedAt = bookedAt;
		this.bookedByUsersGuid = bookedByUsersGuid;
	}

	public Long getId() {
		return id;
	}

	public UUID getUsersGuid() {
		return usersGuid;
	}

	public long getAmountPoints() {
		return amountPoints;
	}

	public long getBalanceAfter() {
		return balanceAfter;
	}

	public UsersPointBookingReason getBookingReason() {
		return bookingReason;
	}

	public String getReferenceKey() {
		return referenceKey;
	}

	public String getReferenceId() {
		return referenceId;
	}

	public Instant getBookedAt() {
		return bookedAt;
	}

	public UUID getBookedByUsersGuid() {
		return bookedByUsersGuid;
	}
}
