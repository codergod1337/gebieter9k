import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useOrigin } from '../navigation/useOrigin.ts'
import { getUsersProfilePath } from '../users/usersProfilePath.ts'

type UsersProfileLinkProps = {
  usersGuid: string
  /** Der Name der Seite, von der aus man das Profil öffnet, für „Zurück zu …“, z. B. „Gästebuch“. */
  originLabel: string
  /** Für Screenreader, wenn der Inhalt keinen Text hat (z. B. nur der Avatar). */
  ariaLabel?: string
  children: ReactNode
}

/**
 * Ein Link auf das Profil eines Users, überall gleich (Nutzer 2026-11-09): Name und Profilbild eines Users führen immer
 * auf sein Profil, auch wenn es privat ist; was man dort sieht, regelt die Sichtbarkeit (privat: nur GUID und Smiley).
 * Das Profil öffnet sich mit dieser Seite als Origin („Zurück zu …“). Aussehen im Theme (`.users-profile-link`).
 */
export function UsersProfileLink({ usersGuid, originLabel, ariaLabel, children }: UsersProfileLinkProps) {
  const originNavigation = useOrigin()
  const originState = originNavigation.createOriginStateHere(originLabel)
  const usersProfilePath = getUsersProfilePath(usersGuid)
  return (
    <Link to={usersProfilePath} state={originState} className="users-profile-link" aria-label={ariaLabel}>
      {children}
    </Link>
  )
}
