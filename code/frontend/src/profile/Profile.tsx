import { Outlet, useMatch, useParams } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { Subheader, type SubheaderTab } from '../components/Subheader.tsx'
import {
  getGalleryListPath,
  getGalleryPath,
  getGalleryShareTabPath,
  OPEN_GALLERY_PATH_PATTERN,
} from '../gallery/galleryPaths.ts'
import { GALLERY_TEXTS } from '../gallery/galleryTexts.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getUsersProfilePath } from '../users/usersProfilePath.ts'

/**
 * Das Profilmodul unter `/profile/<guid>`, wie in der Vorlage: sein Subheader mit den Tabs „Übersicht“ und „Galerien“,
 * darunter der gewählte Tab. Erreichbar über das Benutzermenü (`/profile` führt zum eigenen) und über jeden Namen und
 * jedes Profilbild eines Users, z. B. im Gästebuch. Was man sieht, regelt die Sichtbarkeit des Profils.
 *
 * Ist eine Galerie offen, kommen ihre Reiter dazu (Nutzer 2026-11-20): „Bilder“ und, im eigenen Profil, „Freigabe“
 * (die Freigaben der Galerie über einen Link). Aktiv ist dann der Reiter der Galerie, „Galerien“ führt zurück zur
 * Liste. Wie alle Reiter sind es Routen.
 */
export function Profile() {
  const { usersGuid } = useParams()
  const { session } = useCurrentSession()
  const openGalleryMatch = useMatch(OPEN_GALLERY_PATH_PATTERN)
  const profileUsersGuid = usersGuid ?? ''
  const usersProfilePath = getUsersProfilePath(profileUsersGuid)
  const galleryListPath = getGalleryListPath(profileUsersGuid)
  const tabs: SubheaderTab[] = [
    { label: 'Übersicht', iconClassName: 'bi bi-person-circle', to: usersProfilePath, end: true },
    { label: 'Galerien', iconClassName: 'bi bi-images', to: galleryListPath, end: true },
  ]
  let openGalleryIdText: string | undefined = undefined
  if (openGalleryMatch !== null) {
    openGalleryIdText = openGalleryMatch.params.galleryId
  }
  if (openGalleryIdText !== undefined) {
    const openGalleryId = Number(openGalleryIdText)
    const galleryPath = getGalleryPath(profileUsersGuid, openGalleryId)
    const imagesTabLabel = getTextInCurrentLanguage(GALLERY_TEXTS.tabImages)
    tabs.push({ label: imagesTabLabel, iconClassName: 'bi bi-grid-3x3-gap', to: galleryPath, end: true })
    const ownProfile = session !== null && session.users.guid === profileUsersGuid
    if (ownProfile) {
      const galleryShareTabPath = getGalleryShareTabPath(profileUsersGuid, openGalleryId)
      const shareTabLabel = getTextInCurrentLanguage(GALLERY_TEXTS.tabShare)
      tabs.push({ label: shareTabLabel, iconClassName: 'bi bi-link-45deg', to: galleryShareTabPath })
    }
  }
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
