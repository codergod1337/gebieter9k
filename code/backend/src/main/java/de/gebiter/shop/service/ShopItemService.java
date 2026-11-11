package de.gebiter.shop.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.service.FileDocumentResolveService;
import de.gebiter.file.service.FileDocumentWriteService;
import de.gebiter.security.CurrentUsersProvider;
import de.gebiter.shop.ShopAccessDeniedException;
import de.gebiter.shop.dto.NewShopOffer;
import de.gebiter.shop.dto.ShopItemForClient;
import de.gebiter.shop.model.ShopItem;
import de.gebiter.shop.model.ShopOffer;
import de.gebiter.shop.model.UsersShopItem;
import de.gebiter.shop.repository.ShopItemRepository;
import de.gebiter.status.model.Visibility;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Die Artikel des Gebietermarkts (Nutzer 2026-11-11: im Markt Dinge hochladen, die andere kaufen können). Ein Artikel
 * entsteht nur durch das Hochladen in eine Rubrik ({@code FileUploadService.uploadFileIntoShopCategory}); sein Angebot
 * legt der Verkäufer danach an ({@link #createShopOfferOfOwnShopItem}, geführter Ablauf „neues Angebot“); einen
 * Endpunkt, der eine beliebige vorhandene Datei zum Artikel macht, gibt es nicht. Er nutzt nur sein eigenes Repository;
 * die Rubrik prüft er über den {@link ShopCategoryService}, die Dateien liest er über den
 * {@link FileDocumentResolveService}, und was der Betrachter schon hat, über den {@link UsersShopItemService}.
 * <p>
 * Löschen und Ändern gibt es noch nicht.
 * <p>
 * Doku: {@code docu/entities/ShopItem.md}.
 */
@Service
public class ShopItemService {

	private final ShopItemRepository shopItemRepository;

	private final ShopCategoryService shopCategoryService;

	private final ShopOfferService shopOfferService;

	private final UsersShopItemService usersShopItemService;

	private final FileDocumentWriteService fileDocumentWriteService;

	private final FileDocumentResolveService fileDocumentResolveService;

	private final CurrentUsersProvider currentUsersProvider;

	/** Der Key des Rechts ADMIN ({@code gebiter.accessrole.admin-key}): Der Admin legt Angebote zu jedem Artikel an. */
	private final String adminAccessRoleKey;

	public ShopItemService(ShopItemRepository shopItemRepository, ShopCategoryService shopCategoryService,
			ShopOfferService shopOfferService, UsersShopItemService usersShopItemService,
			FileDocumentWriteService fileDocumentWriteService,
			FileDocumentResolveService fileDocumentResolveService, CurrentUsersProvider currentUsersProvider,
			@Value("${gebiter.accessrole.admin-key}") String adminAccessRoleKey) {
		this.adminAccessRoleKey = adminAccessRoleKey;
		this.shopItemRepository = shopItemRepository;
		this.shopCategoryService = shopCategoryService;
		this.shopOfferService = shopOfferService;
		this.usersShopItemService = usersShopItemService;
		this.fileDocumentWriteService = fileDocumentWriteService;
		this.fileDocumentResolveService = fileDocumentResolveService;
		this.currentUsersProvider = currentUsersProvider;
	}

	/**
	 * Für den Upload in eine Rubrik (der {@code FileUploadService} ruft es, bevor er die Bytes annimmt): Die Rubrik muss
	 * es geben. Liefert die Felder, die das Backend ins neue Solr-Dokument schreibt: die Sichtbarkeit. Eine Datei im Markt
	 * sieht jeder angemeldete User, sonst sähe niemand, was er kauft.
	 *
	 * @throws IllegalArgumentException wenn der Key nicht der Key-Regel entspricht
	 * @throws EntityNotFoundException wenn es die Rubrik nicht gibt
	 */
	@Transactional(readOnly = true)
	public Map<String, Object> prepareShopCategoryUpload(String shopCategoryKey) {
		Helper.requireValidKey(shopCategoryKey);
		requireExistingShopCategory(shopCategoryKey);
		UUID sellerUsersGuid = currentUsersProvider.currentUsersGuid();
		// Fest im Code, keine Einstellung: Ein Artikel im Markt muss für alle Angemeldeten sichtbar sein.
		Visibility marketVisibility = Visibility.AUTHENTICATED;
		Map<String, Object> visibilityFieldValues = fileDocumentWriteService.createVisibilityFieldValues(marketVisibility,
				sellerUsersGuid);
		Map<String, Object> shopFieldValues = new HashMap<>(visibilityFieldValues);
		// ein neues Dokument braucht keine leeren Felder: ohne FRIENDS fällt die Freundes-GUID weg
		shopFieldValues.values().removeIf(fieldValue -> fieldValue == null);
		return shopFieldValues;
	}

	/**
	 * CREATE: Legt den Artikel zu einer Datei an, die gerade in die Rubrik hochgeladen und eingecheckt wurde (der
	 * {@code FileUploadService} ruft es direkt danach). Verkäufer ist der angemeldete User, also der Uploader. Ein
	 * Angebot hat der Artikel damit noch nicht.
	 *
	 * @throws IllegalArgumentException wenn die id kein SHA-256-Hex-Wert ist oder der Key nicht der Key-Regel entspricht
	 * @throws EntityNotFoundException wenn es die Rubrik nicht gibt
	 * @throws DuplicateKeyException wenn die Datei schon ein Artikel ist
	 */
	@Transactional
	public ShopItem createShopItemOfUploadedFile(String fileDocumentId, String shopCategoryKey) {
		String normalizedFileDocumentId = Helper.requireSha256Hex(fileDocumentId);
		Helper.requireValidKey(shopCategoryKey);
		requireExistingShopCategory(shopCategoryKey);
		boolean alreadyShopItem = shopItemRepository.existsByFileDocumentId(normalizedFileDocumentId);
		if (alreadyShopItem) {
			throw new DuplicateKeyException("Diese Datei ist schon ein Artikel im Markt.");
		}
		UUID sellerUsersGuid = currentUsersProvider.currentUsersGuid();
		ShopItem newShopItem = new ShopItem(normalizedFileDocumentId, shopCategoryKey, sellerUsersGuid);
		return shopItemRepository.save(newShopItem);
	}

	/**
	 * CREATE: Legt ein Angebot zu einem Artikel an (Nutzer 2026-11-11, der geführte Ablauf „neues Angebot“: erst die Datei
	 * hochladen, dann sagen, was das Angebot ist). Das darf der Verkäufer des Artikels und der ADMIN. Die Methode steht
	 * hier und nicht im {@link ShopOfferService}, weil die Prüfung den Artikel braucht und der {@code ShopOfferService}
	 * die Artikel nicht kennt (sonst hingen beide Services aneinander).
	 *
	 * @throws IllegalArgumentException wenn die id kein SHA-256-Hex-Wert ist oder das Angebot nicht passt
	 * @throws EntityNotFoundException wenn diese Datei kein Artikel im Markt ist
	 * @throws ShopAccessDeniedException wenn der Artikel einem anderen gehört
	 */
	@Transactional
	public ShopOffer createShopOfferOfOwnShopItem(NewShopOffer newShopOffer) {
		Helper.requireNotNull(newShopOffer, "Angebot");
		String fileDocumentId = newShopOffer.fileDocumentId();
		String normalizedFileDocumentId = Helper.requireSha256Hex(fileDocumentId);
		Optional<ShopItem> foundShopItem = shopItemRepository.findByFileDocumentId(normalizedFileDocumentId);
		if (foundShopItem.isEmpty()) {
			throw new EntityNotFoundException("Diese Datei ist kein Artikel im Markt.");
		}
		ShopItem shopItem = foundShopItem.get();
		requireCurrentUsersSellerOrAdmin(shopItem);
		Long shopItemId = shopItem.getId();
		return shopOfferService.createShopOffer(shopItemId, newShopOffer);
	}

	/**
	 * READ: Ein Artikel über seine id. Für andere Services, z. B. den Kauf (Datei und Verkäufer des Artikels).
	 *
	 * @throws EntityNotFoundException wenn es den Artikel nicht gibt
	 */
	@Transactional(readOnly = true)
	public ShopItem getShopItem(Long shopItemId) {
		Helper.requireNotNull(shopItemId, "shopItemId");
		Optional<ShopItem> foundShopItem = shopItemRepository.findById(shopItemId);
		if (foundShopItem.isEmpty()) {
			throw new EntityNotFoundException("Den Artikel mit der id " + shopItemId + " gibt es nicht.");
		}
		return foundShopItem.get();
	}

	/**
	 * READ: Die Artikel einer Rubrik für die Anzeige, der neueste zuerst, für jeden angemeldeten User: je Artikel das
	 * Dokument seiner Datei, so wie der Betrachter es lesen darf (mit Vorschau), seine laufenden Angebote und das, was der
	 * Betrachter selbst schon davon hat. Artikel, deren Datei er nicht lesen darf oder die nicht mehr aktiv ist, fehlen
	 * in der Liste.
	 *
	 * @throws IllegalArgumentException wenn der Key nicht der Key-Regel entspricht
	 * @throws EntityNotFoundException wenn es die Rubrik nicht gibt
	 */
	@Transactional(readOnly = true)
	public List<ShopItemForClient> resolveShopItems(String shopCategoryKey) {
		Helper.requireValidKey(shopCategoryKey);
		requireExistingShopCategory(shopCategoryKey);
		List<ShopItem> shopItemsOfShopCategory = shopItemRepository.findAllByShopCategoryKeyOrderByIdDesc(shopCategoryKey);
		List<Long> shopItemIds = new ArrayList<>();
		List<String> fileDocumentIds = new ArrayList<>();
		for (ShopItem shopItem : shopItemsOfShopCategory) {
			Long shopItemId = shopItem.getId();
			shopItemIds.add(shopItemId);
			String fileDocumentId = shopItem.getFileDocumentId();
			fileDocumentIds.add(fileDocumentId);
		}
		Map<Long, List<ShopOffer>> runningShopOffersByShopItemId = shopOfferService
				.getRunningShopOffersByShopItemId(shopItemIds);
		Map<String, UsersShopItem> ownUsersShopItemsByFileDocumentId = usersShopItemService
				.getOwnUsersShopItemsByFileDocumentId(fileDocumentIds);
		List<ShopItemForClient> shopItemsForClient = new ArrayList<>();
		for (ShopItem shopItem : shopItemsOfShopCategory) {
			String fileDocumentId = shopItem.getFileDocumentId();
			Map<String, Object> readableFileDocument = fileDocumentResolveService.resolveFileDocumentById(fileDocumentId);
			if (readableFileDocument == null) {
				continue;
			}
			Long shopItemId = shopItem.getId();
			List<ShopOffer> runningShopOffers = runningShopOffersByShopItemId.get(shopItemId);
			if (runningShopOffers == null) {
				runningShopOffers = List.of();
			}
			UsersShopItem ownUsersShopItem = ownUsersShopItemsByFileDocumentId.get(fileDocumentId);
			ShopItemForClient shopItemForClient = new ShopItemForClient(shopItem, readableFileDocument, runningShopOffers,
					ownUsersShopItem);
			shopItemsForClient.add(shopItemForClient);
		}
		return shopItemsForClient;
	}

	/** Der angemeldete User muss den Artikel eingestellt haben oder ADMIN sein. */
	private void requireCurrentUsersSellerOrAdmin(ShopItem shopItem) {
		boolean currentUsersIsAdmin = currentUsersProvider.currentUsersHasAccessRole(adminAccessRoleKey);
		if (currentUsersIsAdmin) {
			return;
		}
		UUID currentUsersGuid = currentUsersProvider.currentUsersGuid();
		UUID sellerUsersGuid = shopItem.getSellerUsersGuid();
		boolean currentUsersIsSeller = currentUsersGuid.equals(sellerUsersGuid);
		if (!currentUsersIsSeller) {
			throw new ShopAccessDeniedException("Ein Angebot anlegen darfst du nur zu Artikeln, die du selbst eingestellt hast.");
		}
	}

	private void requireExistingShopCategory(String shopCategoryKey) {
		boolean shopCategoryExists = shopCategoryService.existsShopCategory(shopCategoryKey);
		if (!shopCategoryExists) {
			throw new EntityNotFoundException("Die Rubrik " + shopCategoryKey + " gibt es nicht.");
		}
	}
}
