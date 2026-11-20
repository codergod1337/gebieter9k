package de.gebiter.gallery.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import de.gebiter.gallery.model.GalleryShare;

/**
 * Datenzugriff auf {@link GalleryShare}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.gallery.service.GalleryShareService}.
 */
public interface GalleryShareRepository extends JpaRepository<GalleryShare, Long> {

	/** Die Freigaben einer Galerie, die älteste zuerst. */
	List<GalleryShare> findByGalleryIdOrderByIdAsc(Long galleryId);

	/** Die Freigaben mehrerer Galerien, die älteste zuerst: alle Freigaben der eigenen Galerien eines Users. */
	List<GalleryShare> findByGalleryIdInOrderByIdAsc(Collection<Long> galleryIds);

	/** Alle Freigaben aller Galerien, die neueste zuerst: für die Übersicht des Admins. */
	List<GalleryShare> findAllByOrderByIdDesc();

	/** Die Freigabe zum SHA-256 eines Tokens: So findet das Backend sie für einen Besucher. */
	Optional<GalleryShare> findByShareTokenHash(String shareTokenHash);

	/**
	 * Zählt an einer Freigabe {@code accessCountIncrease} Aufrufe dazu, aber nur, wenn sie in diesem Moment noch gilt:
	 * nicht abgelaufen, und die Grenze der Aufrufe reicht noch für alle. Prüfen und Zählen sind EINE Anweisung in der
	 * Datenbank: Zwei gleichzeitige Abrufe können die Grenze so nie gemeinsam überschreiten. Mit eigener Transaktion, der
	 * Abruf selbst (das Streamen) läuft ohne.
	 *
	 * @return 1, wenn gezählt wurde; 0, wenn die Freigabe fehlt, abgelaufen ist oder die Aufrufe nicht mehr reichen
	 */
	@Transactional
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update GalleryShare galleryShare set galleryShare.accessCount = galleryShare.accessCount + :accessCountIncrease "
			+ "where galleryShare.id = :id "
			+ "and (galleryShare.expiresAt is null or galleryShare.expiresAt > :now) "
			+ "and (galleryShare.maxAccessCount is null "
			+ "or galleryShare.accessCount + :accessCountIncrease <= galleryShare.maxAccessCount)")
	int increaseAccessCountIfValid(@Param("id") Long id, @Param("accessCountIncrease") long accessCountIncrease,
			@Param("now") Instant now);

	/**
	 * Zählt bei allen Freigaben einer Galerie die Zahl der Bilder ({@code fileCount}) um {@code fileCountChange} weiter,
	 * atomar in der Datenbank: +1 nach einem Upload in die Galerie, -1 nach einem gelöschten Bild. Unter 0 fällt die Zahl
	 * nie. Mit eigener Transaktion, weil auch eine Meldung ohne laufende Transaktion sie auslöst.
	 *
	 * @return die Zahl der geänderten Zeilen, 0 ohne Freigabe an dieser Galerie
	 */
	@Transactional
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query("update GalleryShare galleryShare set galleryShare.fileCount = galleryShare.fileCount + :fileCountChange "
			+ "where galleryShare.galleryId = :galleryId and galleryShare.fileCount + :fileCountChange >= 0")
	int changeFileCountByGalleryId(@Param("galleryId") Long galleryId, @Param("fileCountChange") long fileCountChange);
}
