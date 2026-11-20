import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { Navigate, useParams } from 'react-router'
import { useLoadedData } from '../api/useLoadedData.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { getGalleryPath } from './galleryPaths.ts'
import { GalleryShareBox } from './GalleryShareBox.tsx'
import { useGallery } from './useGallery.ts'

/**
 * Der Reiter „Freigabe“ einer eigenen Galerie unter `/profile/<guid>/galleries/<id>/share` (Nutzer 2026-11-20: ein
 * eigener Reiter, nicht mehr unter allen Bildkacheln): die Freigaben der Galerie über einen Link
 * ({@link GalleryShareBox}, Konzept `docu/konzept-galerie-freigabe.md`). Den Reiter zeigt der Subheader des Profils
 * nur dem Besitzer; wer die Adresse einer fremden Galerie von Hand öffnet, landet bei ihren Bildern.
 */
export function GallerySharePage() {
  const { galleryId } = useParams()
  const { session } = useCurrentSession()
  const galleryHook = useGallery()
  const getGalleryForClient = galleryHook.getGalleryForClient
  const galleryIdNumber = Number(galleryId)

  const loadGallery = useCallback(() => getGalleryForClient(galleryIdNumber), [getGalleryForClient, galleryIdNumber])
  const loadedGallery = useLoadedData(loadGallery)
  const gallery = loadedGallery.data

  if (galleryHook.error !== null && gallery === null) {
    return <ErrorAlert message="Diese Galerie gibt es nicht, oder du darfst sie nicht sehen." />
  }
  if (gallery === null) {
    return <Spinner animation="border" />
  }
  const ownGallery = session !== null && session.users.guid === gallery.ownerUsersGuid
  if (!ownGallery) {
    const galleryPath = getGalleryPath(gallery.ownerUsersGuid, gallery.id)
    return <Navigate to={galleryPath} replace />
  }
  return <GalleryShareBox galleryId={gallery.id} galleryTitle={gallery.title} />
}
