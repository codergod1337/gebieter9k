import { useParams } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { OtherUsersProfileOverview } from './OtherUsersProfileOverview.tsx'
import { ProfileOverview } from './ProfileOverview.tsx'

/**
 * Der Tab „Übersicht“ eines Profils: die eigene GUID zeigt das eigene Profil mit allem Bearbeiten, jede andere das
 * Profil dieses Users nach seiner Sichtbarkeit.
 */
export function ProfileHome() {
  const { usersGuid } = useParams()
  const { session } = useCurrentSession()
  if (session === null || usersGuid === undefined) {
    return null
  }
  const ownProfile = usersGuid === session.users.guid
  if (ownProfile) {
    return <ProfileOverview />
  }
  // je Profil frisch aufgebaut: Wechselt man von einem Profil zum nächsten, bleibt nichts vom vorigen stehen
  return <OtherUsersProfileOverview key={usersGuid} profileUsersGuid={usersGuid} />
}
