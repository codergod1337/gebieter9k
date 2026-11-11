/** Der Tab „Tätigkeiten“ im Modul „Achievements & Markt“. Abbrechen und Speichern führen hierher zurück. */
export const POINT_ACTIVITY_TAB_PATH = '/achievement-manager/point-activity'

/** Die Seite „neue Tätigkeit“. */
export const NEW_POINT_ACTIVITY_PATH = '/achievement-manager/point-activity/new'

/** Die Seite „Tätigkeit bearbeiten“ für die Tätigkeit mit `pointActivityKey`. */
export function getEditPointActivityPath(pointActivityKey: string): string {
  return '/achievement-manager/point-activity/edit/' + pointActivityKey
}
