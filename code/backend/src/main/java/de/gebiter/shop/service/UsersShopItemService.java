package de.gebiter.shop.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.shop.model.UsersShopItem;
import de.gebiter.shop.repository.UsersShopItemRepository;
import de.gebiter.util.Helper;

/**
 * Was ein User von den Artikeln des Gebietermarkts zur Verfügung hat (Nutzer 2026-11-11: eine Entity für alles, was ein
 * User hat, losgelöst vom Angebot): dauerhaft oder noch eine Anzahl Nutzungen. Er nutzt nur sein eigenes Repository.
 * Besitz entsteht nur durch einen Kauf ({@code ShopOrderService}); einen Endpunkt, der Besitz anlegt, gibt es nicht.
 * Das Nutzen (Zähler herunter) kommt als eigenes Stück.
 * <p>
 * Doku: {@code docu/entities/UsersShopItem.md}.
 */
@Service
public class UsersShopItemService {

	private final UsersShopItemRepository usersShopItemRepository;

	private final CurrentUsersProvider currentUsersProvider;

	public UsersShopItemService(UsersShopItemRepository usersShopItemRepository,
			CurrentUsersProvider currentUsersProvider) {
		this.usersShopItemRepository = usersShopItemRepository;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * CREATE oder UPDATE: Gibt dem User, was er gekauft hat. Aufgerufen nur vom {@code ShopOrderService}, in der
	 * Transaktion des Kaufs. Hat der User von der Datei schon etwas, wird aufgestockt (dauerhaft bleibt dauerhaft,
	 * Nutzungen kommen dazu); sonst entsteht seine Zeile. Beispiel: Bob hat von der Kuh noch 7 Nutzungen und kauft ein
	 * 10er-Paket, dann stehen 17 da; kauft er sie dauerhaft, steht dauerhaft da und die 17 zählen nicht mehr.
	 *
	 * @param permanent der Kauf gilt dauerhaft
	 * @param grantedUsageCount so viele Nutzungen bringt der Kauf; bei einem dauerhaften Kauf 0
	 * @return was der User jetzt von der Datei hat
	 * @throws IllegalArgumentException wenn der Kauf weder dauerhaft ist noch Nutzungen bringt
	 */
	@Transactional
	public UsersShopItem grantUsersShopItem(UUID usersGuid, String fileDocumentId, boolean permanent,
			int grantedUsageCount) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		String normalizedFileDocumentId = Helper.requireSha256Hex(fileDocumentId);
		if (!permanent && grantedUsageCount < 1) {
			throw new IllegalArgumentException("Ein Kauf ist entweder dauerhaft oder bringt mindestens eine Nutzung.");
		}
		int changedRowCount;
		if (permanent) {
			changedRowCount = usersShopItemRepository.markPermanent(usersGuid, normalizedFileDocumentId);
		} else {
			changedRowCount = usersShopItemRepository.increaseRemainingUsageCount(usersGuid, normalizedFileDocumentId,
					grantedUsageCount);
		}
		boolean nothingOwnedYet = changedRowCount == 0;
		if (nothingOwnedYet) {
			// Kaufen zwei Requests desselben Users dieselbe Datei im selben Augenblick zum ersten Mal, lehnt die Datenbank
			// die zweite Zeile ab (uq_users_shop_item) und dieser zweite Kauf wird ganz zurückgenommen.
			UsersShopItem newUsersShopItem = new UsersShopItem(usersGuid, normalizedFileDocumentId, permanent,
					grantedUsageCount);
			return usersShopItemRepository.saveAndFlush(newUsersShopItem);
		}
		Optional<UsersShopItem> changedUsersShopItem = usersShopItemRepository
				.findByUsersGuidAndFileDocumentId(usersGuid, normalizedFileDocumentId);
		return changedUsersShopItem.orElseThrow();
	}

	/**
	 * READ: Was dieser User von dieser Datei hat, {@code null} wenn nichts. Für andere Services, z. B. bevor ein Kauf
	 * angenommen wird.
	 */
	@Transactional(readOnly = true)
	public UsersShopItem getUsersShopItemOrNull(UUID usersGuid, String fileDocumentId) {
		Helper.requireNotNull(usersGuid, "usersGuid");
		String normalizedFileDocumentId = Helper.requireSha256Hex(fileDocumentId);
		Optional<UsersShopItem> foundUsersShopItem = usersShopItemRepository
				.findByUsersGuidAndFileDocumentId(usersGuid, normalizedFileDocumentId);
		return foundUsersShopItem.orElse(null);
	}

	/**
	 * READ: Was der angemeldete User von diesen Dateien hat, je id der Datei seine Zeile. Dateien, von denen er nichts
	 * hat, fehlen in der Map. Für die Anzeige der Artikel einer Rubrik.
	 */
	@Transactional(readOnly = true)
	public Map<String, UsersShopItem> getOwnUsersShopItemsByFileDocumentId(List<String> fileDocumentIds) {
		Map<String, UsersShopItem> ownUsersShopItemsByFileDocumentId = new HashMap<>();
		if (fileDocumentIds.isEmpty()) {
			return ownUsersShopItemsByFileDocumentId;
		}
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		List<UsersShopItem> ownUsersShopItems = usersShopItemRepository
				.findAllByUsersGuidAndFileDocumentIdIn(currentUsersGuid, fileDocumentIds);
		for (UsersShopItem ownUsersShopItem : ownUsersShopItems) {
			String fileDocumentId = ownUsersShopItem.getFileDocumentId();
			ownUsersShopItemsByFileDocumentId.put(fileDocumentId, ownUsersShopItem);
		}
		return ownUsersShopItemsByFileDocumentId;
	}
}
