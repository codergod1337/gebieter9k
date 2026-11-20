import { formatTag } from '../file/getFileDocumentHeading.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { GalleryTagCount } from './Gallery.ts'
import { GALLERY_TEXTS } from './galleryTexts.ts'

type GalleryTagFilterProps = {
  /** Alle Hashtags der Galerie mit der Zahl ihrer Bilder, häufigste zuerst. */
  galleryTagCounts: GalleryTagCount[]
  /** Die gerade gewählten Hashtags, wie gespeichert (ohne Raute). */
  selectedTags: string[]
  /** Ein Klick auf einen Hashtag: Der Aufrufer schaltet ihn an oder aus. */
  onToggle: (tag: string) => void
  /** „alle Bilder zeigen“: Der Aufrufer nimmt jede Wahl zurück. */
  onReset: () => void
  disabled: boolean
}

/**
 * Der Filter nach Hashtags über den Kacheln einer Galerie (Nutzer 2026-11-20): jeder Hashtag der Galerie als Schalter
 * mit der Zahl seiner Bilder, aufgebaut wie die Rechte zum Anklicken (`AccessRoleToggleList`).
 * - Kein Schalter an: Die Galerie zeigt alle Bilder, alle Hashtags stehen gleich da.
 * - Schalter an: Die Galerie zeigt die Bilder mit diesem Hashtag; mehrere an: Bilder mit mindestens einem davon. Die
 *   gewählten sind eingerahmt und tragen einen Haken, die anderen sind blass. Daneben „alle Bilder zeigen“.
 * Die Liste merkt sich nichts: Was gewählt ist, hält der Aufrufer (in der Adresse). Ohne Hashtags erscheint nichts.
 */
export function GalleryTagFilter({ galleryTagCounts, selectedTags, onToggle, onReset, disabled }: GalleryTagFilterProps) {
  const filterActive = selectedTags.length > 0
  if (galleryTagCounts.length === 0 && !filterActive) {
    return null
  }
  return (
    <div className="gallery-tag-filter" role="group" aria-label={getTextInCurrentLanguage(GALLERY_TEXTS.tagFilterLabel)}>
      {galleryTagCounts.map((galleryTagCount) => {
        const tag = galleryTagCount.tag
        const selected = selectedTags.includes(tag)
        let toggleClassName = 'gallery-tag-toggle'
        if (selected) {
          toggleClassName = 'gallery-tag-toggle gallery-tag-toggle-active'
        } else if (filterActive) {
          toggleClassName = 'gallery-tag-toggle gallery-tag-toggle-muted'
        }
        const shownTag = formatTag(tag)
        const fileCountText = String(galleryTagCount.fileCount)
        const toggleLabel = getTextInCurrentLanguageWithValues(GALLERY_TEXTS.tagToggleLabel, {
          tag: shownTag,
          fileCount: fileCountText,
        })
        return (
          <button
            key={tag}
            type="button"
            className={toggleClassName}
            aria-pressed={selected}
            aria-label={toggleLabel}
            disabled={disabled}
            onClick={() => onToggle(tag)}>
            <span className="badge file-tag">
              {selected && <i className="bi bi-check-lg gallery-tag-toggle-check" aria-hidden="true"></i>}
              {shownTag}
              <span className="gallery-tag-toggle-count">{fileCountText}</span>
            </span>
          </button>
        )
      })}
      {filterActive && (
        <button type="button" className="btn btn-link btn-sm gallery-tag-filter-reset" disabled={disabled} onClick={onReset}>
          {getTextInCurrentLanguage(GALLERY_TEXTS.tagFilterReset)}
        </button>
      )}
    </div>
  )
}
