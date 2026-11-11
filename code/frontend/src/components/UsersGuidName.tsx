import { getUsersShownName } from '../users/getUsersShownName.ts'
import { useUsersAvatarForClient } from '../users/useUsersAvatarForClient.ts'
import { HighlightedText } from './HighlightedText.tsx'
import { UsersAvatar, type UsersAvatarSize } from './UsersAvatar.tsx'
import { UsersProfileLink } from './UsersProfileLink.tsx'

type UsersGuidNameProps = {
  usersGuid: string
  /** Der Name der Seite, von der aus man das Profil öffnet, für „Zurück zu …“. */
  originLabel: string
  /** Standard: klein, wie im Gästebuch an Kommentaren. */
  avatarSize?: UsersAvatarSize
  /** In einer Liste mit Suchfeld: die gesuchte Zeichenfolge, ihre Fundstellen im Namen sind markiert. */
  searchText?: string
}

/**
 * Ein User aus seiner GUID, überall gleich (Nutzer 2026-11-09, wie der Autor im Gästebuch): Avatar und fetter Name, beide
 * führen auf sein Profil. Was man sieht, regelt seine Sichtbarkeit: privat ein Smiley und „Anonym“, gelöscht ein „?“
 * ohne Link ({@link getUsersShownName}). Nur die GUID einsetzen, den Rest lädt die Komponente selbst (einmal je GUID für
 * die ganze Seite). Aussehen im Theme (`.users-guid-name`).
 */
export function UsersGuidName({ usersGuid, originLabel, avatarSize = 'small', searchText = '' }: UsersGuidNameProps) {
  const usersAvatar = useUsersAvatarForClient(usersGuid)
  if (usersAvatar === null) {
    return (
      <span className="users-guid-name" aria-busy="true">
        <UsersAvatar usersGuid={usersGuid} username={null} profileImageBase64Png={null} size={avatarSize} anonymous />
        <span className="users-guid-name-text text-body-secondary">…</span>
      </span>
    )
  }
  const avatar = (
    <UsersAvatar
      usersGuid={usersGuid}
      username={usersAvatar.username}
      profileImageBase64Png={usersAvatar.profileImageSmallBase64Png}
      size={avatarSize}
      anonymous={usersAvatar.anonymous}
      textColor={usersAvatar.avatarTextColor}
      backgroundColor={usersAvatar.avatarBackgroundColor}
    />
  )
  const shownName = getUsersShownName(usersAvatar)
  const shownNameText = <HighlightedText text={shownName} searchText={searchText} />
  const usersDeleted = !usersAvatar.anonymous && usersAvatar.username === null
  if (usersDeleted) {
    return (
      <span className="users-guid-name">
        {avatar}
        <strong className="users-guid-name-text">{shownNameText}</strong>
      </span>
    )
  }
  const avatarLinkLabel = 'Profil von ' + shownName
  return (
    <span className="users-guid-name">
      <UsersProfileLink usersGuid={usersGuid} originLabel={originLabel} ariaLabel={avatarLinkLabel}>
        {avatar}
      </UsersProfileLink>
      <UsersProfileLink usersGuid={usersGuid} originLabel={originLabel}>
        <strong className="users-guid-name-text">{shownNameText}</strong>
      </UsersProfileLink>
    </span>
  )
}
