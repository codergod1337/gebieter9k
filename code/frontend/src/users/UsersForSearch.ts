import type { UsersAvatarForClient } from './UsersAvatarForClient.ts'

/**
 * Ein Treffer der Vervollständigung von Usern (`UsersForSearch` im Backend, `POST /api/users/search`): die GUID, die der
 * Aufrufer speichert, der Username und das, was man für den Avatar braucht. Den Username gibt es bei jedem Treffer, auch
 * bei einem privaten Profil; der Avatar folgt der Sichtbarkeit des Profils (privat der Smiley aus der GUID). Nie die
 * E-Mail-Adresse, auch wenn sie den Treffer ergeben hat.
 * Doku: `docu/entities/Users.md`
 */
export type UsersForSearch = {
  usersGuid: string
  username: string
  usersAvatar: UsersAvatarForClient
}

/**
 * Ab so vielen getippten Zeichen sucht die Vervollständigung auch am Anfang der E-Mail-Adresse, wie
 * `gebiter.users.search-email-min-length` im Backend.
 */
export const USERS_SEARCH_EMAIL_MIN_LENGTH = 4
