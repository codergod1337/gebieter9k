import { CopyableLink } from '../components/CopyableLink.tsx'
import { DateTimeText } from '../components/DateTimeText.tsx'
import { formatDateTime } from '../components/formatDateTime.ts'
import type { TableColumn } from '../components/TableColumn.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { GalleryShare } from './GalleryShare.ts'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'
import { getGalleryShareLink } from './galleryShareUrls.ts'

/** Wie lange eine Freigabe gilt, als Text für die Liste. */
function getGalleryShareDurationText(galleryShare: GalleryShare): string {
  if (galleryShare.expiresAt !== null) {
    const dateTime = formatDateTime(galleryShare.expiresAt)
    const expired = new Date(galleryShare.expiresAt).getTime() <= Date.now()
    if (expired) {
      return getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.durationExpired, { dateTime })
    }
    return getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.durationUntil, { dateTime })
  }
  if (galleryShare.maxAccessCount !== null) {
    const maxAccessCount = String(galleryShare.maxAccessCount)
    const accessesUsedUp = galleryShare.accessCount >= galleryShare.maxAccessCount
    if (accessesUsedUp) {
      return getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.durationAccessesUsedUp, { maxAccessCount })
    }
    return getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.durationAccessLimited, { maxAccessCount })
  }
  return getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.durationPermanent)
}

/** Die Zahl der Bilder einer Freigabe; weicht der Stand in Solr von dem in Postgres ab, stehen beide da. */
function getGalleryShareFileCountText(galleryShare: GalleryShare): string {
  if (galleryShare.sharedFileCount === galleryShare.fileCount) {
    return String(galleryShare.fileCount)
  }
  return getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.fileCountMismatch, {
    sharedFileCount: String(galleryShare.sharedFileCount),
    fileCount: String(galleryShare.fileCount),
  })
}

/**
 * Die Spalten einer Freigabe für die zentrale `Table` (`components/Table.tsx`), überall dieselben: Bezeichnung, Link
 * zum Weitergeben mit „kopieren“ (`components/CopyableLink.tsx`), Laufzeit, Aufrufe, Bilder, angelegt. Die Liste des
 * Besitzers (`GalleryShareBox`) zeigt genau sie, die Übersicht des Admins (`admin/galleryshare/GalleryShareTab`) stellt
 * Besitzer und Galerie davor.
 *
 * @param getGalleryShare holt die Freigabe aus einer Zeile der Tabelle (beim Besitzer ist die Zeile die Freigabe selbst)
 */
export function createGalleryShareColumns<T>(getGalleryShare: (row: T) => GalleryShare): TableColumn<T>[] {
  return [
    {
      key: 'LABEL',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLabel),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLabelHint),
      cell: (row) => {
        const galleryShare = getGalleryShare(row)
        return <span className="text-break">{galleryShare.label}</span>
      },
    },
    {
      key: 'LINK',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLink),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLinkHint),
      cell: (row) => {
        const galleryShare = getGalleryShare(row)
        const galleryShareLink = getGalleryShareLink(galleryShare.shareToken)
        const copyLabel = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.copyLinkOfShareLabel, {
          label: galleryShare.label,
        })
        return <CopyableLink href={galleryShareLink} copyLabel={copyLabel} />
      },
    },
    {
      key: 'DURATION',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnDuration),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnDurationHint),
      cell: (row) => {
        const galleryShare = getGalleryShare(row)
        return getGalleryShareDurationText(galleryShare)
      },
    },
    {
      key: 'ACCESS_COUNT',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnAccessCount),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnAccessCountHint),
      cell: (row) => {
        const galleryShare = getGalleryShare(row)
        return String(galleryShare.accessCount)
      },
      width: '7rem',
    },
    {
      key: 'FILE_COUNT',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnFileCount),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnFileCountHint),
      cell: (row) => {
        const galleryShare = getGalleryShare(row)
        return getGalleryShareFileCountText(galleryShare)
      },
      width: '7rem',
    },
    {
      key: 'CREATED_AT',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnCreatedAt),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnCreatedAtHint),
      cell: (row) => {
        const galleryShare = getGalleryShare(row)
        return <DateTimeText isoDateTime={galleryShare.createdAt} />
      },
      unimportant: true,
    },
  ]
}
