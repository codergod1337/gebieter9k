import { useState } from 'react'
import { Link } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ConfirmDeletePopup } from '../../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../../components/ContentBox.tsx'
import { DeleteButton } from '../../components/DeleteButton.tsx'
import { EditTextPopup } from '../../components/EditTextPopup.tsx'
import { StatusMark, type StatusMarkLook } from '../../components/StatusMark.tsx'
import { Table } from '../../components/Table.tsx'
import type { TableColumn } from '../../components/TableColumn.ts'
import { showToast } from '../../components/toastStore.ts'
import { UsersGuidName } from '../../components/UsersGuidName.tsx'
import { EditGalleryShareDurationPopup } from '../../gallery/EditGalleryShareDurationPopup.tsx'
import { getGalleryPath } from '../../gallery/galleryPaths.ts'
import {
  GALLERY_SHARE_LABEL_MAX_LENGTH,
  type GalleryShare,
  type GalleryShareChange,
  type GalleryShareForAdmin,
} from '../../gallery/GalleryShare.ts'
import { createGalleryShareColumns, type GalleryShareColumnsEditing } from '../../gallery/galleryShareColumns.tsx'
import type { GalleryShareLimits } from '../../gallery/galleryShareDurationInput.ts'
import { GALLERY_SHARE_TEXTS } from '../../gallery/galleryShareTexts.ts'
import { useGalleryShare } from '../../gallery/useGalleryShare.ts'
import { getTextInCurrentLanguage } from '../../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../../language/getTextInCurrentLanguageWithValues.ts'
import { useOrigin } from '../../navigation/useOrigin.ts'
import { LoadStatus } from '../../components/LoadStatus.tsx'
import { getFirstErrorDetail } from '../../api/getFirstErrorDetail.ts'

/** In der Übersicht des Admins steckt die Freigabe in der Zeile, neben Galerie und Besitzer. */
function getGalleryShareOfRow(galleryShareForAdmin: GalleryShareForAdmin): GalleryShare {
  return galleryShareForAdmin.galleryShare
}

/**
 * Tab „Freigaben“ der Administration (Nutzer 2026-11-20, Konzept `docu/konzept-galerie-freigabe.md`, Abschnitt 9): alle
 * Freigaben aller Galerien über einen Link in einer ContentBox, die neueste zuerst. Alles aus globalen Bausteinen: die
 * zentrale `Table`, der Besitzer über `UsersGuidName`, die Galerie als Link mit diesem Tab als Origin („Zurück zu
 * Freigaben“), dahinter dieselben Spalten wie in der Liste des Besitzers ({@link createGalleryShareColumns}).
 *
 * Der Admin ändert und löscht hier jede Freigabe (Nutzer 2026-11-21), direkt in der Zeile wie in jeder Tabelle: Klick
 * auf die Bezeichnung öffnet das kleine Popup für den Text ({@link EditTextPopup}), Klick auf „Gilt“ das für die
 * Laufzeit ({@link EditGalleryShareDurationPopup}: dauerhaft, bis zu einem Zeitpunkt, für eine Zahl von Aufrufen), der
 * Mülleimer löscht nach der Sicherheitsabfrage. Der Link einer Freigabe bleibt beim Ändern derselbe; neben ihm stehen
 * „kopieren“ und der QR-Code. Angelegt wird eine Freigabe weiter in ihrer Galerie, im Reiter „Freigabe“.
 */
export function GalleryShareTab() {
  const originNavigation = useOrigin()
  const galleryShareHook = useGalleryShare()
  const changeHook = useGalleryShare()
  const deleteHook = useGalleryShare()
  const loadedGalleryShares = useLoadedData(galleryShareHook.getAllGalleryShare)
  const gallerySharesForAdmin = loadedGalleryShares.data
  const reloadGalleryShares = loadedGalleryShares.reload
  /** Die Freigabe, deren Bezeichnung gerade im Popup geändert wird, `null` wenn keine. */
  const [galleryShareToRename, setGalleryShareToRename] = useState<GalleryShare | null>(null)
  /** Die Freigabe, deren Laufzeit gerade im Popup geändert wird, `null` wenn keine. */
  const [galleryShareToChangeDuration, setGalleryShareToChangeDuration] = useState<GalleryShare | null>(null)
  /** Die Freigabe, nach deren Löschen gerade gefragt wird, `null` wenn keine. */
  const [galleryShareToDelete, setGalleryShareToDelete] = useState<GalleryShare | null>(null)

  /** Speichert eine geänderte Freigabe; liefert, ob es geklappt hat. Der Fehler steht sonst im Popup. */
  async function saveGalleryShareChange(galleryShareChange: GalleryShareChange): Promise<boolean> {
    const changedGalleryShare = await changeHook.changeGalleryShare(galleryShareChange)
    if (changedGalleryShare === null) {
      return false
    }
    showToast({
      kind: 'success',
      title: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.changedToastTitle),
      text: getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.changedToastText, { label: changedGalleryShare.label }),
    })
    await reloadGalleryShares()
    return true
  }

  async function handleSaveLabel(changedLabel: string) {
    if (galleryShareToRename === null) {
      return
    }
    const galleryShareChange: GalleryShareChange = {
      id: galleryShareToRename.id,
      label: changedLabel,
      expiresAt: galleryShareToRename.expiresAt,
      maxAccessCount: galleryShareToRename.maxAccessCount,
    }
    const saved = await saveGalleryShareChange(galleryShareChange)
    if (saved) {
      setGalleryShareToRename(null)
    }
  }

  async function handleSaveDuration(changedLimits: GalleryShareLimits) {
    if (galleryShareToChangeDuration === null) {
      return
    }
    const galleryShareChange: GalleryShareChange = {
      id: galleryShareToChangeDuration.id,
      label: galleryShareToChangeDuration.label,
      expiresAt: changedLimits.expiresAt,
      maxAccessCount: changedLimits.maxAccessCount,
    }
    const saved = await saveGalleryShareChange(galleryShareChange)
    if (saved) {
      setGalleryShareToChangeDuration(null)
    }
  }

  async function confirmDeleteGalleryShare() {
    if (galleryShareToDelete === null) {
      return
    }
    const deleted = await deleteHook.deleteGalleryShare(galleryShareToDelete.id)
    if (!deleted) {
      return
    }
    showToast({
      kind: 'success',
      title: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.deletedToastTitle),
      text: getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.deletedToastText, { label: galleryShareToDelete.label }),
    })
    setGalleryShareToDelete(null)
    await reloadGalleryShares()
  }

  const originLabel = getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminOriginLabel)
  const originState = originNavigation.createOriginStateHere(originLabel)
  // Eine Freigabe an einer Galerie, die es nicht mehr gibt, ist ein Rest und soll auffallen
  const galleryMissingLook: StatusMarkLook = {
    tone: 'DANGER',
    iconClassName: 'bi bi-exclamation-triangle',
    label: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminGalleryMissing),
  }

  const ownerAndGalleryColumns: TableColumn<GalleryShareForAdmin>[] = [
    {
      key: 'OWNER',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminColumnOwner),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminColumnOwnerHint),
      cell: (galleryShareForAdmin) => {
        const ownerUsersGuid = galleryShareForAdmin.ownerUsersGuid
        if (ownerUsersGuid === null) {
          return <span className="text-body-secondary">–</span>
        }
        return <UsersGuidName usersGuid={ownerUsersGuid} originLabel={originLabel} />
      },
    },
    {
      key: 'GALLERY',
      header: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminColumnGallery),
      headerHint: getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminColumnGalleryHint),
      cell: (galleryShareForAdmin) => {
        const galleryTitle = galleryShareForAdmin.galleryTitle
        const ownerUsersGuid = galleryShareForAdmin.ownerUsersGuid
        if (galleryTitle === null || ownerUsersGuid === null) {
          return <StatusMark look={galleryMissingLook} />
        }
        const galleryId = galleryShareForAdmin.galleryShare.galleryId
        const galleryPath = getGalleryPath(ownerUsersGuid, galleryId)
        return (
          <Link to={galleryPath} state={originState} className="text-break">
            {galleryTitle}
          </Link>
        )
      },
    },
  ]
  const columnsEditing: GalleryShareColumnsEditing = {
    onEditLabel: setGalleryShareToRename,
    onEditDuration: setGalleryShareToChangeDuration,
  }
  const galleryShareColumns = createGalleryShareColumns<GalleryShareForAdmin>(getGalleryShareOfRow, columnsEditing)
  const columns = [...ownerAndGalleryColumns, ...galleryShareColumns]

  let changeErrorMessage: string | null = null
  if (changeHook.error !== null) {
    changeErrorMessage = changeHook.error.detail
  }
  let deleteErrorMessage: string | null = null
  if (deleteHook.error !== null) {
    deleteErrorMessage = deleteHook.error.detail
  }
  let renamePopupTitle = ''
  if (galleryShareToRename !== null) {
    renamePopupTitle = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.editLabelTitle, {
      label: galleryShareToRename.label,
    })
  }
  let durationPopupTitle = ''
  if (galleryShareToChangeDuration !== null) {
    durationPopupTitle = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.editDurationTitle, {
      label: galleryShareToChangeDuration.label,
    })
  }

  const footerErrorMessage = getFirstErrorDetail([galleryShareHook.error])
  let shareCountText = ''
  if (gallerySharesForAdmin !== null) {
    const shareCount = String(gallerySharesForAdmin.length)
    shareCountText = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.adminShareCountMany, { shareCount })
    if (gallerySharesForAdmin.length === 1) {
      shareCountText = getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminShareCountOne)
    }
  }
  const footer = (
    <LoadStatus errorMessage={footerErrorMessage} isLoading={gallerySharesForAdmin === null}>
      {shareCountText}
    </LoadStatus>
  )

  function renderRowActions(galleryShareForAdmin: GalleryShareForAdmin) {
    const galleryShare = galleryShareForAdmin.galleryShare
    const deleteLabel = getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.deleteLabel, { label: galleryShare.label })
    return <DeleteButton label={deleteLabel} onClick={() => setGalleryShareToDelete(galleryShare)} />
  }

  return (
    <>
      <ContentBox title={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminBoxTitle)} footer={footer}>
        <p className="small text-body-secondary">{getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminBoxHint)}</p>
        {gallerySharesForAdmin !== null && (
          <Table
            columns={columns}
            rows={gallerySharesForAdmin}
            rowKey={(galleryShareForAdmin) => String(galleryShareForAdmin.galleryShare.id)}
            detailTitle={(galleryShareForAdmin) => galleryShareForAdmin.galleryShare.label}
            emptyText={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.adminNoShares)}
            settingKey="GALLERY_SHARE_ADMIN"
            actions={renderRowActions}
            actionsWidth="4rem"
          />
        )}
      </ContentBox>
      {galleryShareToRename !== null && (
        <EditTextPopup
          title={renamePopupTitle}
          inputLabel={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.labelInputLabel)}
          initialText={galleryShareToRename.label}
          maxLength={GALLERY_SHARE_LABEL_MAX_LENGTH}
          hint={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.labelHintForEdit)}
          isSaving={changeHook.isLoading}
          errorMessage={changeErrorMessage}
          onSave={(changedLabel) => void handleSaveLabel(changedLabel)}
          onClose={() => setGalleryShareToRename(null)}
        />
      )}
      {galleryShareToChangeDuration !== null && (
        <EditGalleryShareDurationPopup
          title={durationPopupTitle}
          galleryShare={galleryShareToChangeDuration}
          isSaving={changeHook.isLoading}
          errorMessage={changeErrorMessage}
          onSave={(changedLimits) => void handleSaveDuration(changedLimits)}
          onClose={() => setGalleryShareToChangeDuration(null)}
        />
      )}
      {galleryShareToDelete !== null && (
        <ConfirmDeletePopup
          title={getTextInCurrentLanguage(GALLERY_SHARE_TEXTS.deleteTitle)}
          isDeleting={deleteHook.isLoading}
          errorMessage={deleteErrorMessage}
          onConfirm={() => void confirmDeleteGalleryShare()}
          onClose={() => setGalleryShareToDelete(null)}>
          {getTextInCurrentLanguageWithValues(GALLERY_SHARE_TEXTS.deleteQuestion, { label: galleryShareToDelete.label })}
        </ConfirmDeletePopup>
      )}
    </>
  )
}
