package de.gebiter.solr.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.solr.model.SolrReference;

/**
 * Datenzugriff auf {@link SolrReference}, Primärschlüssel ist der {@code key}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.solr.service.SolrReferenceService}.
 */
public interface SolrReferenceRepository extends JpaRepository<SolrReference, String> {

	/** Alle Referenzen in der Reihenfolge der Anzeige, bei gleichem Platz nach Key. */
	List<SolrReference> findAllByOrderByListingPositionAscKeyAsc();

	/** Die Referenz mit dem höchsten Platz, für den Platz einer neuen am Ende. */
	Optional<SolrReference> findTopByOrderByListingPositionDesc();
}
