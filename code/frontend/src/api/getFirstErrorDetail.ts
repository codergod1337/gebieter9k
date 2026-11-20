import type { ApiError } from './ApiError.ts'

/**
 * Der Text des ersten Fehlers aus mehreren Entity-Hooks einer Ansicht, in der genannten Reihenfolge, `null` ohne
 * Fehler. Beispiel: `getFirstErrorDetail([rankHook.error, orderRankHook.error])` für den Fuß eines Tabs, der lädt und
 * sortiert (`components/LoadStatus.tsx`).
 */
export function getFirstErrorDetail(errors: (ApiError | null)[]): string | null {
  for (const error of errors) {
    if (error !== null) {
      return error.detail
    }
  }
  return null
}
