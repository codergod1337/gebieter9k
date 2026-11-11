/*
 * Bilder im Browser rechnen, ohne DOM-Komponente, aus der Vorlage übernommen (base64Image.ts, zuerst fürs Profilbild):
 * eine Datei als Bild laden, um 90° drehen, einen Ausschnitt in ein PNG einpassen und als Base64 geben. Die Grundlage
 * von ImageCropUploadPopup.
 */
import type { ImageCrop } from './imageCrop.ts'

/** Dateitypen, die als Bild angenommen werden. */
export const IMAGE_FILE_TYPES: readonly string[] = ['image/jpeg', 'image/png']

/** Ist die Datei ein JPG oder PNG? Manche Browser lassen den Typ leer, dann entscheidet die Endung. */
export function isImageFile(file: File): boolean {
  if (IMAGE_FILE_TYPES.includes(file.type)) {
    return true
  }
  const imageFileNamePattern = /\.(jpe?g|png)$/i
  return file.type === '' && imageFileNamePattern.test(file.name)
}

/** Ein Bild aus einer Adresse laden; der Browser richtet ein JPEG dabei schon nach seiner EXIF-Ausrichtung aus. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Das Bild ist nicht lesbar.'))
    image.src = src
  })
}

/** Ein Canvas als Blob-Adresse (PNG); der Aufrufer gibt sie mit URL.revokeObjectURL wieder frei. */
function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error('Das Bild ließ sich nicht schreiben.'))
        return
      }
      const blobUrl = URL.createObjectURL(blob)
      resolve(blobUrl)
    }, 'image/png')
  })
}

/**
 * Die Datei als Bild für den Zuschnitt, in der Größe, in der sie ist (nie vorab verkleinert), als Blob-Adresse. Prüft
 * dabei, dass der Browser sie als Bild lesen kann. Der Aufrufer gibt die Adresse mit URL.revokeObjectURL wieder frei.
 */
export async function imageUrlOf(file: File): Promise<string> {
  const fileUrl = URL.createObjectURL(file)
  try {
    await loadImage(fileUrl)
    return fileUrl
  } catch (error) {
    URL.revokeObjectURL(fileUrl)
    throw error
  }
}

/** Das Bild um 90° im Uhrzeigersinn gedreht, als neue Blob-Adresse; Breite und Höhe tauschen. */
export async function rotatedImageUrl(src: string): Promise<string> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalHeight
  canvas.height = image.naturalWidth
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('Der Browser kann kein Canvas zeichnen.')
  }
  context.translate(canvas.width, 0)
  context.rotate(Math.PI / 2)
  context.drawImage(image, 0, 0)
  return canvasToBlobUrl(canvas)
}

/**
 * Der Ausschnitt eines Bildes in ein PNG von canvasWidth × canvasHeight eingepasst, nach der Regel der Dateivorschau
 * (FilePreviewService im Backend): Seitenverhältnis bleibt, die längere Seite füllt, mittig, der Rest transparent, nichts
 * abgeschnitten, nie vergrößert. Als Base64 ohne data:-Präfix.
 */
export async function fittedPngBase64(src: string, crop: ImageCrop, canvasWidth: number, canvasHeight: number): Promise<string> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('Der Browser kann kein Canvas zeichnen.')
  }
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  const cropWidth = crop.x2 - crop.x1
  const cropHeight = crop.y2 - crop.y1
  const fittingScale = Math.min(canvasWidth / cropWidth, canvasHeight / cropHeight)
  const scale = Math.min(1, fittingScale)
  const fittedWidth = Math.max(1, Math.round(cropWidth * scale))
  const fittedHeight = Math.max(1, Math.round(cropHeight * scale))
  const left = Math.round((canvasWidth - fittedWidth) / 2)
  const top = Math.round((canvasHeight - fittedHeight) / 2)
  context.drawImage(image, crop.x1, crop.y1, cropWidth, cropHeight, left, top, fittedWidth, fittedHeight)
  const dataUrl = canvas.toDataURL('image/png')
  const commaIndex = dataUrl.indexOf(',')
  return dataUrl.slice(commaIndex + 1)
}

/** Ein PNG als Base64 ohne Präfix aus einem Canvas. */
function canvasPngBase64(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/png')
  const commaIndex = dataUrl.indexOf(',')
  return dataUrl.slice(commaIndex + 1)
}

/** Ein leeres Canvas mit glättendem Zeichnen; wirft, wenn der Browser keins kann. */
function createSmoothCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('Der Browser kann kein Canvas zeichnen.')
  }
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  return { canvas, context }
}

/**
 * Ein PNG (Base64 ohne Präfix) verkleinert auf genau diese Maße, z. B. das große Profilbild auf das kleine. Verkleinert
 * wird in Stufen von höchstens der Hälfte: Ein Sprung von 400 auf 96 Pixel in einem Zug flimmert in Browsern, die nur
 * einfach glätten (Firefox); Transparenz bleibt.
 */
export async function downscaledPngBase64(base64Png: string, targetWidth: number, targetHeight: number): Promise<string> {
  const pngDataUrl = 'data:image/png;base64,' + base64Png
  const image = await loadImage(pngDataUrl)
  let currentSource: CanvasImageSource = image
  let currentWidth = image.naturalWidth
  let currentHeight = image.naturalHeight
  while (currentWidth / 2 >= targetWidth && currentHeight / 2 >= targetHeight) {
    const halfWidth = Math.round(currentWidth / 2)
    const halfHeight = Math.round(currentHeight / 2)
    const halfStep = createSmoothCanvas(halfWidth, halfHeight)
    halfStep.context.drawImage(currentSource, 0, 0, halfWidth, halfHeight)
    currentSource = halfStep.canvas
    currentWidth = halfWidth
    currentHeight = halfHeight
  }
  const finalStep = createSmoothCanvas(targetWidth, targetHeight)
  finalStep.context.drawImage(currentSource, 0, 0, targetWidth, targetHeight)
  return canvasPngBase64(finalStep.canvas)
}

/**
 * Der Ausschnitt eines Uploads liegt immer ganz im Bild, wie in der Vorlage: Ein Rand würde als Transparenz ins PNG
 * gerechnet. Die Breite ist höchstens die größte, die im Verhältnis ins Bild passt, und mindestens die Mindestkante; das
 * Rechteck wird um seine Mitte gerechnet und dann ins Bild geschoben. Ist das Bild kleiner als das Minimum, gilt das
 * Größte, was passt.
 */
export function insideCrop(candidate: ImageCrop, imageWidth: number, imageHeight: number, aspectRatio: number, minSide: number): ImageCrop {
  const maximumWidth = Math.min(imageWidth, imageHeight * aspectRatio)
  let minimumSideWidth = minSide
  if (aspectRatio >= 1) {
    minimumSideWidth = minSide * aspectRatio
  }
  const minimumWidth = Math.min(minimumSideWidth, maximumWidth)
  const candidateWidth = candidate.x2 - candidate.x1
  const cropWidth = Math.round(Math.max(minimumWidth, Math.min(candidateWidth, maximumWidth)))
  const cropHeight = Math.round(cropWidth / aspectRatio)
  const centerX = (candidate.x1 + candidate.x2) / 2
  const centerY = (candidate.y1 + candidate.y2) / 2
  const x1 = Math.round(Math.max(0, Math.min(imageWidth - cropWidth, centerX - cropWidth / 2)))
  const y1 = Math.round(Math.max(0, Math.min(imageHeight - cropHeight, centerY - cropHeight / 2)))
  return { x1, y1, x2: x1 + cropWidth, y2: y1 + cropHeight }
}

/**
 * Wie {@link insideCrop}, aber ohne festes Verhältnis: Der Ausschnitt bleibt ganz im Bild, jede Seite mindestens
 * minSide (oder die ganze Bildseite, wenn das Bild kleiner ist).
 */
export function insideFreeCrop(candidate: ImageCrop, imageWidth: number, imageHeight: number, minSide: number): ImageCrop {
  const minimumWidth = Math.min(minSide, imageWidth)
  const minimumHeight = Math.min(minSide, imageHeight)
  const candidateWidth = candidate.x2 - candidate.x1
  const candidateHeight = candidate.y2 - candidate.y1
  const cropWidth = Math.round(Math.max(minimumWidth, Math.min(candidateWidth, imageWidth)))
  const cropHeight = Math.round(Math.max(minimumHeight, Math.min(candidateHeight, imageHeight)))
  const centerX = (candidate.x1 + candidate.x2) / 2
  const centerY = (candidate.y1 + candidate.y2) / 2
  const x1 = Math.round(Math.max(0, Math.min(imageWidth - cropWidth, centerX - cropWidth / 2)))
  const y1 = Math.round(Math.max(0, Math.min(imageHeight - cropHeight, centerY - cropHeight / 2)))
  return { x1, y1, x2: x1 + cropWidth, y2: y1 + cropHeight }
}
