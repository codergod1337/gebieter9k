/** Die Richtung einer Stimme zu einer Datei, wie `FileCheerDirection` im Backend: begeistert (`UP`) oder angewidert (`DOWN`). */
export type FileCheerDirection = 'UP' | 'DOWN'

/**
 * Der Stand der Stimmen zu einer Datei, wie das Backend ihn liefert (Tabelle `file_cheer`, je User und Datei eine
 * Stimme): beide Zahlen, wer zuletzt so gestimmt hat und wie der angemeldete User selbst gestimmt hat. Die Listen nennen
 * nie alle User, nur die neuesten je Richtung (`gebiter.file.cheer-shown-users-max` im Backend); die Zahl aller Stimmen
 * steht in den Zählern.
 * Doku: `docu/entities/FileCheer.md`
 */
export type FileCheerState = {
  fileDocumentId: string
  cheerUpCount: number
  cheerDownCount: number
  /** Die User, die zuletzt begeistert gestimmt haben, der neueste zuerst. */
  cheerUpUsersGuids: string[]
  /** Die User, die zuletzt angewidert gestimmt haben, der neueste zuerst. */
  cheerDownUsersGuids: string[]
  /** `null`: Der angemeldete User hat nicht gestimmt. */
  directionOfCurrentUsers: FileCheerDirection | null
}

/**
 * Eine Seite der User, die in einer Richtung für eine Datei gestimmt haben, der neueste zuerst (`FileCheerUsersPage` im
 * Backend). Damit lädt „Alle laden“ alle nach, eine Seite nach der anderen.
 * Doku: `docu/entities/FileCheer.md`
 */
export type FileCheerUsersPage = {
  fileDocumentId: string
  direction: FileCheerDirection
  usersGuids: string[]
  /** So viele Stimmen dieser Richtung gibt es insgesamt. */
  totalCount: number
  page: number
  pageSize: number
}
