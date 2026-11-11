import type { ApiError } from './ApiError.ts'

/**
 * Der Zustand, den JEDER Entity-Hook (z. B. `useUsers`) gleich liefert, für die Anzeige:
 *
 * - `isLoading`: mindestens ein Request dieses Hooks läuft gerade
 * - `error`: der Fehler des letzten fehlgeschlagenen Requests, sonst `null`
 */
export type ApiHookState = {
  isLoading: boolean
  error: ApiError | null
}
