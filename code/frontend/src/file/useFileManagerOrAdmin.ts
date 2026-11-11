import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS } from '../filemanager/fileManagerEntryAccessRoleKeys.ts'

/**
 * Ist der angemeldete User FILE_MANAGER oder ADMIN? Dann ändert er Dateien über die Endpunkte des
 * File-Managers (jede Datei), sonst über die eigenen (nur seine Dateien mit Schreibrolle).
 */
export function useFileManagerOrAdmin(): boolean {
  const { hasAccessRole } = useCurrentSession()
  return FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS.some((accessRoleKey) => hasAccessRole(accessRoleKey))
}
