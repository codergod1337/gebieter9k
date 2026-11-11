import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useSortableItem } from '../components/useSortableItem.tsx'
import { FileCheerBar } from '../file/cheer/FileCheerBar.tsx'
import { FileDocumentActionButtons } from '../file/document/FileDocumentActionButtons.tsx'
import { FileDocumentPreviewImage } from '../file/document/FileDocumentPreviewImage.tsx'
import { getFileDocumentPath } from '../file/fileDocumentPaths.ts'
import type { OriginState } from '../navigation/origin.ts'

type GalleryImageTileProps = {
  fileDocumentId: string
  fileName: string
  /** Die Überschrift des Bildes: seine Tags, ohne Tags der Dateiname. */
  heading: string
  previewBase64Png: unknown
  /** Nur in der eigenen Galerie: der Griff zum Verschieben (Drag and Drop). */
  sortable: boolean
  sortingDisabled: boolean
  /** Darf der User die Metadaten ändern (Autor, freigegebene Bearbeiter, FILE_MANAGER, ADMIN)? Dann gibt es den Stift. */
  changeable: boolean
  /** Der Origin für die Seite der Datei („Zurück zu <Galerie>“). */
  originState: OriginState
  onOpen: (fileDocumentId: string) => void
  /** Optional, unter der Aktionsleiste: was der Aufrufer zur Kachel dazusagt, z. B. im Gebietermarkt das Angebot. */
  footer?: ReactNode
}

/** Kantenlänge der Vorschau einer Kachel: die volle Vorschau aus Solr. */
const GALLERY_IMAGE_PREVIEW_PIXELS = 200

/**
 * Ein Bild der Galerie als Kachel, nach den Bildkacheln der Vorlage, von oben nach unten (Nutzer 2026-11-11):
 * - die Kopfzeile: in der eigenen Galerie links der Griff zum Verschieben, daneben die Überschrift des Bildes (die
 *   Tags, ohne Tags der Dateiname);
 * - die Vorschau aus dem Solr-Dokument (PNG 200 × 200), ein Klick öffnet das Bild groß; oben mittig über dem Bild
 *   liegen die Stimmen ({@link FileCheerBar}: begeistert und angewidert; jede Kachel lädt sie selbst nach, wenn sie
 *   schon dasteht). Sie stehen oben, damit ihre Sprechblase nicht die Aktionsleiste verdeckt;
 * - die Aktionsleiste wie überall an einer Datei: Info
 * (Details mit allen Metadaten), Download und, wer bearbeiten darf, der Stift: Er führt auf dieselbe Seite, dort ändert
 * man jedes Feld per Klick im Popup (eine eigene Bearbeiten-Seite gibt es nicht mehr). Die Knöpfe stehen neben
 * der Bildfläche, nie darin;
 * - optional ein Fuß des Aufrufers (`footer`), z. B. im Gebietermarkt das Angebot des Artikels.
 * Dieselbe Kachel überall, wo ein Bild als Kachel steht: Galerie und Gebietermarkt.
 */
export function GalleryImageTile({
  fileDocumentId,
  fileName,
  heading,
  previewBase64Png,
  sortable,
  sortingDisabled,
  changeable,
  originState,
  onOpen,
  footer,
}: GalleryImageTileProps) {
  const navigate = useNavigate()
  const sortableItem = useSortableItem(fileDocumentId, sortingDisabled || !sortable)
  let tileClassName = 'gallery-image-tile'
  if (sortableItem.isDragging) {
    tileClassName = 'gallery-image-tile gallery-tile-dragging'
  }
  const openLabel = heading + ' groß ansehen'
  const fileDocumentPath = getFileDocumentPath(fileDocumentId)

  function openEdit() {
    navigate(fileDocumentPath, { state: originState })
  }

  return (
    <div ref={sortableItem.ref} style={sortableItem.style} className={tileClassName}>
      <div className="gallery-image-tile-head">
        {sortable && <div className="gallery-image-tile-handle">{sortableItem.dragHandle}</div>}
        <span className="gallery-image-tile-name">{heading}</span>
      </div>
      <div className="gallery-image-tile-picture">
        <button type="button" className="gallery-image-tile-button" onClick={() => onOpen(fileDocumentId)} aria-label={openLabel}>
          <FileDocumentPreviewImage
            previewBase64Png={previewBase64Png}
            sizePixels={GALLERY_IMAGE_PREVIEW_PIXELS}
            alternativeText={fileName}
          />
        </button>
        <div className="gallery-image-tile-cheers">
          <FileCheerBar fileDocumentId={fileDocumentId} originLabel={originState.origin.label} />
        </div>
      </div>
      <div className="gallery-image-tile-actions">
        <FileDocumentActionButtons
          fileDocumentId={fileDocumentId}
          fileName={fileName}
          hasViewer={false}
          changeable={changeable}
          onEdit={openEdit}
          linkState={originState}
          detailsPath={fileDocumentPath}
        />
      </div>
      {footer !== undefined && <div className="gallery-image-tile-footer small text-center px-2 pb-2">{footer}</div>}
    </div>
  )
}
