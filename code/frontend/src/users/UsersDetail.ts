import type { MultilingualText } from '../language/MultilingualText.ts'

/**
 * Die Details eines Users (1:1 zu `Users`), so wie das Backend sie als JSON liefert: Profilbild, Status, Über mich, Banner-Drift,
 * Avatar-Farben und Zähler (die setzt nur das Backend). Kontaktangaben stehen in `UsersContact`, je Feld mit eigener
 * Sichtbarkeit.
 * Doku: `docu/entities/UsersDetail.md`
 */
export type UsersDetail = {
  usersGuid: string
  uploadCount: number
  downloadCount: number
  writtenGuestbookEntryCount: number
  /**
   * Das Profilbild groß fürs Profil als PNG in Base64 ohne Präfix, {@link PROFILE_IMAGE_SIZE_PIXELS} im Quadrat: das Bild
   * ganz eingepasst, Seitenverhältnis bleibt, Rest transparent. `null`: die Initialen.
   */
  profileImageBase64Png: string | null
  /** Dasselbe klein ({@link PROFILE_IMAGE_SMALL_SIZE_PIXELS}), für Avatare im Gästebuch, in Listen und später im Chat. */
  profileImageSmallBase64Png: string | null
  /** Der Status-Text im Profilkopf, z. B. was man gerade macht; `null` ohne. */
  statusText: string | null
  /** Der Text der Box „Über mich“ als mehrsprachiger Rich-Text, je Sprachkürzel das bereinigte HTML; `null` ohne. */
  aboutText: MultilingualText | null
  /**
   * Wie schnell das Standard-Banner dieses Profils driftet, in Prozent des Tempos aus dem Theme: 0 steht still, `null`
   * gilt als {@link BANNER_DRIFT_SPEED_DEFAULT_PERCENT}. Gehört zum Profil, jeder Besucher sieht es so.
   */
  bannerDriftSpeedPercent: number | null
  /** Die Schriftfarbe des Avatars ohne Profilbild (`#rrggbb`), `null`: Standard (weiß). */
  avatarTextColor: string | null
  /** Die Hintergrundfarbe des Avatars ohne Profilbild (`#rrggbb`), `null`: Standard (Verlauf aus der GUID). */
  avatarBackgroundColor: string | null
}

/** Höchstlänge des Status-Texts, wie `gebiter.profile-status-text.max-length` im Backend. */
export const PROFILE_STATUS_TEXT_MAX_LENGTH = 160

/** Höchstlänge des Texts „Über mich“ in Zeichen sichtbaren Texts, wie `gebiter.profile-about-text.max-length` im Backend. */
export const PROFILE_ABOUT_TEXT_MAX_LENGTH = 2000

/** Ohne Einstellung driftet das Banner im Tempo des Themes. */
export const BANNER_DRIFT_SPEED_DEFAULT_PERCENT = 100

/** Höchstens so schnell, wie `gebiter.profile-banner-drift.max-percent` im Backend (Nutzer 2026-11-09: 50 % schneller). */
export const BANNER_DRIFT_SPEED_MAX_PERCENT = 150

/** Das Tempo der Banner-Drift eines Profils in Prozent; ohne Einstellung das des Themes. */
export function getBannerDriftSpeedPercent(usersDetail: UsersDetail | null): number {
  if (usersDetail === null || usersDetail.bannerDriftSpeedPercent === null) {
    return BANNER_DRIFT_SPEED_DEFAULT_PERCENT
  }
  return usersDetail.bannerDriftSpeedPercent
}

/** Kante des großen Profilbilds in Pixeln, wie `gebiter.profile-image.size-pixels` im Backend. */
export const PROFILE_IMAGE_SIZE_PIXELS = 600

/** Kante des kleinen Profilbilds in Pixeln, wie `gebiter.profile-image.small-size-pixels` im Backend. */
export const PROFILE_IMAGE_SMALL_SIZE_PIXELS = 96

/**
 * Die kürzeste Kante, die der quadratische Ausschnitt fürs Profilbild im Originalbild haben muss: so groß wie das
 * Profilbild selbst, denn vergrößert wird nie (Regel der Dateivorschau). So füllt der Ausschnitt die 600 × 600 ganz; nur
 * ein Bild, das selbst kleiner ist, bleibt kleiner mit transparentem Rand.
 */
export const PROFILE_IMAGE_MIN_CROP_PIXELS = PROFILE_IMAGE_SIZE_PIXELS
