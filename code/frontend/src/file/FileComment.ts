import type { MultilingualText } from '../language/MultilingualText.ts'
import type { UsersAvatarForClient } from '../users/UsersAvatarForClient.ts'

/**
 * Ein Kommentar zu einer Datei, wie das Backend ihn für die Darstellung liefert (Tabelle `file_comment`). Wird nie
 * geändert, nur gelöscht.
 * Doku: `docu/entities/FileComment.md`
 */
export type FileCommentForClient = {
  id: number
  authorUsersGuid: string
  /** Mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML. */
  commentText: MultilingualText
  writtenAt: string
  /** Ob der angemeldete User ihn löschen darf (sein Autor oder der Autor der Datei); für Besucher immer `false`. */
  deletableByCurrentUsers: boolean
}

/**
 * Der Verlauf der Kommentare einer Datei: die Kommentare, die ältesten zuerst, und jeder Autor einmal, fertig
 * aufgelöst. Die Autoren kommen mit, damit auch ein Besucher ohne Anmeldung sie sieht.
 * Doku: `docu/entities/FileComment.md`
 */
export type FileCommentThread = {
  fileDocumentId: string
  comments: FileCommentForClient[]
  authors: UsersAvatarForClient[]
}

/**
 * Wie viele Kommentare eine Datei hat, für die Sprechblase an ihrer Kachel.
 * Doku: `docu/entities/FileComment.md`
 */
export type FileCommentCount = {
  fileDocumentId: string
  commentCount: number
}
