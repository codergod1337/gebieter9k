import { type ReactNode, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import type { AccessRoleCollection } from '../auth/access/AccessRoleCollection.ts'
import { AccessRoleCollectionBadge } from '../auth/access/AccessRoleCollectionBadge.tsx'
import { ContentBox } from '../components/ContentBox.tsx'
import { Hoverlay } from '../components/Hoverlay.tsx'
import { downscaledPngBase64 } from '../components/base64Image.ts'
import { ImageCropUploadPopup } from '../components/ImageCropUploadPopup.tsx'
import { UsersAvatar } from '../components/UsersAvatar.tsx'
import { GUESTBOOK_BOX_ELEMENT_ID } from '../guestbook/guestbookBoxElementId.ts'
import {
  BANNER_DRIFT_SPEED_DEFAULT_PERCENT,
  getBannerDriftSpeedPercent,
  PROFILE_IMAGE_MIN_CROP_PIXELS,
  PROFILE_IMAGE_SIZE_PIXELS,
  PROFILE_IMAGE_SMALL_SIZE_PIXELS,
  type UsersDetail,
} from '../users/UsersDetail.ts'
import { useUsersDetail } from '../users/useUsersDetail.ts'
import type { UsersForProfile } from '../users/Users.ts'
import { ProfileCover } from './ProfileCover.tsx'
import { type ProfileHeadSettings, ProfileHeadSettingsPopup } from './ProfileHeadSettingsPopup.tsx'
import { ProfileOnlineSince } from './ProfileOnlineSince.tsx'

/** Was nur das eigene Profil hat: die Sitzung im Kopf und das Neuladen nach dem Ändern von Bild, Status oder Drift. */
export type OwnProfileHead = {
  /** Die eigene E-Mail-Adresse; andere sehen sie nie. */
  email: string
  /** Der Platz dieser Sitzung. */
  sessionNumber: number
  /** Zeit bis zur nächsten Erneuerung der Sitzung als `mm:ss`. */
  sessionRenewalCountdown: string | null
  /** Nach dem Ändern von Profilbild, Status oder Drift: der Aufrufer lädt die Details neu. */
  onUsersDetailChanged: () => Promise<void>
}

type ProfileHeroProps = {
  /** Wessen Profil; die GUID ist immer öffentlich. */
  profileUsersGuid: string
  /** Der User, `null` wenn der Betrachter das Profil nicht sehen darf: Dann zeigt der Kopf es anonym. */
  users: UsersForProfile | null
  /** `null`, solange die Details laden, und bei einem anonymen Profil. */
  usersDetail: UsersDetail | null
  /** Die Position des Users aus den Stammdaten, `null` ohne oder solange sie laden. */
  accessRoleCollection: AccessRoleCollection | null
  /** Nur im eigenen Profil: Sitzung, Zahnrad und „Neues Bild“; `null` im Profil anderer. */
  ownProfileHead: OwnProfileHead | null
  /** Nur im Profil eines anderen: seit wann er online ist, `null` wenn offline (kein „zuletzt online“). */
  onlineSince?: string | null
  /** Nur im Profil eines anderen: oben rechts im Kopf, z. B. „Freund hinzufügen“. */
  otherProfileActions?: ReactNode
}

type ProfileStatProps = {
  iconClassName: string
  label: string
  value: ReactNode
  /** Mit Klick: Die Kennzahl ist ein Knopf, z. B. „zum Gästebuch springen“; der Text sagt es Screenreadern. */
  onClick?: () => void
  clickLabel?: string
}

/** Was ein privates Profil statt des Namens zeigt. */
const ANONYMOUS_NAME = 'Anonym'

/** Eine Kennzahl im Fuß des Profilkopfs, wahlweise zum Anklicken. */
function ProfileStat({ iconClassName, label, value, onClick, clickLabel }: ProfileStatProps) {
  const content = (
    <>
      <i className={iconClassName}></i>
      <span className="profile-stat-text">
        <span className="profile-stat-label">{label}</span>
        <span className="profile-stat-value">{value}</span>
      </span>
    </>
  )
  if (onClick !== undefined) {
    return (
      <button type="button" className="profile-stat profile-stat-link" onClick={onClick} aria-label={clickLabel}>
        {content}
      </button>
    )
  }
  return <div className="profile-stat">{content}</div>
}

/** Rollt die Seite zum Gästebuch weiter unten. */
function scrollToGuestbook() {
  const guestbookBox = document.getElementById(GUESTBOOK_BOX_ELEMENT_ID)
  if (guestbookBox !== null) {
    guestbookBox.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * Der Kopf eines Profils als ContentBox, wie in der Vorlage, unten die Kennzahlen. Für das eigene Profil, das Profil
 * anderer und ein privates Profil (anonym), überall gleich gebaut:
 * - Das Titelbild (vorerst ein gerechnetes Muster, später das Banner) liegt hinter dem ganzen Inhalt der Box und driftet
 *   so schnell, wie der Besitzer es eingestellt hat. Oben rechts die Punkte.
 * - Unten ein durchscheinender dunkler Streifen mit Name, Position und Status, abgetrennt durch eine Leuchtlinie wie
 *   unter dem Header (Nutzer 2026-11-09).
 * - Das Profilbild sitzt mit seiner Mitte auf dieser Linie; die Form steht im Theme, Lage und Wachsen beim Zeigen in
 *   base.css. Es kommt aus `UsersDetail` über den globalen {@link UsersAvatar} (`large`), ohne Bild die Initialen,
 *   anonym ein Smiley aus der GUID.
 * - Nur im eigenen Profil: oben rechts im großen Bild „Neues Bild“ ({@link ImageCropUploadPopup}, gespeichert groß und
 *   klein), das Zahnrad mit {@link ProfileHeadSettingsPopup} (Status und Drift in `UsersDetail`, für Besucher sichtbar),
 *   die E-Mail-Adresse und die Sitzung.
 * - Unten die Zähler aus `UsersDetail`; „Gästebuch“ springt zum Gästebuch. Ein anonymes Profil zeigt nur die GUID.
 */
export function ProfileHero({
  profileUsersGuid,
  users,
  usersDetail,
  accessRoleCollection,
  ownProfileHead,
  otherProfileActions = null,
  onlineSince = null,
}: ProfileHeroProps) {
  const profileImageHook = useUsersDetail()
  const headSettingsHook = useUsersDetail()
  const [profileImagePopupOpen, setProfileImagePopupOpen] = useState<boolean>(false)
  const [headSettingsPopupOpen, setHeadSettingsPopupOpen] = useState<boolean>(false)
  /** Das Tempo, das das Popup gerade vorführt; `null`: das gespeicherte. */
  const [previewDriftPercent, setPreviewDriftPercent] = useState<number | null>(null)
  const anonymous = users === null
  const ownProfile = ownProfileHead !== null

  let currentProfileImageBase64Png: string | null = null
  let statusText: string | null = null
  let avatarTextColor: string | null = null
  let avatarBackgroundColor: string | null = null
  if (usersDetail !== null) {
    currentProfileImageBase64Png = usersDetail.profileImageBase64Png
    statusText = usersDetail.statusText
    avatarTextColor = usersDetail.avatarTextColor
    avatarBackgroundColor = usersDetail.avatarBackgroundColor
  }
  let profileImageSaveErrorMessage: string | null = null
  if (profileImageHook.error !== null) {
    profileImageSaveErrorMessage = profileImageHook.error.detail
  }
  let headSettingsErrorMessage: string | null = null
  if (headSettingsHook.error !== null) {
    headSettingsErrorMessage = headSettingsHook.error.detail
  }
  const savedDriftPercent = getBannerDriftSpeedPercent(usersDetail)
  let shownDriftPercent = savedDriftPercent
  if (previewDriftPercent !== null) {
    shownDriftPercent = previewDriftPercent
  }
  const driftSpeedFactor = shownDriftPercent / BANNER_DRIFT_SPEED_DEFAULT_PERCENT

  let title = 'Anonymes Profil'
  let shownName = ANONYMOUS_NAME
  let username: string | null = null
  let pointsText: string | null = null
  if (users !== null) {
    username = users.username
    shownName = users.username
    pointsText = users.points.toLocaleString('de-DE')
    title = 'Profil von ' + users.username
  }
  if (ownProfile) {
    title = 'Dein Profil'
  }
  let onlineText: string | null = null
  if (ownProfileHead !== null) {
    onlineText =
      'online · Sitzung #' + ownProfileHead.sessionNumber + ' · Erneuerung in ' + ownProfileHead.sessionRenewalCountdown
  }

  /**
   * Speichert das zugeschnittene Bild groß und dazu den kleinen Abklatsch für Avatare (`null`: beide entfernen), lädt die
   * Details neu; liefert, ob es geklappt hat.
   */
  async function saveProfileImage(profileImageBase64Png: string | null): Promise<boolean> {
    if (ownProfileHead === null) {
      return false
    }
    let profileImageSmallBase64Png: string | null = null
    if (profileImageBase64Png !== null) {
      profileImageSmallBase64Png = await downscaledPngBase64(
        profileImageBase64Png,
        PROFILE_IMAGE_SMALL_SIZE_PIXELS,
        PROFILE_IMAGE_SMALL_SIZE_PIXELS,
      )
    }
    const savedUsersDetail = await profileImageHook.changeOwnUsersDetailProfileImage(
      profileImageBase64Png,
      profileImageSmallBase64Png,
    )
    if (savedUsersDetail === null) {
      return false
    }
    await ownProfileHead.onUsersDetailChanged()
    return true
  }

  function handleRemoveProfileImage(): Promise<boolean> {
    return saveProfileImage(null)
  }

  /** Speichert Status-Text, Drift und Avatarfarben nacheinander und lädt die Details neu; liefert, ob alles geklappt hat. */
  async function saveHeadSettings(profileHeadSettings: ProfileHeadSettings): Promise<boolean> {
    if (ownProfileHead === null) {
      return false
    }
    const statusSaved = await headSettingsHook.changeOwnUsersDetailStatusText(profileHeadSettings.statusText)
    if (statusSaved === null) {
      return false
    }
    const driftSaved = await headSettingsHook.changeOwnUsersDetailBannerDriftSpeed(profileHeadSettings.bannerDriftSpeedPercent)
    if (driftSaved === null) {
      return false
    }
    const colorsSaved = await headSettingsHook.changeOwnUsersDetailAvatarColors(
      profileHeadSettings.avatarTextColor,
      profileHeadSettings.avatarBackgroundColor,
    )
    if (colorsSaved === null) {
      return false
    }
    await ownProfileHead.onUsersDetailChanged()
    return true
  }

  let footer: ReactNode
  if (anonymous) {
    footer = <span className="small">Dieses Profil ist privat.</span>
  } else if (usersDetail === null) {
    footer = <Spinner animation="border" size="sm" />
  } else {
    footer = (
      <div className="profile-stats">
        <ProfileStat iconClassName="bi bi-cloud-upload" label="Uploads" value={usersDetail.uploadCount} />
        <ProfileStat iconClassName="bi bi-cloud-download" label="Downloads" value={usersDetail.downloadCount} />
        <ProfileStat
          iconClassName="bi bi-journal-text"
          label="Gästebuch"
          value={usersDetail.writtenGuestbookEntryCount + ' geschrieben'}
          onClick={scrollToGuestbook}
          clickLabel="Zum Gästebuch springen"
        />
      </div>
    )
  }

  // Oben rechts: im eigenen Profil das Zahnrad, im Profil eines anderen dessen Aktionen
  let headActions: ReactNode = otherProfileActions
  if (ownProfile) {
    headActions = (
      <Hoverlay text="Profilkopf einstellen: Status, Drift des Banners">
        <Button
          variant="outline-secondary"
          size="sm"
          className="control-button"
          aria-label="Profilkopf einstellen"
          disabled={usersDetail === null}
          onClick={() => setHeadSettingsPopupOpen(true)}>
          <i className="bi bi-gear" aria-hidden="true"></i>
        </Button>
      </Hoverlay>
    )
  }

  let statusLine: ReactNode = null
  if (statusText !== null) {
    statusLine = <p className="profile-info">{statusText}</p>
  } else if (ownProfile) {
    statusLine = <p className="profile-info profile-info-empty">Noch kein Status. Über das Zahnrad oben setzt du ihn.</p>
  }

  return (
    <div className="profile-hero">
      <ContentBox title={title} actions={headActions} footer={footer}>
        {/* Das Banner liegt hinter dem ganzen Inhalt, unten der durchscheinende Streifen mit Profilbild und Name */}
        <div className="profile-banner">
          <ProfileCover seed={profileUsersGuid} driftSpeedFactor={driftSpeedFactor} />
          {pointsText !== null && (
            <span className="profile-cover-badge">
              <span className="profile-cover-badge-ring">{pointsText}</span>
              <span className="fw-semibold">Punkte</span>
            </span>
          )}
          <div className="profile-identity">
            {/* die Klemmen auf der Trennlinie an den Kanten des Profilbilds, hinter ihm */}
            <span className="profile-avatar-clamp profile-avatar-clamp-left" aria-hidden="true" />
            <span className="profile-avatar-clamp profile-avatar-clamp-right" aria-hidden="true" />
            <div className="profile-avatar-wrap">
              {/* auf der Trennlinie: schraffierte Platte, Ziel-Winkel, Neon-Rahmen mit Fase, Passepartout, das Bild */}
              <div className="profile-avatar-figure">
                <span className="profile-avatar-echo" aria-hidden="true" />
                <div className="profile-avatar-frame">
                  <div className="profile-avatar-mat">
                    <UsersAvatar
                      usersGuid={profileUsersGuid}
                      username={username}
                      profileImageBase64Png={currentProfileImageBase64Png}
                      size="large"
                      anonymous={anonymous}
                      textColor={avatarTextColor}
                      backgroundColor={avatarBackgroundColor}
                    />
                  </div>
                </div>
                <span className="profile-avatar-bracket profile-avatar-bracket-top" aria-hidden="true" />
                <span className="profile-avatar-bracket profile-avatar-bracket-bottom" aria-hidden="true" />
                {/* nur im eigenen Profil: oben rechts im Bild, nur beim Zeigen darauf (groß), blendet nach dem Wachsen ein */}
                {ownProfile && (
                  <button type="button" className="profile-avatar-upload" onClick={() => setProfileImagePopupOpen(true)}>
                    <i className="bi bi-camera" aria-hidden="true"></i>
                    Neues Bild
                  </button>
                )}
              </div>
            </div>
            <div className="profile-identity-text">
              <h1 className="profile-name">{shownName}</h1>
              <div className="profile-meta">
                {ownProfileHead !== null && <span className="profile-email">{ownProfileHead.email}</span>}
                {anonymous && <span className="profile-email">GUID {profileUsersGuid}</span>}
                {accessRoleCollection !== null && <AccessRoleCollectionBadge accessRoleCollection={accessRoleCollection} />}
                {onlineText !== null && (
                  <span className="profile-online">
                    <span className="profile-online-dot" />
                    {onlineText}
                  </span>
                )}
                {!ownProfile && onlineSince !== null && <ProfileOnlineSince onlineSince={onlineSince} />}
              </div>
              {statusLine}
            </div>
          </div>
        </div>
      </ContentBox>
      {profileImagePopupOpen && (
        <ImageCropUploadPopup
          title="Profilbild"
          aspectRatio={1}
          targetWidth={PROFILE_IMAGE_SIZE_PIXELS}
          targetHeight={PROFILE_IMAGE_SIZE_PIXELS}
          minCropPixels={PROFILE_IMAGE_MIN_CROP_PIXELS}
          onConfirm={saveProfileImage}
          onRemove={currentProfileImageBase64Png !== null ? handleRemoveProfileImage : undefined}
          saveErrorMessage={profileImageSaveErrorMessage}
          onClose={() => setProfileImagePopupOpen(false)}
        />
      )}
      {headSettingsPopupOpen && (
        <ProfileHeadSettingsPopup
          usersGuid={profileUsersGuid}
          username={shownName}
          statusText={statusText}
          bannerDriftSpeedPercent={savedDriftPercent}
          avatarTextColor={avatarTextColor}
          avatarBackgroundColor={avatarBackgroundColor}
          isSaving={headSettingsHook.isLoading}
          errorMessage={headSettingsErrorMessage}
          onBannerDriftSpeedPreview={setPreviewDriftPercent}
          onSave={saveHeadSettings}
          onClose={() => setHeadSettingsPopupOpen(false)}
        />
      )}
    </div>
  )
}
