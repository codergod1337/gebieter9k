package de.gebiter.point.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.point.model.PointActivity;

/** Die Tätigkeiten mit Punkten; nur der {@link de.gebiter.point.service.PointActivityService} nutzt es. */
public interface PointActivityRepository extends JpaRepository<PointActivity, String> {

	List<PointActivity> findAllByOrderByListingPositionAscKeyAsc();

	Optional<PointActivity> findTopByOrderByListingPositionDesc();
}
