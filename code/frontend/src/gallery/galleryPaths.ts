import { getUsersProfilePath } from '../users/usersProfilePath.ts'

/** Der Tab „Galerien“ im Profil eines Users. */
export function getGalleryListPath(usersGuid: string): string {
  const usersProfilePath = getUsersProfilePath(usersGuid)
  return usersProfilePath + '/galleries'
}

/**
 * Eine Galerie im Profil ihres Besitzers: ihre Bilder. Solange eine Galerie offen ist, zeigt der Subheader des Profils
 * dafür den Reiter „Bilder“ (und dem Besitzer „Freigabe“).
 */
export function getGalleryPath(usersGuid: string, galleryId: number): string {
  const galleryListPath = getGalleryListPath(usersGuid)
  return galleryListPath + '/' + galleryId
}

/** Der Reiter „Freigabe“ einer eigenen Galerie: ihre Freigaben über einen Link. */
export function getGalleryShareTabPath(usersGuid: string, galleryId: number): string {
  const galleryPath = getGalleryPath(usersGuid, galleryId)
  return galleryPath + '/share'
}

/** Das Muster der Adressen einer offenen Galerie, mit allem darunter (für `useMatch` im Profil). */
export const OPEN_GALLERY_PATH_PATTERN = '/profile/:usersGuid/galleries/:galleryId/*'
