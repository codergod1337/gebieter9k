/**
 * Ein Uploadberechtigter einer Galerie, wie das Backend ihn liefert (Tabelle `gallery_uploader`, Nutzer 2026-11-22): Der
 * Besitzer hat diesen User eingetragen, er darf Bilder in die Galerie hochladen und sieht sie ganz.
 * Doku: `docu/entities/GalleryUploader.md`
 */
export type GalleryUploader = {
  id: number
  galleryId: number
  /** GUID des Users, der in die Galerie hochladen darf; nie der Besitzer selbst. */
  uploaderUsersGuid: string
}
