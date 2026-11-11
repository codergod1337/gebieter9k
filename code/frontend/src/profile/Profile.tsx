import { Outlet, useParams } from 'react-router'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import { getGalleryListPath } from '../gallery/galleryPaths.ts'
import { getUsersProfilePath } from '../users/usersProfilePath.ts'

/**
 * Das Profilmodul unter `/profile/<guid>`, wie in der Vorlage: sein Subheader mit den Tabs „Übersicht“ und „Galerien“,
 * darunter der gewählte Tab. Erreichbar über das Benutzermenü (`/profile` führt zum eigenen) und über jeden Namen und
 * jedes Profilbild eines Users, z. B. im Gästebuch. Was man sieht, regelt die Sichtbarkeit des Profils.
 */
export function Profile() {
  const { usersGuid } = useParams()
  const profileUsersGuid = usersGuid ?? ''
  const usersProfilePath = getUsersProfilePath(profileUsersGuid)
  const galleryListPath = getGalleryListPath(profileUsersGuid)
  const tabs: SubheaderTab[] = [
    { label: 'Übersicht', iconClassName: 'bi bi-person-circle', to: usersProfilePath, end: true },
    { label: 'Galerien', iconClassName: 'bi bi-images', to: galleryListPath },
  ]
  const subheaderStatus = (
    <>
      <i className="bi bi-person-circle me-2"></i>
      Profil
    </>
  )
  return (
    <>
      <Subheader status={subheaderStatus} tabs={tabs} />
      <div className="main-content">
        <Outlet />
      </div>
    </>
  )
}
