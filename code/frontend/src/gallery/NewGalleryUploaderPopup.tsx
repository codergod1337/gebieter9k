import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import { EditValuePopup } from '../components/EditValuePopup.tsx'
import { showToast } from '../components/toastStore.ts'
import { UsersAvatar } from '../components/UsersAvatar.tsx'
import { UsersSearchInput } from '../components/UsersSearchInput.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import { getTextInCurrentLanguageWithValues } from '../language/getTextInCurrentLanguageWithValues.ts'
import type { UsersForSearch } from '../users/UsersForSearch.ts'
import { GALLERY_UPLOADER_TEXTS } from './galleryUploaderTexts.ts'
import { useGalleryUploader } from './useGalleryUploader.ts'

type NewGalleryUploaderPopupProps = {
  galleryId: number
  /** Der Titel der Galerie, für die Rückmeldung. */
  galleryTitle: string
  /** Wen die Suche nicht anbietet: der Besitzer selbst und wer schon eingetragen ist. */
  excludedUsersGuids: string[]
  /** Ein Uploadberechtigter ist eingetragen: Der Aufrufer lädt seine Liste neu. */
  onCreated: () => void
  onClose: () => void
}

/**
 * „Neuer Uploadberechtigter“ einer eigenen Galerie (Nutzer 2026-11-22), das kleine Popup hinter dem Knopf: einen User
 * über die globale Vervollständigung suchen ({@link UsersSearchInput}: Username oder Anfang der E-Mail-Adresse), den
 * Treffer wählen, speichern. Gespeichert wird seine GUID. Erst mit der Wahl steht der Gewählte da und „Speichern“ wird
 * frei; „anderen wählen“ bringt die Suche zurück.
 */
export function NewGalleryUploaderPopup({
  galleryId,
  galleryTitle,
  excludedUsersGuids,
  onCreated,
  onClose,
}: NewGalleryUploaderPopupProps) {
  const galleryUploaderHook = useGalleryUploader()
  const [pickedUsers, setPickedUsers] = useState<UsersForSearch | null>(null)
  const isSaving = galleryUploaderHook.isLoading
  let errorMessage: string | null = null
  if (galleryUploaderHook.error !== null) {
    errorMessage = galleryUploaderHook.error.detail
  }

  async function handleSave() {
    if (pickedUsers === null) {
      return
    }
    const createdGalleryUploader = await galleryUploaderHook.createOwnGalleryUploader(galleryId, pickedUsers.usersGuid)
    if (createdGalleryUploader === null) {
      return
    }
    showToast({
      kind: 'success',
      title: getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.createdToastTitle),
      text: getTextInCurrentLanguageWithValues(GALLERY_UPLOADER_TEXTS.createdToastText, {
        username: pickedUsers.username,
        galleryTitle,
      }),
    })
    onCreated()
    onClose()
  }

  return (
    <EditValuePopup
      title={getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.newUploaderPopupTitle)}
      isSaving={isSaving}
      errorMessage={errorMessage}
      saveDisabled={pickedUsers === null}
      onSave={() => void handleSave()}
      onClose={onClose}>
      {pickedUsers === null && (
        <>
          <label className="form-label" htmlFor="newGalleryUploaderSearch">
            {getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.searchLabel)}
          </label>
          <UsersSearchInput
            controlId="newGalleryUploaderSearch"
            excludedUsersGuids={excludedUsersGuids}
            autoFocus
            onPick={setPickedUsers}
          />
        </>
      )}
      {pickedUsers !== null && (
        <>
          <div className="form-label">{getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.pickedLabel)}</div>
          <div className="gallery-uploader-picked">
            <UsersAvatar
              usersGuid={pickedUsers.usersGuid}
              username={pickedUsers.username}
              profileImageBase64Png={pickedUsers.usersAvatar.profileImageSmallBase64Png}
              size="medium"
              anonymous={pickedUsers.usersAvatar.anonymous}
              textColor={pickedUsers.usersAvatar.avatarTextColor}
              backgroundColor={pickedUsers.usersAvatar.avatarBackgroundColor}
            />
            <strong className="gallery-uploader-picked-name">{pickedUsers.username}</strong>
            <Button variant="link" size="sm" disabled={isSaving} onClick={() => setPickedUsers(null)}>
              {getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.pickOtherButton)}
            </Button>
          </div>
        </>
      )}
    </EditValuePopup>
  )
}
