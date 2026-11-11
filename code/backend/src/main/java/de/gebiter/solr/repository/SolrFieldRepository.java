package de.gebiter.solr.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.solr.model.SolrField;

/**
 * Datenzugriff auf {@link SolrField}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.solr.service.SolrFieldService}.
 */
public interface SolrFieldRepository extends JpaRepository<SolrField, Long> {

	/** Gibt es im Kern {@code solrCoreKey} schon ein Feld mit diesem Namen? */
	boolean existsBySolrCoreKeyAndName(String solrCoreKey, String name);

	/** Gibt es im Kern ein anderes Feld (nicht {@code id}) mit diesem Namen? Für das Ändern. */
	boolean existsBySolrCoreKeyAndNameAndIdNot(String solrCoreKey, String name, Long id);

	/** Alle Felder aller Kerne, je Kern in der Reihenfolge der Feldtabelle (Position, dann Name). Für die Kopie im Speicher. */
	List<SolrField> findAllByOrderBySolrCoreKeyAscListingPositionAscNameAsc();

	/** Gibt es in irgendeinem Kern ein Feld mit diesem Namen? Für den Key einer neuen Referenz. */
	boolean existsByName(String name);

	/** Alle Felder eines Kerns. Für die neue Reihenfolge nach Drag and Drop. */
	List<SolrField> findAllBySolrCoreKey(String solrCoreKey);

	/** Die Zeilen einer Referenz, eine je Kern. */
	List<SolrField> findAllBySolrReferenceKey(String solrReferenceKey);
}
