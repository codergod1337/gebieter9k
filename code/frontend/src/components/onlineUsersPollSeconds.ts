/**
 * So oft fragt der Header nach, wie viele User online sind, in Sekunden, aus der Vite-Umgebung
 * (`VITE_ONLINE_USERS_POLL_SECONDS`), nie aus dem Code.
 */
const onlineUsersPollSecondsFromEnvironment = import.meta.env.VITE_ONLINE_USERS_POLL_SECONDS
const parsedOnlineUsersPollSeconds = Number(onlineUsersPollSecondsFromEnvironment)
if (!Number.isInteger(parsedOnlineUsersPollSeconds) || parsedOnlineUsersPollSeconds < 10) {
  throw new Error('VITE_ONLINE_USERS_POLL_SECONDS fehlt oder ist keine ganze Zahl ab 10 (.env.development / .env.production).')
}

export const onlineUsersPollSeconds: number = parsedOnlineUsersPollSeconds
