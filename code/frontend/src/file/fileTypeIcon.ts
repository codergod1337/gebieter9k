/** Das Symbol je Dateiart, wenn es kein Vorschaubild gibt (Bootstrap Icons). */
const FILE_TYPE_ICON_CLASS_NAMES = {
  image: 'bi bi-file-earmark-image',
  video: 'bi bi-file-earmark-play',
  audio: 'bi bi-file-earmark-music',
  pdf: 'bi bi-file-earmark-pdf',
  word: 'bi bi-file-earmark-word',
  spreadsheet: 'bi bi-file-earmark-spreadsheet',
  presentation: 'bi bi-file-earmark-slides',
  text: 'bi bi-file-earmark-text',
  archive: 'bi bi-file-earmark-zip',
  other: 'bi bi-file-earmark',
}

/** Das Symbol einer Datei nach ihrem Typ (MIME), z. B. für die Seite einer Datei ohne Vorschaubild. */
export function getFileTypeIconClassName(mimeType: unknown): string {
  if (typeof mimeType !== 'string') {
    return FILE_TYPE_ICON_CLASS_NAMES.other
  }
  if (mimeType.startsWith('image/')) {
    return FILE_TYPE_ICON_CLASS_NAMES.image
  }
  if (mimeType.startsWith('video/')) {
    return FILE_TYPE_ICON_CLASS_NAMES.video
  }
  if (mimeType.startsWith('audio/')) {
    return FILE_TYPE_ICON_CLASS_NAMES.audio
  }
  if (mimeType === 'application/pdf') {
    return FILE_TYPE_ICON_CLASS_NAMES.pdf
  }
  if (mimeType.includes('wordprocessing') || mimeType === 'application/msword' || mimeType.includes('opendocument.text')) {
    return FILE_TYPE_ICON_CLASS_NAMES.word
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('ms-excel') || mimeType === 'text/csv') {
    return FILE_TYPE_ICON_CLASS_NAMES.spreadsheet
  }
  if (mimeType.includes('presentation') || mimeType.includes('ms-powerpoint')) {
    return FILE_TYPE_ICON_CLASS_NAMES.presentation
  }
  if (mimeType.startsWith('text/')) {
    return FILE_TYPE_ICON_CLASS_NAMES.text
  }
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('x-tar')) {
    return FILE_TYPE_ICON_CLASS_NAMES.archive
  }
  return FILE_TYPE_ICON_CLASS_NAMES.other
}
