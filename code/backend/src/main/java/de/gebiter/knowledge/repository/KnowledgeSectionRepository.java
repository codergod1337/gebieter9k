package de.gebiter.knowledge.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.knowledge.model.KnowledgeSection;

/**
 * Die Gliederung der Wissensdatenbank; nur der {@link de.gebiter.knowledge.service.KnowledgeSectionService} nutzt es.
 * Die Tabelle ist klein (Rubriken, Kapitel, Unterkapitel): Der Service liest sie ganz und sucht darin selbst.
 */
public interface KnowledgeSectionRepository extends JpaRepository<KnowledgeSection, Long> {

	List<KnowledgeSection> findAllByOrderByListingPositionAscIdAsc();
}
