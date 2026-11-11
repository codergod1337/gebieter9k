package de.gebiter.shop.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.shop.model.ShopItem;

/** Die Artikel des Gebietermarkts; nur der {@link de.gebiter.shop.service.ShopItemService} nutzt es. */
public interface ShopItemRepository extends JpaRepository<ShopItem, Long> {

	/** Die Artikel einer Rubrik, der neueste zuerst. */
	List<ShopItem> findAllByShopCategoryKeyOrderByIdDesc(String shopCategoryKey);

	/** Ist diese Datei schon ein Artikel? */
	boolean existsByFileDocumentId(String fileDocumentId);

	/** Der Artikel zu dieser Datei; eine Datei ist höchstens ein Artikel. */
	Optional<ShopItem> findByFileDocumentId(String fileDocumentId);
}
