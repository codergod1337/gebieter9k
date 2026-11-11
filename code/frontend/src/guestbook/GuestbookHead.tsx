import type { ReactNode } from 'react'
import { DateTimeText } from '../components/DateTimeText.tsx'
import { UsersAvatar, type UsersAvatarSize } from '../components/UsersAvatar.tsx'
import { UsersProfileLink } from '../components/UsersProfileLink.tsx'
import { type GuestbookAuthor, getGuestbookAuthorName } from './Guestbook.ts'

type GuestbookHeadProps = {
  author: GuestbookAuthor
  avatarSize: UsersAvatarSize
  /** Was hinter dem Namen steht, z. B. „hat geschrieben“; `null`: nur der Name. */
  actionText: string | null
  writtenAt: string
  /** Rechts im Kopf, z. B. der Mülleimer. */
  actions: ReactNode
}

/** Woher man kommt, wenn man aus dem Gästebuch ein Profil öffnet. */
const GUESTBOOK_ORIGIN_LABEL = 'Gästebuch'

/**
 * Der Kopf eines Eintrags oder Kommentars: Avatar, Name des Autors, wann, rechts die Knöpfe. Avatar und Name führen auf
 * das Profil des Autors; ein gelöschter Autor hat keins.
 */
export function GuestbookHead({ author, avatarSize, actionText, writtenAt, actions }: GuestbookHeadProps) {
  const authorName = getGuestbookAuthorName(author)
  const avatar = (
    <UsersAvatar
      usersGuid={author.usersGuid}
      username={author.username}
      profileImageBase64Png={author.profileImageSmallBase64Png}
      size={avatarSize}
      textColor={author.avatarTextColor}
      backgroundColor={author.avatarBackgroundColor}
    />
  )
  const authorDeleted = author.username === null
  if (authorDeleted) {
    return (
      <div className="guestbook-head">
        {avatar}
        <span className="guestbook-head-text">
          <strong>{authorName}</strong>
          {actionText !== null && ' ' + actionText}
          <span className="guestbook-time"><DateTimeText isoDateTime={writtenAt} label="Geschrieben" /></span>
        </span>
        {actions}
      </div>
    )
  }
  const avatarLinkLabel = 'Profil von ' + authorName
  return (
    <div className="guestbook-head">
      <UsersProfileLink usersGuid={author.usersGuid} originLabel={GUESTBOOK_ORIGIN_LABEL} ariaLabel={avatarLinkLabel}>
        {avatar}
      </UsersProfileLink>
      <span className="guestbook-head-text">
        <UsersProfileLink usersGuid={author.usersGuid} originLabel={GUESTBOOK_ORIGIN_LABEL}>
          <strong>{authorName}</strong>
        </UsersProfileLink>
        {actionText !== null && ' ' + actionText}
        <span className="guestbook-time"><DateTimeText isoDateTime={writtenAt} label="Geschrieben" /></span>
      </span>
      {actions}
    </div>
  )
}
