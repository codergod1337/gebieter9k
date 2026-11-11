import { useCallback } from 'react'
import type { AccessRole } from '../auth/access/AccessRole.ts'
import type { AccessRoleCollection } from '../auth/access/AccessRoleCollection.ts'
import { useCurrentSession } from '../auth/login/useCurrentSession.ts'
import { useLoadedData } from '../api/useLoadedData.ts'
import { ErrorAlert } from '../components/ErrorAlert.tsx'
import { useCountdown } from '../layout/useCountdown.ts'
import { useMasterData } from '../masterdata/useMasterData.ts'
import { useUsersContact } from '../users/useUsersContact.ts'
import { useUsersDetail } from '../users/useUsersDetail.ts'
import { type OwnAboutEditing, ProfileAboutBox } from './ProfileAboutBox.tsx'
import { ProfileAccountBox } from './ProfileAccountBox.tsx'
import { ProfileAchievementsBox } from './ProfileAchievementsBox.tsx'
import { type OwnContactEditing, ProfileContactBox } from './ProfileContactBox.tsx'
import { ProfileFriendsBox } from './ProfileFriendsBox.tsx'
import { ProfilePointsBox } from './ProfilePointsBox.tsx'
import { GuestbookBox } from '../guestbook/GuestbookBox.tsx'
import { type OwnProfileHead, ProfileHero } from './ProfileHero.tsx'
import { ProfileRightsBox } from './ProfileRightsBox.tsx'
import { ProfileSecurityBox } from './ProfileSecurityBox.tsx'
import { ProfileSettingsBox } from './ProfileSettingsBox.tsx'

/**
 * Das eigene Profil, nach der Vorlage: oben der Profilkopf, darunter links Kontakt (je Angabe mit eigener Sichtbarkeit),
 * Konto, Einstellungen und Sicherheit, rechts Über mich, Achievements, Gästebuch, Freunde und Rechte. Echt sind User, Details, Position, Rechte und
 * Sitzung; alles mit dem Chip „Dummy“ ist Platzhalter zum Hinschieben. Bearbeiten kommt mit den Endpunkten für die
 * eigenen Daten.
 */
export function ProfileOverview() {
  const { session, nextSessionRenewalAt } = useCurrentSession()
  const { accessRoles, accessRoleCollections } = useMasterData()
  const usersDetailHook = useUsersDetail()
  const getUsersDetail = usersDetailHook.getUsersDetail

  let usersGuid = ''
  if (session !== null) {
    usersGuid = session.users.guid
  }
  const loadUsersDetail = useCallback(() => getUsersDetail(usersGuid), [getUsersDetail, usersGuid])
  const loadedUsersDetail = useLoadedData(loadUsersDetail)
  const usersContactHook = useUsersContact()
  const loadedOwnContacts = useLoadedData(usersContactHook.getOwnUsersContact)
  const sessionRenewalCountdown = useCountdown(nextSessionRenewalAt)

  if (session === null) {
    return null
  }
  const users = session.users

  let ownAccessRoleCollection: AccessRoleCollection | null = null
  for (const accessRoleCollection of accessRoleCollections ?? []) {
    if (accessRoleCollection.key === users.accessRoleCollectionKey) {
      ownAccessRoleCollection = accessRoleCollection
    }
  }
  // Die Rechte kommen aus dem Token, Namen aus den Stammdaten
  const ownAccessRoles: AccessRole[] = []
  for (const accessRole of accessRoles ?? []) {
    if (session.accessRoleKeys.includes(accessRole.key)) {
      ownAccessRoles.push(accessRole)
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
  const ownContacts = loadedOwnContacts.data
  let ownContactEditing: OwnContactEditing | null = null
  if (ownContacts !== null) {
    ownContactEditing = { ownContacts, onSaved: loadedOwnContacts.reload }
  }

  const ownAboutEditing: OwnAboutEditing = { onSaved: loadedUsersDetail.reload }

  const ownProfileHead: OwnProfileHead = {
    email: users.email,
    sessionNumber: session.sessionNumber,
    sessionRenewalCountdown,
    onUsersDetailChanged: loadedUsersDetail.reload,
  }

  return (
    <div className="profile">
      <ProfileHero
        profileUsersGuid={users.guid}
        users={users}
        usersDetail={loadedUsersDetail.data}
        accessRoleCollection={ownAccessRoleCollection}
        ownProfileHead={ownProfileHead}
      />
      <ErrorAlert message={usersDetailErrorMessage} />
      <div className="profile-grid">
        <div className="profile-column">
          <ProfileContactBox contacts={ownContacts} errorMessage={usersContactErrorMessage} ownContactEditing={ownContactEditing} />
          <ProfileAccountBox users={users} accessRoleCollection={ownAccessRoleCollection} />
          <ProfileSettingsBox users={users} />
          <ProfileSecurityBox
            sessionNumber={session.sessionNumber}
            sessionRenewalCountdown={sessionRenewalCountdown}
          />
        </div>
        <div className="profile-column">
          <ProfileAboutBox aboutText={loadedUsersDetail.data?.aboutText ?? null} ownAboutEditing={ownAboutEditing} />
          <ProfileAchievementsBox />
          <ProfilePointsBox />
          <GuestbookBox profileUsersGuid={users.guid} />
          <ProfileFriendsBox />
          <ProfileRightsBox ownAccessRoles={ownAccessRoles} />
        </div>
      </div>
    </div>
  )
}
