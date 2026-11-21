import { CopyableLink, type CopyableLinkQrCode } from '../components/CopyableLink.tsx'
import { DateTimeText } from '../components/DateTimeText.tsx'
import { EditableCellButton } from '../components/EditableCellButton.tsx'
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
 * Wer eine Freigabe direkt in der Zeile ändern darf, gibt das mit: Dann sind Bezeichnung und Laufzeit anklickbar
 * (`EditableCellButton`) und öffnen das kleine Popup des Aufrufers.
 */
export type GalleryShareColumnsEditing = {
  onEditLabel: (galleryShare: GalleryShare) => void
  onEditDuration: (galleryShare: GalleryShare) => void
}

/**
 * Die Spalten einer Freigabe für die zentrale `Table` (`components/Table.tsx`), überall dieselben: Bezeichnung, Link
 * zum Weitergeben mit „kopieren“ und QR-Code (`components/CopyableLink.tsx`), Laufzeit, Aufrufe, Bilder, angelegt. Die
 * Liste des Besitzers (`GalleryShareBox`) zeigt genau sie, die Übersicht des Admins
 * (`admin/galleryshare/GalleryShareTab`) stellt Besitzer und Galerie davor und ändert Bezeichnung und Laufzeit in der
 * Zeile.
 *
 * @param getGalleryShare holt die Freigabe aus einer Zeile der Tabelle (beim Besitzer ist die Zeile die Freigabe selbst)
 * @param editing mit dieser Angabe sind Bezeichnung und Laufzeit anklickbar; ohne sie nur Text
 */
export function createGalleryShareColumns<T>(
  getGalleryShare: (row: T) => GalleryShare,
  editing?: GalleryShareColumnsEditing,
): TableColumn<T>[] {
  return [
    {
      key: 'LABEL',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLabel),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLabelHint),
      cell: (row) => {
        const galleryShare = getGalleryShare(row)
        const labelText = <span className="text-break">{galleryShare.label}</span>
        if (editing === undefined) {
          return labelText
        }
        const editLabelLabel = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.editLabelLabel, {
          label: galleryShare.label,
        })
        return (
          <EditableCellButton label={editLabelLabel} onClick={() => editing.onEditLabel(galleryShare)}>
            {labelText}
          </EditableCellButton>
        )
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
        const qrCode: CopyableLinkQrCode = {
          label: getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.qrCodeOfShareLabel, { label: galleryShare.label }),
          title: getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.qrCodeOfShareTitle, { label: galleryShare.label }),
          hint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.qrCodeHint),
        }
        return <CopyableLink href={galleryShareLink} copyLabel={copyLabel} qrCode={qrCode} />
      },
    },
    {
      key: 'DURATION',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnDuration),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnDurationHint),
      cell: (row) => {
        const galleryShare = getGalleryShare(row)
        const durationText = getGalleryShareDurationText(galleryShare)
        if (editing === undefined) {
          return durationText
        }
        const editDurationLabel = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.editDurationLabel, {
          label: galleryShare.label,
        })
        return (
          <EditableCellButton label={editDurationLabel} onClick={() => editing.onEditDuration(galleryShare)}>
            {durationText}
          </EditableCellButton>
        )
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
