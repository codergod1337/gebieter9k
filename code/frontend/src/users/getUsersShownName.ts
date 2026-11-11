import type { UsersAvatarForClient } from './UsersAvatarForClient.ts'

/** Was statt des Namens steht, wenn der User privat ist. */
export const ANONYMOUS_USERS_NAME = 'Anonym'

/** Was statt des Namens steht, wenn es den User nicht mehr gibt. */
export const DELETED_USERS_NAME = 'Gelöschter User'

/**
 * Der Name, unter dem ein User überall steht, an EINER Stelle: sein Username; privat „Anonym“, gelöscht oder unbekannt
 * „Gelöschter User“. Für die Anzeige (`UsersGuidName`) und für die Suche in einer Liste von Usern (`UsersGuidList`).
 */
export function getUsersShownName(usersAvatar: UsersAvatarForClient): string {
  if (usersAvatar.anonymous) {
    return ANONYMOUS_USERS_NAME
  }
  if (usersAvatar.username === null) {
    return DELETED_USERS_NAME
  }
  return usersAvatar.username
}
