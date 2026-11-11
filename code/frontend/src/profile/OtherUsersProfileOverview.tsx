import { useCallback } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import type { AccessRoleCollection } from '../auth/access/AccessRoleCollection.ts'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { GuestbookBox } from '../guestbook/GuestbookBox.tsx'
import { useMasterData } from '../masterdata/useMasterData.ts'
import { useUsers } from '../users/useUsers.ts'
import { useUsersContact } from '../users/useUsersContact.ts'
import { useUsersDetail } from '../users/useUsersDetail.ts'
import { useUsersOnline } from '../users/useUsersOnline.ts'
import { ProfileAboutBox } from './ProfileAboutBox.tsx'
import { ProfileContactBox } from './ProfileContactBox.tsx'
import { ProfileFriendshipButton } from './ProfileFriendshipButton.tsx'
import { ProfileHero } from './ProfileHero.tsx'

type OtherUsersProfileOverviewProps = {
  /** Wessen Profil, aus der Adresse. */
  profileUsersGuid: string
}

/**
 * Das Profil eines anderen Users unter `/profile/<guid>`, nach der einen Regel der Sichtbarkeit (Nutzer 2026-11-09):
 * - Erst kommt der User selbst (`UsersForClient`). Darf man sein Profil sehen, folgen die Details, und es steht da wie
 *   das eigene, nur ohne Bearbeiten: Kopf mit Banner (in seiner Drift), Profilbild, Name, Position, Status und Zähler,
 *   darunter links die Kontaktangaben, die man je Angabe sehen darf, rechts „Über mich“ (wenn er etwas geschrieben hat)
 *   und sein Gästebuch.
 * - Oben rechts im Kopf, auch bei einem privaten Profil, die Freundschaft ({@link ProfileFriendshipButton}).
 * - Ist es privat, lädt die Seite nichts weiter: Banner, Smiley und „Anonym“, dazu die GUID.
 * Den Admin regelt das nicht anders, er liest alles über seine eigenen Endpunkte.
 */
export function OtherUsersProfileOverview({ profileUsersGuid }: OtherUsersProfileOverviewProps) {
  const usersHook = useUsers()
  const usersDetailHook = useUsersDetail()
  const { accessRoleCollections } = useMasterData()
  const getUsersForClient = usersHook.getUsersForClient
  const getUsersDetail = usersDetailHook.getUsersDetail

  const loadUsersForClient = useCallback(() => getUsersForClient(profileUsersGuid), [getUsersForClient, profileUsersGuid])
  const loadedUsersForClient = useLoadedData(loadUsersForClient)
  const usersForClient = loadedUsersForClient.data
  let profileVisible = false
  if (usersForClient !== null) {
    profileVisible = usersForClient.profileVisible
  }

  // Die Details nur bei einem sichtbaren Profil: Bei einem privaten lädt die Seite vom Rest nichts
  const loadUsersDetail = useCallback(async () => {
    if (!profileVisible) {
      return null
    }
    return getUsersDetail(profileUsersGuid)
  }, [profileVisible, getUsersDetail, profileUsersGuid])
  const loadedUsersDetail = useLoadedData(loadUsersDetail)

  // Die Kontaktangaben ebenso nur bei einem sichtbaren Profil; das Backend schickt nur die, die man sehen darf
  const usersContactHook = useUsersContact()
  const getVisibleUsersContact = usersContactHook.getVisibleUsersContact
  const loadVisibleContacts = useCallback(async () => {
    if (!profileVisible) {
      return null
    }
    return getVisibleUsersContact(profileUsersGuid)
  }, [profileVisible, getVisibleUsersContact, profileUsersGuid])
  const loadedVisibleContacts = useLoadedData(loadVisibleContacts)

  // Online-Status: nur wenn man das Profil sehen darf, sonst meldet der Server „offline“
  const usersOnlineHook = useUsersOnline()
  const getVisibleUsersOnlineStatus = usersOnlineHook.getVisibleUsersOnlineStatus
  const loadUsersOnlineStatus = useCallback(
    () => getVisibleUsersOnlineStatus(profileUsersGuid),
    [getVisibleUsersOnlineStatus, profileUsersGuid],
  )
  const loadedUsersOnlineStatus = useLoadedData(loadUsersOnlineStatus)

  if (usersHook.error !== null) {
    return <ErrorAlert message={usersHook.error.detail} />
  }
  if (usersForClient === null) {
    return <Spinner animation="border" />
  }
  const users = usersForClient.users
  let accessRoleCollection: AccessRoleCollection | null = null
  if (users !== null) {
    for (const candidateAccessRoleCollection of accessRoleCollections ?? []) {
      if (candidateAccessRoleCollection.key === users.accessRoleCollectionKey) {
        accessRoleCollection = candidateAccessRoleCollection
      }
    }
  }
  let usersDetailErrorMessage: string | null = null
  if (usersDetailHook.error !== null) {
    usersDetailErrorMessage = usersDetailHook.error.detail
  }
  let usersContactErrorMessage: string | null = null
  if (usersContactHook.error !== null) {
    usersContactErrorMessage = usersContactHook.error.detail
  }
  const visibleContacts = loadedVisibleContacts.data
  // Ohne sichtbare Angabe keine leere Box
  const contactBoxShown = visibleContacts === null || visibleContacts.length > 0
  // „Über mich“ nur, wenn der User etwas geschrieben hat
  const aboutText = loadedUsersDetail.data?.aboutText ?? null

  return (
    <div className="profile">
      <ProfileHero
        profileUsersGuid={profileUsersGuid}
        users={users}
        usersDetail={loadedUsersDetail.data}
        accessRoleCollection={accessRoleCollection}
        ownProfileHead={null}
        otherProfileActions={<ProfileFriendshipButton profileUsersGuid={profileUsersGuid} />}
        onlineSince={loadedUsersOnlineStatus.data?.onlineSince ?? null}
      />
      <ErrorAlert message={usersDetailErrorMessage} />
      {profileVisible && (
        <div className="profile-grid">
          {contactBoxShown && (
            <div className="profile-column">
              <ProfileContactBox contacts={visibleContacts} errorMessage={usersContactErrorMessage} ownContactEditing={null} />
            </div>
          )}
          <div className="profile-column">
            {aboutText !== null && <ProfileAboutBox aboutText={aboutText} ownAboutEditing={null} />}
            <GuestbookBox profileUsersGuid={profileUsersGuid} />
          </div>
        </div>
      )}
    </div>
  )
}
