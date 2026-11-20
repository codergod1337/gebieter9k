import { CHEER_LOOKS } from '../file/cheer/fileCheerLooks.ts'
import type { FileCheerDirection } from '../file/FileCheer.ts'
import { DEFAULT_LANGUAGE } from '../language/activeLanguages.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'

type GalleryShareCheerCountsProps = {
  /** Die Zahlen aus dem Dokument des Bildes (`cheerUpCount`, `cheerDownCount`); fehlt ein Feld, gilt 0. */
  cheerUpCount: unknown
  cheerDownCount: unknown
  /** Ein Klick auf einen Smiley: Der Aufrufer zeigt den Hinweis zur Anmeldung. */
  onCheerRequested: () => void
}

/** Die Zahl aus einem Feld des Dokuments, ohne Feld 0. */
function toCheerCount(storedCheerCount: unknown): number {
  if (typeof storedCheerCount === 'number' && Number.isFinite(storedCheerCount)) {
    return storedCheerCount
  }
  return 0
}

/**
 * Die Stimmen eines Bildes auf der Besucherseite einer Galerie-Freigabe: dieselben Smileys und Zahlen wie in der
 * `FileCheerBar`, aber nur zum Ansehen. Abstimmen kann nur ein angemeldeter User (Nutzer 2026-11-19): Ein Klick meldet
 * den Wunsch an den Aufrufer, der den Hinweis „melde dich kostenlos an“ zeigt.
 */
export function GalleryShareCheerCounts({ cheerUpCount, cheerDownCount, onCheerRequested }: GalleryShareCheerCountsProps) {
  function renderCheerCount(direction: FileCheerDirection, storedCheerCount: unknown) {
    const cheerLook = CHEER_LOOKS[direction]
    const cheerCount = toCheerCount(storedCheerCount)
    const cheerCountText = cheerCount.toLocaleString(DEFAULT_LANGUAGE.code)
    let ariaLabelText = GALLERY_SHARE_TEXTS.visitorCheerUpLabel
    if (direction === 'DOWN') {
      ariaLabelText = GALLERY_SHARE_TEXTS.visitorCheerDownLabel
    }
    const ariaLabel = getTextInCurrentLanguageWithValues(ariaLabelText, { count: cheerCountText })
    return (
      <button type="button" className="file-cheer-button" aria-label={ariaLabel} onClick={onCheerRequested}>
        <span className="emoji-text" aria-hidden="true">
          {cheerLook.emoji}
        </span>
        <span className="file-cheer-count">{cheerCountText}</span>
      </button>
    )
  }

  return (
    <div className="file-cheer" role="group">
      {renderCheerCount('UP', cheerUpCount)}
      {renderCheerCount('DOWN', cheerDownCount)}
    </div>
  )
}
