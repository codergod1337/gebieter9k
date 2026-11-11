import type { ReactNode } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { AchievementBadge } from '../achievement/AchievementBadge.tsx'
import type { Achievement } from '../achievement/Achievement.ts'
import type { UsersAchievementSummary } from '../achievement/UsersAchievementSummary.ts'
import { useUsersAchievement } from '../achievement/useUsersAchievement.ts'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { formatDateTimeWithRelativeDays } from '../components/formatDateTime.ts'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'

/**
 * Box „Achievements“ im eigenen Profil (Nutzer 2026-11-09, scharf geschaltet): alle Achievements als Medaillon
 * ({@link AchievementBadge}, Aussehen aus dem Admin), erreichte farbig mit „×N“ bei mehreren Abschlüssen, gesperrte
 * grau. Die Sprechblase sagt, wofür es das gibt, was es an Punkten bringt und wann es zuletzt erreicht wurde. Die
 * Abschlüsse trägt nur das Backend ein, beim Prüfen des Protokolls.
 */
export function ProfileAchievementsBox() {
  const { achievements } = useMasterData()
  const usersAchievementHook = useUsersAchievement()
  const loadedSummaries = useLoadedData(usersAchievementHook.getOwnUsersAchievementSummaries)
  const summaries = loadedSummaries.data

  let errorMessage: string | null = null
  if (usersAchievementHook.error !== null) {
    errorMessage = usersAchievementHook.error.detail
  }
  const summaryByAchievementKey = new Map<string, UsersAchievementSummary>()
  for (const summary of summaries ?? []) {
    summaryByAchievementKey.set(summary.achievementKey, summary)
  }
  const allAchievements = achievements ?? []
  const achievedCount = allAchievements.filter((achievement) => summaryByAchievementKey.has(achievement.key)).length
  const footerText = achievedCount + ' von ' + allAchievements.length + ' erreicht'

  function renderHint(achievement: Achievement, summary: UsersAchievementSummary | undefined): ReactNode {
    const descriptionText = getTextInCurrentLanguage(achievement.description ?? {})
    let rewardText: string | null = null
    if (achievement.rewardPoints > 0) {
      rewardText = '+' + achievement.rewardPoints + ' Punkte je Abschluss'
      if (!achievement.repeatable) {
        rewardText = '+' + achievement.rewardPoints + ' Punkte'
      }
    }
    let progressText = 'Noch nicht erreicht'
    if (summary !== undefined) {
      const lastAchievedText = formatDateTimeWithRelativeDays(summary.lastAchievedAt)
      progressText = 'Erreicht ' + summary.achievedCount + '×, zuletzt ' + lastAchievedText
      if (summary.achievedCount === 1) {
        progressText = 'Erreicht ' + lastAchievedText
      }
    }
    return (
      <span className="profile-achievement-hint">
        <span className="profile-achievement-hint-title">{getTextInCurrentLanguage(achievement.displayName)}</span>
        {descriptionText !== '' && <span>{descriptionText}</span>}
        {rewardText !== null && <span>{rewardText}</span>}
        <span className="profile-achievement-hint-progress">{progressText}</span>
      </span>
    )
  }

  return (
    <ContentBox title="Achievements" footer={footerText}>
      <ErrorAlert message={errorMessage} />
      {(achievements === null || summaries === null) && errorMessage === null && <Spinner animation="border" size="sm" />}
      {achievements !== null && allAchievements.length === 0 && (
        <p className="profile-achievements-empty">Es gibt noch keine Achievements.</p>
      )}
      <div className="profile-achievements">
        {allAchievements.map((achievement) => {
          const summary = summaryByAchievementKey.get(achievement.key)
          const displayNameText = getTextInCurrentLanguage(achievement.displayName)
          let achievementClassName = 'profile-achievement'
          if (summary === undefined) {
            achievementClassName = 'profile-achievement is-locked'
          }
          return (
            <Hoverlay key={achievement.key} text={renderHint(achievement, summary)}>
              <div className={achievementClassName} tabIndex={0}>
                <span className="profile-achievement-medal">
                  <AchievementBadge achievement={achievement} />
                  {summary !== undefined && summary.achievedCount > 1 && (
                    <span className="badge profile-achievement-count">{'×' + summary.achievedCount}</span>
                  )}
                </span>
                {displayNameText}
              </div>
            </Hoverlay>
          )
        })}
      </div>
    </ContentBox>
  )
}
