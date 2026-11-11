import { useCallback, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useParams } from 'react-router'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ConfirmDeletePopup } from '../components/ConfirmDeletePopup.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { NewEntityButton } from '../components/NewEntityButton.tsx'
import { SortableArea } from '../components/SortableArea.tsx'
import { useOrigin } from '../navigation/useOrigin.ts'
import type { GalleryForClient, GalleryInput } from './Gallery.ts'
import { GalleryEditPopup } from './GalleryEditPopup.tsx'
import { GalleryTile } from './GalleryTile.tsx'
import { useGallery } from './useGallery.ts'

/** Woher man kommt, wenn man aus diesem Tab eine Galerie öffnet. */
const GALLERY_LIST_ORIGIN_LABEL = 'Galerien'

function getGalleryKey(gallery: GalleryForClient): string {
  return String(gallery.id)
}

/**
 * Tab „Galerien“ im Profil unter `/profile/<guid>/galleries` (Konzept `docu/konzept-galerie.md`): die Galerien des
 * Users als Kacheln, die der Betrachter sehen darf, in ihrer Reihenfolge. Im eigenen Profil dazu „neue Galerie“ (Popup
 * mit Titel, Beschreibung, Sichtbarkeit), je Kachel Bearbeiten und Löschen und das Sortieren per Drag and Drop. Ein
 * privates Profil hat für andere keine Galerien.
 */
export function GalleryListTab() {
  const { usersGuid } = useParams()
  const { session } = useCurrentSession()
  const loadHook = useGallery()
  const saveHook = useGallery()
  const originNavigation = useOrigin()
  const resolveGalleries = loadHook.resolveGalleries
  const profileUsersGuid = usersGuid ?? ''
  const ownProfile = session !== null && session.users.guid === profileUsersGuid
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

  let boxTitle = 'Galerien'
  let newGalleryButton = null
  if (ownProfile) {
    boxTitle = 'Deine Galerien'
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

  let content
  if (loadHook.error !== null && galleries === null) {
    content = <p className="text-body-secondary mb-0">Dieses Profil ist privat, seine Galerien sieht nur der Besitzer.</p>
  } else if (galleries === null) {
    content = <Spinner animation="border" />
  } else if (galleries.length === 0) {
    content = <p className="text-body-secondary mb-0">Noch keine Galerien.</p>
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
      <ContentBox title={boxTitle} actions={newGalleryButton}>
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
