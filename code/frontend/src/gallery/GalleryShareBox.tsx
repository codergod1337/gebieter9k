import { useCallback, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../api/useLoadedData.ts'
import { adminAccessRoleKey } from '../auth/access/adminAccessRoleKey.ts'
import { galleryShareAccessRoleKey } from '../auth/access/galleryShareAccessRoleKey.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { ConfirmDeletePopup } from '../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { DeleteButton } from '../components/DeleteButton.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { NewEntityButton } from '../components/NewEntityButton.tsx'
import { Table } from '../components/Table.tsx'
import { showToast } from '../components/toastStore.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { GalleryShare } from './GalleryShare.ts'
import { createGalleryShareColumns } from './galleryShareColumns.tsx'
import { GALLERY_SHARE_TEXTS } from './galleryShareTexts.ts'
import { NewGallerySharePopup } from './NewGallerySharePopup.tsx'
import { useGalleryShare } from './useGalleryShare.ts'

type GalleryShareBoxProps = {
  /** Die eigene Galerie. */
  galleryId: number
  /** Ihr Titel, für die Überschrift der Box. */
  galleryTitle: string
}

/** In der Liste des Besitzers ist die Zeile der Tabelle die Freigabe selbst. */
function getGalleryShareOfRow(galleryShare: GalleryShare): GalleryShare {
  return galleryShare
}

/**
 * Die Freigaben einer eigenen Galerie über einen Link (Konzept `docu/konzept-galerie-freigabe.md`), der Inhalt des
 * Reiters „Freigabe“ der Galerie (`GallerySharePage`, seit 2026-11-20 ein eigener Reiter statt unter den Bildern):
 * die Liste der Freigaben (Bezeichnung, Link zum Weitergeben mit „kopieren“, Laufzeit, Aufrufe, Bilder, angelegt), je
 * Zeile das Löschen nach der Sicherheitsabfrage, und rechts im Kopf „neue Freigabe“ als geführter Ablauf
 * ({@link NewGallerySharePopup}). Der Link bleibt hier stehen, solange es die Freigabe gibt (Nutzer 2026-11-20).
 *
 * Anlegen darf nur, wer Admin ist oder das Recht FREIGABE hat: Ohne das Recht fehlt der Knopf, und im Fuß steht, wer
 * anlegen darf. Wer das Recht nicht (mehr) hat, sieht und löscht seine vorhandenen Freigaben weiter.
 */
export function GalleryShareBox({ galleryId, galleryTitle }: GalleryShareBoxProps) {
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
  const columns = createGalleryShareColumns<GalleryShare>(getGalleryShareOfRow)

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
  const boxTitle = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.boxTitle, { galleryTitle })

  return (
    <>
      <ContentBox title={boxTitle} actions={newShareButton} footer={footer}>
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
