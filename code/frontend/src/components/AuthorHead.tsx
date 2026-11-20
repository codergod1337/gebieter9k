import type { ReactNode } from 'react'
import { getUsersShownName } from '../users/getUsersShownName.ts'
import type { UsersAvatarForClient } from '../users/UsersAvatarForClient.ts'
import { DateTimeText } from './DateTimeText.tsx'
import { UsersAvatar, type UsersAvatarSize } from './UsersAvatar.tsx'
import { UsersProfileLink } from './UsersProfileLink.tsx'

type AuthorHeadProps = {
  /** Wer geschrieben hat, schon aufgelöst (Name, kleines Profilbild, Avatar-Farben; privat `anonymous`). */
  author: UsersAvatarForClient
  /** Der Name der Seite, von der aus man das Profil des Autors öffnet, für „Zurück zu …“, z. B. „Gästebuch“. */
  originLabel: string
  avatarSize: UsersAvatarSize
  /** Was hinter dem Namen steht, z. B. „hat geschrieben“; `null`: nur der Name. */
  actionText: string | null
  writtenAt: string
  /** Rechts im Kopf, z. B. der Mülleimer. */
  actions?: ReactNode
}

/**
 * Der Kopf von etwas Geschriebenem, überall gleich (Gästebucheintrag, Kommentar im Gästebuch, Kommentar an einem
 * Bild): Avatar, Name des Autors, wann, rechts die Knöpfe. Avatar und Name führen auf das Profil des Autors; ein
 * gelöschter Autor hat keins. Der Autor kommt fertig aufgelöst mit, die Komponente fragt nichts nach: So geht sie auch
 * für einen Besucher ohne Anmeldung. Lage in base.css (`.author-head*`), Farben im Theme.
 */
export function AuthorHead({ author, originLabel, avatarSize, actionText, writtenAt, actions }: AuthorHeadProps) {
  const authorName = getUsersShownName(author)
  const avatar = (
    <UsersAvatar
      usersGuid={author.usersGuid}
      username={author.username}
      profileImageBase64Png={author.profileImageSmallBase64Png}
      size={avatarSize}
      anonymous={author.anonymous}
      textColor={author.avatarTextColor}
      backgroundColor={author.avatarBackgroundColor}
    />
  )
  const writtenAtText = (
    <span className="author-head-time">
      <DateTimeText isoDateTime={writtenAt} label="Geschrieben" />
    </span>
  )
  const authorDeleted = !author.anonymous && author.username === null
  if (authorDeleted) {
    return (
      <div className="author-head">
        {avatar}
        <span className="author-head-text">
          <strong>{authorName}</strong>
          {actionText !== null && ' ' + actionText}
          {writtenAtText}
        </span>
        {actions}
      </div>
    )
  }
  const avatarLinkLabel = 'Profil von ' + authorName
  return (
    <div className="author-head">
      <UsersProfileLink usersGuid={author.usersGuid} originLabel={originLabel} ariaLabel={avatarLinkLabel}>
        {avatar}
      </UsersProfileLink>
      <span className="author-head-text">
        <UsersProfileLink usersGuid={author.usersGuid} originLabel={originLabel}>
          <strong>{authorName}</strong>
        </UsersProfileLink>
        {actionText !== null && ' ' + actionText}
        {writtenAtText}
      </span>
      {actions}
    </div>
  )
}
