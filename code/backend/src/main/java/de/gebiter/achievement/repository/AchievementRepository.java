package de.gebiter.achievement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.achievement.model.Achievement;

/**
 * Datenzugriff auf {@link Achievement}, Primärschlüssel ist der {@code key}. Genutzt wird es ausschließlich vom
 * {@link de.gebiter.achievement.service.AchievementService}.
 */
public interface AchievementRepository extends JpaRepository<Achievement, String> {

	/** Alle Achievements, in der Reihenfolge der Anzeige, bei gleichem Platz nach Key. */
	List<Achievement> findAllByOrderByListingPositionAscKeyAsc();

	/** Das Achievement mit dem höchsten Platz, für den Platz eines neuen am Ende. */
	Optional<Achievement> findTopByOrderByListingPositionDesc();
}
