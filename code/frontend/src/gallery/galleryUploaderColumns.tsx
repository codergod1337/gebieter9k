import type { TableColumn } from '../components/TableColumn.ts'
import { UsersGuidName } from '../components/UsersGuidName.tsx'
import { UsersUploadFrameSwatch } from '../components/UsersUploadFrameSwatch.tsx'
import { getTextInCurrentLanguage } from '../language/getTextInCurrentLanguage.ts'
import type { GalleryUploader } from './GalleryUploader.ts'
import { GALLERY_UPLOADER_TEXTS } from './galleryUploaderTexts.ts'

/**
 * Die Spalten eines Uploadberechtigten für die zentrale `Table` (`components/Table.tsx`), aus globalen Bausteinen: der
 * User (`UsersGuidName`: Avatar und Name, führt auf sein Profil) und die Farbe, in der seine Bilder in der Galerie
 * umrandet sind (`UsersUploadFrameSwatch`).
 *
 * @param originLabel der Name der Seite, von der aus man ein Profil öffnet, für „Zurück zu …“
 */
export function createGalleryUploaderColumns(originLabel: string): TableColumn<GalleryUploader>[] {
  return [
    {
      key: 'USERS',
      header: getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.columnUsers),
      headerHint: getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.columnUsersHint),
      cell: (galleryUploader) => (
        <UsersGuidName usersGuid={galleryUploader.uploaderUsersGuid} originLabel={originLabel} />
      ),
    },
    {
      key: 'FRAME_COLOR',
      header: getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.columnFrameColor),
      headerHint: getTextInCurrentLanguage(GALLERY_UPLOADER_TEXTS.columnFrameColorHint),
      width: '6rem',
      cell: (galleryUploader) => <UsersUploadFrameSwatch usersGuid={galleryUploader.uploaderUsersGuid} />,
    },
  ]
}
