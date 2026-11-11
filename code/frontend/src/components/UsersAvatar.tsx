import type { CSSProperties } from 'react'
import { createSeededRandom } from './seededRandom.ts'

/** Die Größen des Avatars: `small` im Kommentar, `medium` im Eintrag oder in Listen, `large` im Profilkopf. */
export type UsersAvatarSize = 'small' | 'medium' | 'large'

type UsersAvatarProps = {
  /** Die GUID des Users; aus ihr kommt die Farbe des Verlaufs, sie bleibt deshalb immer gleich. */
  usersGuid: string
  /** Aus dem Username kommen die Initialen, solange es kein Profilbild gibt. `null` bei einem gelöschten User. */
  username: string | null
  /** Das Profilbild als PNG-Base64 ohne Präfix, `null` ohne Bild. */
  profileImageBase64Png: string | null
  size: UsersAvatarSize
  /** Privates Profil, das der Betrachter nicht sehen darf: statt Bild und Initialen ein Smiley aus der GUID. */
  anonymous?: boolean
  /** Ohne Profilbild: die Schriftfarbe der Initialen, die der User gewählt hat; `null`: weiß. */
  textColor?: string | null
  /** Ohne Profilbild: die Hintergrundfarbe, die der User gewählt hat; `null`: Verlauf aus der GUID. */
  backgroundColor?: string | null
}

/** Was ein gelöschter User statt der Initialen zeigt. */
const DELETED_USERS_INITIALS = '?'

/** Die Smileys für private Profile; die GUID wählt fest einen davon (Nutzer 2026-11-09). */
const ANONYMOUS_EMOJIS: readonly string[] = [
  '🦊', '🐺', '🦉', '🐙', '🦇', '🐸', '🦝', '🐼', '🐯', '🦁', '🐲', '🦄',
  '👻', '👽', '🤖', '🎃', '🕶️', '🎭', '🦹', '🥷', '🐍', '🦂', '🐝', '🦈',
]

/** Der Smiley eines privaten Profils, aus der GUID: dasselbe Profil zeigt immer denselben. */
function getAnonymousEmoji(usersGuid: string): string {
  const random = createSeededRandom(usersGuid + '-anonym')
  const emojiIndex = Math.floor(random() * ANONYMOUS_EMOJIS.length)
  return ANONYMOUS_EMOJIS[emojiIndex]
}

/** Zwei Buchstaben für den Avatar, solange es kein hochgeladenes Profilbild gibt. */
function getInitials(username: string | null): string {
  if (username === null) {
    return DELETED_USERS_INITIALS
  }
  const firstTwoCharacters = username.slice(0, 2)
  return firstTwoCharacters.toUpperCase()
}

/** Verlauf hinter dem Avatar, die Farbe kommt aus der GUID und bleibt deshalb immer gleich. */
function getAvatarBackground(usersGuid: string): string {
  const random = createSeededRandom(usersGuid)
  const hue = Math.floor(random() * 360)
  const secondHue = (hue + 40) % 360
  return 'linear-gradient(135deg, hsl(' + hue + ' 70% 58%), hsl(' + secondHue + ' 65% 36%))'
}

/**
 * Der Avatar eines Users, überall gleich: das Profilbild (PNG, transparente Teile zeigen den Verlauf) oder die
 * Initialen auf einem Farbverlauf aus der GUID; bei einem privaten Profil ein Smiley aus der GUID. `small` und `medium`
 * sind rund, `large` ist das Profilbild im Profilkopf (seine Form bestimmt dort das Theme). Ohne Profilbild gelten die
 * Farben, die der User für Schrift und Hintergrund gewählt hat (Nutzer 2026-11-09), sonst weiß auf dem Verlauf. Maße in `base.css`, Schatten und Rahmen im Theme. Mit Bild trägt er zusätzlich `users-avatar-with-image`,
 * z. B. für das Vergrößern beim Zeigen darauf.
 */
export function UsersAvatar({
  usersGuid,
  username,
  profileImageBase64Png,
  size,
  anonymous = false,
  textColor = null,
  backgroundColor = null,
}: UsersAvatarProps) {
  let avatarBackground = getAvatarBackground(usersGuid)
  // die Farben, die der User selbst gewählt hat, nur ohne Profilbild und nicht anonym
  const ownColorsApply = profileImageBase64Png === null && !anonymous
  if (ownColorsApply && backgroundColor !== null) {
    avatarBackground = backgroundColor
  }
  const avatarStyle = { '--users-avatar-bg': avatarBackground } as CSSProperties
  if (ownColorsApply && textColor !== null) {
    avatarStyle.color = textColor
  }
  if (anonymous) {
    const anonymousEmoji = getAnonymousEmoji(usersGuid)
    const anonymousClassName = 'users-avatar users-avatar-' + size + ' users-avatar-anonymous emoji-text'
    return (
      <span className={anonymousClassName} style={avatarStyle} aria-hidden="true">
        {anonymousEmoji}
      </span>
    )
  }
  let avatarClassName = 'users-avatar users-avatar-' + size
  if (profileImageBase64Png !== null) {
    avatarClassName = avatarClassName + ' users-avatar-with-image'
  }

  if (profileImageBase64Png !== null) {
    const profileImageSrc = 'data:image/png;base64,' + profileImageBase64Png
    return (
      <span className={avatarClassName} style={avatarStyle} aria-hidden="true">
        <img className="users-avatar-image" src={profileImageSrc} alt="" />
      </span>
    )
  }
  const initials = getInitials(username)
  return (
    <span className={avatarClassName} style={avatarStyle} aria-hidden="true">
      {initials}
    </span>
  )
}
