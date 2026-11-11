/** Der Tab „Achievements“ im Modul „Achievements & Markt“. Abbrechen und Speichern führen hierher zurück. */
export const ACHIEVEMENT_TAB_PATH = '/achievement-manager/achievement'

/** Die Seite „neues Achievement“. */
export const NEW_ACHIEVEMENT_PATH = '/achievement-manager/achievement/new'

/** Die Seite „Achievement bearbeiten“ für das Achievement mit `achievementKey`. */
export function getEditAchievementPath(achievementKey: string): string {
  return '/achievement-manager/achievement/edit/' + achievementKey
}
