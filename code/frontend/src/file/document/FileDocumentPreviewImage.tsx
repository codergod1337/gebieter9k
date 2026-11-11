type FileDocumentPreviewImageProps = {
  /** Das Vorschaubild aus dem Dokument (PNG als Base64 ohne Präfix), `undefined` ohne Vorschau. */
  previewBase64Png: unknown
  /** Kantenlänge in Pixeln; das Bild ist quadratisch mit transparentem Rand. */
  sizePixels: number
  alternativeText: string
}

/**
 * Das Vorschaubild einer Datei direkt aus dem Dokument, ohne Datei vom SFTP. Ohne Vorschau ein Datei-Symbol in derselben
 * Größe, damit Listen nicht springen.
 */
export function FileDocumentPreviewImage({ previewBase64Png, sizePixels, alternativeText }: FileDocumentPreviewImageProps) {
  if (typeof previewBase64Png !== 'string' || previewBase64Png === '') {
    return (
      <span
        className="file-preview-placeholder"
        style={{ width: sizePixels, height: sizePixels, fontSize: sizePixels / 2 }}
        aria-label="keine Vorschau">
        <i className="bi bi-file-earmark"></i>
      </span>
    )
  }
  const previewDataUrl = 'data:image/png;base64,' + previewBase64Png
  return <img src={previewDataUrl} width={sizePixels} height={sizePixels} alt={alternativeText} />
}
