import { useCallback, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../api/useLoadedData.ts'
import { adminAccessRoleKey } from '../auth/access/adminAccessRoleKey.ts'
import { galleryShareAccessRoleKey } from '../auth/access/galleryShareAccessRoleKey.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { ConfirmDeletePopup } from '../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { CopyButton } from '../components/CopyButton.tsx'
import { DateTimeText } from '../components/DateTimeText.tsx'
import { DeleteButton } from '../components/DeleteButton.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { formatDateTime } from '../components/formatDateTime.ts'
import { NewEntityButton } from '../components/NewEntityButton.tsx'
import { Table } from '../components/Table.tsx'
import type { TableColumn } from '../components/TableColumn.ts'
import { showToast } from '../components/toastStore.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { GalleryShare } from './GalleryShare.ts'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'
import { getGalleryShareLink } from './galleryShareUrls.ts'
import { NewGallerySharePopup } from './NewGallerySharePopup.tsx'
import { useGalleryShare } from './useGalleryShare.ts'

type GalleryShareBoxProps = {
  /** Die eigene Galerie. */
  galleryId: number
}

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

type GalleryShareLinkCellProps = {
  galleryShare: GalleryShare
}

/**
 * Der Link einer Freigabe zum Weitergeben, in der Liste des Besitzers: zum Anklicken (die Besucherseite geht in einem
 * neuen Tab auf) und daneben der Knopf zum Kopieren.
 */
function GalleryShareLinkCell({ galleryShare }: GalleryShareLinkCellProps) {
  const galleryShareLink = getGalleryShareLink(galleryShare.shareToken)
  const copyLabel = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.copyLinkOfShareLabel, {
    label: galleryShare.label,
  })
  return (
    <span className="d-flex align-items-center">
      <a className="small text-break" href={galleryShareLink} target="_blank" rel="noopener noreferrer">
        {galleryShareLink}
      </a>
      <CopyButton label={copyLabel} value={galleryShareLink} />
    </span>
  )
}

/**
 * Die Freigaben einer eigenen Galerie über einen Link (Konzept `docu/konzept-galerie-freigabe.md`), unter ihren Bildern:
 * die Liste der Freigaben (Bezeichnung, Link zum Weitergeben mit „kopieren“, Laufzeit, Aufrufe, Bilder, angelegt), je
 * Zeile das Löschen nach der Sicherheitsabfrage, und rechts im Kopf „neue Freigabe“ als geführter Ablauf
 * ({@link NewGallerySharePopup}). Der Link bleibt hier stehen, solange es die Freigabe gibt (Nutzer 2026-11-20).
 *
 * Anlegen darf nur, wer Admin ist oder das Recht FREIGABE hat: Ohne das Recht fehlt der Knopf. Wer das Recht nicht (mehr)
 * hat, sieht und löscht seine vorhandenen Freigaben weiter; ohne Recht und ohne Freigaben erscheint die Box nicht.
 */
export function GalleryShareBox({ galleryId }: GalleryShareBoxProps) {
  const { hasAccessRole } = useCurrentSession()
  const listHook = useGalleryShare()
  const deleteHook = useGalleryShare()
  const resolveOwnGalleryShares = listHook.resolveOwnGalleryShares
  const [newShareOpen, setNewShareOpen] = useState<boolean>(false)
  const [deletedGalleryShare, setDeletedGalleryShare] = useState<GalleryShare | null>(null)

  const loadGalleryShares = useCallback(() => resolveOwnGalleryShares(galleryId), [resolveOwnGalleryShares, galleryId])
  const loadedGalleryShares = useLoadedData(loadGalleryShares)
  const galleryShares = loadedGalleryShares.data
  const reloadGalleryShares = loadedGalleryShares.reload

  const mayCreate = hasAccessRole(adminAccessRoleKey) || hasAccessRole(galleryShareAccessRoleKey)

  async function confirmDeleteGalleryShare() {
    if (deletedGalleryShare === null) {
      return
    }
    const deleted = await deleteHook.deleteOwnGalleryShare(deletedGalleryShare.id)
    if (!deleted) {
      return
    }
    showToast({
      kind: 'success',
      title: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.deletedToastTitle),
      text: getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.deletedToastText, { label: deletedGalleryShare.label }),
    })
    setDeletedGalleryShare(null)
    await reloadGalleryShares()
  }

  if (galleryShares === null) {
    if (listHook.error !== null) {
      return <ErrorAlert message={listHook.error.detail} />
    }
    return <Spinner animation="border" size="sm" />
  }
  if (!mayCreate && galleryShares.length === 0) {
    return null
  }

  const columns: TableColumn<GalleryShare>[] = [
    {
      key: 'LABEL',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLabel),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLabelHint),
      cell: (galleryShare) => <span className="text-break">{galleryShare.label}</span>,
    },
    {
      key: 'LINK',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLink),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnLinkHint),
      cell: (galleryShare) => <GalleryShareLinkCell galleryShare={galleryShare} />,
    },
    {
      key: 'DURATION',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnDuration),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnDurationHint),
      cell: (galleryShare) => getGalleryShareDurationText(galleryShare),
    },
    {
      key: 'ACCESS_COUNT',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnAccessCount),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnAccessCountHint),
      cell: (galleryShare) => String(galleryShare.accessCount),
      width: '7rem',
    },
    {
      key: 'FILE_COUNT',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnFileCount),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnFileCountHint),
      cell: (galleryShare) => getGalleryShareFileCountText(galleryShare),
      width: '7rem',
    },
    {
      key: 'CREATED_AT',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnCreatedAt),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.columnCreatedAtHint),
      cell: (galleryShare) => <DateTimeText isoDateTime={galleryShare.createdAt} />,
      unimportant: true,
    },
  ]

  let newShareButton = null
  if (mayCreate) {
    newShareButton = (
      <NewEntityButton
        label={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.newShareButton)}
        onClick={() => setNewShareOpen(true)}
      />
    )
  }
  let footer = null
  if (!mayCreate) {
    footer = <span className="small">{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.noCreateRight)}</span>
  }
  let deleteErrorMessage: string | null = null
  if (deleteHook.error !== null) {
    deleteErrorMessage = deleteHook.error.detail
  }

  return (
    <>
      <ContentBox title={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.boxTitle)} actions={newShareButton} footer={footer}>
        <p className="small text-body-secondary">{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.boxHint)}</p>
        <Table
          columns={columns}
          rows={galleryShares}
          rowKey={(galleryShare) => String(galleryShare.id)}
          detailTitle={(galleryShare) => galleryShare.label}
          emptyText={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.noShares)}
          settingKey="GALLERY_SHARE"
          actions={(galleryShare) => (
            <DeleteButton
              label={getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.deleteLabel, { label: galleryShare.label })}
              onClick={() => setDeletedGalleryShare(galleryShare)}
            />
          )}
        />
      </ContentBox>
      {newShareOpen && (
        <NewGallerySharePopup
          galleryId={galleryId}
          onCreated={() => void reloadGalleryShares()}
          onClose={() => setNewShareOpen(false)}
        />
      )}
      {deletedGalleryShare !== null && (
        <ConfirmDeletePopup
          title={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.deleteTitle)}
          isDeleting={deleteHook.isLoading}
          errorMessage={deleteErrorMessage}
          onConfirm={() => void confirmDeleteGalleryShare()}
          onClose={() => setDeletedGalleryShare(null)}>
          {getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.deleteQuestion, { label: deletedGalleryShare.label })}
        </ConfirmDeletePopup>
      )}
    </>
  )
}
