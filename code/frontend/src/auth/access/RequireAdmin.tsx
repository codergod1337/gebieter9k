import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useCurrentSession } from '../login/useCurrentSession.ts'
import { adminAccessRoleKey } from './adminAccessRoleKey.ts'

type RequireAdminProps = {
  children: ReactNode
}

/**
 * Der Wächter für den Adminbereich: Ohne Admin-Recht geht es zurück auf die Startseite.
 *
 * Nur Anzeige-Absicherung. Die echte Prüfung macht das Backend (`@PreAuthorize`). Solange die
 * Befüll-Phase läuft, sind die Endpunkte dort noch offen.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { hasAccessRole } = useCurrentSession()
  const currentUsersIsAdmin = hasAccessRole(adminAccessRoleKey)
  if (!currentUsersIsAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}
