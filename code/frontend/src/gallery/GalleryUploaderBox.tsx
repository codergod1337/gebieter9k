import { useCallback, useState } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ConfirmDeleteButton } from '../components/ConfirmDeleteButton.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { NewEntityButton } from '../components/NewEntityButton.tsx'
import { Table } from '../components/Table.tsx'
import { showToast } from '../components/toastStore.ts'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { GalleryUploader } from './GalleryUploader.ts'
import { createGalleryUploaderColumns } from './galleryUploaderColumns.tsx'
import { GALLERY_UPLOADER_TEXTS } from './galleryUploaderTexts.ts'
import { NewGalleryUploaderPopup } from './NewGalleryUploaderPopup.tsx'
import { useGalleryUploader } from './useGalleryUploader.ts'

type GalleryUploaderBoxProps = {
  /** Die eigene Galerie. */
  galleryId: number
  /** Ihr Titel, für die Überschrift der Box. */
  galleryTitle: string
  /** Ihr Besitzer (der angemeldete User): Ihn bietet die Suche nicht an. */
  ownerUsersGuid: string
}

/**
 * Die Uploadberechtigten einer eigenen Galerie (Nutzer 2026-11-22, Konzept `docu/konzept-galerie.md`, „Gemeinsame
 * Galerie“), im Reiter „Freigabe“ der Galerie (`GallerySharePage`) als eigene Box neben den Freigaben über einen Link:
 * die Liste der User, die in die Galerie hochladen dürfen (Name und Rahmenfarbe), je Zeile das Austragen nach der
 * Sicherheitsabfrage, und rechts im Kopf „neuer Uploadberechtigter“ ({@link NewGalleryUploaderPopup}, mit der globalen
 * Vervollständigung von Usern). Ein eigenes Recht braucht der Besitzer dafür nicht.
 */
export function GalleryUploaderBox({ galleryId, galleryTitle, ownerUsersGuid }: GalleryUploaderBoxProps) {
  const listHook = useGalleryUploader()
  const deleteHook = useGalleryUploader()
  const resolveGalleryUploaders = listHook.resolveGalleryUploaders
  const [newUploaderOpen, setNewUploaderOpen] = useState<boolean>(false)

  const loadGalleryUploaders = useCallback(() => resolveGalleryUploaders(galleryId), [resolveGalleryUploaders, galleryId])
  const loadedGalleryUploaders = useLoadedData(loadGalleryUploaders)
  const galleryUploaders = loadedGalleryUploaders.data
  const reloadGalleryUploaders = loadedGalleryUploaders.reload

  async function deleteGalleryUploader(galleryUploader: GalleryUploader): Promise<boolean> {
    const deleted = await deleteHook.deleteOwnGalleryUploader(galleryUploader.id)
    if (!deleted) {
      return false
    }
    showToast({
      kind: 'success',
      title: getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.deletedToastTitle),
      text: getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.deletedToastText),
    })
    await reloadGalleryUploaders()
    return true
  }

  if (galleryUploaders === null) {
    if (listHook.error !== null) {
      return <ErrorAlert message={listHook.error.detail} />
    }
    return <Spinner animation="border" size="sm" />
  }
  const boxTitle = getTextInCurrentLanguageWithValues(GALLERY_UPLOADER_TEXTS.boxTitle, { galleryTitle })
  const columns = createGalleryUploaderColumns(galleryTitle)
  const newUploaderButton = (
    <NewEntityButton
      label={getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.newUploaderButton)}
      onClick={() => setNewUploaderOpen(true)}
    />
  )
  let deleteErrorMessage: string | null = null
  if (deleteHook.error !== null) {
    deleteErrorMessage = deleteHook.error.detail
  }
  // Die Suche bietet weder den Besitzer an noch wen, der schon eingetragen ist
  const excludedUsersGuids = [ownerUsersGuid]
  for (const galleryUploader of galleryUploaders) {
    excludedUsersGuids.push(galleryUploader.uploaderUsersGuid)
  }

  return (
    <>
      <ContentBox title={boxTitle} actions={newUploaderButton}>
        <p className="small text-body-secondary">{getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.boxHint)}</p>
        <Table
          columns={columns}
          rows={galleryUploaders}
          rowKey={(galleryUploader) => String(galleryUploader.id)}
          detailTitle={() => getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.columnUsers)}
          emptyText={getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.noUploaders)}
          settingKey="GALLERY_UPLOADER"
          actionsWidth="4rem"
          actions={(galleryUploader) => (
            <ConfirmDeleteButton
              label={getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.deleteLabel)}
              question={getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.deleteQuestion)}
              isDeleting={deleteHook.isLoading}
              errorMessage={deleteErrorMessage}
              onDelete={() => deleteGalleryUploader(galleryUploader)}
            />
          )}
        />
      </ContentBox>
      {newUploaderOpen && (
        <NewGalleryUploaderPopup
          galleryId={galleryId}
          galleryTitle={galleryTitle}
          excludedUsersGuids={excludedUsersGuids}
          onCreated={() => void reloadGalleryUploaders()}
          onClose={() => setNewUploaderOpen(false)}
        />
      )}
    </>
  )
}
