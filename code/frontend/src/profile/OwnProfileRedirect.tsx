import { Navigate } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { getUsersProfilePath } from '../users/usersProfilePath.ts'

/** `/profile` ohne GUID führt zum eigenen Profil, ersetzt dabei den Eintrag im Verlauf. */
export function OwnProfileRedirect() {
  const { session } = useCurrentSession()
  if (session === null) {
    return null
  }
  const ownProfilePath = getUsersProfilePath(session.users.guid)
  return <Navigate to={ownProfilePath} replace />
}
