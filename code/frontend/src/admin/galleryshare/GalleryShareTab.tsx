import { Link } from 'react-router'
import { useLoadedData } from '../../api/useLoadedData.ts'
import { ContentBox } from '../../components/ContentBox.tsx'
import { StatusMark, type StatusMarkLook } from '../../components/StatusMark.tsx'
import { Table } from '../../components/Table.tsx'
import type { TableColumn } from '../../components/TableColumn.ts'
import { UsersGuidName } from '../../components/UsersGuidName.tsx'
import { getGalleryPath } from '../../gallery/galleryPaths.ts'
import type { GalleryShare, GalleryShareForAdmin } from '../../gallery/GalleryShare.ts'
import { createGalleryShareColumns } from '../../gallery/galleryShareColumns.tsx'
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
 * Nur Ansicht: Angelegt und gelöscht wird eine Freigabe in ihrer Galerie, im Reiter „Freigabe“.
 */
export function GalleryShareTab() {
  const originNavigation = useOrigin()
  const galleryShareHook = useGalleryShare()
  const loadedGalleryShares = useLoadedData(galleryShareHook.getAllGalleryShare)
  const gallerySharesForAdmin = loadedGalleryShares.data

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
  const galleryShareColumns = createGalleryShareColumns<GalleryShareForAdmin>(getGalleryShareOfRow)
  const columns = [...ownerAndGalleryColumns, ...galleryShareColumns]

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

  return (
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
        />
      )}
    </ContentBox>
  )
}
