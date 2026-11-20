/**
 * Der Key des Rechts, mit dem ein User eine eigene Galerie über einen Link freigeben darf, aus der Vite-Umgebung
 * (`VITE_GALLERY_SHARE_ACCESS_ROLE_KEY` in `.env.development` bzw. `.env.production`), nie aus dem Code. Muss zur
 * Prüfung am `GalleryShareService` im Backend passen (ADMIN oder FREIGABE). Die Oberfläche blendet damit nur den Knopf
 * ein; ob jemand wirklich darf, prüft das Backend.
 */
const galleryShareAccessRoleKeyFromEnvironment = import.meta.env.VITE_GALLERY_SHARE_ACCESS_ROLE_KEY
if (galleryShareAccessRoleKeyFromEnvironment === undefined || galleryShareAccessRoleKeyFromEnvironment === '') {
  throw new Error('VITE_GALLERY_SHARE_ACCESS_ROLE_KEY fehlt in der Vite-Umgebung (.env.development / .env.production).')
}

export const galleryShareAccessRoleKey: string = galleryShareAccessRoleKeyFromEnvironment
