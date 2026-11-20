import { Link } from 'react-router'
import { DateTimeText } from '../components/DateTimeText.tsx'
import { InfoHint } from '../components/InfoHint.tsx'
import { RichTextView } from '../components/RichTextView.tsx'
import type { TableColumn } from '../components/TableColumn.ts'
import { VisibilityPicker } from '../components/VisibilityPicker.tsx'
import { FileDocumentPreviewImage } from '../file/document/FileDocumentPreviewImage.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { OriginState } from '../navigation/origin.ts'
import type { GalleryForClient } from './Gallery.ts'
import { getGalleryPath, getGalleryShareTabPath } from './galleryPaths.ts'
import type { GalleryShare } from './GalleryShare.ts'
import { GALLERY_TEXTS } from './galleryTexts.ts'

/** Kantenlänge der Vorschau neben dem Titel einer Galerie in der Tabelle. */
const GALLERY_TABLE_COVER_PIXELS = 32

type GalleryColumnsOptions = {
  /** Der Origin für eine Galerie, die man aus der Liste öffnet („Zurück zu Galerien“). */
  originState: OriginState
  /** Nur im eigenen Profil: die Spalte „Freigaben“ (Freigaben über einen Link sieht nur der Besitzer). */
  showShares: boolean
  /** Die Freigaben je Galerie-id; `null`, solange sie noch laden. */
  gallerySharesByGalleryId: Map<number, GalleryShare[]> | null
}

/**
 * Die Spalten einer Galerie für die zentrale `Table` (`components/Table.tsx`), so steht die Liste der Galerien auf dem
 * Handy da (Nutzer 2026-11-20: eine Tabelle mit mehr Angaben statt einer Kachel wie ein Bild): Galerie (kleine
 * Vorschau, Titel als Link, Beschreibung hinter dem „i“), Bilder, letztes Bild, sichtbar für, Freigaben (nur beim
 * Besitzer), erstellt. Alles aus globalen Bausteinen (`InfoHint`, `RichTextView`, `DateTimeText`, `VisibilityPicker`).
 * Was auf einem schmalen Bildschirm nicht passt, lässt die Tabelle von rechts weg; ein Tipp auf die Zeile zeigt alles.
 */
export function createGalleryColumns(options: GalleryColumnsOptions): TableColumn<GalleryForClient>[] {
  const originState = options.originState
  const gallerySharesByGalleryId = options.gallerySharesByGalleryId
  const noValueText = getTextInCurrentLanguage(GALLERY_TEXTS.noValue)

  const columns: TableColumn<GalleryForClient>[] = [
    {
      key: 'GALLERY',
      header: getTextInCurrentLanguage(GALLERY_TEXTS.columnGallery),
      headerHint: getTextInCurrentLanguage(GALLERY_TEXTS.columnGalleryHint),
      width: '14rem',
      cell: (gallery) => {
        const galleryPath = getGalleryPath(gallery.ownerUsersGuid, gallery.id)
        let coverPreviewBase64Png: string | undefined = undefined
        if (gallery.coverPreviewBase64Png !== null) {
          coverPreviewBase64Png = gallery.coverPreviewBase64Png
        }
        let descriptionHint = null
        if (gallery.description !== null) {
          const descriptionLabel = getTextInCurrentLanguageWithValues(GALLERY_TEXTS.descriptionHintLabel, {
            title: gallery.title,
          })
          const descriptionView = <RichTextView richText={gallery.description} />
          descriptionHint = <InfoHint text={descriptionView} label={descriptionLabel} />
        }
        return (
          <span className="gallery-table-title">
            <FileDocumentPreviewImage
              previewBase64Png={coverPreviewBase64Png}
              sizePixels={GALLERY_TABLE_COVER_PIXELS}
              alternativeText={gallery.title}
            />
            <Link to={galleryPath} state={originState} className="gallery-table-title-link">
              {gallery.title}
            </Link>
            {descriptionHint}
          </span>
        )
      },
    },
    {
      key: 'FILE_COUNT',
      header: getTextInCurrentLanguage(GALLERY_TEXTS.columnFileCount),
      headerHint: getTextInCurrentLanguage(GALLERY_TEXTS.columnFileCountHint),
      width: '4.5rem',
      cell: (gallery) => gallery.fileCount.toLocaleString('de-DE'),
    },
    {
      key: 'LAST_UPLOADED_AT',
      header: getTextInCurrentLanguage(GALLERY_TEXTS.columnLastUploadedAt),
      headerHint: getTextInCurrentLanguage(GALLERY_TEXTS.columnLastUploadedAtHint),
      width: '9rem',
      unimportant: true,
      cell: (gallery) => {
        if (gallery.lastUploadedAt === null) {
          return noValueText
        }
        const lastUploadedAtLabel = getTextInCurrentLanguage(GALLERY_TEXTS.lastUploadedAtLabel)
        return <DateTimeText isoDateTime={gallery.lastUploadedAt} label={lastUploadedAtLabel} />
      },
    },
    {
      key: 'VISIBILITY',
      header: getTextInCurrentLanguage(GALLERY_TEXTS.columnVisibility),
      headerHint: getTextInCurrentLanguage(GALLERY_TEXTS.columnVisibilityHint),
      width: '11rem',
      unimportant: true,
      cell: (gallery) => {
        const visibilityLabel = getTextInCurrentLanguageWithValues(GALLERY_TEXTS.visibilityLabel, {
          title: gallery.title,
        })
        return <VisibilityPicker value={gallery.visibility} ariaLabel={visibilityLabel} />
      },
    },
  ]

  if (options.showShares) {
    columns.push({
      key: 'SHARES',
      header: getTextInCurrentLanguage(GALLERY_TEXTS.columnShares),
      headerHint: getTextInCurrentLanguage(GALLERY_TEXTS.columnSharesHint),
      width: '11rem',
      unimportant: true,
      cell: (gallery) => {
        if (gallerySharesByGalleryId === null) {
          return '…'
        }
        const galleryShares = gallerySharesByGalleryId.get(gallery.id)
        if (galleryShares === undefined || galleryShares.length === 0) {
          return getTextInCurrentLanguage(GALLERY_TEXTS.noShares)
        }
        const galleryShareLabels = galleryShares.map((galleryShare) => galleryShare.label)
        const galleryShareLabelsText = galleryShareLabels.join(', ')
        const galleryShareCountText = galleryShares.length.toLocaleString('de-DE')
        const galleryShareText = galleryShareCountText + ' (' + galleryShareLabelsText + ')'
        const galleryShareTabPath = getGalleryShareTabPath(gallery.ownerUsersGuid, gallery.id)
        return (
          <Link to={galleryShareTabPath} state={originState} className="text-break">
            {galleryShareText}
          </Link>
        )
      },
    })
  }

  columns.push({
    key: 'CREATED_AT',
    header: getTextInCurrentLanguage(GALLERY_TEXTS.columnCreatedAt),
    headerHint: getTextInCurrentLanguage(GALLERY_TEXTS.columnCreatedAtHint),
    width: '9rem',
    unimportant: true,
    cell: (gallery) => {
      const createdAtLabel = getTextInCurrentLanguage(GALLERY_TEXTS.createdAtLabel)
      return <DateTimeText isoDateTime={gallery.createdAt} label={createdAtLabel} />
    },
  })
  return columns
}
