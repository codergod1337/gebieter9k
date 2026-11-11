/**
 * Ein erreichtes Achievement des angemeldeten Users zusammengefasst, wie `UsersAchievementSummary` im Backend.
 * Doku: `docu/entities/UsersAchievement.md`
 */
export type UsersAchievementSummary = {
  achievementKey: string
  /** wie oft abgeschlossen (bei einmaligen 1) */
  achievedCount: number
  firstAchievedAt: string
  lastAchievedAt: string
}
