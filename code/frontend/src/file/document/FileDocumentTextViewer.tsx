import { useEffect, useState } from 'react'
import { useFileDocumentBlob } from '../useFileDocumentBlob.ts'
import { FileDocumentLoadingProgress } from './FileDocumentLoadingProgress.tsx'

/** Über dieser Länge zeigt der Viewer nur den Anfang, damit der Browser nicht einfriert (wie in der Vorlage). */
const TEXT_VIEWER_MAX_CHARACTERS = 500_000

type FileDocumentTextViewerProps = {
  fileDocumentId: string
  fileName: string
}

/** Der gelesene Text, zu welchen Bytes er gehört. */
type DecodedText = {
  blob: Blob
  text: string
}

/**
 * Den Text der Datei lesen: UTF-8, und wenn die Bytes kein gültiges UTF-8 sind, Windows-1252. Ältere Textdateien aus
 * Windows kommen so, sonst stünden statt Umlauten Ersatzzeichen da.
 */
async function decodeText(blob: Blob): Promise<string> {
  const bytes = await blob.arrayBuffer()
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true })
    return utf8Decoder.decode(bytes)
  } catch {
    const windows1252Decoder = new TextDecoder('windows-1252')
    return windows1252Decoder.decode(bytes)
  }
}

/**
 * Text im Viewer, wie der TextViewer der Vorlage: roh, man will sehen, was drinsteht. Lange Zeilen brechen um. Die
 * Bytes kommen nur in den Speicher, reine Anzeige.
 */
export function FileDocumentTextViewer({ fileDocumentId, fileName }: FileDocumentTextViewerProps) {
  const fileDocumentBlobHook = useFileDocumentBlob(fileDocumentId)
  const blob = fileDocumentBlobHook.blob
  const [decodedText, setDecodedText] = useState<DecodedText | null>(null)

  useEffect(() => {
    if (blob === null) {
      return
    }
    let active = true
    void decodeText(blob).then((text) => {
      if (active) {
        setDecodedText({ blob, text })
      }
    })
    return () => {
      active = false
    }
  }, [blob])

  if (fileDocumentBlobHook.errorMessage !== null) {
    return <p className="text-danger mb-0">{fileDocumentBlobHook.errorMessage}</p>
  }
  if (decodedText === null || decodedText.blob !== blob) {
    return (
      <FileDocumentLoadingProgress
        fileName={fileName}
        receivedBytes={fileDocumentBlobHook.receivedBytes}
        totalBytes={fileDocumentBlobHook.totalBytes}
      />
    )
  }
  const isShortened = decodedText.text.length > TEXT_VIEWER_MAX_CHARACTERS
  let shownText = decodedText.text
  if (isShortened) {
    shownText = decodedText.text.slice(0, TEXT_VIEWER_MAX_CHARACTERS)
  }
  const maxCharactersText = TEXT_VIEWER_MAX_CHARACTERS.toLocaleString('de-DE')
  return (
    <div className="file-viewer-text">
      {isShortened && (
        <p className="text-warning small">
          Die Datei ist lang, hier stehen die ersten {maxCharactersText} Zeichen. Den Rest gibt es im Download.
        </p>
      )}
      <pre>{shownText}</pre>
    </div>
  )
}
