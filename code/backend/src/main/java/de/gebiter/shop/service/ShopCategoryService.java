package de.gebiter.shop.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.file.service.FileClassService;
import de.gebiter.shop.model.ShopCategory;
import de.gebiter.shop.repository.ShopCategoryRepository;
import de.gebiter.util.Helper;
import jakarta.persistence.EntityNotFoundException;

/**
 * Die Rubriken des Gebietermarkts (Nutzer 2026-11-10: ein Shop-Manager, darin Rubriken): Pflege durch den Admin (Modul
 * „Achievements &amp; Markt“, Tab „Rubriken“), Lesen für jeden angemeldeten User. Nutzt nur sein eigenes Repository;
 * ob es die FileClass einer Rubrik gibt, prüft er über den {@link FileClassService}.
 * Ein Löschen gibt es noch nicht: Was dann mit den Artikeln der Rubrik geschieht, wird vorher mit dem Nutzer besprochen.
 * <p>
 * Doku: {@code docu/entities/ShopCategory.md}.
 */
@Service
public class ShopCategoryService {

	private final ShopCategoryRepository shopCategoryRepository;

	private final FileClassService fileClassService;

	private final String defaultLanguageCode;

	public ShopCategoryService(ShopCategoryRepository shopCategoryRepository, FileClassService fileClassService,
			@Value("${gebiter.language.default-code}") String defaultLanguageCode) {
		this.shopCategoryRepository = shopCategoryRepository;
		this.fileClassService = fileClassService;
		this.defaultLanguageCode = defaultLanguageCode;
	}

	/**
	 * CREATE: Legt eine Rubrik am Ende der Liste an. Ihre FileClass ist Pflicht (Nutzer 2026-11-11).
	 *
	 * @throws IllegalArgumentException wenn Key oder Name nicht passen, die FileClass fehlt oder es sie nicht gibt
	 * @throws DuplicateKeyException wenn es den Key schon gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public ShopCategory createShopCategory(String shopCategoryKey, Map<String, String> displayName,
			String fileClassKey) {
		Helper.requireValidKey(shopCategoryKey);
		Helper.requireMultilingualText(displayName, "displayName", defaultLanguageCode);
		requireExistingFileClass(fileClassKey);
		boolean shopCategoryKeyTaken = shopCategoryRepository.existsById(shopCategoryKey);
		if (shopCategoryKeyTaken) {
			throw new DuplicateKeyException("Die Rubrik " + shopCategoryKey + " gibt es schon.");
		}
		int newListingPosition = 1;
		Optional<ShopCategory> lastShopCategory = shopCategoryRepository.findTopByOrderByListingPositionDesc();
		if (lastShopCategory.isPresent()) {
			int lastListingPosition = lastShopCategory.get().getListingPosition();
			newListingPosition = lastListingPosition + 1;
		}
		ShopCategory newShopCategory = new ShopCategory(shopCategoryKey, displayName, fileClassKey, newListingPosition);
		return shopCategoryRepository.save(newShopCategory);
	}

	/** READ: Gibt es die Rubrik {@code shopCategoryKey}? Für andere Services, z. B. bevor ein Artikel in ihr entsteht. */
	@Transactional(readOnly = true)
	public boolean existsShopCategory(String shopCategoryKey) {
		Helper.requireNotNull(shopCategoryKey, "shopCategoryKey");
		return shopCategoryRepository.existsById(shopCategoryKey);
	}

	/**
	 * READ: Eine Rubrik über ihren Key.
	 *
	 * @throws IllegalArgumentException wenn der Key nicht der Key-Regel entspricht
	 * @throws EntityNotFoundException wenn es sie nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional(readOnly = true)
	public ShopCategory getShopCategory(String shopCategoryKey) {
		Helper.requireValidKey(shopCategoryKey);
		return doGetShopCategory(shopCategoryKey);
	}

	/**
	 * READ: Die FileClass der Rubrik {@code shopCategoryKey}, für jeden angemeldeten User: Der Upload in eine Rubrik
	 * ({@code FileUploadService.uploadFileIntoShopCategory}) setzt damit die FileClass der Datei.
	 *
	 * @throws IllegalArgumentException wenn der Key nicht der Key-Regel entspricht
	 * @throws EntityNotFoundException wenn es die Rubrik nicht gibt
	 */
	@Transactional(readOnly = true)
	public String getFileClassKeyOfShopCategory(String shopCategoryKey) {
		Helper.requireValidKey(shopCategoryKey);
		ShopCategory shopCategory = doGetShopCategory(shopCategoryKey);
		return shopCategory.getFileClassKey();
	}

	/** READ: Alle Rubriken in der Reihenfolge der Anzeige, für jeden angemeldeten User. */
	@Transactional(readOnly = true)
	public List<ShopCategory> getAllShopCategory() {
		return shopCategoryRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	/**
	 * UPDATE: Ändert den Anzeigenamen und die FileClass einer Rubrik; der Key bestimmt nur, welche. Den Platz ändert
	 * {@link #changeShopCategoryListingPositions}. Eine neue FileClass gilt für das, was danach hochgeladen wird; Dateien,
	 * die schon in der Rubrik stehen, behalten ihre.
	 *
	 * @throws IllegalArgumentException wenn Key oder Name nicht passen, die FileClass fehlt oder es sie nicht gibt
	 * @throws EntityNotFoundException wenn es die Rubrik nicht gibt
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public ShopCategory changeShopCategory(ShopCategory changedShopCategory) {
		String shopCategoryKey = changedShopCategory.getKey();
		Helper.requireValidKey(shopCategoryKey);
		Map<String, String> changedDisplayName = changedShopCategory.getDisplayName();
		Helper.requireMultilingualText(changedDisplayName, "displayName", defaultLanguageCode);
		String changedFileClassKey = changedShopCategory.getFileClassKey();
		requireExistingFileClass(changedFileClassKey);
		ShopCategory existingShopCategory = doGetShopCategory(shopCategoryKey);
		existingShopCategory.setDisplayName(changedDisplayName);
		existingShopCategory.setFileClassKey(changedFileClassKey);
		return shopCategoryRepository.save(existingShopCategory);
	}

	/**
	 * UPDATE: Die neue Reihenfolge nach Drag and Drop.
	 *
	 * @throws IllegalArgumentException wenn ein Key fehlt, doppelt oder unbekannt ist
	 */
	@PreAuthorize("hasRole('ADMIN')")
	@Transactional
	public List<ShopCategory> changeShopCategoryListingPositions(List<String> shopCategoryKeysInOrder) {
		List<ShopCategory> allShopCategories = shopCategoryRepository.findAllByOrderByListingPositionAscKeyAsc();
		List<String> existingShopCategoryKeys = new ArrayList<>();
		for (ShopCategory shopCategory : allShopCategories) {
			String existingShopCategoryKey = shopCategory.getKey();
			existingShopCategoryKeys.add(existingShopCategoryKey);
		}
		Helper.requireCompleteKeyOrder(shopCategoryKeysInOrder, existingShopCategoryKeys, "keysInOrder");
		for (ShopCategory shopCategory : allShopCategories) {
			String shopCategoryKey = shopCategory.getKey();
			int newListingPosition = shopCategoryKeysInOrder.indexOf(shopCategoryKey) + 1;
			shopCategory.setListingPosition(newListingPosition);
		}
		shopCategoryRepository.saveAll(allShopCategories);
		return shopCategoryRepository.findAllByOrderByListingPositionAscKeyAsc();
	}

	/** Die FileClass einer Rubrik ist Pflicht und muss es geben. */
	private void requireExistingFileClass(String fileClassKey) {
		if (fileClassKey == null || fileClassKey.isBlank()) {
			throw new IllegalArgumentException("fileClassKey fehlt: Jede Rubrik braucht eine FileClass.");
		}
		Helper.requireValidKey(fileClassKey);
		boolean fileClassExists = fileClassService.existsFileClass(fileClassKey);
		if (!fileClassExists) {
			throw new IllegalArgumentException("Die FileClass " + fileClassKey + " gibt es nicht.");
		}
	}

	private ShopCategory doGetShopCategory(String shopCategoryKey) {
		Optional<ShopCategory> foundShopCategory = shopCategoryRepository.findById(shopCategoryKey);
		if (foundShopCategory.isEmpty()) {
			throw new EntityNotFoundException("Die Rubrik " + shopCategoryKey + " gibt es nicht.");
		}
		return foundShopCategory.get();
	}
}
