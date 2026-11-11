import { adminAccessRoleKey } from '../auth/access/adminAccessRoleKey.ts'
import { fileManagerAccessRoleKey } from '../auth/access/fileManagerAccessRoleKey.ts'

/** Wer den File-Manager betreten darf: eines dieser Rechte reicht. Dieselbe Liste für die Kachel und die Route. */
export const FILE_MANAGER_ENTRY_ACCESS_ROLE_KEYS: string[] = [adminAccessRoleKey, fileManagerAccessRoleKey]
