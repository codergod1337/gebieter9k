import { Hoverlay } from '../components/Hoverlay.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { GALLERY_UPLOADER_TEXTS } from './galleryUploaderTexts.ts'

/**
 * Die Marke „gemeinsam“ an einer Galerie eines anderen Users, in die man hochladen darf (Nutzer 2026-11-22): in der
 * Liste der eigenen Galerien an der Kachel und in der Tabelle. Der Hinweis dazu steht im Hoverlay. Farben im Theme
 * (`.gallery-shared-mark`).
 */
export function GallerySharedMark() {
  return (
    <Hoverlay text={getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.sharedGalleryMarkHint)}>
      <span className="gallery-shared-mark" tabIndex={0}>
        <i className="bi bi-people-fill" aria-hidden="true"></i>
        {getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.sharedGalleryMark)}
      </span>
    </Hoverlay>
  )
}
