import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { FileClass } from './FileClass.ts'

type FileClassHintProps = {
  fileClass: FileClass
  /** Ein Satz unter dem Key, z. B. „Klick: andere Dateiart wählen“; ohne: keiner. */
  note?: string
}

/**
 * Der Inhalt jeder Sprechblase über einer Dateiart (Nutzer 2026-11-10), überall gleich: oben die Beschreibung, darunter
 * klein „Key:“ und der Key in Codeschrift, zuletzt ein Hinweis, falls es einen gibt. Ohne Beschreibung steht nur der Key.
 */
export function FileClassHint({ fileClass, note }: FileClassHintProps) {
  let descriptionText = ''
  if (fileClass.description !== null) {
    descriptionText = getTextInCurrentLanguage(fileClass.description)
  }
  return (
    <span className="file-class-hint">
      {descriptionText !== '' && <span>{descriptionText}</span>}
      <span className="file-class-hint-key">
        Key: <code>{fileClass.key}</code>
      </span>
      {note !== undefined && <span className="file-class-hint-note">{note}</span>}
    </span>
  )
}
