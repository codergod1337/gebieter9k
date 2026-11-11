import type { Visibility } from './Users.ts'

/** Die Sichtbarkeiten in der Reihenfolge von eng nach weit, so stehen sie in der Liste des {@link VisibilityPicker}. */
export const VISIBILITY_ORDER: readonly Visibility[] = ['NONE', 'FRIENDS', 'AUTHENTICATED', 'ANY']

/** Wie eine Sichtbarkeit heißt, in den Worten des Nutzers (2026-11-09). */
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  NONE: 'Nur ich',
  FRIENDS: 'Ich und meine Freunde',
  AUTHENTICATED: 'Alle User',
  ANY: 'Alle',
}

/** Das Symbol je Sichtbarkeit, für den VisibilityPicker und überall, wo eine Sichtbarkeit klein steht. */
export const VISIBILITY_ICON_CLASS_NAMES: Record<Visibility, string> = {
  NONE: 'bi bi-lock-fill',
  FRIENDS: 'bi bi-people-fill',
  AUTHENTICATED: 'bi bi-person-check-fill',
  ANY: 'bi bi-globe2',
}

/** Was eine Sichtbarkeit bedeutet, für die Erklärung in der Liste und die Sprechblase am Pill. */
export const VISIBILITY_HINTS: Record<Visibility, string> = {
  NONE: 'Nur du selbst.',
  FRIENDS: 'Du und deine Freunde.',
  AUTHENTICATED: 'Jeder angemeldete User.',
  ANY: 'Jeder, auch ohne Anmeldung.',
}
