package de.gebiter.gallery.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.gallery.model.Gallery;

/** Datenzugriff auf {@link Gallery}. Genutzt wird es ausschließlich vom {@link de.gebiter.gallery.service.GalleryService}. */
public interface GalleryRepository extends JpaRepository<Gallery, Long> {

	/** Die Galerien eines Users in ihrer Reihenfolge. */
	List<Gallery> findByOwnerUsersGuidOrderByListingPositionAscIdAsc(UUID ownerUsersGuid);

	/** Die Galerie eines Users mit dem höchsten Platz, für den Platz einer neuen. */
	Optional<Gallery> findFirstByOwnerUsersGuidOrderByListingPositionDesc(UUID ownerUsersGuid);
}
