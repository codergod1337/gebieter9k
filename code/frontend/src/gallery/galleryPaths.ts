import { getUsersProfilePath } from '../users/usersProfilePath.ts'

/** Der Tab „Galerien“ im Profil eines Users. */
export function getGalleryListPath(usersGuid: string): string {
  const usersProfilePath = getUsersProfilePath(usersGuid)
  return usersProfilePath + '/galleries'
}

/** Eine Galerie im Profil ihres Besitzers, unter dem Tab „Galerien“ (der Tab bleibt dort aktiv). */
export function getGalleryPath(usersGuid: string, galleryId: number): string {
  const galleryListPath = getGalleryListPath(usersGuid)
  return galleryListPath + '/' + galleryId
}
