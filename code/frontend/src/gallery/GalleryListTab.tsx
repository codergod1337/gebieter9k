import { type ReactNode, useCallback, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ConfirmDeletePopup } from '../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { DeleteButton } from '../components/DeleteButton.tsx'
import { EditButton } from '../components/EditButton.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { LoadStatus } from '../components/LoadStatus.tsx'
import { NewEntityButton } from '../components/NewEntityButton.tsx'
import { SortableArea } from '../components/SortableArea.tsx'
import { Table } from '../components/Table.tsx'
import { useIsMobile } from '../components/useIsMobile.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import { useOrigin } from '../navigation/useOrigin.ts'
import type { GalleryForClient, GalleryInput } from './Gallery.ts'
import { createGalleryColumns } from './galleryColumns.tsx'
import { GalleryEditPopup } from './GalleryEditPopup.tsx'
import type { GalleryShare } from './GalleryShare.ts'
import { GALLERY_TEXTS } from './galleryTexts.ts'
import { GalleryTile } from './GalleryTile.tsx'
import { useGallery } from './useGallery.ts'
import { useGalleryShare } from './useGalleryShare.ts'

/** Woher man kommt, wenn man aus diesem Tab eine Galerie öffnet. */
const GALLERY_LIST_ORIGIN_LABEL = 'Galerien'

function getGalleryKey(gallery: GalleryForClient): string {
  return String(gallery.id)
}

/** Die Freigaben nach ihrer Galerie geordnet, für die Spalte „Freigaben“ der Tabelle. */
function groupGallerySharesByGalleryId(galleryShares: GalleryShare[]): Map<number, GalleryShare[]> {
  const gallerySharesByGalleryId = new Map<number, GalleryShare[]>()
  for (const galleryShare of galleryShares) {
    let gallerySharesOfGallery = gallerySharesByGalleryId.get(galleryShare.galleryId)
    if (gallerySharesOfGallery === undefined) {
      gallerySharesOfGallery = []
      gallerySharesByGalleryId.set(galleryShare.galleryId, gallerySharesOfGallery)
    }
    gallerySharesOfGallery.push(galleryShare)
  }
  return gallerySharesByGalleryId
}

/**
 * Tab „Galerien“ im Profil unter `/profile/<guid>/galleries` (Konzept `docu/konzept-galerie.md`): die Galerien des
 * Users, die der Betrachter sehen darf, in ihrer Reihenfolge. Im eigenen Profil dazu „neue Galerie“ (Popup mit Titel,
 * Beschreibung, Sichtbarkeit), je Galerie Bearbeiten und Löschen und das Sortieren per Drag and Drop. Ein privates
 * Profil hat für andere keine Galerien.
 *
 * Am Desktop stehen die Galerien als Kacheln da ({@link GalleryTile}), auf dem Handy als Tabelle (Nutzer 2026-11-20,
 * die zentrale `Table` mit den Spalten aus {@link createGalleryColumns}): Titel mit Beschreibung hinter dem „i“,
 * Bilder, letztes Bild, sichtbar für, im eigenen Profil die Freigaben über einen Link, erstellt. Die Freigaben lädt
 * der Tab nur dann (eigenes Profil, Handy).
 */
export function GalleryListTab() {
  const { usersGuid } = useParams()
  const { session } = useCurrentSession()
  const loadHook = useGallery()
  const saveHook = useGallery()
  const galleryShareHook = useGalleryShare()
  const originNavigation = useOrigin()
  const isMobile = useIsMobile()
  const resolveGalleries = loadHook.resolveGalleries
  const getAllOwnGalleryShare = galleryShareHook.getAllOwnGalleryShare
  const profileUsersGuid = usersGuid ?? ''
  const ownProfile = session !== null && session.users.guid === profileUsersGuid
  /** Die Spalte „Freigaben“ gibt es nur in der Tabelle des eigenen Profils. */
  const showShares = ownProfile && isMobile
  const [newGalleryOpen, setNewGalleryOpen] = useState<boolean>(false)
  const [editedGallery, setEditedGallery] = useState<GalleryForClient | null>(null)
  const [deletedGallery, setDeletedGallery] = useState<GalleryForClient | null>(null)
  /** Die Reihenfolge nach dem Ziehen, bis das Backend sie bestätigt hat; `null`: die geladene. */
  const [reorderedGalleries, setReorderedGalleries] = useState<GalleryForClient[] | null>(null)

  const loadGalleries = useCallback(() => resolveGalleries(profileUsersGuid), [resolveGalleries, profileUsersGuid])
  const loadedGalleries = useLoadedData(loadGalleries)
  let galleries = loadedGalleries.data
  if (reorderedGalleries !== null) {
    galleries = reorderedGalleries
  }
  let saveErrorMessage: string | null = null
  if (saveHook.error !== null) {
    saveErrorMessage = saveHook.error.detail
  }
  const originState = originNavigation.createOriginStateHere(GALLERY_LIST_ORIGIN_LABEL)

  const loadOwnGalleryShares = useCallback(async () => {
    if (!showShares) {
      const noGalleryShares: GalleryShare[] = []
      return noGalleryShares
    }
    return getAllOwnGalleryShare()
  }, [showShares, getAllOwnGalleryShare])
  const loadedOwnGalleryShares = useLoadedData(loadOwnGalleryShares)
  let gallerySharesByGalleryId: Map<number, GalleryShare[]> | null = null
  if (loadedOwnGalleryShares.data !== null) {
    gallerySharesByGalleryId = groupGallerySharesByGalleryId(loadedOwnGalleryShares.data)
  }

  async function createGallery(galleryInput: GalleryInput): Promise<boolean> {
    const createdGallery = await saveHook.createOwnGallery(galleryInput)
    if (createdGallery === null) {
      return false
    }
    await loadedGalleries.reload()
    return true
  }

  async function changeGallery(galleryInput: GalleryInput): Promise<boolean> {
    if (editedGallery === null) {
      return false
    }
    const changedGallery = await saveHook.changeOwnGallery(editedGallery.id, galleryInput)
    if (changedGallery === null) {
      return false
    }
    await loadedGalleries.reload()
    return true
  }

  async function confirmDeleteGallery() {
    if (deletedGallery === null) {
      return
    }
    const deleted = await saveHook.deleteOwnGallery(deletedGallery.id)
    if (!deleted) {
      return
    }
    setDeletedGallery(null)
    await loadedGalleries.reload()
  }

  /** Nach dem Ziehen: gleich so zeigen, speichern, dann neu laden. */
  async function reorderGalleries(changedGalleries: GalleryForClient[]) {
    setReorderedGalleries(changedGalleries)
    const galleryIdsInOrder = changedGalleries.map((gallery) => gallery.id)
    await saveHook.changeOwnGalleryListingPositions(galleryIdsInOrder)
    await loadedGalleries.reload()
    setReorderedGalleries(null)
  }

  let boxTitle = getTextInCurrentLanguage(GALLERY_TEXTS.listTitle)
  let newGalleryButton = null
  if (ownProfile) {
    boxTitle = getTextInCurrentLanguage(GALLERY_TEXTS.listTitleOwn)
    newGalleryButton = <NewEntityButton label="neue Galerie" onClick={() => setNewGalleryOpen(true)} />
  }
  let editedGalleryInput: GalleryInput | null = null
  if (editedGallery !== null) {
    editedGalleryInput = {
      title: editedGallery.title,
      description: editedGallery.description,
      visibility: editedGallery.visibility,
    }
  }

  // Der Fuß: wie viele Galerien, im eigenen Profil mit dem Hinweis auf das Verschieben
  const profilePrivate = loadHook.error !== null && galleries === null
  const isLoadingGalleries = galleries === null && !profilePrivate
  let galleryCountText = ''
  if (galleries !== null && galleries.length > 0) {
    const galleryCount = galleries.length.toLocaleString('de-DE')
    galleryCountText = getTextInCurrentLanguageWithValues(GALLERY_TEXTS.listCountMany, { galleryCount })
    if (galleries.length === 1) {
      galleryCountText = getTextInCurrentLanguage(GALLERY_TEXTS.listCountOne)
    }
    if (ownProfile) {
      galleryCountText = galleryCountText + getTextInCurrentLanguage(GALLERY_TEXTS.listCountOwnHint)
    }
  }
  const footer = (
    <LoadStatus errorMessage={null} isLoading={isLoadingGalleries}>
      {galleryCountText}
    </LoadStatus>
  )

  let content
  if (profilePrivate) {
    content = <p className="text-body-secondary mb-0">{getTextInCurrentLanguage(GALLERY_TEXTS.listPrivate)}</p>
  } else if (galleries === null) {
    content = <Spinner animation="border" />
  } else if (galleries.length === 0) {
    content = <p className="text-body-secondary mb-0">{getTextInCurrentLanguage(GALLERY_TEXTS.listEmpty)}</p>
  } else if (isMobile) {
    // Auf dem Handy die Tabelle: mehr Angaben je Galerie, was nicht passt, zeigt ein Tipp auf die Zeile
    const columns = createGalleryColumns({ originState, showShares, gallerySharesByGalleryId })
    let rowActions: ((gallery: GalleryForClient) => ReactNode) | undefined = undefined
    let reorderRows: ((changedGalleries: GalleryForClient[]) => void) | undefined = undefined
    if (ownProfile) {
      rowActions = (gallery) => {
        const editLabel = getTextInCurrentLanguageWithValues(GALLERY_TEXTS.editLabel, { title: gallery.title })
        const deleteLabel = getTextInCurrentLanguageWithValues(GALLERY_TEXTS.deleteLabel, { title: gallery.title })
        return (
          <>
            <EditButton label={editLabel} onClick={() => setEditedGallery(gallery)} />{' '}
            <DeleteButton label={deleteLabel} onClick={() => setDeletedGallery(gallery)} />
          </>
        )
      }
      reorderRows = (changedGalleries) => void reorderGalleries(changedGalleries)
    }
    content = (
      <Table
        columns={columns}
        rows={galleries}
        rowKey={getGalleryKey}
        detailTitle={(gallery) => gallery.title}
        emptyText={getTextInCurrentLanguage(GALLERY_TEXTS.listEmpty)}
        settingKey="GALLERY"
        actions={rowActions}
        onReorder={reorderRows}
        reorderDisabled={saveHook.isLoading}
      />
    )
  } else {
    content = (
      <SortableArea items={galleries} itemKey={getGalleryKey} onReorder={(changed) => void reorderGalleries(changed)} layout="grid">
        <div className="gallery-tiles">
          {galleries.map((gallery) => (
            <GalleryTile
              key={gallery.id}
              gallery={gallery}
              originState={originState}
              editable={ownProfile}
              sortingDisabled={saveHook.isLoading}
              onEdit={setEditedGallery}
              onDelete={setDeletedGallery}
            />
          ))}
        </div>
      </SortableArea>
    )
  }

  return (
    <>
      <ContentBox title={boxTitle} actions={newGalleryButton} footer={footer}>
        <ErrorAlert message={saveErrorMessage} />
        {content}
      </ContentBox>
      {newGalleryOpen && (
        <GalleryEditPopup
          title="Neue Galerie"
          initialGalleryInput={null}
          isSaving={saveHook.isLoading}
          errorMessage={saveErrorMessage}
          onSave={createGallery}
          onClose={() => setNewGalleryOpen(false)}
        />
      )}
      {editedGallery !== null && (
        <GalleryEditPopup
          title="Galerie bearbeiten"
          initialGalleryInput={editedGalleryInput}
          isSaving={saveHook.isLoading}
          errorMessage={saveErrorMessage}
          onSave={changeGallery}
          onClose={() => setEditedGallery(null)}
        />
      )}
      {deletedGallery !== null && (
        <ConfirmDeletePopup
          title="Galerie löschen"
          isDeleting={saveHook.isLoading}
          errorMessage={saveErrorMessage}
          onConfirm={() => void confirmDeleteGallery()}
          onClose={() => setDeletedGallery(null)}>
          Soll die Galerie <strong>{deletedGallery.title}</strong> gelöscht werden? Ihre Bilder bleiben erhalten, sie
          verlieren nur die Galerie und werden privat (nur du).
        </ConfirmDeletePopup>
      )}
    </>
  )
}
