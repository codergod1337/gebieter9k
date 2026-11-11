package de.gebiter.rank.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.rank.model.Rank;

/** Datenzugriff auf {@link Rank}. Genutzt wird es ausschließlich vom {@link de.gebiter.rank.service.RankService}. */
public interface RankRepository extends JpaRepository<Rank, String> {

	/** Alle Ränge, von unten nach oben. */
	List<Rank> findAllByOrderByLevelAsc();

	/** Der oberste Rang, für die Stufe eines neuen. */
	Optional<Rank> findTopByOrderByLevelDesc();
}
