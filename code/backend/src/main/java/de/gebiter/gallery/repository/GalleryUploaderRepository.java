package de.gebiter.gallery.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.gallery.model.GalleryUploader;

/**
 * Datenzugriff auf {@link GalleryUploader}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.gallery.service.GalleryUploaderService}.
 */
public interface GalleryUploaderRepository extends JpaRepository<GalleryUploader, Long> {

	/** Die Uploadberechtigten einer Galerie, der zuerst eingetragene zuerst. */
	List<GalleryUploader> findByGalleryIdOrderByIdAsc(Long galleryId);

	/** Die Einträge eines Users: in welche fremden Galerien er hochladen darf, der älteste Eintrag zuerst. */
	List<GalleryUploader> findByUploaderUsersGuidOrderByIdAsc(UUID uploaderUsersGuid);

	/** Ist dieser User schon Uploadberechtigter dieser Galerie? */
	boolean existsByGalleryIdAndUploaderUsersGuid(Long galleryId, UUID uploaderUsersGuid);
}
