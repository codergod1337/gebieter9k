import type { MultilingualText } from '../language/MultilingualText.ts'
import type { UsersAvatarForClient } from '../users/UsersAvatarForClient.ts'

/**
 * Ein Gästebucheintrag, wie ihn das Backend nach dem Schreiben liefert (Tabelle `guestbook`). Wird nie geändert.
 * Doku: `docu/entities/Guestbook.md`
 */
export type Guestbook = {
  id: number
  /** Wessen Gästebuch. */
  profileUsersGuid: string
  authorUsersGuid: string
  /** Mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML. */
  entryText: MultilingualText
  writtenAt: string
}

/**
 * Ein Kommentar unter einem Eintrag, wie ihn das Backend nach dem Schreiben liefert (`guestbook_comment`).
 * Doku: `docu/entities/GuestbookComment.md`
 */
export type GuestbookComment = {
  id: number
  guestbookId: number
  authorUsersGuid: string
  /** Mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML. */
  commentText: MultilingualText
  writtenAt: string
}

/**
 * Ein Emoji an einem Eintrag oder Kommentar: wie oft vergeben und ob der angemeldete User es selbst vergeben hat.
 * Doku: `docu/entities/GuestbookReaction.md`
 */
export type GuestbookReactionCount = {
  reactionEmoji: string
  reactionCount: number
  reactedByCurrentUsers: boolean
}

/**
 * Einmal je Autor in einer Seite: Username, das kleine Profilbild und die Farben seines Avatars ohne Bild (`null`:
 * Standard). Bei einem gelöschten User ist `username` `null`.
 * Doku: `docu/entities/Guestbook.md`
 */
export type GuestbookAuthor = {
  usersGuid: string
  username: string | null
  profileImageSmallBase64Png: string | null
  avatarTextColor: string | null
  avatarBackgroundColor: string | null
}

/**
 * Ein Kommentar für die Darstellung, samt Smileys und ob der angemeldete User ihn löschen darf.
 * Doku: `docu/entities/GuestbookComment.md`
 */
export type GuestbookCommentForClient = {
  id: number
  authorUsersGuid: string
  /** Mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML. */
  commentText: MultilingualText
  writtenAt: string
  reactionCounts: GuestbookReactionCount[]
  deletableByCurrentUsers: boolean
}

/**
 * Ein Eintrag für die Darstellung, samt Smileys, Kommentaren (älteste zuerst) und Löschrecht.
 * Doku: `docu/entities/Guestbook.md`
 */
export type GuestbookEntryForClient = {
  id: number
  authorUsersGuid: string
  /** Mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML. */
  entryText: MultilingualText
  writtenAt: string
  reactionCounts: GuestbookReactionCount[]
  comments: GuestbookCommentForClient[]
  deletableByCurrentUsers: boolean
}

/**
 * Eine Seite eines Gästebuchs (neueste Einträge zuerst), alles für die Darstellung in einer Antwort.
 * Doku: `docu/entities/Guestbook.md`
 */
export type GuestbookPage = {
  profileUsersGuid: string
  entries: GuestbookEntryForClient[]
  /** Jeder vorkommende Autor einmal, so steht jedes Profilbild nur einmal in der Antwort. */
  authorsByUsersGuid: Record<string, GuestbookAuthor>
  totalCount: number
  /** Die Seite, ab 0. */
  page: number
  pageSize: number
}

/**
 * Der Autor aus der Seite in der Form, die die globalen Bausteine nehmen (`AuthorHead`, `CommentItem`); fehlt er (sollte
 * nicht vorkommen), ein Autor ohne Namen und Bild. Im Gästebuch ist nie jemand anonym: Wer hineinschreibt, steht dort
 * nach den Regeln dieses Profils mit Namen.
 */
export function findGuestbookAuthor(guestbookPage: GuestbookPage, authorUsersGuid: string): UsersAvatarForClient {
  const guestbookAuthor = guestbookPage.authorsByUsersGuid[authorUsersGuid]
  if (guestbookAuthor === undefined) {
    return {
      usersGuid: authorUsersGuid,
      anonymous: false,
      username: null,
      profileImageSmallBase64Png: null,
      avatarTextColor: null,
      avatarBackgroundColor: null,
      uploadFrameColor: null,
    }
  }
  return {
    usersGuid: guestbookAuthor.usersGuid,
    anonymous: false,
    username: guestbookAuthor.username,
    profileImageSmallBase64Png: guestbookAuthor.profileImageSmallBase64Png,
    avatarTextColor: guestbookAuthor.avatarTextColor,
    avatarBackgroundColor: guestbookAuthor.avatarBackgroundColor,
    // Die Rahmenfarbe der Uploads braucht das Gästebuch nicht, sein Autor trägt sie nicht mit
    uploadFrameColor: null,
  }
}
