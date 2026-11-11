package de.gebiter.users.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.point.service.PointActivityService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.users.dto.UsersPointBookingPage;
import de.gebiter.users.model.UsersPointBooking;
import de.gebiter.users.model.UsersPointBookingReason;
import de.gebiter.users.repository.UsersPointBookingRepository;
import de.gebiter.util.Helper;

/**
 * Das Kontobuch der Punkte (Nutzer 2026-11-09: wie ein Online-Shop, transparent und nachvollziehbar), die EINZIGE Stelle,
 * die Punkte bewegt. Je Vorgang eine öffentliche Methode, den Betrag bestimmt immer das Backend (z. B. die Punkte des
 * Achievements), nie der Client; es gibt keinen Endpunkt, der Punkte oder Beträge annimmt. Jede Buchung ändert
 * {@code Users.points} und schreibt die Zeile im Kontobuch in derselben Transaktion: alles oder nichts, nie ins Minus,
 * jeder Bezug höchstens einmal.
 */
@Service
public class UsersPointBookingService {

	private static final Logger LOGGER = LoggerFactory.getLogger(UsersPointBookingService.class);

	private final UsersPointBookingRepository usersPointBookingRepository;

	private final UsersService usersService;

	private final PointActivityService pointActivityService;

	private final CurrentUsersProvider currentUsersProvider;

	/** Buchungen je Seite des Kontoauszugs ({@code gebiter.users-point-booking.page-size}). */
	private final int pageSize;

	public UsersPointBookingService(UsersPointBookingRepository usersPointBookingRepository, UsersService usersService,
			PointActivityService pointActivityService, CurrentUsersProvider currentUsersProvider,
			@Value("${gebiter.users-point-booking.page-size}") int pageSize) {
		this.usersPointBookingRepository = usersPointBookingRepository;
		this.usersService = usersService;
		this.pointActivityService = pointActivityService;
		this.currentUsersProvider = currentUsersProvider;
		this.pageSize = pageSize;
	}

	/**
	 * CREATE: Bucht die Punkte eines Achievement-Abschlusses. Aufgerufen nur vom Backend beim Prüfen des Protokolls, in
	 * dessen Transaktion. Der Abschluss ({@code usersAchievementId}) wird höchstens einmal gebucht; ein zweiter Versuch
	 * ändert nichts.
	 *
	 * @return die Buchung, {@code null} wenn der Abschluss schon gebucht ist
	 */
	@Transactional
	public UsersPointBooking createAchievementRewardBooking(UUID usersGuid, long rewardPoints, String achievementKey,
			Long usersAchievementId, Instant achievedAt) {
		Helper.requireNotNull(usersAchievementId, "usersAchievementId");
		if (rewardPoints <= 0) {
			throw new IllegalArgumentException("Eine Belohnung hat positive Punkte.");
		}
		String referenceId = usersAchievementId.toString();
		return doCreateUsersPointBooking(usersGuid, rewardPoints, UsersPointBookingReason.ACHIEVEMENT_REWARD,
				achievementKey, referenceId, achievedAt, null);
	}

	/**
	 * CREATE: Bucht die Punkte einer Tätigkeit (Nutzer 2026-11-09), z. B. für einen Gästebucheintrag. Wie viele, sagt die
	 * Tätigkeit jetzt ({@link PointActivityService}); der Betrag steht danach fest in der Buchung, nie rückwirkend.
	 * Bringt die Tätigkeit 0 Punkte oder gibt es sie nicht, wird nichts gebucht. Aufgerufen nur vom Backend, in der
	 * Transaktion des Vorgangs; dasselbe Ergebnis ({@code referenceId}) bringt höchstens einmal Punkte.
	 *
	 * @param referenceId was entstand: id des Eintrags oder Kommentars, SHA-256 der Datei
	 * @return die Buchung, {@code null} ohne Punkte oder wenn schon gebucht
	 */
	@Transactional
	public UsersPointBooking createActivityRewardBooking(UUID usersGuid, String pointActivityKey, String referenceId,
			Instant bookedAt) {
		Helper.requireNotNull(pointActivityKey, "pointActivityKey");
		Helper.requireNotNull(referenceId, "referenceId");
		long rewardPoints = pointActivityService.getPointActivityRewardPoints(pointActivityKey);
		if (rewardPoints <= 0) {
			return null;
		}
		return doCreateUsersPointBooking(usersGuid, rewardPoints, UsersPointBookingReason.ACTIVITY_REWARD,
				pointActivityKey, referenceId, bookedAt, null);
	}

	/**
	 * CREATE: Bucht beim Käufer den Preis eines Kaufs im Gebietermarkt ab. Aufgerufen nur vom {@code ShopOrderService}, in
	 * der Transaktion des Kaufs; den Preis bestimmt das Angebot, nie der Client. Reicht der Stand nicht, scheitert die
	 * Buchung und mit ihr der ganze Kauf.
	 *
	 * @param pricePoints der Preis, positiv; abgebucht wird er als negativer Betrag
	 * @param fileDocumentId die gekaufte Datei, zum Anzeigen im Kontoauszug
	 * @param shopOrderId die id des Belegs: Ein Beleg wird höchstens einmal abgebucht
	 * @return die Buchung, {@code null} wenn der Beleg schon gebucht ist
	 * @throws IllegalStateException wenn der Punktestand nicht reicht
	 */
	@Transactional
	public UsersPointBooking createShopPurchaseBooking(UUID buyerUsersGuid, long pricePoints, String fileDocumentId,
			Long shopOrderId, Instant orderedAt) {
		Helper.requireNotNull(fileDocumentId, "fileDocumentId");
		Helper.requireNotNull(shopOrderId, "shopOrderId");
		if (pricePoints <= 0) {
			throw new IllegalArgumentException("Abgebucht wird nur ein positiver Preis.");
		}
		long amountPoints = -pricePoints;
		String referenceId = shopOrderId.toString();
		return doCreateUsersPointBooking(buyerUsersGuid, amountPoints, UsersPointBookingReason.SHOP_PURCHASE,
				fileDocumentId, referenceId, orderedAt, buyerUsersGuid);
	}

	/**
	 * CREATE: Bucht beim Verkäufer seinen Anteil an einem Verkauf im Gebietermarkt. Aufgerufen nur vom
	 * {@code ShopOrderService}, in der Transaktion des Kaufs; den Anteil (Preis abzüglich Marktgebühr) rechnet er aus.
	 *
	 * @param salePoints der Anteil des Verkäufers, positiv
	 * @param fileDocumentId die verkaufte Datei, zum Anzeigen im Kontoauszug
	 * @param shopOrderId die id des Belegs: Ein Beleg wird höchstens einmal gutgeschrieben
	 * @param buyerUsersGuid wer gekauft und die Buchung damit ausgelöst hat
	 * @return die Buchung, {@code null} wenn der Beleg schon gebucht ist
	 */
	@Transactional
	public UsersPointBooking createShopSaleBooking(UUID sellerUsersGuid, long salePoints, String fileDocumentId,
			Long shopOrderId, UUID buyerUsersGuid, Instant orderedAt) {
		Helper.requireNotNull(fileDocumentId, "fileDocumentId");
		Helper.requireNotNull(shopOrderId, "shopOrderId");
		if (salePoints <= 0) {
			throw new IllegalArgumentException("Gutgeschrieben wird nur ein positiver Anteil.");
		}
		String referenceId = shopOrderId.toString();
		return doCreateUsersPointBooking(sellerUsersGuid, salePoints, UsersPointBookingReason.SHOP_SALE, fileDocumentId,
				referenceId, orderedAt, buyerUsersGuid);
	}

	/** READ: Eine Seite des eigenen Kontoauszugs, die neuesten Buchungen zuerst, dazu der aktuelle Stand. */
	@Transactional(readOnly = true)
	public UsersPointBookingPage resolveOwnUsersPointBookingPage(int page) {
		if (page < 0) {
			throw new IllegalArgumentException("Die Seite darf nicht negativ sein.");
		}
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		long pointBalance = usersService.getUsersPoints(currentUsersGuid);
		Pageable pageable = PageRequest.of(page, pageSize);
		Page<UsersPointBooking> bookingPage = usersPointBookingRepository
				.findByUsersGuidOrderByBookedAtDescIdDesc(currentUsersGuid, pageable);
		List<UsersPointBooking> bookings = bookingPage.getContent();
		long totalCount = bookingPage.getTotalElements();
		return new UsersPointBookingPage(pointBalance, bookings, totalCount, page, pageSize);
	}

	/**
	 * Der Kern jeder Buchung: Bezug prüfen, Kontostand atomar ändern (nie ins Minus), Zeile mit dem Stand danach.
	 * Läuft in der Transaktion des Aufrufers; scheitert etwas, gibt es weder Stand noch Zeile.
	 */
	private UsersPointBooking doCreateUsersPointBooking(UUID usersGuid, long amountPoints,
			UsersPointBookingReason bookingReason, String referenceKey, String referenceId, Instant bookedAt,
			UUID bookedByUsersGuid) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		Helper.requireNotNull(bookedAt, "bookedAt");
		if (referenceId != null) {
			boolean alreadyBooked = usersPointBookingRepository
					.existsByBookingReasonAndReferenceKeyAndReferenceId(bookingReason, referenceKey, referenceId);
			if (alreadyBooked) {
				LOGGER.warn("Buchung {} {} schon vorhanden, nicht noch einmal gebucht", bookingReason, referenceId);
				return null;
			}
		}
		long balanceAfter = usersService.changeUsersPoints(usersGuid, amountPoints);
		UsersPointBooking newBooking = new UsersPointBooking(usersGuid, amountPoints, balanceAfter, bookingReason,
				referenceKey, referenceId, bookedAt, bookedByUsersGuid);
		UsersPointBooking savedBooking = usersPointBookingRepository.save(newBooking);
		LOGGER.info("Punkte gebucht: {} ({}) für {} ({} {}), Stand {}", amountPoints, bookingReason, usersGuid,
				referenceKey, referenceId, balanceAfter);
		return savedBooking;
	}
}
