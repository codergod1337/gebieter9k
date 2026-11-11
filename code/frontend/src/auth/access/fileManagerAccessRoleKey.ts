/**
 * Der Key des File-Manager-Rechts aus der Vite-Umgebung (`VITE_FILE_MANAGER_ACCESS_ROLE_KEY` in `.env.development` bzw.
 * `.env.production`), nie aus dem Code. Muss zu `gebiter.accessrole.file-manager-key` im Backend passen.
 */
const fileManagerAccessRoleKeyFromEnvironment = import.meta.env.VITE_FILE_MANAGER_ACCESS_ROLE_KEY
if (fileManagerAccessRoleKeyFromEnvironment === undefined || fileManagerAccessRoleKeyFromEnvironment === '') {
  throw new Error('VITE_FILE_MANAGER_ACCESS_ROLE_KEY fehlt in der Vite-Umgebung (.env.development / .env.production).')
}

export const fileManagerAccessRoleKey: string = fileManagerAccessRoleKeyFromEnvironment
