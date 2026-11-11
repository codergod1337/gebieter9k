import type { MultilingualText } from '../language/MultilingualText.ts'
import type { Visibility } from '../users/Users.ts'

/**
 * Eine Galerie im Profil, wie das Backend sie liefert (Tabelle `gallery`).
 * Doku: `docu/entities/Gallery.md`
 */
export type Gallery = {
  id: number
  ownerUsersGuid: string
  title: string
  /** Mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML; `null` ohne. */
  description: MultilingualText | null
  visibility: Visibility
  listingPosition: number
  createdAt: string
}

/**
 * Eine Galerie für die Anzeige: dazu wie viele Bilder der Betrachter darin sieht und die Vorschau des ersten.
 * Doku: `docu/entities/Gallery.md`
 */
export type GalleryForClient = Gallery & {
  fileCount: number
  /** PNG als Base64 ohne Präfix, `null` ohne Bild. */
  coverPreviewBase64Png: string | null
}

/** Was man beim Anlegen und Ändern einer Galerie einträgt. */
export type GalleryInput = {
  title: string
  /** Mehrsprachiger Rich-Text; `null` ohne Beschreibung. */
  description: MultilingualText | null
  visibility: Visibility
}

/** Höchstlänge des Titels, wie `gebiter.gallery.title-max-length` im Backend. */
export const GALLERY_TITLE_MAX_LENGTH = 100

/** Höchstlänge der Beschreibung je Sprache in Zeichen sichtbaren Texts, wie `gebiter.gallery.description-max-length` im Backend. */
export const GALLERY_DESCRIPTION_MAX_LENGTH = 2000
