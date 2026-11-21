import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'

/** Wie lange der Link gilt: dauerhaft, bis zu einem Zeitpunkt oder für eine Zahl von Aufrufen. */
export type GalleryShareDurationChoice = 'PERMANENT' | 'UNTIL' | 'ACCESS_LIMITED'

/**
 * Was bei der Laufzeit einer Freigabe gewählt und getippt ist: beim Anlegen (`NewGallerySharePopup`, Schritt 2) und beim
 * Ändern (`EditGalleryShareDurationPopup`). Die Eingaben zeichnet `GalleryShareDurationFields`.
 */
export type GalleryShareDurationInput = {
  durationChoice: GalleryShareDurationChoice
  /** nur bei „bis zu einem Zeitpunkt“: der Wert des Felds `datetime-local` (Ortszeit) */
  expiresAtLocalText: string
  /** nur bei „für eine Zahl von Aufrufen“: der getippte Text */
  maxAccessCountText: string
}

/** Die Grenzen einer Freigabe, wie das Backend sie bekommt: höchstens eine von beiden ist gesetzt. */
export type GalleryShareLimits = {
  /** Bis wann sie gilt (ISO-Text, UTC), `null` ohne zeitliche Grenze. */
  expiresAt: string | null
  /** Wie viele Aufrufe sie höchstens erlaubt, `null` ohne Grenze. */
  maxAccessCount: number | null
}

/** Was aus einer Eingabe wird: die Grenzen, oder was an der Eingabe noch nicht passt. */
export type GalleryShareLimitsResult = {
  limits: GalleryShareLimits | null
  errorMessage: string | null
}

/** Der Anfangszustand beim Anlegen: dauerhaft. */
export const START_GALLERY_SHARE_DURATION_INPUT: GalleryShareDurationInput = {
  durationChoice: 'PERMANENT',
  expiresAtLocalText: '',
  maxAccessCountText: '',
}

const WHOLE_NUMBER_PATTERN = /^\d+$/

/** Ein Zeitpunkt (ISO, UTC) als Wert für `datetime-local` in Ortszeit, z. B. `2026-12-31T23:59`. */
function toDateTimeLocalText(isoDateTimeText: string): string {
  const dateTime = new Date(isoDateTimeText)
  if (Number.isNaN(dateTime.getTime())) {
    return ''
  }
  const timezoneOffsetMillis = dateTime.getTimezoneOffset() * 60 * 1000
  const localDateTime = new Date(dateTime.getTime() - timezoneOffsetMillis)
  const localIsoText = localDateTime.toISOString()
  return localIsoText.slice(0, 16)
}

/** Der Anfangszustand beim Ändern: die Wahl und die Werte, die die Freigabe gerade hat. */
export function createGalleryShareDurationInput(knownLimits: GalleryShareLimits): GalleryShareDurationInput {
  if (knownLimits.expiresAt !== null) {
    const expiresAtLocalText = toDateTimeLocalText(knownLimits.expiresAt)
    return { durationChoice: 'UNTIL', expiresAtLocalText, maxAccessCountText: '' }
  }
  if (knownLimits.maxAccessCount !== null) {
    const maxAccessCountText = String(knownLimits.maxAccessCount)
    return { durationChoice: 'ACCESS_LIMITED', expiresAtLocalText: '', maxAccessCountText }
  }
  return START_GALLERY_SHARE_DURATION_INPUT
}

/**
 * Macht aus der Eingabe die Grenzen für das Backend, mit denselben Regeln wie dort
 * (`GalleryShareService.requireValidLimits`): Ein Zeitpunkt muss gewählt sein und in der Zukunft liegen, eine Zahl von
 * Aufrufen eine ganze Zahl ab 1 sein. Was die Wahl ausblendet, zählt nicht.
 *
 * @param knownExpiresAt beim Ändern der Ablauf, den die Freigabe schon hat: Bleibt er derselbe, darf er auch in der
 *        Vergangenheit liegen (eine abgelaufene Freigabe unverändert lassen); beim Anlegen `null`
 */
export function createGalleryShareLimitsOfInput(
  durationInput: GalleryShareDurationInput,
  knownExpiresAt: string | null,
): GalleryShareLimitsResult {
  if (durationInput.durationChoice === 'UNTIL') {
    const trimmedExpiresAtLocalText = durationInput.expiresAtLocalText.trim()
    const expiresAtDate = new Date(trimmedExpiresAtLocalText)
    const expiresAtMillis = expiresAtDate.getTime()
    if (trimmedExpiresAtLocalText === '' || Number.isNaN(expiresAtMillis)) {
      return { limits: null, errorMessage: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.expiresAtMissing) }
    }
    let knownExpiresAtLocalText = ''
    if (knownExpiresAt !== null) {
      knownExpiresAtLocalText = toDateTimeLocalText(knownExpiresAt)
    }
    if (knownExpiresAt !== null && trimmedExpiresAtLocalText === knownExpiresAtLocalText) {
      // unverändert: genau den gespeicherten Wert zurückgeben, auch mit seinen Sekunden
      return { limits: { expiresAt: knownExpiresAt, maxAccessCount: null }, errorMessage: null }
    }
    if (expiresAtMillis <= Date.now()) {
      return { limits: null, errorMessage: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.expiresAtInPast) }
    }
    const expiresAt = expiresAtDate.toISOString()
    return { limits: { expiresAt, maxAccessCount: null }, errorMessage: null }
  }
  if (durationInput.durationChoice === 'ACCESS_LIMITED') {
    const trimmedMaxAccessCountText = durationInput.maxAccessCountText.trim()
    const enteredMaxAccessCount = Number(trimmedMaxAccessCountText)
    const isWholeNumber = WHOLE_NUMBER_PATTERN.test(trimmedMaxAccessCountText)
    const validMaxAccessCount = isWholeNumber && Number.isSafeInteger(enteredMaxAccessCount) && enteredMaxAccessCount >= 1
    if (!validMaxAccessCount) {
      return { limits: null, errorMessage: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.maxAccessCountInvalid) }
    }
    return { limits: { expiresAt: null, maxAccessCount: enteredMaxAccessCount }, errorMessage: null }
  }
  return { limits: { expiresAt: null, maxAccessCount: null }, errorMessage: null }
}
