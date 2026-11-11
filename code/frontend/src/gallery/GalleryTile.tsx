import { Link } from 'react-router'
import { DeleteButton } from '../components/DeleteButton.tsx'
import { EditButton } from '../components/EditButton.tsx'
import { useSortableItem } from '../components/useSortableItem.tsx'
import { FileDocumentPreviewImage } from '../file/document/FileDocumentPreviewImage.tsx'
import type { OriginState } from '../navigation/origin.ts'
import { VISIBILITY_LABELS } from '../users/visibilityLabels.ts'
import type { GalleryForClient } from './Gallery.ts'
import { getGalleryPath } from './galleryPaths.ts'

type GalleryTileProps = {
  gallery: GalleryForClient
  /** Der Origin für die Galerie („Zurück zu Galerien“). */
  originState: OriginState
  /** Nur bei eigenen Galerien: verschieben, bearbeiten, löschen. */
  editable: boolean
  sortingDisabled: boolean
  onEdit: (gallery: GalleryForClient) => void
  onDelete: (gallery: GalleryForClient) => void
}

/** Kantenlänge der Vorschau in einer Kachel. */
const GALLERY_COVER_PIXELS = 160

/**
 * Eine Galerie als Kachel: Vorschau des ersten Bildes, Titel, wie viele Bilder und für wen sichtbar. Ein Klick öffnet
 * die Galerie. Eigene Galerien haben den Griff zum Verschieben (Drag and Drop) und die Knöpfe Bearbeiten und Löschen.
 */
export function GalleryTile({ gallery, originState, editable, sortingDisabled, onEdit, onDelete }: GalleryTileProps) {
  const sortableItem = useSortableItem(String(gallery.id), sortingDisabled || !editable)
  const galleryPath = getGalleryPath(gallery.ownerUsersGuid, gallery.id)
  let fileCountText = gallery.fileCount + ' Bilder'
  if (gallery.fileCount === 1) {
    fileCountText = '1 Bild'
  }
  const visibilityText = VISIBILITY_LABELS[gallery.visibility]
  let tileClassName = 'gallery-tile'
  if (sortableItem.isDragging) {
    tileClassName = 'gallery-tile gallery-tile-dragging'
  }

  return (
    <div ref={sortableItem.ref} style={sortableItem.style} className={tileClassName}>
      <Link to={galleryPath} state={originState} className="gallery-tile-link">
        <FileDocumentPreviewImage
          previewBase64Png={gallery.coverPreviewBase64Png ?? undefined}
          sizePixels={GALLERY_COVER_PIXELS}
          alternativeText={gallery.title}
        />
        <span className="gallery-tile-title">{gallery.title}</span>
        <span className="gallery-tile-meta">
          {fileCountText} · {visibilityText}
        </span>
      </Link>
      {editable && (
        <div className="gallery-tile-actions">
          {sortableItem.dragHandle}
          <EditButton label={gallery.title + ' bearbeiten'} onClick={() => onEdit(gallery)} />
          <DeleteButton label={gallery.title + ' löschen'} onClick={() => onDelete(gallery)} />
        </div>
      )}
    </div>
  )
}
