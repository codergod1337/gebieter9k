/*
 * Der Zuschnitt eines Bildes, reine Rechnungen ohne DOM, aus der Vorlage übernommen (imageCrop.ts): die Grundlage von
 * ImageCropper. Alle Koordinaten sind Pixel des Originalbilds.
 */

/** Ein Ausschnitt in Originalpixeln. */
export type ImageCrop = {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Die Originalmaße eines Bildes. */
export type NaturalSize = {
  width: number
  height: number
}

function roundCrop(crop: ImageCrop): ImageCrop {
  return { x1: Math.round(crop.x1), y1: Math.round(crop.y1), x2: Math.round(crop.x2), y2: Math.round(crop.y2) }
}

/**
 * Das Maximal-Rechteck: das kleinste Rechteck im verlangten Verhältnis, das das ganze Bild umschließt, zentriert um das
 * Bild. Es ist die Bühne des Zuschnitts und die Obergrenze jedes Ausschnitts.
 */
export function maximalCrop(imageWidth: number, imageHeight: number, aspectRatio: number): ImageCrop {
  let cropWidth: number
  let cropHeight: number
  if (imageWidth / imageHeight >= aspectRatio) {
    cropWidth = imageWidth
    cropHeight = imageWidth / aspectRatio
  } else {
    cropHeight = imageHeight
    cropWidth = imageHeight * aspectRatio
  }
  const x1 = (imageWidth - cropWidth) / 2
  const y1 = (imageHeight - cropHeight) / 2
  return roundCrop({ x1, y1, x2: x1 + cropWidth, y2: y1 + cropHeight })
}

/** Eine Achse: Rechteck kürzer als das Bild, dann ganz im Bild; Rechteck länger, dann das Bild ganz im Rechteck. */
function clampAxis(start: number, length: number, imageLength: number): number {
  const lowest = Math.min(0, imageLength - length)
  const highest = Math.max(0, imageLength - length)
  return Math.round(Math.max(lowest, Math.min(highest, start)))
}

/**
 * Der eine Begrenzer, durch den jeder Kandidat läuft: Danach stimmt das Verhältnis exakt (ein verzogener Kandidat
 * schrumpft auf seine kleinere Kante), die Größe ist höchstens das Maximal-Rechteck, und je Achse liegt das Rechteck
 * im Bild oder das Bild im Rechteck. Die Breite führt, die Höhe folgt aus ihr.
 */
export function clampCrop(candidate: ImageCrop, imageWidth: number, imageHeight: number, aspectRatio: number): ImageCrop {
  const maximum = maximalCrop(imageWidth, imageHeight, aspectRatio)
  const maximumWidth = maximum.x2 - maximum.x1
  let cropWidth = candidate.x2 - candidate.x1
  const cropHeight = candidate.y2 - candidate.y1
  if (Math.abs(cropHeight - cropWidth / aspectRatio) > 1) {
    cropWidth = Math.min(cropWidth, cropHeight * aspectRatio)
  }
  cropWidth = Math.round(Math.max(1, Math.min(cropWidth, maximumWidth)))
  const targetHeight = Math.max(1, Math.round(cropWidth / aspectRatio))
  const x1 = clampAxis(candidate.x1, cropWidth, imageWidth)
  const y1 = clampAxis(candidate.y1, targetHeight, imageHeight)
  return { x1, y1, x2: x1 + cropWidth, y2: y1 + targetHeight }
}

/** Der Begrenzer ohne festes Verhältnis: Jede Kante liegt im Bild, jede Seite ist mindestens ein Pixel. */
export function clampFreeCrop(candidate: ImageCrop, imageWidth: number, imageHeight: number): ImageCrop {
  const left = Math.min(candidate.x1, candidate.x2)
  const right = Math.max(candidate.x1, candidate.x2)
  const upper = Math.min(candidate.y1, candidate.y2)
  const lower = Math.max(candidate.y1, candidate.y2)
  const cropWidth = Math.round(Math.max(1, Math.min(right - left, imageWidth)))
  const cropHeight = Math.round(Math.max(1, Math.min(lower - upper, imageHeight)))
  const x1 = Math.round(Math.max(0, Math.min(imageWidth - cropWidth, left)))
  const y1 = Math.round(Math.max(0, Math.min(imageHeight - cropHeight, upper)))
  return { x1, y1, x2: x1 + cropWidth, y2: y1 + cropHeight }
}
