/** Der Tab „Ränge“ der Administration. Abbrechen und Speichern führen hierher zurück. */
export const RANK_TAB_PATH = '/admin/rank'

/** Die Seite „neuer Rang“. */
export const NEW_RANK_PATH = '/admin/rank/new'

/** Die Seite „Rang bearbeiten“ für den Rang mit `rankKey`. */
export function getEditRankPath(rankKey: string): string {
  return '/admin/rank/edit/' + rankKey
}
