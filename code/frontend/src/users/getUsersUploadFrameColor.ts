import { createSeededRandom } from '../components/seededRandom.ts'
import type { UsersAvatarForClient } from './UsersAvatarForClient.ts'

/** Sättigung und Helligkeit der Rahmenfarbe aus der GUID in Prozent: kräftig genug für einen Rahmen auf hellem Papier. */
const DEFAULT_UPLOAD_FRAME_SATURATION_PERCENT = 78
const DEFAULT_UPLOAD_FRAME_LIGHTNESS_PERCENT = 44

/** Ein Farbanteil von 0 bis 1 als zwei Hex-Ziffern. */
function createHexColorPart(colorPart: number): string {
  const colorPartByte = Math.round(colorPart * 255)
  const hexText = colorPartByte.toString(16)
  return hexText.padStart(2, '0')
}

/** Eine Farbe aus Farbton (0 bis 360), Sättigung und Helligkeit (Prozent) als `#rrggbb`. */
function createHexColorFromHsl(hue: number, saturationPercent: number, lightnessPercent: number): string {
  const saturation = saturationPercent / 100
  const lightness = lightnessPercent / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const hueSection = hue / 60
  const secondPart = chroma * (1 - Math.abs((hueSection % 2) - 1))
  let red = 0
  let green = 0
  let blue = 0
  if (hueSection < 1) {
    red = chroma
    green = secondPart
  } else if (hueSection < 2) {
    red = secondPart
    green = chroma
  } else if (hueSection < 3) {
    green = chroma
    blue = secondPart
  } else if (hueSection < 4) {
    green = secondPart
    blue = chroma
  } else if (hueSection < 5) {
    red = secondPart
    blue = chroma
  } else {
    red = chroma
    blue = secondPart
  }
  const lightnessOffset = lightness - chroma / 2
  const redText = createHexColorPart(red + lightnessOffset)
  const greenText = createHexColorPart(green + lightnessOffset)
  const blueText = createHexColorPart(blue + lightnessOffset)
  return '#' + redText + greenText + blueText
}

/**
 * Die Rahmenfarbe eines Users, solange er keine gewählt hat: eine Farbe aus seiner GUID als `#rrggbb`. Dieselbe GUID
 * ergibt immer dieselbe Farbe, zwei User fast immer verschiedene.
 */
export function getDefaultUploadFrameColor(usersGuid: string): string {
  const random = createSeededRandom(usersGuid + '-rahmen')
  const hue = Math.floor(random() * 360)
  return createHexColorFromHsl(hue, DEFAULT_UPLOAD_FRAME_SATURATION_PERCENT, DEFAULT_UPLOAD_FRAME_LIGHTNESS_PERCENT)
}

/**
 * Die Rahmenfarbe der Uploads eines Users, an EINER Stelle (Nutzer 2026-11-22): die Farbe, die er in seinem Profil
 * gewählt hat (`UsersDetail.uploadFrameColor`), sonst die aus seiner GUID. Auch bei einem privaten Profil und solange
 * seine Darstellung noch lädt (`usersAvatar` ist dann `null`) gilt die Farbe aus der GUID. Für den Rahmen der
 * Bildkacheln einer gemeinsamen Galerie und für das Farbfeld in ihrer Legende.
 */
export function getUsersUploadFrameColor(usersGuid: string, usersAvatar: UsersAvatarForClient | null): string {
  if (usersAvatar !== null && usersAvatar.uploadFrameColor !== null) {
    return usersAvatar.uploadFrameColor
  }
  return getDefaultUploadFrameColor(usersGuid)
}
