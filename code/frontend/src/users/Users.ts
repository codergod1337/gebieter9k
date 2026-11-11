/** Wer etwas sehen darf, wie das Enum `Visibility` im Backend. */
export type Visibility = 'NONE' | 'FRIENDS' | 'AUTHENTICATED' | 'ANY'

/** Status eines Users, wie das Enum `UsersStatus` im Backend. */
export type UsersStatus = 'ACTIVE' | 'DELETED'

/**
 * Ein User, genau so, wie ihn das Backend als JSON liefert und bei PUT erwartet.
 * Doku: `docu/entities/Users.md`
 */
export type Users = {
  guid: string
  username: string
  email: string
  profileVisibility: Visibility
  friendListVisibility: Visibility
  /** Die Position (AccessRoleCollection), `null` heißt keine. */
  accessRoleCollectionKey: string | null
  status: UsersStatus
  /** Der Punktestand, setzt nur das Backend. */
  points: number
}

/**
 * Was ein anderer vom User selbst sieht, wie `UsersForProfile` im Backend: GUID, Name, Position und Punkte. Nie die
 * E-Mail-Adresse und nie seine Einstellungen. Der eigene `Users` passt ebenfalls hierher.
 * Doku: `docu/entities/Users.md`
 */
export type UsersForProfile = {
  guid: string
  username: string
  accessRoleCollectionKey: string | null
  points: number
}

/**
 * Ein User für die Anzeige bei anderen, wie `UsersForClient` im Backend: Darf man sein Profil sehen, kommt
 * {@link UsersForProfile}; sonst nur die GUID (immer öffentlich), `profileVisible` ist `false` und `users` `null`. Dann
 * lädt man vom Rest nichts.
 * Doku: `docu/entities/Users.md`
 */
export type UsersForClient = {
  usersGuid: string
  profileVisible: boolean
  users: UsersForProfile | null
}

/**
 * Body, mit dem der Admin einen User anlegt (`NewUsers` im Backend, `POST /api/admin/users`): Username und E-Mail wie
 * bei der Registrierung, dazu wahlweise eine vorgegebene GUID und das Passwort.
 * Doku: `docu/entities/Users.md`
 */
export type NewUsers = {
  username: string
  email: string
  /** fehlt sie, vergibt das Backend eine neue GUID */
  guid?: string
  /** das Passwort, schon mit SHA-256 gehasht; fehlt es, setzt das Backend das Startpasswort */
  sha256HexPassword?: string
}
