package de.gebiter.achievement.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.gebiter.achievement.dto.UsersAchievementSummary;
import de.gebiter.achievement.model.UsersAchievement;

/** Die erreichten Achievements; nur der {@link de.gebiter.achievement.service.UsersAchievementService} nutzt es. */
public interface UsersAchievementRepository extends JpaRepository<UsersAchievement, Long> {

	boolean existsByUsersGuidAndAchievementKey(UUID usersGuid, String achievementKey);

	/** Je Achievement eines Users: wie oft, erster und letzter Abschluss. */
	@Query("select new de.gebiter.achievement.dto.UsersAchievementSummary(usersAchievement.achievementKey, "
			+ "count(usersAchievement), min(usersAchievement.achievedAt), max(usersAchievement.achievedAt)) "
			+ "from UsersAchievement usersAchievement where usersAchievement.usersGuid = :usersGuid "
			+ "group by usersAchievement.achievementKey")
	List<UsersAchievementSummary> findUsersAchievementSummariesByUsersGuid(@Param("usersGuid") UUID usersGuid);
}
