/**
 * Der Key des Admin-Rechts aus der Vite-Umgebung (`VITE_ADMIN_ACCESS_ROLE_KEY` in `.env.development`
 * bzw. `.env.production`), nie aus dem Code. Muss zu `gebiter.accessrole.admin-key` im Backend passen.
 */
const adminAccessRoleKeyFromEnvironment = import.meta.env.VITE_ADMIN_ACCESS_ROLE_KEY
if (adminAccessRoleKeyFromEnvironment === undefined || adminAccessRoleKeyFromEnvironment === '') {
  throw new Error('VITE_ADMIN_ACCESS_ROLE_KEY fehlt in der Vite-Umgebung (.env.development / .env.production).')
}

export const adminAccessRoleKey: string = adminAccessRoleKeyFromEnvironment
