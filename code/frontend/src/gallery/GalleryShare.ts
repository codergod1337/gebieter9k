import type { FileDocumentPage } from '../file/FileDocument.ts'
import type { FileSolrFieldNameSet } from '../file/FileSolrFieldNameSet.ts'
import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Eine Freigabe einer Galerie über einen Link mit Token, so wie der Besitzer sie sieht (Tabelle `gallery_share`), mit
 * ihrem Token: Aus ihm wird der Link zum Weitergeben (`getGalleryShareLink`), jederzeit wieder abrufbar.
 * Doku: `docu/entities/GalleryShare.md`
 */
export type GalleryShare = {
  id: number
  galleryId: number
  /** Die Bezeichnung, z. B. „für Oma“. */
  label: string
  /** Der Token für den Link, Hex-Text. */
  shareToken: string
  /** Bis wann die Freigabe gilt (ISO-Text), `null` ohne zeitliche Grenze. */
  expiresAt: string | null
  /** Wie viele Aufrufe sie höchstens erlaubt, `null` ohne Grenze. */
  maxAccessCount: number | null
  /** Wie viele Aufrufe es schon gab (ein Bild im Viewer geladen oder heruntergeladen). */
  accessCount: number
  /** In wie vielen Bildern die Freigabe stehen soll (Postgres). */
  fileCount: number
  /** In wie vielen Bildern sie wirklich steht (Solr); weicht die Zahl ab, stimmt etwas nicht. */
  sharedFileCount: number
  createdAt: string
}

/** Was man beim Anlegen einer Freigabe einträgt; höchstens eine der beiden Grenzen. */
export type NewGalleryShare = {
  galleryId: number
  label: string
  expiresAt: string | null
  maxAccessCount: number | null
}

/**
 * Die Standardansicht einer Freigabe für einen Besucher: die Galerie und eine Seite ihrer Bilder. Die Feldnamen kommen
 * mit, weil ein Besucher ohne Anmeldung die Stammdaten nicht hat.
 */
export type SharedGallery = {
  title: string
  description: MultilingualText | null
  expiresAt: string | null
  /** Wie viele Aufrufe noch gehen, `null` ohne Grenze. */
  remainingAccessCount: number | null
  filePage: FileDocumentPage
  fileSolrFieldNameSet: FileSolrFieldNameSet
}

/** Höchstlänge der Bezeichnung, wie `gebiter.gallery-share.label-max-length` im Backend. */
export const GALLERY_SHARE_LABEL_MAX_LENGTH = 100

/** Höchstens so viele Bilder in einer Auswahl, wie `gebiter.gallery-share.selection-max-file-count` im Backend. */
export const GALLERY_SHARE_SELECTION_MAX_FILE_COUNT = 2000
