package de.gebiter.shop.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.shop.model.UsersShopItem;

/** Was die User von den Artikeln des Gebietermarkts haben; nur der {@link de.gebiter.shop.service.UsersShopItemService} nutzt es. */
public interface UsersShopItemRepository extends JpaRepository<UsersShopItem, Long> {

	/** Was dieser User von dieser Datei hat; je User und Datei höchstens eine Zeile. */
	Optional<UsersShopItem> findByUsersGuidAndFileDocumentId(UUID usersGuid, String fileDocumentId);

	/** Was dieser User von diesen Dateien hat. */
	List<UsersShopItem> findAllByUsersGuidAndFileDocumentIdIn(UUID usersGuid, Collection<String> fileDocumentIds);

	/**
	 * Macht aus dem, was der User von der Datei hat, einen dauerhaften Besitz, in einer Anweisung.
	 *
	 * @return die Zahl der geänderten Zeilen: 1 gesetzt, 0 der User hat von der Datei noch nichts
	 */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update UsersShopItem usersShopItem set usersShopItem.permanent = true "
			+ "where usersShopItem.usersGuid = :usersGuid and usersShopItem.fileDocumentId = :fileDocumentId")
	int markPermanent(@Param("usersGuid") UUID usersGuid, @Param("fileDocumentId") String fileDocumentId);

	/**
	 * Zählt Nutzungen dazu, atomar in der Datenbank: Zwei gleichzeitige Käufe gehen beide in den Zähler ein.
	 *
	 * @return die Zahl der geänderten Zeilen: 1 gezählt, 0 der User hat von der Datei noch nichts
	 */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update UsersShopItem usersShopItem "
			+ "set usersShopItem.remainingUsageCount = usersShopItem.remainingUsageCount + :usageCount "
			+ "where usersShopItem.usersGuid = :usersGuid and usersShopItem.fileDocumentId = :fileDocumentId")
	int increaseRemainingUsageCount(@Param("usersGuid") UUID usersGuid, @Param("fileDocumentId") String fileDocumentId,
			@Param("usageCount") int usageCount);
}
