/**
 * Wie viele User gerade online sind, wie `OnlineUsersCount` im Backend.
 * Doku: `docu/entities/Users.md`
 */
export type OnlineUsersCount = {
  onlineUsersCount: number
}

/**
 * Ob ein User gerade online ist und seit wann, wie `UsersOnlineStatus` im Backend. Kein „zuletzt online“ (Nutzer
 * 2026-11-09: kein Stasi-Tracking).
 * Doku: `docu/entities/Users.md`
 */
export type UsersOnlineStatus = {
  online: boolean
  /** seit wann am Stück da, `null` wenn offline */
  onlineSince: string | null
}
