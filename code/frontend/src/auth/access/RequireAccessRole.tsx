import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useCurrentSession } from '../login/useCurrentSession.ts'

type RequireAccessRoleProps = {
  /** Eines dieser Rechte reicht, z. B. ADMIN oder FILE_MANAGER. */
  accessRoleKeys: string[]
  children: ReactNode
}

/**
 * Der Wächter für ein Modul, das mehr als ein Recht öffnet (wie `entryAccessRoleKeys` der Kachel): Ohne eines der Rechte
 * geht es zurück auf die Startseite. Nur Anzeige-Absicherung; die echte Prüfung macht das Backend.
 */
export function RequireAccessRole({ accessRoleKeys, children }: RequireAccessRoleProps) {
  const { hasAccessRole } = useCurrentSession()
  const currentUsersHasOneOfAccessRoles = accessRoleKeys.some(hasAccessRole)
  if (!currentUsersHasOneOfAccessRoles) {
    return <Navigate to="/" replace />
  }
  return children
}
